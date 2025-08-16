'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Receipt } from '@/components/payments/Receipt';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  UserIcon,
  CreditCardIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// TypeScript interfaces
interface Payment {
  id: string;
  receipt_number: string;
  student_id: string;
  student_name: string;
  student_admission: string;
  student_class: string;
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_date: string;
  reference_number?: string;
  notes?: string;
  discount_reason?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentFeeItem {
  id: string;
  fee_item_name: string;
  original_amount: number;
  paid_amount: number;
  fee_plan_name: string;
}

export default function PaymentViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { profile } = useAuth();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [feeItems, setFeeItems] = useState<PaymentFeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (profile?.institution_id) {
      fetchPaymentData();
    }
  }, [params.id, profile?.institution_id]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch payment details
      const { data: paymentData, error: paymentError } = await supabase
        .from('fee_payments')
        .select(`
          *,
          students!inner(
            first_name,
            last_name,
            admission_number,
            classes!inner(name, section)
          )
        `)
        .eq('id', params.id)
        .eq('institution_id', profile?.institution_id)
        .single();

      if (paymentError) throw paymentError;

      // Fetch payment fee items
      const { data: feeItemsData, error: feeItemsError } = await supabase
        .from('payment_fee_items')
        .select(`
          id,
          paid_amount,
          fee_items!inner(name),
          fee_plans!inner(name)
        `)
        .eq('payment_id', params.id)
        .eq('institution_id', profile?.institution_id);

      if (feeItemsError) throw feeItemsError;

      setPayment({
        ...paymentData,
        student_name: `${paymentData.students.first_name} ${paymentData.students.last_name}`,
        student_admission: paymentData.students.admission_number,
        student_class: `${paymentData.students.classes.name} ${paymentData.students.classes.section}`
      });

      setFeeItems(feeItemsData?.map(item => ({
        id: item.id,
        fee_item_name: item.fee_items.name,
        original_amount: item.paid_amount,
        paid_amount: item.paid_amount,
        fee_plan_name: item.fee_plans.name
      })) || []);

    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'cheque': return '🏦';
      case 'bank_transfer': return '🏛️';
      default: return '💰';
    }
  };

  const handleDownloadReceipt = () => {
    // This would typically generate and download a PDF
    // For now, we'll show the receipt component
    setShowReceipt(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  if (!payment) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" className="mb-6">
          Payment not found
        </Alert>
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (showReceipt) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setShowReceipt(false)}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Payment Details
          </Button>
        </div>
        <Receipt paymentData={payment} feeItems={feeItems} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Receipt #{payment.receipt_number}
              </h1>
              <p className="text-gray-600">
                Payment for {payment.student_name} • {format(new Date(payment.payment_date), 'PPP')}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleDownloadReceipt}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline" onClick={handlePrintReceipt}>
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Payment Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Receipt Number</p>
                    <p className="font-medium">{payment.receipt_number}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Payment Date</p>
                    <p className="font-medium">{format(new Date(payment.payment_date), 'PPP')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CreditCardIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium flex items-center">
                      <span className="mr-2">{getPaymentMethodIcon(payment.payment_method)}</span>
                      {payment.payment_method.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge variant={getPaymentStatusBadgeVariant(payment.payment_status)}>
                      {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {payment.reference_number && (
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Reference Number</p>
                      <p className="font-medium">{payment.reference_number}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Created On</p>
                    <p className="font-medium">{format(new Date(payment.created_at), 'PPP')}</p>
                  </div>
                </div>
              </div>

              {payment.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-gray-900">{payment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="font-medium">{payment.student_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Admission Number</p>
                    <p className="font-medium">{payment.student_admission}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Class</p>
                    <p className="font-medium">{payment.student_class}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Fee Items</h2>
            </div>
            <div className="p-6">
              {feeItems.length > 0 ? (
                <div className="space-y-4">
                  {feeItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.fee_item_name}</h3>
                        <p className="text-sm text-gray-600">Plan: {item.fee_plan_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.paid_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No fee items found</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">₹{payment.total_amount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium">₹{payment.paid_amount.toLocaleString()}</span>
              </div>

              {payment.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{payment.discount_amount.toLocaleString()}</span>
                </div>
              )}

              {payment.discount_reason && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Discount Reason:</p>
                  <p>{payment.discount_reason}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Final Amount:</span>
                  <span>₹{payment.paid_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button onClick={handleDownloadReceipt} className="w-full">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
              <Button variant="outline" onClick={handlePrintReceipt} className="w-full">
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
