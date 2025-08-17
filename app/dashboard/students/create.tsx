'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { mapClasses, mapUsers, type Class, type User } from '@/lib/typeMappers';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { FadeIn } from '@/components/ui/motion';
import { Select } from '@/components/ui/Select';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const studentSchema = z.object({
  admission_number: z.string().min(1, 'Admission number is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  class_id: z.string().min(1, 'Class is required'),
  guardian_name: z.string().min(1, 'Guardian name is required'),
  guardian_phone: z.string().min(10, 'Valid phone number is required'),
  guardian_email: z.string().email('Valid email is required'),
  guardian_relationship: z.string().min(1, 'Relationship is required'),
  address: z.string().min(1, 'Address is required'),
  emergency_contact: z.string().min(10, 'Valid emergency contact is required'),
  blood_group: z.string().optional(),
  previous_school: z.string().optional(),
  admission_date: z.string().min(1, 'Admission date is required'),
});

type StudentFormData = z.infer<typeof studentSchema>;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateStudentPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string; section: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      gender: 'male',
      guardian_relationship: 'parent',
      admission_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (profile?.institution_id) {
      fetchClasses();
    }
  }, [profile?.institution_id]);

  const fetchClasses = async () => {
    if (!profile?.institution_id) return;

    try {
      setLoading(true);
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
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    if (!profile?.institution_id) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Create user record first
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: `${data.admission_number}@${profile.institution_id}.student.local`,
        password: `student${data.admission_number}`,
        email_confirm: true,
        user_metadata: {
          role: 'student',
          institution_id: profile.institution_id,
        },
      });

      if (userError) throw userError;

      if (!userData.user) {
        throw new Error('Failed to create user account');
      }

      // Create student profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userData.user.id,
          institution_id: profile.institution_id,
          role: 'student',
          first_name: data.first_name,
          last_name: data.last_name,
          email: `${data.admission_number}@${profile.institution_id}.student.local`,
          phone: data.guardian_phone,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          address: data.address,
        });

      if (profileError) throw profileError;

      // Create student record
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          id: userData.user.id,
          institution_id: profile.institution_id,
          class_id: data.class_id,
          admission_number: data.admission_number,
          admission_date: data.admission_date,
          guardian_name: data.guardian_name,
          guardian_phone: data.guardian_phone,
          guardian_email: data.guardian_email,
          guardian_relationship: data.guardian_relationship,
          emergency_contact: data.emergency_contact,
          blood_group: data.blood_group,
          previous_school: data.previous_school,
          current_academic_year: new Date().getFullYear().toString(),
          enrollment_status: 'active',
        });

      if (studentError) throw studentError;

      setSuccess('Student created successfully!');
      toast.success('Student created successfully!');
      reset();
      
      // Redirect to students list after a short delay
      setTimeout(() => {
        router.push('/dashboard/students');
      }, 2000);
    } catch (err) {
      console.error('Error creating student:', err);
      setError(err instanceof Error ? err.message : 'Failed to create student');
      toast.error(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600"
            aria-label="Back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Student</h1>
            <p className="text-lg text-gray-600">Create a new student profile and account</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-2xl border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Admission Number"
                  {...register('admission_number')}
                  error={errors.admission_number?.message}
                  placeholder="Enter admission number"
                  className="mb-4"
                />
                <Input
                  label="First Name"
                  {...register('first_name')}
                  error={errors.first_name?.message}
                  placeholder="Enter first name"
                  className="mb-4"
                />
                <Input
                  label="Last Name"
                  {...register('last_name')}
                  error={errors.last_name?.message}
                  placeholder="Enter last name"
                  className="mb-4"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  {...register('date_of_birth')}
                  error={errors.date_of_birth?.message}
                  className="mb-4"
                />
                <Select
                  label="Gender"
                  value={watch('gender')}
                  onChange={e => setValue('gender', e.target.value)}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  error={errors.gender?.message}
                  className="mb-4"
                />
                <Select
                  label="Class"
                  value={watch('class_id')}
                  onChange={e => setValue('class_id', e.target.value)}
                  options={classes.map(cls => ({ value: cls.id, label: `${cls.name} ${cls.section}` }))}
                  error={errors.class_id?.message}
                  className="mb-4"
                />
              </div>
            </div>
            {/* Guardian Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2" />
                Guardian Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Guardian Name"
                  {...register('guardian_name')}
                  error={errors.guardian_name?.message}
                  placeholder="Enter guardian name"
                  className="mb-4"
                />
                <Input
                  label="Guardian Phone"
                  type="tel"
                  {...register('guardian_phone')}
                  error={errors.guardian_phone?.message}
                  placeholder="Enter guardian phone number"
                  className="mb-4"
                />
                <Input
                  label="Guardian Email"
                  type="email"
                  {...register('guardian_email')}
                  error={errors.guardian_email?.message}
                  placeholder="Enter guardian email"
                  className="mb-4"
                />
                <Select
                  label="Relationship"
                  value={watch('guardian_relationship')}
                  onChange={e => setValue('guardian_relationship', e.target.value)}
                  options={[
                    { value: 'parent', label: 'Parent' },
                    { value: 'guardian', label: 'Guardian' },
                    { value: 'grandparent', label: 'Grandparent' },
                    { value: 'sibling', label: 'Sibling' },
                    { value: 'other', label: 'Other' },
                  ]}
                  error={errors.guardian_relationship?.message}
                  className="mb-4"
                />
              </div>
            </div>
            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Address"
                  {...register('address')}
                  error={errors.address?.message}
                  placeholder="Enter address"
                  className="mb-4"
                />
                <Input
                  label="Emergency Contact"
                  type="tel"
                  {...register('emergency_contact')}
                  error={errors.emergency_contact?.message}
                  placeholder="Enter emergency contact"
                  className="mb-4"
                />
                <Input
                  label="Blood Group"
                  {...register('blood_group')}
                  error={errors.blood_group?.message}
                  placeholder="e.g., A+, B-, O+"
                  className="mb-4"
                />
                <Input
                  label="Previous School"
                  {...register('previous_school')}
                  error={errors.previous_school?.message}
                  placeholder="Enter previous school (if any)"
                  className="mb-4"
                />
                <Input
                  label="Admission Date"
                  type="date"
                  {...register('admission_date')}
                  error={errors.admission_date?.message}
                  className="mb-4"
                />
              </div>
            </div>
            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} variant="default">
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  'Create Student'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </FadeIn>
  );
}
