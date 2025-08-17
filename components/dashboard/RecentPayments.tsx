'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading payments</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">💰</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent payments</h3>
        <p className="text-gray-500">Payments will appear here once they are processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-gray-50 transition-colors">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {(payment.students as any)[0]?.first_name?.[0] || ''}{(payment.students as any)[0]?.last_name?.[0] || ''}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {(payment.students as any)[0]?.first_name || ''} {(payment.students as any)[0]?.last_name || ''}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(payment.students as any)[0]?.admission_number || ''} • {(payment.classes as any)[0]?.name || ''} {(payment.classes as any)[0]?.section || ''}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {payment.receipt_number}
              </TableCell>
              <TableCell className="font-semibold text-gray-900">
                {formatCurrency(payment.paid_amount)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPaymentMethodIcon(payment.payment_method)}</span>
                  <span className="capitalize text-sm">{payment.payment_method.replace('_', ' ')}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(payment.payment_status)}>
                  {payment.payment_status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {payments.length > 0 && (
        <div className="text-center py-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {payments.length} most recent payments
          </p>
        </div>
      )}
    </div>
  );
}
