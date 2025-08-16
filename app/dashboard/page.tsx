'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentPayments } from '@/components/dashboard/RecentPayments';
import { FeeCollectionChart } from '@/components/dashboard/FeeCollectionChart';
import { PendingDues } from '@/components/dashboard/PendingDues';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCollection: 0,
    pendingDues: 0,
    todayPayments: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // TODO: Implement API calls to fetch dashboard data
        // For now, using mock data
        setStats({
          totalStudents: 1250,
          totalCollection: 2500000,
          pendingDues: 450000,
          todayPayments: 75000,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your institution today.
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Fee Collection Trend</h3>
            <p className="card-description">
              Monthly fee collection for the current academic year
            </p>
          </div>
          <div className="card-content">
            <FeeCollectionChart />
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Payments</h3>
            <p className="card-description">
              Latest payment transactions
            </p>
          </div>
          <div className="card-content">
            <RecentPayments />
          </div>
        </div>
      </div>

      {/* Pending Dues */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Pending Dues</h3>
          <p className="card-description">
            Students with overdue fees
          </p>
        </div>
        <div className="card-content">
          <PendingDues />
        </div>
      </div>
    </div>
  );
}
