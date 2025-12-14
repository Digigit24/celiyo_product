// src/components/pharmacy/PharmacyDashboard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, Clock, Ban } from 'lucide-react';
import { PharmacyProductStats } from '@/types/pharmacy.types';

interface PharmacyDashboardProps {
  stats: PharmacyProductStats | undefined;
  isLoading: boolean;
}

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string; value: number; icon: React.ElementType; isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="h-8 w-1/2 bg-muted animate-pulse rounded" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

export const PharmacyDashboard: React.FC<PharmacyDashboardProps> = ({ stats, isLoading }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard
        title="Total Products"
        value={stats?.total_products || 0}
        icon={Package}
        isLoading={isLoading}
      />
      <StatCard
        title="Low Stock"
        value={stats?.low_stock_products || 0}
        icon={AlertTriangle}
        isLoading={isLoading}
      />
      <StatCard
        title="Near Expiry"
        value={stats?.near_expiry_products || 0}
        icon={Clock}
        isLoading={isLoading}
      />
      <StatCard
        title="Expired"
        value={stats?.expired_products || 0}
        icon={Ban}
        isLoading={isLoading}
      />
    </div>
  );
};
