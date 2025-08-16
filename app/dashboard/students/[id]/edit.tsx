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
import { ArrowLeftIcon, UserIcon, PhoneIcon, EnvelopeIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Validation schema
const studentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number must be less than 15 digits'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(1, 'Address is required').max(200, 'Address must be less than 200 characters'),
  city: z.string().min(1, 'City is required').max(50, 'City must be less than 50 characters'),
  state: z.string().min(1, 'State is required').max(50, 'State must be less than 50 characters'),
  pincode: z.string().min(6, 'Pincode must be at least 6 digits').max(10, 'Pincode must be less than 10 digits'),
  class_id: z.string().min(1, 'Class is required'),
  parent_name: z.string().min(1, 'Parent name is required').max(100, 'Parent name must be less than 100 characters'),
  parent_phone: z.string().min(10, 'Parent phone must be at least 10 digits').max(15, 'Parent phone must be less than 15 digits'),
  parent_email: z.string().email('Invalid parent email address'),
  emergency_contact: z.string().min(10, 'Emergency contact must be at least 10 digits').max(15, 'Emergency contact must be less than 15 digits'),
  blood_group: z.string().optional(),
  status: z.enum(['active', 'inactive', 'transferred'])
});

type StudentFormData = z.infer<typeof studentSchema>;

interface Class {
  id: string;
  name: string;
  section: string;
}

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [student, setStudent] = useState<StudentFormData | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema)
  });

  useEffect(() => {
    if (profile?.institution_id) {
      fetchClasses();
      fetchStudent();
    }
  }, [profile?.institution_id, params.id]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('institution_id', profile?.institution_id)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
    }
  };

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', params.id)
        .eq('institution_id', profile?.institution_id)
        .single();

      if (error) throw error;

      setStudent(data);
      
      // Set form values
      Object.keys(data).forEach((key) => {
        if (key in data) {
          setValue(key as keyof StudentFormData, data[key]);
        }
      });

    } catch (err) {
      console.error('Error fetching student:', err);
      setError('Failed to load student information');
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

      const response = await fetch(`/api/students/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          institution_id: profile.institution_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student');
      }

      setSuccess('Student updated successfully!');
      
      // Redirect to view page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/students/${params.id}/view`);
      }, 1500);

    } catch (err) {
      console.error('Error updating student:', err);
      setError(err instanceof Error ? err.message : 'Failed to update student');
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

  if (error && !student) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
            <p className="text-gray-600">Update student information and details</p>
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

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <UserIcon className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <Input
                {...register('first_name')}
                placeholder="Enter first name"
                error={errors.first_name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <Input
                {...register('last_name')}
                placeholder="Enter last name"
                error={errors.last_name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="Enter email address"
                error={errors.email?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <Input
                {...register('phone')}
                placeholder="Enter phone number"
                error={errors.phone?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <Input
                {...register('date_of_birth')}
                type="date"
                error={errors.date_of_birth?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group
              </label>
              <Input
                {...register('blood_group')}
                placeholder="Enter blood group"
                error={errors.blood_group?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <UserIcon className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Address Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <Input
                {...register('address')}
                placeholder="Enter complete address"
                error={errors.address?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <Input
                {...register('city')}
                placeholder="Enter city"
                error={errors.city?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <Input
                {...register('state')}
                placeholder="Enter state"
                error={errors.state?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <Input
                {...register('pincode')}
                placeholder="Enter pincode"
                error={errors.pincode?.message}
              />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <AcademicCapIcon className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Academic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                {...register('class_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section}
                  </option>
                ))}
              </select>
              {errors.class_id && (
                <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <UserIcon className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Parent Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Name *
              </label>
              <Input
                {...register('parent_name')}
                placeholder="Enter parent name"
                error={errors.parent_name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Phone *
              </label>
              <Input
                {...register('parent_phone')}
                placeholder="Enter parent phone number"
                error={errors.parent_phone?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Email *
              </label>
              <Input
                {...register('parent_email')}
                type="email"
                placeholder="Enter parent email address"
                error={errors.parent_email?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact *
              </label>
              <Input
                {...register('emergency_contact')}
                placeholder="Enter emergency contact number"
                error={errors.emergency_contact?.message}
              />
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
            {submitting ? 'Updating...' : 'Update Student'}
          </Button>
        </div>
      </form>
    </div>
  );
}
