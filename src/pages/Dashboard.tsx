// src/pages/Dashboard.tsx
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CircularProgress } from '@/components/dashboard/CircularProgress';
import { BarChart } from '@/components/dashboard/BarChart';
import {
  WorkingIllustration,
  GoalIllustration,
  MoneyIllustration,
  ChartUpIllustration,
} from '@/components/dashboard/DashboardIllustrations';
import { usePatient } from '@/hooks/usePatient';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { useOPDBill } from '@/hooks/useOPDBill';

// Toggle between demo and real data
const USE_DEMO_DATA = true;

const Dashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { usePatientStatistics } = usePatient();
  const { useOpdVisitStatistics } = useOpdVisit();
  const { useOPDBillStatistics } = useOPDBill();

  // Fetch real data
  const { data: realPatientStats, isLoading: patientLoading } = usePatientStatistics();
  const { data: realVisitStats, isLoading: visitLoading } = useOpdVisitStatistics();
  const { data: realBillStats, isLoading: billLoading } = useOPDBillStatistics();

  const patientStats = realPatientStats;
  const visitStats = realVisitStats;
  const billStats = realBillStats;
  const isLoading = patientLoading || visitLoading || billLoading;

  // Revenue data for chart (last 8 months)
  const revenueData = useMemo(() => {
    const baseRevenue = parseFloat(billStats?.received_amount || '10890000');

    return [
      { name: 'Jan', value1: Math.floor(baseRevenue * 0.08 + Math.random() * 50000), value2: Math.floor(baseRevenue * 0.05 + Math.random() * 30000) },
      { name: 'Feb', value1: Math.floor(baseRevenue * 0.09 + Math.random() * 50000), value2: Math.floor(baseRevenue * 0.07 + Math.random() * 30000) },
      { name: 'Mar', value1: Math.floor(baseRevenue * 0.11 + Math.random() * 50000), value2: Math.floor(baseRevenue * 0.09 + Math.random() * 30000) },
      { name: 'Apr', value1: Math.floor(baseRevenue * 0.12 + Math.random() * 50000), value2: Math.floor(baseRevenue * 0.08 + Math.random() * 30000) },
      { name: 'May', value1: Math.floor(baseRevenue * 0.10 + Math.random() * 50000), value2: Math.floor(baseRevenue * 0.11 + Math.random() * 30000) },
      { name: 'Jun', value1: Math.floor(baseRevenue * 0.13 + Math.random() * 50000), value2: Math.floor(baseRevenue * 0.10 + Math.random() * 30000) },
      { name: 'Jul', value1: Math.floor(baseRevenue * 0.14 + Math.random() * 50000), value2: Math.floor(baseRevenue * 0.12 + Math.random() * 30000) },
      { name: 'Aug', value1: Math.floor(baseRevenue * 0.15 + Math.random() * 50000), value2: Math.floor(baseRevenue * 0.13 + Math.random() * 30000) },
    ];
  }, [billStats]);

  // Weekly earnings data
  const weeklyEarningsData = useMemo(() => {
    const baseRevenue = parseFloat(billStats?.received_amount || '10890000');

    return [
      { name: 'Mon', value: Math.floor(baseRevenue * 0.03 + Math.random() * 20000) },
      { name: 'Tue', value: Math.floor(baseRevenue * 0.04 + Math.random() * 20000) },
      { name: 'Wed', value: Math.floor(baseRevenue * 0.035 + Math.random() * 20000) },
      { name: 'Thu', value: Math.floor(baseRevenue * 0.045 + Math.random() * 20000) },
      { name: 'Fri', value: Math.floor(baseRevenue * 0.042 + Math.random() * 20000) },
      { name: 'Sat', value: Math.floor(baseRevenue * 0.038 + Math.random() * 20000) },
      { name: 'Sun', value: Math.floor(baseRevenue * 0.032 + Math.random() * 20000) },
    ];
  }, [billStats]);

  // Calculate total revenue
  const totalRevenue = useMemo(() => {
    return parseFloat(billStats?.received_amount || '10890000');
  }, [billStats]);

  // Calculate monthly revenue (for welcome card)
  const monthlyRevenue = useMemo(() => {
    return Math.floor(totalRevenue * 0.15);
  }, [totalRevenue]);

  // Calculate product goal (total patients)
  const productGoal = useMemo(() => {
    return patientStats?.total_patients || 3267;
  }, [patientStats]);

  // Calculate yearly target value
  const yearlyValue = useMemo(() => {
    return totalRevenue;
  }, [totalRevenue]);

  return (
    <div className={`flex-1 p-6 overflow-auto ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className={`text-3xl font-bold ${
            isDark
              ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent'
          }`}>
            Dashboard
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Welcome back! Here's your overview
          </p>
        </div>

        {/* Asymmetric Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Welcome Card - Spans 8 columns on large screens */}
          <div className="lg:col-span-8">
            <StatCard
              title="Welcome back!"
              subtitle="Check dashboard"
              value={`₹${monthlyRevenue.toLocaleString('en-IN')}`}
              previousValue={`You have earned ${Math.floor((monthlyRevenue / (totalRevenue * 0.12)) * 100 - 100)}% more than last month which is great`}
              illustration={<WorkingIllustration className="w-40 h-40" />}
              action={{
                label: 'Check',
                onClick: () => console.log('Check clicked'),
              }}
              className="h-full"
            />
          </div>

          {/* Product Goal - Spans 4 columns on large screens */}
          <div className="lg:col-span-4">
            <StatCard
              title="Product Goal"
              value={productGoal.toLocaleString()}
              subtitle="Total Patients"
              variant="gradient"
              illustration={<GoalIllustration className="w-20 h-20" />}
              className="h-full"
            />
          </div>

          {/* Revenue Chart - Spans 8 columns */}
          <div className="lg:col-span-8">
            <RevenueChart
              title="Revenue Updates"
              data={revenueData}
              dataKey1="Revenue"
              dataKey2="Expenses"
              variant="area"
            />
          </div>

          {/* Circular Progress - Spans 4 columns */}
          <div className="lg:col-span-4">
            <CircularProgress
              title="Yearly Updates"
              value={yearlyValue}
              label={`₹${yearlyValue.toLocaleString('en-IN')}`}
              sublabel="Overview of Profit"
              color="#10B981"
            />
          </div>

          {/* Total Earnings Card - Spans 4 columns */}
          <div className="lg:col-span-4">
            <StatCard
              title="Total Earnings"
              value={`₹${totalRevenue.toLocaleString('en-IN')}`}
              trend={{
                value: 9,
                isPositive: true,
              }}
              previousValue="vs last month"
              illustration={<MoneyIllustration />}
            />
          </div>

          {/* Weekly Earnings Bar Chart - Spans 5 columns */}
          <div className="lg:col-span-5">
            <BarChart
              title="Weekly Earnings"
              data={weeklyEarningsData}
              color="#3b82f6"
            />
          </div>

          {/* Monthly Stats - Spans 3 columns */}
          <div className="lg:col-span-3">
            <StatCard
              title="Today's Visits"
              value={visitStats?.today_visits?.toLocaleString() || '0'}
              trend={{
                value: 12,
                isPositive: true,
              }}
              previousValue="vs yesterday"
              illustration={<ChartUpIllustration />}
              variant="outlined"
            />
          </div>

          {/* Additional Stats Row - 3 columns each */}
          <div className="lg:col-span-3">
            <StatCard
              title="Active Patients"
              value={patientStats?.active_patients?.toLocaleString() || '0'}
              trend={{
                value: 5,
                isPositive: true,
              }}
              previousValue="vs last month"
            />
          </div>

          <div className="lg:col-span-3">
            <StatCard
              title="Pending Bills"
              value={(billStats?.unpaid_bills || 0) + (billStats?.partial_bills || 0)}
              trend={{
                value: 3,
                isPositive: false,
              }}
              previousValue="vs last week"
            />
          </div>

          <div className="lg:col-span-3">
            <StatCard
              title="Total Revenue"
              value={`₹${parseFloat(billStats?.total_amount || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              trend={{
                value: 8,
                isPositive: true,
              }}
              previousValue="vs last month"
            />
          </div>

          <div className="lg:col-span-3">
            <StatCard
              title="Total Visits"
              value={visitStats?.total_visits?.toLocaleString() || '0'}
              trend={{
                value: 15,
                isPositive: true,
              }}
              previousValue="All time visits"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
