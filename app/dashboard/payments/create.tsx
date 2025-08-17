'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { mapStudents, mapFeeItems, mapClasses, type Student, type FeeItem, type Class } from '@/lib/typeMappers';
import { Receipt } from '@/components/payments/Receipt';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  CreditCardIcon,
  DocumentTextIcon,
  CalculatorIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Validation schema
const paymentSchema = z.object({
  student_id: z.string().min(1, 'Student is required'),
  fee_items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    outstanding_amount: z.number(),
    paid_amount: z.number().min(0, 'Paid amount must be positive')
  })).min(1, 'At least one fee item must be selected'),
  payment_method: z.enum(['cash', 'card', 'upi', 'cheque', 'bank_transfer']),
  payment_date: z.string().min(1, 'Payment date is required'),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  discount_amount: z.number().min(0, 'Discount cannot be negative').optional(),
  discount_reason: z.string().optional()
});

type PaymentFormData = z.infer<typeof paymentSchema>;



interface PaymentSummary {
  total_outstanding: number;
  total_paid: number;
  discount_amount: number;
  final_amount: number;
}

export default function CreatePaymentPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFeeItems, setSelectedFeeItems] = useState<FeeItem[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    total_outstanding: 0,
    total_paid: 0,
    discount_amount: 0,
    final_amount: 0
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      discount_amount: 0
    }
  });

  const watchedDiscount = watch('discount_amount') || 0;

  useEffect(() => {
    if (profile?.institution_id) {
      fetchStudents();
    }
  }, [profile?.institution_id]);

  useEffect(() => {
    if (selectedStudent) {
      fetchFeeItems();
    }
  }, [selectedStudent]);

  useEffect(() => {
    calculatePaymentSummary();
  }, [selectedFeeItems, watchedDiscount]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          admission_number,
          classes!inner(name, section)
        `)
        .eq('institution_id', profile?.institution_id)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;

                     setStudents(mapStudents(data));
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeItems = async () => {
    if (!selectedStudent) return;

    try {
      const { data, error } = await supabase
        .from('student_fee_items')
        .select(`
          id,
          fee_items!inner(name),
          outstanding_amount,
          due_date,
          status,
          fee_plans!inner(name)
        `)
        .eq('student_id', selectedStudent.id)
        .eq('institution_id', profile?.institution_id)
        .gt('outstanding_amount', 0)
        .order('due_date');

      if (error) throw error;

              setFeeItems(mapFeeItems(data));
    } catch (err) {
      console.error('Error fetching fee items:', err);
      setError('Failed to load fee items');
    }
  };

  const calculatePaymentSummary = () => {
    const totalOutstanding = selectedFeeItems.reduce((sum, item) => sum + item.outstanding_amount, 0);
    const totalPaid = selectedFeeItems.reduce((sum, item) => sum + (item.paid_amount || 0), 0);
    const discountAmount = watchedDiscount || 0;
    const finalAmount = totalPaid - discountAmount;

    setPaymentSummary({
      total_outstanding: totalOutstanding,
      total_paid: totalPaid,
      discount_amount: discountAmount,
      final_amount: finalAmount
    });
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student || null);
    setSelectedFeeItems([]);
    setValue('fee_items', []);
  };

  const handleFeeItemToggle = (feeItem: FeeItem, checked: boolean) => {
    if (checked) {
      const updatedItems = [...selectedFeeItems, { ...feeItem, paid_amount: feeItem.outstanding_amount }];
      setSelectedFeeItems(updatedItems);
      setValue('fee_items', updatedItems.map(item => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        outstanding_amount: item.outstanding_amount,
        paid_amount: item.paid_amount || 0
      })));
    } else {
      const updatedItems = selectedFeeItems.filter(item => item.id !== feeItem.id);
      setSelectedFeeItems(updatedItems);
      setValue('fee_items', updatedItems.map(item => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        outstanding_amount: item.outstanding_amount,
        paid_amount: item.paid_amount || 0
      })));
    }
  };

  const handleFeeItemAmountChange = (feeItemId: string, amount: number) => {
    const updatedItems = selectedFeeItems.map(item => 
      item.id === feeItemId ? { ...item, paid_amount: amount } : item
    );
    setSelectedFeeItems(updatedItems);
    setValue('fee_items', updatedItems.map(item => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      outstanding_amount: item.outstanding_amount,
      paid_amount: item.paid_amount || 0
    })));
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!profile?.institution_id) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const paymentData = {
        ...data,
        institution_id: profile.institution_id,
        total_amount: paymentSummary.total_outstanding,
        paid_amount: paymentSummary.final_amount,
        discount_amount: paymentSummary.discount_amount
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment');
      }

      const result = await response.json();
      setGeneratedReceipt(result);
      setSuccess('Payment created successfully!');
      setShowReceipt(true);

    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment');
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

  if (showReceipt && generatedReceipt) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setShowReceipt(false)}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Payment
          </Button>
        </div>
        <Receipt paymentData={generatedReceipt} />
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
            <h1 className="text-3xl font-bold text-gray-900">Create Payment</h1>
            <p className="text-gray-600">Process fee payment for a student</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <UserIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900">Select Student</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student *
                </label>
                <select
                  {...register('student_id')}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} - {student.admission_number} ({student.class_name} {student.class_section})
                    </option>
                  ))}
                </select>
                {errors.student_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.student_id.message}</p>
                )}
              </div>

              {selectedStudent && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Admission: {selectedStudent.admission_number} • Class: {selectedStudent.class_name} {selectedStudent.class_section}
                  </p>
                </div>
              )}
            </div>

            {/* Fee Items Selection */}
            {selectedStudent && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Select Fee Items</h2>
                </div>

                {feeItems.length > 0 ? (
                  <div className="space-y-4">
                    {feeItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedFeeItems.some(selected => selected.id === item.id)}
                              onChange={(e) => handleFeeItemToggle(item, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <h3 className="font-medium text-gray-900">{item.name}</h3>
                              <p className="text-sm text-gray-600">
                                Due: {format(new Date(item.due_date), 'PPP')} • Plan: {item.fee_plan_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Outstanding: ₹{item.outstanding_amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {selectedFeeItems.some(selected => selected.id === item.id) && (
                            <div className="w-32">
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={selectedFeeItems.find(selected => selected.id === item.id)?.paid_amount || 0}
                                onChange={(e) => handleFeeItemAmountChange(item.id, parseFloat(e.target.value) || 0)}
                                min="0"
                                max={item.outstanding_amount}
                                step="0.01"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No outstanding fee items found for this student</p>
                )}
              </div>
            )}

            {/* Payment Details */}
            {selectedFeeItems.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <CreditCardIcon className="h-6 w-6 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      {...register('payment_method')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select payment method</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="cheque">Cheque</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                    {errors.payment_method && (
                      <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date *
                    </label>
                    <Input
                      {...register('payment_date')}
                      type="date"
                      error={errors.payment_date?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <Input
                      {...register('reference_number')}
                      placeholder="Cheque/transaction number"
                      error={errors.reference_number?.message}
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes (optional)"
                    />
                    {errors.notes && (
                      <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <div className="flex items-center space-x-3 mb-6">
                <CalculatorIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900">Payment Summary</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Outstanding:</span>
                  <span className="font-medium">₹{paymentSummary.total_outstanding.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium">₹{paymentSummary.total_paid.toLocaleString()}</span>
                </div>

                {paymentSummary.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{paymentSummary.discount_amount.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Final Amount:</span>
                    <span>₹{paymentSummary.final_amount.toLocaleString()}</span>
                  </div>
                </div>

                {selectedFeeItems.length > 0 && (
                  <Button
                    type="submit"
                    className="w-full mt-6"
                    loading={submitting}
                    disabled={submitting || paymentSummary.final_amount <= 0}
                  >
                    {submitting ? 'Processing...' : 'Process Payment'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
