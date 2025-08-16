'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on user role
      switch (profile.role) {
        case 'super_admin':
          router.push('/admin/dashboard');
          break;
        case 'school_admin':
        case 'accountant':
          router.push('/dashboard');
          break;
        case 'teacher':
          router.push('/teacher/dashboard');
          break;
        case 'student':
        case 'parent':
          router.push('/student/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Fee Management System
            </h1>
            <p className="text-gray-600">
              Comprehensive fee management solution for schools and colleges
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <LoginForm />
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Don't have an account? Contact your institution administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
