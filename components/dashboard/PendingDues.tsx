'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { mapPendingDues, mapClasses, type PendingDue, type Class } from '@/lib/typeMappers';
import { format } from 'date-fns';



const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function PendingDues() {
  const { profile } = useAuth();
  const [pendingDues, setPendingDues] = useState<PendingDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (profile?.institution_id) {
      fetchClasses();
      fetchPendingDues();
    }
  }, [profile?.institution_id]);

  useEffect(() => {
    if (profile?.institution_id) {
      fetchPendingDues();
    }
  }, [selectedClass, profile?.institution_id]);

  const fetchClasses = async () => {
    if (!profile?.institution_id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('institution_id', profile.institution_id)
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;
      setClasses(mapClasses(data));
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchPendingDues = async () => {
    if (!profile?.institution_id) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('student_fee_items')
        .select(`
          id,
          outstanding_amount,
          due_date,
          status,
          students!inner(
            first_name,
            last_name,
            admission_number,
            guardian_phone
          ),
          classes!inner(
            name,
            section
          ),
          fee_items(
            name,
            amount
          )
        `)
        .eq('students.institution_id', profile.institution_id)
        .gt('outstanding_amount', 0)
        .order('due_date', { ascending: true });

      if (selectedClass !== 'all') {
        query = query.eq('classes.id', selectedClass);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPendingDues(mapPendingDues(data));
    } catch (err) {
      console.error('Error fetching pending dues:', err);
      setError('Failed to load pending dues');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getOverdueColor = (dueDate: string) => {
    const daysOverdue = getDaysOverdue(dueDate);
    if (daysOverdue > 30) return 'bg-red-100 text-red-800';
    if (daysOverdue > 15) return 'bg-orange-100 text-orange-800';
    if (daysOverdue > 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading pending dues</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (pendingDues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">✅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending dues</h3>
        <p className="text-gray-500">All students have cleared their dues.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Class Filter */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filter by Class:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} {cls.section}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {pendingDues.length} pending dues found
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingDues.map((due) => {
                const daysOverdue = getDaysOverdue(due.due_date);
                return (
                  <tr key={due.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-red-600">
                              {(due.students as any)[0]?.first_name?.[0] || ''}{(due.students as any)[0]?.last_name?.[0] || ''}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {(due.students as any)[0]?.first_name || ''} {(due.students as any)[0]?.last_name || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(due.students as any)[0]?.admission_number || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(due.classes as any)[0]?.name || ''} {(due.classes as any)[0]?.section || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(due.fee_items as any)[0]?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(due.outstanding_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(due.due_date), 'MMM dd, yyyy')}
                      </div>
                      {daysOverdue > 0 && (
                        <div className="text-xs text-red-600">
                          {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getOverdueColor(due.due_date)}>
                        {daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Due soon'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(due.students as any)[0]?.guardian_phone || 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-500">
            Total outstanding amount: {formatCurrency(
              pendingDues.reduce((sum, due) => sum + due.outstanding_amount, 0)
            )}
          </div>
          <div className="text-gray-500">
            {pendingDues.filter(due => getDaysOverdue(due.due_date) > 30).length} severely overdue
          </div>
        </div>
      </div>
    </div>
  );
}
