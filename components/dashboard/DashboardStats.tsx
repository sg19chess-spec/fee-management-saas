'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import {
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
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

export function DashboardStats({ stats: initialStats }: DashboardStatsProps) {
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
    if (initialStats) {
      // Use provided stats (for mock data)
      const collectionRate = initialStats.totalCollection > 0 
        ? ((initialStats.totalCollection - initialStats.pendingDues) / initialStats.totalCollection) * 100 
        : 0;
      
      setData({
        ...initialStats,
        collectionRate: Math.round(collectionRate),
        ytdRevenue: initialStats.totalCollection,
      });
      setLoading(false);
    } else {
      fetchDashboardStats();
    }
  }, [initialStats, profile?.institution_id]);

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
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      name: 'Outstanding Dues',
      value: formatCurrency(data.pendingDues),
      change: '+5.2%',
      changeType: 'negative',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      name: 'Collection Rate',
      value: `${data.collectionRate}%`,
      change: '+2.1%',
      changeType: 'positive',
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      name: 'YTD Revenue',
      value: formatCurrency(data.ytdRevenue),
      change: '+18.3%',
      changeType: 'positive',
      icon: CalendarIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  if (loading) {
    return (
      <StaggerContainer>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StaggerItem key={i}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error loading statistics</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <StaggerContainer>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => (
          <StaggerItem key={item.name}>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`h-6 w-6 ${item.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 truncate">
                      {item.name}
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {item.value}
                      </p>
                      <div className={`flex items-center text-sm font-medium ${
                        item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.changeType === 'positive' ? (
                          <TrendingUpIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDownIcon className="h-4 w-4 mr-1" />
                        )}
                        {item.change}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </div>
    </StaggerContainer>
  );
}

