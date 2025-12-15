// src/components/pharmacy/PharmacyDashboard.tsx
import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, Clock, Ban, Activity, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';
import { PharmacyProductStats, PharmacyOrderStats } from '@/types/pharmacy.types';
import { useTheme } from 'next-themes';

interface PharmacyDashboardProps {
  productStats: PharmacyProductStats | undefined;
  orderStats: PharmacyOrderStats | undefined;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  isLoading: boolean;
  gradient: string;
  isDark: boolean;
  trend?: string;
  trendUp?: boolean;
}

const StatCard = ({ title, value, icon: Icon, isLoading, gradient, isDark, trend, trendUp }: StatCardProps) => (
  <Card className={`relative overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all duration-300`}>
    <div className="p-6 relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600/80'}`}>{title}</p>
          {isLoading ? (
            <div className="mt-2">
              <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          ) : (
            <h3 className={`text-3xl font-bold mt-2 ${
              isDark
                ? 'bg-gradient-to-br from-gray-100 to-gray-300 bg-clip-text text-transparent'
                : 'bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent'
            }`}>
              {value}
            </h3>
          )}
          {trend && !isLoading && (
            <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl`}>
          <Icon className={`w-7 h-7 ${
            title === 'Total Products' ? 'text-indigo-600' :
            title === 'Low Stock' ? 'text-amber-600' :
            title === 'Near Expiry' ? 'text-orange-600' :
            title === 'Expired' ? 'text-rose-600' :
            title === 'Total Orders' ? 'text-emerald-600' :
            title === 'Pending Orders' ? 'text-blue-600' :
            title === 'Completed Orders' ? 'text-green-600' :
            'text-gray-600'
          }`} />
        </div>
      </div>
    </div>
    <div className={`absolute inset-0 pointer-events-none ${
      isDark
        ? 'bg-gradient-to-br from-white/5 to-transparent'
        : 'bg-gradient-to-br from-white/50 to-transparent'
    }`} />
  </Card>
);

export const PharmacyDashboard: React.FC<PharmacyDashboardProps> = ({ productStats, orderStats, isLoading }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const colors = {
    primary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    pink: '#EC4899',
    purple: '#8B5CF6',
    orange: '#F97316',
    amber: '#F59E0B',
    text: isDark ? '#E5E7EB' : '#6B7280',
    grid: isDark ? '#374151' : '#F3F4F6',
    background: isDark ? '#1F2937' : '#FFFFFF',
  };

  // Stock Status Data for Donut Chart
  const stockStatusData = useMemo(() => {
    if (!productStats) return [0, 0, 0];
    return [
      productStats.in_stock_products || 0,
      productStats.out_of_stock_products || 0,
      productStats.low_stock_products || 0,
    ];
  }, [productStats]);

  // Product Health Data for Radial Bar Chart
  const productHealthData = useMemo(() => {
    if (!productStats) return [0, 0, 0, 0];
    const total = productStats.total_products || 1;
    return [
      Math.round(((productStats.active_products || 0) / total) * 100),
      Math.round(((productStats.in_stock_products || 0) / total) * 100),
      Math.round(((productStats.near_expiry_products || 0) / total) * 100),
      Math.round(((productStats.expired_products || 0) / total) * 100),
    ];
  }, [productStats]);

  // Order Status Data for Donut Chart
  const orderStatusData = useMemo(() => {
    if (!orderStats) return [0, 0, 0];
    return [
      orderStats.pending_orders || 0,
      orderStats.completed_orders || 0,
      orderStats.cancelled_orders || 0,
    ];
  }, [orderStats]);

  // Stock Alerts Data for Bar Chart
  const stockAlertsData = useMemo(() => {
    if (!productStats) return [0, 0, 0];
    return [
      productStats.low_stock_products || 0,
      productStats.near_expiry_products || 0,
      productStats.expired_products || 0,
    ];
  }, [productStats]);

  // Chart Options
  const stockStatusOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 320,
      background: 'transparent',
      dropShadow: {
        enabled: true,
        blur: 3,
        opacity: isDark ? 0.3 : 0.1,
      },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    labels: ['In Stock', 'Out of Stock', 'Low Stock'],
    colors: [colors.success, colors.danger, colors.warning],
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: { colors: colors.text },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Products',
              fontSize: '14px',
              color: colors.text,
              formatter: () => (productStats?.total_products || 0).toString(),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    tooltip: {
      y: { formatter: (value) => `${value} products` },
      theme: isDark ? 'dark' : 'light',
    },
  };

  const productHealthOptions: ApexOptions = {
    chart: {
      type: 'radialBar',
      height: 320,
      background: 'transparent',
      dropShadow: {
        enabled: true,
        blur: 3,
        opacity: isDark ? 0.3 : 0.1,
      },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: '35%',
          background: 'transparent',
        },
        dataLabels: {
          name: { fontSize: '13px', color: colors.text },
          value: { fontSize: '16px', color: isDark ? '#F3F4F6' : '#111827', fontWeight: 'bold' },
        },
        track: {
          background: colors.grid,
          strokeWidth: '100%',
        },
      },
    },
    colors: [colors.primary, colors.success, colors.orange, colors.danger],
    labels: ['Active', 'In Stock', 'Near Expiry', 'Expired'],
    legend: {
      show: true,
      floating: true,
      fontSize: '13px',
      position: 'left',
      offsetX: 0,
      offsetY: 10,
      labels: { colors: colors.text, useSeriesColors: true },
    },
  };

  const orderStatusOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 320,
      background: 'transparent',
      dropShadow: {
        enabled: true,
        blur: 3,
        opacity: isDark ? 0.3 : 0.1,
      },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    labels: ['Pending', 'Completed', 'Cancelled'],
    colors: [colors.warning, colors.success, colors.danger],
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: { colors: colors.text },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Orders',
              fontSize: '14px',
              color: colors.text,
              formatter: () => (orderStats?.total_orders || 0).toString(),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    tooltip: {
      y: { formatter: (value) => `${value} orders` },
      theme: isDark ? 'dark' : 'light',
    },
  };

  const stockAlertsOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 320,
      toolbar: { show: false },
      background: 'transparent',
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 3,
        opacity: isDark ? 0.3 : 0.1,
      },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: '55%',
        distributed: true,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Low Stock', 'Near Expiry', 'Expired'],
      labels: { style: { colors: colors.text, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: colors.text, fontSize: '12px' } },
    },
    colors: [colors.warning, colors.orange, colors.danger],
    grid: { borderColor: colors.grid, strokeDashArray: 4 },
    legend: { show: false },
    tooltip: {
      y: { formatter: (value) => `${value} products` },
      theme: isDark ? 'dark' : 'light',
    },
  };

  return (
    <div className="space-y-6">
      {/* Product Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={productStats?.total_products || 0}
          icon={Package}
          isLoading={isLoading}
          gradient={isDark ? 'from-indigo-900/20 to-indigo-900/10' : 'from-indigo-50 to-indigo-50/30'}
          isDark={isDark}
        />
        <StatCard
          title="Low Stock"
          value={productStats?.low_stock_products || 0}
          icon={AlertTriangle}
          isLoading={isLoading}
          gradient={isDark ? 'from-amber-900/20 to-amber-900/10' : 'from-amber-50 to-amber-50/30'}
          isDark={isDark}
        />
        <StatCard
          title="Near Expiry"
          value={productStats?.near_expiry_products || 0}
          icon={Clock}
          isLoading={isLoading}
          gradient={isDark ? 'from-orange-900/20 to-orange-900/10' : 'from-orange-50 to-orange-50/30'}
          isDark={isDark}
        />
        <StatCard
          title="Expired"
          value={productStats?.expired_products || 0}
          icon={Ban}
          isLoading={isLoading}
          gradient={isDark ? 'from-rose-900/20 to-rose-900/10' : 'from-rose-50 to-rose-50/30'}
          isDark={isDark}
        />
      </div>

      {/* Order Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={orderStats?.total_orders || 0}
          icon={ShoppingCart}
          isLoading={isLoading}
          gradient={isDark ? 'from-emerald-900/20 to-emerald-900/10' : 'from-emerald-50 to-emerald-50/30'}
          isDark={isDark}
        />
        <StatCard
          title="Pending Orders"
          value={orderStats?.pending_orders || 0}
          icon={Clock}
          isLoading={isLoading}
          gradient={isDark ? 'from-blue-900/20 to-blue-900/10' : 'from-blue-50 to-blue-50/30'}
          isDark={isDark}
        />
        <StatCard
          title="Completed Orders"
          value={orderStats?.completed_orders || 0}
          icon={Package}
          isLoading={isLoading}
          gradient={isDark ? 'from-green-900/20 to-green-900/10' : 'from-green-50 to-green-50/30'}
          isDark={isDark}
        />
        <StatCard
          title="Cancelled Orders"
          value={orderStats?.cancelled_orders || 0}
          icon={Ban}
          isLoading={isLoading}
          gradient={isDark ? 'from-red-900/20 to-red-900/10' : 'from-red-50 to-red-50/30'}
          isDark={isDark}
        />
      </div>

      {/* Charts Row 1: Stock Status & Product Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stock Status Distribution Chart */}
        <Card className={`p-6 ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow duration-300`}>
          <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <Package className="w-5 h-5 text-indigo-500" />
            Stock Status Distribution
          </h3>
          {isLoading ? (
            <div className="h-[320px] flex items-center justify-center">
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          ) : (
            <Chart
              options={stockStatusOptions}
              series={stockStatusData}
              type="donut"
              height={320}
            />
          )}
        </Card>

        {/* Product Health Overview Chart */}
        <Card className={`p-6 ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow duration-300`}>
          <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <Activity className="w-5 h-5 text-emerald-500" />
            Product Health Overview
          </h3>
          {isLoading ? (
            <div className="h-[320px] flex items-center justify-center">
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          ) : (
            <Chart
              options={productHealthOptions}
              series={productHealthData}
              type="radialBar"
              height={320}
            />
          )}
        </Card>
      </div>

      {/* Charts Row 2: Order Status & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Order Status Chart */}
        <Card className={`p-6 ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow duration-300`}>
          <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            Order Status Distribution
          </h3>
          {isLoading ? (
            <div className="h-[320px] flex items-center justify-center">
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          ) : (
            <Chart
              options={orderStatusOptions}
              series={orderStatusData}
              type="donut"
              height={320}
            />
          )}
        </Card>

        {/* Stock Alerts Chart */}
        <Card className={`p-6 ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow duration-300`}>
          <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Stock Alerts Overview
          </h3>
          {isLoading ? (
            <div className="h-[320px] flex items-center justify-center">
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          ) : (
            <Chart
              options={stockAlertsOptions}
              series={[{ name: 'Products', data: stockAlertsData }]}
              type="bar"
              height={320}
            />
          )}
        </Card>
      </div>
    </div>
  );
};
