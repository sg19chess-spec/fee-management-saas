'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { clsx } from 'clsx';
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  CreditCardIcon,
  DocumentTextIcon,
  BellIcon,
  ChartBarIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Students', href: '/dashboard/students', icon: UsersIcon },
  { name: 'Classes', href: '/dashboard/classes', icon: AcademicCapIcon },
  { name: 'Fee Plans', href: '/dashboard/fee-plans', icon: DocumentTextIcon },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCardIcon },
  { name: 'Receipts', href: '/dashboard/receipts', icon: DocumentTextIcon },
  { name: 'Reminders', href: '/dashboard/reminders', icon: BellIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];

export function DashboardSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-6 border-b">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Fee Management</h1>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={clsx(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User profile */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {profile?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-3 flex w-full items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              >
                <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          {/* Header */}
          <div className="flex h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Fee Management</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={clsx(
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                          )}
                        >
                          <item.icon
                            className={clsx(
                              'h-6 w-6 shrink-0',
                              isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>

          {/* User profile */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-3 flex w-full items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
          Fee Management
        </div>
      </div>
    </>
  );
}
