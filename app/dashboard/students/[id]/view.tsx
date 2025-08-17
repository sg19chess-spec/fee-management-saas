'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { mapPayments, mapFeePlans, type Payment, type FeePlan } from '@/lib/typeMappers';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  DocumentTextIcon, 
  CreditCardIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  HomeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Local Student interface for this component
interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  state: string;
  pincode: string;
  class_id: string;
  class_name: string;
  class_section: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  emergency_contact: string;
  blood_group?: string;
  admission_date: string;
  status: 'active' | 'inactive' | 'transferred';
  created_at: string;
  updated_at: string;
}

// Local FeePlan interface for fee plan assignments
interface FeePlanAssignment {
  id: string;
  name: string;
  academic_year: string;
  total_amount: number;
  assigned_date: string;
  status: string;
}

export default function StudentViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlanAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.institution_id) {
      fetchStudentData();
    }
  }, [params.id, profile?.institution_id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student details
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          classes:class_id (
            name,
            section
          )
        `)
        .eq('id', params.id)
        .eq('institution_id', profile?.institution_id)
        .single();

      if (studentError) throw studentError;

      // Fetch student's payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('fee_payments')
        .select(`
          id,
          receipt_number,
          student_id,
          total_amount,
          paid_amount,
          payment_method,
          payment_status,
          payment_date,
          created_at,
          students!inner(first_name, last_name)
        `)
        .eq('student_id', params.id)
        .eq('institution_id', profile?.institution_id)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (paymentsError) throw paymentsError;

      // Fetch student's fee plans
      const { data: feePlansData, error: feePlansError } = await supabase
        .from('fee_plan_assignments')
        .select(`
          id,
          fee_plans!inner(
            id,
            name,
            academic_year,
            total_amount
          ),
          assigned_date,
          status
        `)
        .eq('student_id', params.id)
        .eq('institution_id', profile?.institution_id)
        .order('assigned_date', { ascending: false });

      if (feePlansError) throw feePlansError;

      setStudent({
        ...studentData,
        class_name: studentData.classes?.name || '',
        class_section: studentData.classes?.section || ''
      });

              setPayments(mapPayments(paymentsData));

              setFeePlans(feePlansData?.map((item: any) => ({
                id: item.fee_plans?.id || '',
                name: item.fee_plans?.name || '',
                academic_year: item.fee_plans?.academic_year || '',
                total_amount: item.fee_plans?.total_amount || 0,
                assigned_date: item.assigned_date || '',
                status: item.status || ''
              })) || []);

    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load student information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'transferred': return 'warning';
      default: return 'default';
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

  if (!student) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" className="mb-6">
          Student not found
        </Alert>
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Go Back
        </Button>
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
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-gray-600">
                Admission: {student.admission_number} • Class: {student.class_name} {student.class_section}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link href={`/dashboard/students/${student.id}/edit`}>
              <Button>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
            <Link href={`/dashboard/fees?student_id=${student.id}`}>
              <Button variant="outline">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                View Fees
              </Button>
            </Link>
            <Link href={`/dashboard/payments?student_id=${student.id}`}>
              <Button variant="outline">
                <CreditCardIcon className="h-4 w-4 mr-2" />
                View Payments
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{student.first_name} {student.last_name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{student.class_name} {student.class_section}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{format(new Date(student.date_of_birth), 'PPP')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{student.phone}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{student.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <HomeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{student.address}, {student.city}, {student.state} {student.pincode}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Badge variant={getStatusBadgeVariant(student.status)}>
                  {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Parent Information</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Parent Name</p>
                <p className="font-medium">{student.parent_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Parent Phone</p>
                <p className="font-medium">{student.parent_phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Parent Email</p>
                <p className="font-medium">{student.parent_email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Emergency Contact</p>
                <p className="font-medium">{student.emergency_contact}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Plans and Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fee Plans */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Assigned Fee Plans</h2>
            </div>
            <div className="p-6">
              {feePlans.length > 0 ? (
                <div className="space-y-4">
                  {feePlans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600">Academic Year: {plan.academic_year}</p>
                        <p className="text-sm text-gray-600">
                          Assigned: {format(new Date(plan.assigned_date), 'PPP')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{plan.total_amount.toLocaleString()}</p>
                        <Badge variant={getStatusBadgeVariant(plan.status)}>
                          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No fee plans assigned yet</p>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
            </div>
            <div className="p-6">
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Receipt #{payment.receipt_number}</h3>
                        <p className="text-sm text-gray-600">
                          {format(new Date(payment.payment_date), 'PPP')}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{payment.paid_amount.toLocaleString()}</p>
                        <Badge variant={getPaymentStatusBadgeVariant(payment.payment_status)}>
                          {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No payments found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
