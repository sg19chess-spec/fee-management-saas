'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Validation schema for sending reminders
const reminderSchema = z.object({
  templateId: z.string().uuid('Please select a template'),
  studentFeeItemIds: z.array(z.string().uuid()).min(1, 'Please select at least one fee item'),
  type: z.enum(['single', 'bulk']).default('single'),
});

type ReminderForm = z.infer<typeof reminderSchema>;

interface StudentFeeItem {
  id: string;
  due_date: string;
  amount: number;
  outstanding_amount: number;
  status: string;
  fee_items: {
    name: string;
  }[];
  student_fees: {
    students: {
      users: {
        first_name: string;
        last_name: string;
        phone: string;
      };
      classes: {
        name: string;
        section: string;
      };
      admission_number: string;
    };
  }[];
}

interface ReminderTemplate {
  id: string;
  name: string;
  message_template: string;
  reminder_type: string;
}

// Add this interface for the API result
interface ReminderApiResult {
  success: boolean;
  sent?: number;
  failed?: number;
  error?: string;
}

export default function ReminderManager() {
  const [feeItems, setFeeItems] = useState<StudentFeeItem[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ReminderForm>({
    resolver: zodResolver(reminderSchema),
  });

  const watchType = watch('type');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('institution_id')
        .eq('id', user.id)
        .single();

      if (!userProfile?.institution_id) return;

      // Fetch outstanding fee items
      const { data: feeItemsData } = await supabase
        .from('student_fee_items')
        .select(`
          id,
          due_date,
          amount,
          outstanding_amount,
          status,
          fee_items(name),
          student_fees(
            students(
              users(first_name, last_name, phone),
              classes(name, section),
              admission_number
            )
          )
        `)
        .eq('student_fees.students.institution_id', userProfile.institution_id)
        .gt('outstanding_amount', 0)
        .order('due_date', { ascending: true });

      // Fetch reminder templates
      const { data: templatesData } = await supabase
        .from('reminder_templates')
        .select('*')
        .eq('institution_id', userProfile.institution_id)
        .eq('reminder_type', 'whatsapp')
        .eq('is_active', true);

      if (feeItemsData) setFeeItems(feeItemsData as unknown as StudentFeeItem[]);
      if (templatesData) setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ReminderForm) => {
    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/whatsapp/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentFeeItemIds: data.studentFeeItemIds,
          templateId: data.templateId,
          type: data.type,
        }),
      });

      const result: ReminderApiResult = await response.json();

      if ('success' in result && result.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully sent ${result.sent} reminder(s). ${result.failed && result.failed > 0 ? `${result.failed} failed.` : ''}` 
        });
        
        // Clear selections
        setSelectedItems([]);
        setValue('studentFeeItemIds', []);
        
        // Refresh data
        fetchData();
      } else {
        setMessage({ type: 'error', text: 'error' in result && result.error ? result.error : 'Failed to send reminders' });
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      setMessage({ type: 'error', text: 'Failed to send reminders' });
    } finally {
      setSending(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === feeItems.length) {
      setSelectedItems([]);
      setValue('studentFeeItemIds', []);
    } else {
      const allIds = feeItems.map(item => item.id);
      setSelectedItems(allIds);
      setValue('studentFeeItemIds', allIds);
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    
    setSelectedItems(newSelected);
    setValue('studentFeeItemIds', newSelected);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'paid': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Send Payment Reminders</h2>
        <p className="text-gray-600 mt-2">
          Send WhatsApp reminders to students and parents about outstanding fee payments.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Template
          </label>
          <select
            {...register('templateId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {errors.templateId && (
            <p className="mt-1 text-sm text-red-600">{errors.templateId.message}</p>
          )}
        </div>

        {/* Reminder Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="single"
                {...register('type')}
                className="mr-2"
              />
              Single Reminder
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="bulk"
                {...register('type')}
                className="mr-2"
              />
              Bulk Reminders
            </label>
          </div>
        </div>

        {/* Fee Items Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Outstanding Fee Items ({feeItems.length})
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedItems.length === feeItems.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {watchType === 'single' && selectedItems.length > 1 && (
            <Alert variant="warning" className="mb-4">
              Single reminder mode selected. Only the first selected item will be processed.
            </Alert>
          )}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === feeItems.length && feeItems.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outstanding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feeItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {(item.student_fees as any)[0]?.students?.[0]?.users?.[0]?.first_name || ''} {(item.student_fees as any)[0]?.students?.[0]?.users?.[0]?.last_name || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(item.student_fees as any)[0]?.students?.[0]?.admission_number || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(item.student_fees as any)[0]?.students?.[0]?.classes?.[0]?.name || ''} {(item.student_fees as any)[0]?.students?.[0]?.classes?.[0]?.section || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(item.fee_items as any)[0]?.name || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.outstanding_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {feeItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No outstanding fee items found.
            </div>
          )}
        </div>

        {/* Hidden field for form validation */}
        <input
          type="hidden"
          {...register('studentFeeItemIds')}
          value={selectedItems}
        />

        {errors.studentFeeItemIds && (
          <p className="text-sm text-red-600">{errors.studentFeeItemIds.message}</p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedItems([]);
              setValue('studentFeeItemIds', []);
            }}
            disabled={sending}
          >
            Clear Selection
          </Button>
          <Button
            type="submit"
            loading={sending}
            disabled={sending || selectedItems.length === 0}
          >
            {sending ? 'Sending...' : `Send ${watchType === 'single' ? 'Reminder' : 'Reminders'} (${selectedItems.length})`}
          </Button>
        </div>
      </form>
    </div>
  );
}
