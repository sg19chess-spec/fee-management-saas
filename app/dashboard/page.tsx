'use client';

import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentPayments } from '@/components/dashboard/RecentPayments';
import { FeeCollectionChart } from '@/components/dashboard/FeeCollectionChart';
import { PendingDues } from '@/components/dashboard/PendingDues';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your fee management dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Fee Collection Trends</h2>
          <FeeCollectionChart />
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h2>
          <RecentPayments />
        </div>
      </div>

      {/* Pending Dues */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Dues</h2>
        <PendingDues />
      </div>
    </div>
  );
}
