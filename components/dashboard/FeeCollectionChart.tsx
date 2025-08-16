'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

interface ChartData {
  month: string;
  collection: number;
  target: number;
  previousYear: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function FeeCollectionChart() {
  const { profile } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  useEffect(() => {
    if (profile?.institution_id) {
      fetchChartData();
    }
  }, [profile?.institution_id]);

  const fetchChartData = async () => {
    if (!profile?.institution_id) return;

    try {
      setLoading(true);
      setError(null);

      // Get current year
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;

      // Fetch current year data
      const { data: currentYearData, error: currentError } = await supabase
        .from('payments')
        .select('paid_amount, payment_date')
        .eq('institution_id', profile.institution_id)
        .eq('payment_status', 'completed')
        .gte('payment_date', `${currentYear}-01-01`)
        .lte('payment_date', `${currentYear}-12-31`);

      if (currentError) throw currentError;

      // Fetch previous year data
      const { data: previousYearData, error: previousError } = await supabase
        .from('payments')
        .select('paid_amount, payment_date')
        .eq('institution_id', profile.institution_id)
        .eq('payment_status', 'completed')
        .gte('payment_date', `${previousYear}-01-01`)
        .lte('payment_date', `${previousYear}-12-31`);

      if (previousError) throw previousError;

      // Process data by month
      const monthlyData = processMonthlyData(currentYearData || [], previousYearData || []);

      setData(monthlyData);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (currentYearData: any[], previousYearData: any[]) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const currentYearMap = new Map();
    const previousYearMap = new Map();

    // Process current year data
    currentYearData.forEach(payment => {
      const month = new Date(payment.payment_date).getMonth();
      const currentAmount = currentYearMap.get(month) || 0;
      currentYearMap.set(month, currentAmount + Number(payment.paid_amount));
    });

    // Process previous year data
    previousYearData.forEach(payment => {
      const month = new Date(payment.payment_date).getMonth();
      const previousAmount = previousYearMap.get(month) || 0;
      previousYearMap.set(month, previousAmount + Number(payment.paid_amount));
    });

    // Create chart data
    return months.map((month, index) => ({
      month,
      collection: currentYearMap.get(index) || 0,
      target: Math.round((currentYearMap.get(index) || 0) * 1.1), // 10% above current
      previousYear: previousYearMap.get(index) || 0,
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading chart</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No collection data</h3>
        <p className="text-gray-500">Collection data will appear here once payments are processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => setChartType('bar')}
          className={`px-3 py-1 text-sm rounded-md ${
            chartType === 'bar'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Bar Chart
        </button>
        <button
          onClick={() => setChartType('line')}
          className={`px-3 py-1 text-sm rounded-md ${
            chartType === 'line'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Line Chart
        </button>
        <button
          onClick={() => setChartType('area')}
          className={`px-3 py-1 text-sm rounded-md ${
            chartType === 'area'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Area Chart
        </button>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="collection" fill="#3B82F6" name="Collection" />
              <Bar dataKey="target" fill="#10B981" name="Target" />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="collection"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Collection"
              />
              <Line
                type="monotone"
                dataKey="previousYear"
                stroke="#6B7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Previous Year"
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="collection"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Collection"
              />
              <Area
                type="monotone"
                dataKey="target"
                stackId="2"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
                name="Target"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span>Current Year</span>
        </div>
        {chartType === 'bar' && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Target</span>
          </div>
        )}
        {chartType === 'line' && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
            <span>Previous Year</span>
          </div>
        )}
        {chartType === 'area' && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Target</span>
          </div>
        )}
      </div>
    </div>
  );
}
