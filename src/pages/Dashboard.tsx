// src/pages/Dashboard.tsx
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CircularProgress } from '@/components/dashboard/CircularProgress';
import {
  WorkingIllustration,
  GoalIllustration,
  ChartUpIllustration,
} from '@/components/dashboard/DashboardIllustrations';
import { usePatient } from '@/hooks/usePatient';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { useOPDBill } from '@/hooks/useOPDBill';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { usePatientStatistics } = usePatient();
  const { useOpdVisitStatistics } = useOpdVisit();
  const { useOPDBillStatistics } = useOPDBill();

  // Fetch real data
  const { data: patientStats } = usePatientStatistics();
  const { data: visitStats } = useOpdVisitStatistics();
  const { data: billStats } = useOPDBillStatistics();

  // Calculate values
  const totalRevenue = useMemo(() => {
    return parseFloat(billStats?.received_amount || '10890000');
  }, [billStats]);

  const monthlyRevenue = useMemo(() => {
    return Math.floor(totalRevenue * 0.15);
  }, [totalRevenue]);

  const productGoal = useMemo(() => {
    return patientStats?.total_patients || 3267;
  }, [patientStats]);

  // Revenue data for the main chart (8 months)
  const revenueData = useMemo(() => {
    const base = totalRevenue;
    return [
      { name: 'Jan', value1: Math.floor(base * 0.08), value2: Math.floor(base * 0.05) },
      { name: 'Feb', value1: Math.floor(base * 0.09), value2: Math.floor(base * 0.07) },
      { name: 'Mar', value1: Math.floor(base * 0.11), value2: Math.floor(base * 0.08) },
      { name: 'Apr', value1: Math.floor(base * 0.12), value2: Math.floor(base * 0.09) },
      { name: 'May', value1: Math.floor(base * 0.10), value2: Math.floor(base * 0.11) },
      { name: 'Jun', value1: Math.floor(base * 0.13), value2: Math.floor(base * 0.10) },
      { name: 'Jul', value1: Math.floor(base * 0.14), value2: Math.floor(base * 0.12) },
      { name: 'Aug', value1: Math.floor(base * 0.15), value2: Math.floor(base * 0.13) },
    ];
  }, [totalRevenue]);

  // Mini bar chart data for earnings card
  const miniBarData = useMemo(() => {
    return [
      { value: 45 },
      { value: 52 },
      { value: 48 },
      { value: 58 },
      { value: 50 },
      { value: 55 },
      { value: 60 },
    ];
  }, []);

  return (
    <div className={`flex-1 p-6 overflow-auto ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* First Row: Welcome Card + Product Goal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Welcome Card - 8 columns */}
          <div className="lg:col-span-8">
            <StatCard
              title="Welcome back Natalia!"
              subtitle="Check dashboard"
              value={`₹${monthlyRevenue.toLocaleString('en-IN')}`}
              previousValue="You have earned 25% more than last month which is great"
              illustration={<WorkingIllustration className="w-40 h-40" />}
              action={{
                label: 'Check',
                onClick: () => console.log('Check clicked'),
              }}
              className="h-full"
            />
          </div>

          {/* Product Goal - 4 columns */}
          <div className="lg:col-span-4">
            <StatCard
              title="Product Goal"
              value={productGoal.toLocaleString()}
              variant="gradient"
              illustration={<GoalIllustration className="w-20 h-20" />}
              className="h-full"
            />
          </div>
        </div>

        {/* Second Row: Revenue Chart + Yearly Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Updates Chart - 8 columns */}
          <div className="lg:col-span-8">
            <RevenueChart
              title="Revenue updates"
              data={revenueData}
              dataKey1="Moderate"
              dataKey2="Vegan dishes"
              variant="area"
            />
          </div>

          {/* Yearly Updates - 4 columns */}
          <div className="lg:col-span-4">
            <CircularProgress
              title="Yearly updates"
              value={totalRevenue}
              label={`₹${totalRevenue.toLocaleString('en-IN')}`}
              sublabel="Overview of Profit"
              color="#10B981"
            />
          </div>
        </div>

        {/* Third Row: Total Earnings with mini chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Total Earnings
                  </h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold">
                      ₹{totalRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      +9%
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={80}>
                  <RechartsBarChart data={miniBarData}>
                    <XAxis hide />
                    <YAxis hide />
                    <Bar dataKey="value" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
