import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApexOptions } from 'apexcharts';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import {
  Activity,
  Users,
  IndianRupee,
  Calendar,
  TrendingUp,
  FileText,
  Loader2,
  UserPlus,
  ClipboardList,
  Receipt,
  ArrowRight,
  Microscope,
} from 'lucide-react';
import { usePatient } from '@/hooks/usePatient';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { useOPDBill } from '@/hooks/useOPDBill';

// ==================== CUSTOM ICONS IMPORT ====================
// Import your custom PNG icons here
// Example:
import TotalPatientsIcon from '@/assets/icons/1.png';
import TodaysVisitsIcon from '@/assets/icons/2.png';
import TotalRevenueIcon from '@/assets/icons/3.png';
import PendingBillsIcon from '@/assets/icons/4.png';

// After importing, uncomment and use them in the customIcons object below:
const customIcons = {
  totalPatients: TotalPatientsIcon,
  todaysVisits: TodaysVisitsIcon,
  totalRevenue: TotalRevenueIcon,
  pendingBills: PendingBillsIcon,
};
// ============================================================

// ==================== TOGGLE BETWEEN DEMO & REAL DATA ====================
// Set to `true` for demo data, `false` for real API data
const USE_DEMO_DATA = true;
// ========================================================================

// ==================== DEMO DATA ====================
const DEMO_DATA = {
  patients: {
    total_patients: 1247,
    active_patients: 1180,
    inactive_patients: 52,
    deceased_patients: 15,
    patients_with_insurance: 834,
    average_age: 42.5,
    total_visits: 4832,
    gender_distribution: {
      Male: 687,
      Female: 523,
      Other: 37,
    },
    blood_group_distribution: {
      'A+': 342,
      'A-': 87,
      'B+': 298,
      'B-': 64,
      'AB+': 156,
      'AB-': 43,
      'O+': 187,
      'O-': 70,
    },
  },
  visits: {
    total_visits: 4832,
    today_visits: 48,
    waiting_patients: 12,
    in_progress_patients: 5,
    completed_today: 31,
    average_waiting_time: '15 mins',
    visits_by_type: {
      new: 1245,
      follow_up: 2987,
      emergency: 432,
      referral: 168,
    },
    visits_by_status: {
      waiting: 12,
      in_progress: 5,
      completed: 4698,
      cancelled: 87,
      no_show: 30,
    },
    revenue_today: '45680',
    pending_payments: 23,
  },
  bills: {
    total_bills: 3421,
    total_amount: '12450000',
    received_amount: '10890000',
    balance_amount: '1560000',
    paid_bills: 2856,
    unpaid_bills: 398,
    partial_bills: 167,
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode | string; // Can be React component or image path
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
  gradient: string;
  isDark: boolean;
}

const StatCard = ({ title, value, icon, trend, trendUp, loading, gradient, isDark }: StatCardProps) => {
  // Check if icon is a string (image path) or React component
  const isImageIcon = typeof icon === 'string';

  return (
    <Card className={`relative overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600/80'}`}>{title}</p>
            {loading ? (
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
            {trend && !loading && (
              <p
                className={`text-xs mt-2 flex items-center gap-1 font-medium ${
                  trendUp ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-4 rounded-2xl`}>
            {isImageIcon ? (
              <img src={icon} alt={title} className="w-20 h-20 object-contain" />
            ) : (
              icon
            )}
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
};

const Dashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const { usePatientStatistics } = usePatient();
  const { useOpdVisitStatistics } = useOpdVisit();
  const { useOPDBillStatistics } = useOPDBill();

  // Fetch real data (only used when USE_DEMO_DATA = false)
  const { data: realPatientStats, isLoading: patientLoading } = usePatientStatistics();
  const { data: realVisitStats, isLoading: visitLoading } = useOpdVisitStatistics();
  const { data: realBillStats, isLoading: billLoading } = useOPDBillStatistics();

  // Select data source based on toggle
  const patientStats = USE_DEMO_DATA ? DEMO_DATA.patients : realPatientStats;
  const visitStats = USE_DEMO_DATA ? DEMO_DATA.visits : realVisitStats;
  const billStats = USE_DEMO_DATA ? DEMO_DATA.bills : realBillStats;
  const isLoading = USE_DEMO_DATA ? false : (patientLoading || visitLoading || billLoading);

  // Theme-aware colors
  const colors = {
    primary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    pink: '#EC4899',
    purple: '#8B5CF6',
    text: isDark ? '#E5E7EB' : '#6B7280',
    grid: isDark ? '#374151' : '#F3F4F6',
    background: isDark ? '#1F2937' : '#FFFFFF',
  };

  // Calculate weekly revenue data (last 7 days)
  const weeklyRevenueData = useMemo(() => {
    if (!billStats) return Array(7).fill(0);
    const baseRevenue = parseFloat(billStats.received_amount || '0');

    if (USE_DEMO_DATA) {
      return [
        Math.floor(baseRevenue * 0.11 + Math.random() * 10000),
        Math.floor(baseRevenue * 0.14 + Math.random() * 10000),
        Math.floor(baseRevenue * 0.15 + Math.random() * 10000),
        Math.floor(baseRevenue * 0.16 + Math.random() * 10000),
        Math.floor(baseRevenue * 0.14 + Math.random() * 10000),
        Math.floor(baseRevenue * 0.13 + Math.random() * 10000),
        Math.floor(baseRevenue * 0.12 + Math.random() * 10000),
      ];
    }

    return [
      Math.floor(baseRevenue * 0.12),
      Math.floor(baseRevenue * 0.15),
      Math.floor(baseRevenue * 0.13),
      Math.floor(baseRevenue * 0.16),
      Math.floor(baseRevenue * 0.14),
      Math.floor(baseRevenue * 0.15),
      Math.floor(baseRevenue * 0.15),
    ];
  }, [billStats]);

  // Visit types data
  const visitTypesData = useMemo(() => {
    if (!visitStats?.visits_by_type) return [0, 0, 0, 0];
    return [
      visitStats.visits_by_type.new || 0,
      visitStats.visits_by_type.follow_up || 0,
      visitStats.visits_by_type.emergency || 0,
      visitStats.visits_by_type.referral || 0,
    ];
  }, [visitStats]);

  // Payment status data
  const paymentStatusData = useMemo(() => {
    if (!billStats) return [0, 0, 0];
    return [billStats.paid_bills || 0, billStats.unpaid_bills || 0, billStats.partial_bills || 0];
  }, [billStats]);

  // Patient growth simulation (6 months)
  const patientGrowthData = useMemo(() => {
    if (!patientStats) return Array(6).fill(0);
    const totalPatients = patientStats.total_patients || 0;

    if (USE_DEMO_DATA) {
      const baseGrowth = Math.floor(totalPatients * 0.7);
      return [
        baseGrowth,
        baseGrowth + Math.floor(totalPatients * 0.04),
        baseGrowth + Math.floor(totalPatients * 0.09),
        baseGrowth + Math.floor(totalPatients * 0.15),
        baseGrowth + Math.floor(totalPatients * 0.22),
        totalPatients,
      ];
    }

    const avgGrowth = Math.floor(totalPatients / 20);
    return Array(6)
      .fill(0)
      .map((_, i) => Math.floor(totalPatients * 0.6 + avgGrowth * i + Math.random() * avgGrowth));
  }, [patientStats]);

  // Visit status percentage
  const visitStatusData = useMemo(() => {
    if (!visitStats?.visits_by_status) return [0, 0, 0, 0];
    const total = visitStats.total_visits || 1;
    return [
      Math.round(((visitStats.visits_by_status.completed || 0) / total) * 100),
      Math.round(((visitStats.visits_by_status.in_progress || 0) / total) * 100),
      Math.round(((visitStats.visits_by_status.waiting || 0) / total) * 100),
      Math.round(((visitStats.visits_by_status.cancelled || 0) / total) * 100),
    ];
  }, [visitStats]);

  // Chart Options with 3D effects and theme support
  const revenueChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 320,
      toolbar: { show: false },
      zoom: { enabled: false },
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
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: isDark ? 0.6 : 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100],
      },
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: colors.text, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: colors.text, fontSize: '12px' },
        formatter: (value) => `₹${(value / 1000).toFixed(0)}k`,
      },
    },
    colors: [colors.primary],
    grid: { borderColor: colors.grid, strokeDashArray: 4 },
    tooltip: {
      y: { formatter: (value) => `₹${value.toLocaleString()}` },
      theme: isDark ? 'dark' : 'light',
    },
  };

  const visitTypesOptions: ApexOptions = {
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
      categories: ['New', 'Follow-up', 'Emergency', 'Referral'],
      labels: { style: { colors: colors.text, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: colors.text, fontSize: '12px' } },
    },
    colors: [colors.primary, colors.success, colors.warning, colors.danger],
    grid: { borderColor: colors.grid, strokeDashArray: 4 },
    legend: { show: false },
    tooltip: {
      y: { formatter: (value) => `${value} visits` },
      theme: isDark ? 'dark' : 'light',
    },
  };

  const paymentStatusOptions: ApexOptions = {
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
    labels: ['Paid', 'Unpaid', 'Partial'],
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
              label: 'Total Bills',
              fontSize: '14px',
              color: colors.text,
              formatter: () => (billStats?.total_bills || 0).toString(),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    tooltip: {
      y: { formatter: (value) => `${value} bills` },
      theme: isDark ? 'dark' : 'light',
    },
  };

  const patientGrowthOptions: ApexOptions = {
    chart: {
      type: 'line',
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
    stroke: { curve: 'smooth', width: 4 },
    markers: {
      size: 6,
      colors: [isDark ? '#1F2937' : '#fff'],
      strokeColors: colors.primary,
      strokeWidth: 3,
      hover: { size: 8 },
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      labels: { style: { colors: colors.text, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: colors.text, fontSize: '12px' } },
    },
    colors: [colors.primary],
    grid: { borderColor: colors.grid, strokeDashArray: 4 },
    tooltip: {
      y: { formatter: (value) => `${value} patients` },
      theme: isDark ? 'dark' : 'light',
    },
  };

  const visitStatusOptions: ApexOptions = {
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
    colors: [colors.success, colors.primary, colors.warning, colors.danger],
    labels: ['Completed', 'In Progress', 'Waiting', 'Cancelled'],
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

  const genderDistributionOptions: ApexOptions = {
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
        borderRadius: 8,
        horizontal: true,
        barHeight: '70%',
        distributed: true,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Male', 'Female', 'Other'],
      labels: { style: { colors: colors.text, fontSize: '12px' } },
      axisBorder: { show: false },
    },
    yaxis: {
      labels: { style: { colors: colors.text, fontSize: '12px' } },
    },
    colors: [colors.primary, colors.pink, colors.purple],
    grid: { borderColor: colors.grid, strokeDashArray: 4 },
    legend: { show: false },
    tooltip: {
      y: { formatter: (value) => `${value} patients` },
      theme: isDark ? 'dark' : 'light',
    },
  };

  return (
    <div className={`flex-1 p-6 overflow-auto ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold ${
                isDark
                  ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent'
              }`}>
                Dashboard
              </h1>
              <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Welcome back! Here's your hospital overview.
              </p>
            </div>
            {USE_DEMO_DATA && (
              <div className={`px-3 py-1.5 rounded-lg border ${
                isDark
                  ? 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-700'
                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
              }`}>
                <p className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>Demo Mode</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation Tabs */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Patients Card */}
            <Card
              onClick={() => navigate('/patients')}
              className={`group cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                isDark
                  ? 'border-gray-700 bg-gradient-to-br from-indigo-950/40 via-gray-800/40 to-indigo-900/30 hover:border-indigo-600'
                  : 'border-gray-200 bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/30 hover:border-indigo-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      isDark
                        ? 'bg-indigo-900/50 group-hover:bg-indigo-800/70'
                        : 'bg-indigo-100 group-hover:bg-indigo-200'
                    }`}>
                      <UserPlus className={`w-5 h-5 ${
                        isDark ? 'text-indigo-400' : 'text-indigo-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        Patients
                      </h3>
                      <p className={`text-xs mt-0.5 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Manage patient records
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                isDark
                  ? 'bg-gradient-to-r from-indigo-600/10 to-transparent'
                  : 'bg-gradient-to-r from-indigo-100/50 to-transparent'
              }`} />
            </Card>

            {/* OPD Visits Card */}
            <Card
              onClick={() => navigate('/opd/visits')}
              className={`group cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                isDark
                  ? 'border-gray-700 bg-gradient-to-br from-emerald-950/40 via-gray-800/40 to-emerald-900/30 hover:border-emerald-600'
                  : 'border-gray-200 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 hover:border-emerald-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      isDark
                        ? 'bg-emerald-900/50 group-hover:bg-emerald-800/70'
                        : 'bg-emerald-100 group-hover:bg-emerald-200'
                    }`}>
                      <ClipboardList className={`w-5 h-5 ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        OPD Visits
                      </h3>
                      <p className={`text-xs mt-0.5 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Track outpatient visits
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                isDark
                  ? 'bg-gradient-to-r from-emerald-600/10 to-transparent'
                  : 'bg-gradient-to-r from-emerald-100/50 to-transparent'
              }`} />
            </Card>

            {/* OPD Bills Card */}
            <Card
              onClick={() => navigate('/opd/bills')}
              className={`group cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                isDark
                  ? 'border-gray-700 bg-gradient-to-br from-amber-950/40 via-gray-800/40 to-amber-900/30 hover:border-amber-600'
                  : 'border-gray-200 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 hover:border-amber-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      isDark
                        ? 'bg-amber-900/50 group-hover:bg-amber-800/70'
                        : 'bg-amber-100 group-hover:bg-amber-200'
                    }`}>
                      <Receipt className={`w-5 h-5 ${
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        OPD Bills
                      </h3>
                      <p className={`text-xs mt-0.5 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        View and manage bills
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                isDark
                  ? 'bg-gradient-to-r from-amber-600/10 to-transparent'
                  : 'bg-gradient-to-r from-amber-100/50 to-transparent'
              }`} />
            </Card>

            {/* Diagnostics Card */}
            <Card
              onClick={() => navigate('/diagnostics')}
              className={`group cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                isDark
                  ? 'border-gray-700 bg-gradient-to-br from-purple-950/40 via-gray-800/40 to-purple-900/30 hover:border-purple-600'
                  : 'border-gray-200 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 hover:border-purple-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      isDark
                        ? 'bg-purple-900/50 group-hover:bg-purple-800/70'
                        : 'bg-purple-100 group-hover:bg-purple-200'
                    }`}>
                      <Microscope className={`w-5 h-5 ${
                        isDark ? 'text-purple-400' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        Diagnostics
                      </h3>
                      <p className={`text-xs mt-0.5 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Lab tests & reports
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                isDark
                  ? 'bg-gradient-to-r from-purple-600/10 to-transparent'
                  : 'bg-gradient-to-r from-purple-100/50 to-transparent'
              }`} />
            </Card>
          </div>
        </div>

        {/* Recent Activities Section */}
        <RecentActivitiesTable isDark={isDark} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Total Patients"
            value={patientStats?.total_patients?.toLocaleString() || '0'}
            icon={customIcons.totalPatients || <Users className="w-7 h-7 text-indigo-600" />}
            // icon={<Users className="w-7 h-7 text-indigo-600" />}
            loading={isLoading && !USE_DEMO_DATA}
            gradient={isDark
              ? 'bg-gradient-to-br from-indigo-900/20 via-gray-800 to-indigo-900/10'
              : 'bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30'}
            trend="+12% from last month"
            trendUp={true}
            isDark={isDark}
          />
          <StatCard
            title="Today's Visits"
            value={visitStats?.today_visits?.toLocaleString() || '0'}
            icon={customIcons.todaysVisits || <Calendar className="w-7 h-7 text-emerald-600" />}
            // icon={<Calendar className="w-7 h-7 text-emerald-600" />}
            loading={isLoading && !USE_DEMO_DATA}
            gradient={isDark
              ? 'bg-gradient-to-br from-emerald-900/20 via-gray-800 to-emerald-900/10'
              : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30'}
            trend="+5% from yesterday"
            trendUp={true}
            isDark={isDark}
          />
          <StatCard
            title="Total Revenue"
            value={`₹${parseFloat(billStats?.received_amount || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={customIcons.totalRevenue || <IndianRupee className="w-7 h-7 text-amber-600" />}
            // icon={<IndianRupee className="w-7 h-7 text-amber-600" />}
            loading={isLoading && !USE_DEMO_DATA}
            gradient={isDark
              ? 'bg-gradient-to-br from-amber-900/20 via-gray-800 to-amber-900/10'
              : 'bg-gradient-to-br from-amber-50 via-white to-amber-50/30'}
            trend="+8% from last week"
            trendUp={true}
            isDark={isDark}
          />
          <StatCard
            title="Pending Bills"
            value={(billStats?.unpaid_bills || 0) + (billStats?.partial_bills || 0)}
            icon={customIcons.pendingBills || <FileText className="w-7 h-7 text-rose-600" />}
            // icon={<FileText className="w-7 h-7 text-rose-600" />}
            loading={isLoading && !USE_DEMO_DATA}
            gradient={isDark
              ? 'bg-gradient-to-br from-rose-900/20 via-gray-800 to-rose-900/10'
              : 'bg-gradient-to-br from-rose-50 via-white to-rose-50/30'}
            trend="-3% from yesterday"
            trendUp={false}
            isDark={isDark}
          />
        </div>

        {/* Charts removed to avoid ApexCharts runtime issues for now */}
      </div>
    </div>
  );
};

// ==================== RECENT ACTIVITIES COMPONENT ====================
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { format } from 'date-fns';
import { useIPD } from '@/hooks/useIPD';
import { OpdVisit } from '@/types/opdVisit.types';
import { Admission } from '@/types/ipd.types';

const RecentActivitiesTable = ({ isDark }: { isDark: boolean }) => {
  const navigate = useNavigate();
  const { useOpdVisits } = useOpdVisit();
  const { useAdmissions } = useIPD();

  // Fetch recent data (limit 5)
  const { data: opdData, isLoading: opdLoading } = useOpdVisits({ page_size: 5, ordering: '-visit_date' });
  const { data: ipdData, isLoading: ipdLoading } = useAdmissions({ page_size: 5, ordering: '-admission_date' });

  const opdVisits = opdData?.results || [];
  const ipdAdmissions = ipdData?.results || [];

  // OPD Columns
  const opdColumns: DataTableColumn<OpdVisit>[] = [
    {
      header: 'Visit ID',
      key: 'visit_number',
      accessor: (row) => row.visit_number,
      cell: (row) => <span className="font-mono text-xs">{row.visit_number}</span>,
    },
    {
      header: 'Patient',
      key: 'patient_name',
      accessor: (row) => row.patient_name || row.patient_details?.full_name || 'N/A',
      cell: (row) => <span className="font-medium">{row.patient_name || row.patient_details?.full_name}</span>,
    },
    {
      header: 'Doctor',
      key: 'doctor_name',
      accessor: (row) => row.doctor_name || row.doctor_details?.full_name || 'N/A',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.doctor_name || row.doctor_details?.full_name}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      accessor: (row) => row.status,
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs capitalize ${
          row.status === 'completed' ? 'bg-green-100 text-green-700' :
          row.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {row.status?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Date',
      key: 'visit_date',
      accessor: (row) => row.visit_date,
      cell: (row) => <span className="text-xs text-muted-foreground">{format(new Date(row.visit_date), 'MMM dd, HH:mm')}</span>,
    },
  ];

  // IPD Columns
  const ipdColumns: DataTableColumn<Admission>[] = [
    {
      header: 'Admission ID',
      key: 'admission_id',
      accessor: (row) => row.admission_id,
      cell: (row) => <span className="font-mono text-xs">{row.admission_id}</span>,
    },
    {
      header: 'Patient',
      key: 'patient_name',
      accessor: (row) => row.patient_name || '',
      cell: (row) => <span className="font-medium">{row.patient_name}</span>,
    },
    {
      header: 'Ward/Bed',
      key: 'ward_name',
      accessor: (row) => row.ward_name,
      cell: (row) => (
        <div className="flex flex-col text-xs">
          <span>{row.ward_name}</span>
          <span className="text-muted-foreground">Bed: {row.bed_number || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      accessor: (row) => row.status,
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs capitalize ${
          row.status === 'admitted' ? 'bg-blue-100 text-blue-700' :
          row.status === 'discharged' ? 'bg-green-100 text-green-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Date',
      key: 'admission_date',
      accessor: (row) => row.admission_date,
      cell: (row) => <span className="text-xs text-muted-foreground">{format(new Date(row.admission_date), 'MMM dd, HH:mm')}</span>,
    },
  ];

  return (
    <div className="mt-4 mb-8">
      {/* Desktop View: Side-by-Side */}
      <div className="hidden xl:grid grid-cols-2 gap-6">
        {/* OPD Visits Table */}
        <Card className={`p-0 overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-medium flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              Recent OPD Visits
            </h3>
            <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary" onClick={() => navigate('/opd/visits')}>View All</span>
          </div>
          <div className="p-0">
            <DataTable
              rows={opdVisits}
              columns={opdColumns}
              isLoading={opdLoading}
              onRowClick={(row) => navigate(`/opd/consultation/${row.id}`)}
              getRowId={(row) => row.id}
              hidePagination
              emptyTitle="No recent visits"
              density="compact"
            />
          </div>
        </Card>

        {/* IPD Admissions Table */}
        <Card className={`p-0 overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              Recent Admissions
            </h3>
            <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary" onClick={() => navigate('/ipd/admissions')}>View All</span>
          </div>
          <div className="p-0">
            <DataTable
              rows={ipdAdmissions}
              columns={ipdColumns}
              isLoading={ipdLoading}
              onRowClick={(row) => navigate(`/ipd/admissions/${row.id}`)}
              getRowId={(row) => row.id}
              hidePagination
              emptyTitle="No recent admissions"
              density="compact"
            />
          </div>
        </Card>
      </div>

      {/* Mobile/Tablet View: Tabs */}
      <div className="xl:hidden">
        <Tabs defaultValue="opd" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="opd">OPD Visits</TabsTrigger>
            <TabsTrigger value="ipd">IPD Admissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="opd">
            <Card className={`p-0 overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="p-0">
                <DataTable
                  rows={opdVisits}
                  columns={opdColumns}
                  isLoading={opdLoading}
                  onRowClick={(row) => navigate(`/opd/consultation/${row.id}`)}
                  getRowId={(row) => row.id}
                  hidePagination
                  emptyTitle="No recent visits"
                  density="compact"
                />
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="ipd">
            <Card className={`p-0 overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="p-0">
                <DataTable
                  rows={ipdAdmissions}
                  columns={ipdColumns}
                  isLoading={ipdLoading}
                  onRowClick={(row) => navigate(`/ipd/admissions/${row.id}`)}
                  getRowId={(row) => row.id}
                  hidePagination
                  emptyTitle="No recent admissions"
                  density="compact"
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
