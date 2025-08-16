'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/components/providers/AuthProvider';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, hasAccess } = useRequireAuth('accountant');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasAccess) {
      if (!user) {
        router.push('/');
      } else {
        // Redirect based on user role
        switch (profile?.role) {
          case 'super_admin':
            router.push('/admin/dashboard');
            break;
          case 'teacher':
            router.push('/teacher/dashboard');
            break;
          case 'student':
          case 'parent':
            router.push('/student/dashboard');
            break;
          default:
            router.push('/');
        }
      }
    }
  }, [user, profile, loading, hasAccess, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      
      <div className="lg:pl-72">
        <DashboardHeader />
        
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
