import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { usePharmacy } from '@/hooks/usePharmacy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import {
  Package,
  AlertTriangle,
  Clock,
  Ban,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

function StatCard({ title, value, icon, variant = 'default', subtitle }: StatCardProps) {
  const variantStyles = {
    default: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-orange-50 text-orange-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', variantStyles[variant])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export const PharmacyStatisticsPage: React.FC = () => {
  const { usePharmacyProductStats, usePharmacyOrderStats } = usePharmacy();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    data: productStats,
    isLoading: productStatsLoading,
    error: productStatsError,
  } = usePharmacyProductStats();

  const {
    data: orderStats,
    isLoading: orderStatsLoading,
    error: orderStatsError,
  } = usePharmacyOrderStats();

  const isLoading = productStatsLoading || orderStatsLoading;
  const hasError = productStatsError || orderStatsError;

  // Theme-aware colors
  const colors = useMemo(() => ({
    text: isDark ? '#9CA3AF' : '#6B7280',
    grid: isDark ? '#374151' : '#E5E7EB',
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  }), [isDark]);

  // Chart data preparations
  const inventoryStatusData = useMemo(() => {
    if (!productStats) return [0, 0, 0];
    return [
      productStats.in_stock_products || 0,
      productStats.out_of_stock_products || 0,
      productStats.low_stock_products || 0,
    ];
  }, [productStats]);

  const stockAlertsData = useMemo(() => {
    if (!productStats) return [0, 0, 0, 0];
    return [
      productStats.low_stock_products || 0,
      productStats.near_expiry_products || 0,
      productStats.expired_products || 0,
      productStats.out_of_stock_products || 0,
    ];
  }, [productStats]);

  const orderStatusData = useMemo(() => {
    if (!orderStats) return [0, 0, 0];
    return [
      orderStats.pending_orders || 0,
      orderStats.completed_orders || 0,
      orderStats.cancelled_orders || 0,
    ];
  }, [orderStats]);

  const productActivityData = useMemo(() => {
    if (!productStats) return [0, 0];
    return [
      productStats.active_products || 0,
      productStats.inactive_products || 0,
    ];
  }, [productStats]);

  // Chart Options
  const inventoryStatusOptions: ApexOptions = {
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
        horizontal: true,
        distributed: true,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Low Stock', 'Near Expiry', 'Expired', 'Out of Stock'],
      labels: { style: { colors: colors.text, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: colors.text, fontSize: '12px' } },
    },
    colors: [colors.warning, colors.warning, colors.danger, colors.danger],
    grid: { borderColor: colors.grid, strokeDashArray: 4 },
    legend: { show: false },
    tooltip: {
      y: { formatter: (value) => `${value} items` },
      theme: isDark ? 'dark' : 'light',
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

  const productActivityOptions: ApexOptions = {
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
    labels: ['Active', 'Inactive'],
    colors: [colors.success, colors.text],
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Statistics</h3>
          <p className="text-sm text-muted-foreground">
            {productStatsError?.message || orderStatsError?.message || 'Failed to load statistics'}
          </p>
        </div>
      </div>
    );
  }

  const stockPercentage = productStats?.total_products
    ? ((productStats.in_stock_products / productStats.total_products) * 100).toFixed(1)
    : '0';

  const activePercentage = productStats?.total_products
    ? ((productStats.active_products / productStats.total_products) * 100).toFixed(1)
    : '0';

  const orderCompletionRate = orderStats?.total_orders
    ? ((orderStats.completed_orders / orderStats.total_orders) * 100).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pharmacy Statistics</h1>
          <p className="text-muted-foreground mt-1">
            Overview of products, inventory, and orders
          </p>
        </div>
      </div>

      {/* Product Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={productStats?.total_products || 0}
            icon={<Package className="h-4 w-4" />}
            variant="default"
            subtitle={`${productStats?.categories || 0} categories`}
          />
          <StatCard
            title="Active Products"
            value={productStats?.active_products || 0}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
            subtitle={`${activePercentage}% of total`}
          />
          <StatCard
            title="Inactive Products"
            value={productStats?.inactive_products || 0}
            icon={<XCircle className="h-4 w-4" />}
            variant="default"
          />
          <StatCard
            title="In Stock"
            value={productStats?.in_stock_products || 0}
            icon={<TrendingUp className="h-4 w-4" />}
            variant="success"
            subtitle={`${stockPercentage}% in stock`}
          />
        </div>
      </div>

      {/* Inventory Alerts */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Inventory Alerts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Out of Stock"
            value={productStats?.out_of_stock_products || 0}
            icon={<Ban className="h-4 w-4" />}
            variant="danger"
            subtitle="Needs restocking"
          />
          <StatCard
            title="Low Stock"
            value={productStats?.low_stock_products || 0}
            icon={<AlertTriangle className="h-4 w-4" />}
            variant="warning"
            subtitle="Below minimum level"
          />
          <StatCard
            title="Near Expiry"
            value={productStats?.near_expiry_products || 0}
            icon={<Clock className="h-4 w-4" />}
            variant="warning"
            subtitle="Expiring within 30 days"
          />
          <StatCard
            title="Expired"
            value={productStats?.expired_products || 0}
            icon={<Ban className="h-4 w-4" />}
            variant="danger"
            subtitle="Past expiry date"
          />
        </div>
      </div>

      {/* Order Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders"
            value={orderStats?.total_orders || 0}
            icon={<ShoppingCart className="h-4 w-4" />}
            variant="default"
          />
          <StatCard
            title="Pending Orders"
            value={orderStats?.pending_orders || 0}
            icon={<Loader2 className="h-4 w-4" />}
            variant="warning"
            subtitle="Awaiting processing"
          />
          <StatCard
            title="Completed Orders"
            value={orderStats?.completed_orders || 0}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
            subtitle={`${orderCompletionRate}% completion rate`}
          />
          <StatCard
            title="Cancelled Orders"
            value={orderStats?.cancelled_orders || 0}
            icon={<XCircle className="h-4 w-4" />}
            variant="danger"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">In Stock</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{stockPercentage}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Low Stock Warning</span>
              <Badge variant="warning" className="bg-orange-100 text-orange-700">
                {productStats?.low_stock_products || 0} items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Out of Stock</span>
              <Badge variant="destructive">
                {productStats?.out_of_stock_products || 0} items
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expiry Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expired Products</span>
              <Badge variant="destructive">
                {productStats?.expired_products || 0} items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expiring Soon (30 days)</span>
              <Badge variant="warning" className="bg-yellow-100 text-yellow-700">
                {productStats?.near_expiry_products || 0} items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Categories</span>
              <Badge variant="secondary">
                {productStats?.categories || 0} categories
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Visual Analytics
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                options={inventoryStatusOptions}
                series={inventoryStatusData}
                type="donut"
                height={320}
              />
            </CardContent>
          </Card>

          {/* Stock Alerts Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                options={stockAlertsOptions}
                series={[{ name: 'Items', data: stockAlertsData }]}
                type="bar"
                height={320}
              />
            </CardContent>
          </Card>

          {/* Order Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                options={orderStatusOptions}
                series={orderStatusData}
                type="donut"
                height={320}
              />
            </CardContent>
          </Card>

          {/* Product Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                options={productActivityOptions}
                series={productActivityData}
                type="donut"
                height={320}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PharmacyStatisticsPage;
