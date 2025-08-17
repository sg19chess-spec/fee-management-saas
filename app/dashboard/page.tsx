'use client';

import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentPayments } from '@/components/dashboard/RecentPayments';
import { FeeCollectionChart } from '@/components/dashboard/FeeCollectionChart';
import { PendingDues } from '@/components/dashboard/PendingDues';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-lg text-gray-600">
            Welcome to your fee management dashboard
          </p>
        </div>
      </FadeIn>

      {/* Stats Cards */}
      <StaggerContainer>
        <StaggerItem>
          <DashboardStats />
        </StaggerItem>
      </StaggerContainer>

      {/* Charts and Tables Grid */}
      <StaggerContainer staggerDelay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Collection Chart */}
          <StaggerItem>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Fee Collection Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <FeeCollectionChart />
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Recent Payments */}
          <StaggerItem>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentPayments />
              </CardContent>
            </Card>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {/* Pending Dues */}
      <StaggerItem>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Pending Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingDues />
          </CardContent>
        </Card>
      </StaggerItem>
    </div>
  );
}
