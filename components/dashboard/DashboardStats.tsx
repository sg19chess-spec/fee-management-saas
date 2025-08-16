'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface DashboardStatsProps {
  stats?: {
    totalStudents: number;
    totalCollection: number;
    pendingDues: number;
    todayPayments: number;
  };
}

interface StatsData {
  totalStudents: number;
  totalCollection: number;
  pendingDues: number;
  todayPayments: number;
  collectionRate: number;
  ytdRevenue: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function DashboardStats({ stats }: DashboardStatsProps) {
  const { profile } = useAuth();
  const [data, setData] = useState<StatsData>({
    totalStudents: 0,
    totalCollection: 0,
    pendingDues: 0,
    todayPayments: 0,
    collectionRate: 0,
    ytdRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stats) {
      // Use provided stats (for mock data)
      const collectionRate = stats.totalCollection > 0 
        ? ((stats.totalCollection - stats.pendingDues) / stats.totalCollection) * 100 
        : 0;
      
      setData({
        ...stats,
        collectionRate: Math.round(collectionRate),
        ytdRevenue: stats.totalCollection,
      });
      setLoading(false);
    } else {
      fetchDashboardStats();
    }
  }, [stats, profile?.institution_id]);

  const fetchDashboardStats = async () => {
    if (!profile?.institution_id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch total students
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', profile.institution_id)
        .eq('is_active', true);

      // Fetch total collection (sum of all completed payments)
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('paid_amount')
        .eq('institution_id', profile.institution_id)
        .eq('payment_status', 'completed');

      const totalCollection = paymentsData?.reduce((sum, payment) => sum + Number(payment.paid_amount), 0) || 0;

      // Fetch pending dues (sum of outstanding amounts)
      const { data: duesData } = await supabase
        .from('student_fee_items')
        .select(`
          outstanding_amount,
          student_fees!inner(
            students!inner(institution_id)
          )
        `)
        .eq('student_fees.students.institution_id', profile.institution_id)
        .gt('outstanding_amount', 0);

      const pendingDues = duesData?.reduce((sum, item) => sum + Number(item.outstanding_amount), 0) || 0;

      // Fetch today's payments
      const today = new Date().toISOString().split('T')[0];
      const { data: todayPaymentsData } = await supabase
        .from('payments')
        .select('paid_amount')
        .eq('institution_id', profile.institution_id)
        .eq('payment_status', 'completed')
        .gte('payment_date', today);

      const todayPayments = todayPaymentsData?.reduce((sum, payment) => sum + Number(payment.paid_amount), 0) || 0;

      // Calculate collection rate
      const collectionRate = totalCollection > 0 
        ? ((totalCollection - pendingDues) / totalCollection) * 100 
        : 0;

      // Calculate YTD revenue (current academic year)
      const currentYear = new Date().getFullYear();
      const { data: ytdData } = await supabase
        .from('payments')
        .select('paid_amount')
        .eq('institution_id', profile.institution_id)
        .eq('payment_status', 'completed')
        .gte('payment_date', `${currentYear}-01-01`);

      const ytdRevenue = ytdData?.reduce((sum, payment) => sum + Number(payment.paid_amount), 0) || 0;

      setData({
        totalStudents: studentsCount || 0,
        totalCollection,
        pendingDues,
        todayPayments,
        collectionRate: Math.round(collectionRate),
        ytdRevenue,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      name: 'Total Collection',
      value: formatCurrency(data.totalCollection),
      change: '+12.5%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Outstanding Dues',
      value: formatCurrency(data.pendingDues),
      change: '+5.2%',
      changeType: 'negative',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
    },
    {
      name: 'Collection Rate',
      value: `${data.collectionRate}%`,
      change: '+2.1%',
      changeType: 'positive',
      icon: ChartBarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'YTD Revenue',
      value: formatCurrency(data.ytdRevenue),
      change: '+18.3%',
      changeType: 'positive',
      icon: CalendarIcon,
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                </div>
                <div className="ml-5 w-full">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading statistics</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {item.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
