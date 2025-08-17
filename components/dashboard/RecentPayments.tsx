'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { mapPayments, type Payment } from '@/lib/typeMappers';
import { format } from 'date-fns';



const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function RecentPayments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.institution_id) {
      fetchRecentPayments();
    }
  }, [profile?.institution_id]);

  const fetchRecentPayments = async () => {
    if (!profile?.institution_id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('payments')
        .select(`
          id,
          receipt_number,
          paid_amount,
          payment_method,
          payment_status,
          payment_date,
          students!inner(
            first_name,
            last_name,
            admission_number
          ),
          classes!inner(
            name,
            section
          )
        `)
        .eq('institution_id', profile.institution_id)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (fetchError) {
        throw fetchError;
      }

      setPayments(mapPayments(data));
    } catch (err) {
      console.error('Error fetching recent payments:', err);
      setError('Failed to load recent payments');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'upi':
        return '📱';
      case 'net_banking':
        return '🏦';
      case 'cheque':
        return '📄';
      case 'bank_transfer':
        return '🏛️';
      default:
        return '💰';
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
            <h3 className="text-sm font-medium text-red-800">Error loading payments</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">💰</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No recent payments</h3>
        <p className="text-gray-500">Payments will appear here once they are processed.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {(payment.students as any)[0]?.first_name?.[0] || ''}{(payment.students as any)[0]?.last_name?.[0] || ''}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {(payment.students as any)[0]?.first_name || ''} {(payment.students as any)[0]?.last_name || ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(payment.students as any)[0]?.admission_number || ''} • {(payment.classes as any)[0]?.name || ''} {(payment.classes as any)[0]?.section || ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payment.receipt_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(payment.paid_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="mr-2">{getPaymentMethodIcon(payment.payment_method)}</span>
                    <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getStatusColor(payment.payment_status)}>
                    {payment.payment_status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {payments.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {payments.length} most recent payments
          </div>
        </div>
      )}
    </div>
  );
}
