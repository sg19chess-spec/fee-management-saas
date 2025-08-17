'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { mapFeePlan, mapFeeItems, type FeePlan, type FeeItem } from '@/lib/typeMappers';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeftIcon, 
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  CalculatorIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Validation schema
const feeItemSchema = z.object({
  name: z.string().min(1, 'Fee item name is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  is_optional: z.boolean().default(false)
});

const feePlanSchema = z.object({
  name: z.string().min(1, 'Fee plan name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  academic_year: z.string().min(1, 'Academic year is required'),
  total_amount: z.number().min(0, 'Total amount must be positive'),
  discount_percentage: z.number().min(0, 'Discount percentage must be positive').max(100, 'Discount cannot exceed 100%').optional(),
  discount_amount: z.number().min(0, 'Discount amount must be positive').optional(),
  discount_reason: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  fee_items: z.array(feeItemSchema).min(1, 'At least one fee item is required')
});

type FeePlanFormData = z.infer<typeof feePlanSchema>;

// Using imported types from typeMappers
interface LocalFeeItem {
  id: string;
  name: string;
  amount: number;
  description?: string;
  due_date: string;
  is_optional: boolean;
  fee_plan_id: string;
}

export default function EditFeePlanPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feePlan, setFeePlan] = useState<FeePlan | null>(null);
  const [feeItems, setFeeItems] = useState<LocalFeeItem[]>([]);

  const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm<FeePlanFormData>({
    resolver: zodResolver(feePlanSchema),
    defaultValues: {
      fee_items: [],
      discount_percentage: 0,
      discount_amount: 0,
      status: 'active'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fee_items'
  });

  const watchedItems = watch('fee_items');
  const watchedDiscountPercentage = watch('discount_percentage') || 0;
  const watchedDiscountAmount = watch('discount_amount') || 0;

  useEffect(() => {
    if (profile?.institution_id) {
      fetchFeePlan();
    }
  }, [profile?.institution_id, params.id]);

  useEffect(() => {
    calculateTotalAmount();
  }, [watchedItems, watchedDiscountPercentage, watchedDiscountAmount]);

  const fetchFeePlan = async () => {
    try {
      // Fetch fee plan details
      const { data: feePlanData, error: feePlanError } = await supabase
        .from('fee_plans')
        .select('*')
        .eq('id', params.id)
        .eq('institution_id', profile?.institution_id)
        .single();

      if (feePlanError) throw feePlanError;

      // Fetch fee items
      const { data: feeItemsData, error: feeItemsError } = await supabase
        .from('fee_items')
        .select('*')
        .eq('fee_plan_id', params.id)
        .eq('institution_id', profile?.institution_id)
        .order('created_at');

      if (feeItemsError) throw feeItemsError;

              setFeePlan(mapFeePlan(feePlanData));
        setFeeItems(feeItemsData?.map(item => ({
          id: item.id,
          name: item.name,
          amount: item.amount,
          description: item.description || '',
          due_date: item.due_date,
          is_optional: item.is_optional || false,
          fee_plan_id: item.fee_plan_id
        })) || []);

      // Set form values
      setValue('name', feePlanData.name);
      setValue('description', feePlanData.description || '');
      setValue('academic_year', feePlanData.academic_year);
      setValue('total_amount', feePlanData.total_amount);
      setValue('discount_percentage', feePlanData.discount_percentage || 0);
      setValue('discount_amount', feePlanData.discount_amount || 0);
      setValue('discount_reason', feePlanData.discount_reason || '');
      setValue('status', feePlanData.status);

      // Set fee items
      const items = feeItemsData?.map(item => ({
        name: item.name,
        amount: item.amount,
        description: item.description || '',
        due_date: item.due_date,
        is_optional: item.is_optional
      })) || [];

      setValue('fee_items', items);

    } catch (err) {
      console.error('Error fetching fee plan:', err);
      setError('Failed to load fee plan information');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    const total = watchedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const discountByPercentage = (total * watchedDiscountPercentage) / 100;
    const finalDiscount = Math.max(discountByPercentage, watchedDiscountAmount);
    const finalAmount = total - finalDiscount;
    
    setValue('total_amount', finalAmount);
  };

  const addFeeItem = () => {
    append({
      name: '',
      amount: 0,
      description: '',
      due_date: '',
      is_optional: false
    });
  };

  const removeFeeItem = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: FeePlanFormData) => {
    if (!profile?.institution_id) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const feePlanData = {
        ...data,
        institution_id: profile.institution_id
      };

      const response = await fetch(`/api/fee-plans/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feePlanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update fee plan');
      }

      setSuccess('Fee plan updated successfully!');
      
      // Redirect to fee plans listing after a short delay
      setTimeout(() => {
        router.push('/dashboard/fee-plans');
      }, 1500);

    } catch (err) {
      console.error('Error updating fee plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to update fee plan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !feePlan) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Fee Plan</h1>
            <p className="text-gray-600">Update fee plan details and items</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" className="mb-6" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Plan Name *
              </label>
              <Input
                {...register('name')}
                placeholder="Enter fee plan name"
                error={errors.name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year *
              </label>
              <Input
                {...register('academic_year')}
                placeholder="e.g., 2024-2025"
                error={errors.academic_year?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter description (optional)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Fee Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CalculatorIcon className="h-6 w-6 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900">Fee Items</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addFeeItem}
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No fee items added yet</p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Fee Item {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name *
                      </label>
                      <Input
                        {...register(`fee_items.${index}.name`)}
                        placeholder="e.g., Tuition Fee"
                        error={errors.fee_items?.[index]?.name?.message}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount *
                      </label>
                      <Input
                        {...register(`fee_items.${index}.amount`, { valueAsNumber: true })}
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        error={errors.fee_items?.[index]?.amount?.message}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date *
                      </label>
                      <Input
                        {...register(`fee_items.${index}.due_date`)}
                        type="date"
                        error={errors.fee_items?.[index]?.due_date?.message}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        {...register(`fee_items.${index}.is_optional`)}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">Optional</label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Input
                      {...register(`fee_items.${index}.description`)}
                      placeholder="Enter description (optional)"
                      error={errors.fee_items?.[index]?.description?.message}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {errors.fee_items && (
            <p className="mt-2 text-sm text-red-600">{errors.fee_items.message}</p>
          )}
        </div>

        {/* Discounts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <CalculatorIcon className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Discounts & Concessions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Percentage
              </label>
              <Input
                {...register('discount_percentage', { valueAsNumber: true })}
                type="number"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
                error={errors.discount_percentage?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount
              </label>
              <Input
                {...register('discount_amount', { valueAsNumber: true })}
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                error={errors.discount_amount?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Reason
              </label>
              <Input
                {...register('discount_reason')}
                placeholder="Reason for discount (optional)"
                error={errors.discount_reason?.message}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CalculatorIcon className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Fee Plan Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{fields.length}</p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{watchedItems.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Final Amount</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{watch('total_amount')?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Fee Plan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
