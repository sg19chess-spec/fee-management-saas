'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { mapFeePlans, type FeePlan } from '@/lib/typeMappers';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { FadeIn } from '@/components/ui/motion';
import { Select } from '@/components/ui/Select';
import { Loader2 } from 'lucide-react';

// Extended interface for fee plans with fee items and count
interface FeePlanWithItems extends FeePlan {
  is_active: boolean;
  fee_items: {
    id: string;
    name: string;
    amount: number;
    fee_type: string;
  }[];
  _count?: {
    fee_items: number;
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FeePlansPage() {
  const { profile } = useAuth();
  const [feePlans, setFeePlans] = useState<FeePlanWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (profile?.institution_id) {
      fetchFeePlans();
    }
  }, [profile?.institution_id]);

  useEffect(() => {
    if (profile?.institution_id) {
      setCurrentPage(1);
      fetchFeePlans();
    }
  }, [searchTerm, selectedYear, selectedStatus, profile?.institution_id]);

  useEffect(() => {
    if (profile?.institution_id) {
      fetchFeePlans();
    }
  }, [currentPage, profile?.institution_id]);

  const fetchFeePlans = async () => {
    if (!profile?.institution_id) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('fee_plans')
        .select(`
          id,
          name,
          description,
          academic_year,
          is_active,
          created_at,
          fee_items(
            id,
            name,
            amount,
            fee_type
          )
        `, { count: 'exact' })
        .eq('institution_id', profile.institution_id);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply academic year filter
      if (selectedYear !== 'all') {
        query = query.eq('academic_year', selectedYear);
      }

      // Apply status filter
      if (selectedStatus !== 'all') {
        query = query.eq('is_active', selectedStatus === 'active');
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Process data to add fee item count
      const processedData = data?.map(plan => ({
        ...plan,
        _count: {
          fee_items: plan.fee_items?.length || 0,
        },
      })) || [];

      setFeePlans(processedData?.map(plan => ({
        ...mapFeePlans([plan])[0],
        is_active: plan.is_active || false,
        fee_items: plan.fee_items || [],
        _count: {
          fee_items: plan.fee_items?.length || 0,
        },
      })) || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (err) {
      console.error('Error fetching fee plans:', err);
      setError('Failed to load fee plans');
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

  const getTotalAmount = (feeItems: any[]) => {
    return feeItems?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedYear('all');
    setSelectedStatus('all');
  };

  if (loading && feePlans.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Plans</h1>
          <p className="text-lg text-gray-600">Manage fee structures and plans</p>
        </div>
        <Link href="/dashboard/fee-plans/create">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Fee Plan
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Search Plans</label>
            <Input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
            />
          </div>
          <div>
            <Select
              label="Academic Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              options={[
                { value: 'all', label: 'All Years' },
                { value: '2024-25', label: '2024-25' },
                { value: '2023-24', label: '2023-24' },
                { value: '2022-23', label: '2022-23' },
              ]}
            />
          </div>
          <div>
            <Select
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-500">
            {totalCount} fee plan{totalCount !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading fee plans</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fee Plans Table */}
      <FadeIn>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3">Plan Name</th>
                <th className="px-4 py-3">Academic Year</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Fee Items</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feePlans.map((plan, idx) => (
                <tr
                  key={plan.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition"
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>
                      <div className="font-medium text-gray-900">{plan.name}</div>
                      <div className="text-sm text-gray-500">{plan.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{plan.academic_year}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(getTotalAmount(plan.fee_items))}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{plan._count?.fee_items || 0} items</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <Badge variant={plan.is_active ? 'success' : 'default'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(plan.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/dashboard/fee-plans/${plan.id}/view`}>
                        <Button variant="outline" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/fee-plans/${plan.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeIn>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
          <div className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
            {' '}to{' '}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
            {' '}of{' '}
            <span className="font-medium">{totalCount}</span>
            {' '}results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
