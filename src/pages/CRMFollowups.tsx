// src/pages/CRMFollowups.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useCRM } from '@/hooks/useCRM';
import { useCurrency } from '@/hooks/useCurrency';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { FollowupScheduleDialog } from '@/components/FollowupScheduleDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, AlertCircle, Phone, Mail, MessageCircle, Eye, CalendarClock, MoreVertical, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, isWithinInterval, addDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import type { Lead, LeadsQueryParams } from '@/types/crmTypes';

type FollowupFilter = 'all' | 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'no-date';

// Stats Card Component matching Dashboard style
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  isDark: boolean;
  loading?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

const StatCard = ({ title, value, icon, gradient, isDark, loading, onClick, isActive }: StatCardProps) => {
  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      } ${
        isActive
          ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
          : 'shadow-sm hover:shadow-md hover:scale-[1.01]'
      }`}
      onClick={onClick}
    >
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600/80'}`}>
              {title}
            </p>
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
          </div>
          <div className="p-4 rounded-2xl">
            {icon}
          </div>
        </div>
      </div>
      <div className={`absolute inset-0 pointer-events-none ${gradient}`} />
      <div className={`absolute inset-0 pointer-events-none ${
        isDark
          ? 'bg-gradient-to-br from-white/5 to-transparent'
          : 'bg-gradient-to-br from-white/50 to-transparent'
      }`} />
    </Card>
  );
};

export const CRMFollowups: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { hasCRMAccess, useLeads, patchLead } = useCRM();
  const { formatCurrency: formatCurrencyDynamic } = useCurrency();

  const [activeTab, setActiveTab] = useState<FollowupFilter>('all');
  const [queryParams, setQueryParams] = useState<LeadsQueryParams>({
    page: 1,
    page_size: 100,
    ordering: 'next_follow_up_at',
  });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leadsData, error, isLoading, mutate } = useLeads(queryParams);

  if (!hasCRMAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">CRM Access Required</h2>
              <p className="text-gray-600">
                CRM module is not enabled for your account. Please contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const leads = leadsData?.results || [];

  // Filter leads based on follow-up status
  const filteredLeads = useMemo(() => {
    const now = new Date();

    return leads.filter((lead) => {
      const followUpDate = lead.next_follow_up_at ? parseISO(lead.next_follow_up_at) : null;

      switch (activeTab) {
        case 'overdue':
          return followUpDate && isPast(followUpDate) && !isToday(followUpDate);
        case 'today':
          return followUpDate && isToday(followUpDate);
        case 'tomorrow':
          return followUpDate && isTomorrow(followUpDate);
        case 'upcoming':
          return followUpDate && !isPast(followUpDate) && !isToday(followUpDate) && !isTomorrow(followUpDate);
        case 'no-date':
          return !followUpDate;
        case 'all':
        default:
          return true;
      }
    });
  }, [leads, activeTab]);

  // Count leads by category
  const counts = useMemo(() => {
    const now = new Date();
    const result = {
      all: leads.length,
      overdue: 0,
      today: 0,
      tomorrow: 0,
      upcoming: 0,
      noDate: 0,
    };

    leads.forEach((lead) => {
      const followUpDate = lead.next_follow_up_at ? parseISO(lead.next_follow_up_at) : null;

      if (!followUpDate) {
        result.noDate++;
      } else if (isPast(followUpDate) && !isToday(followUpDate)) {
        result.overdue++;
      } else if (isToday(followUpDate)) {
        result.today++;
      } else if (isTomorrow(followUpDate)) {
        result.tomorrow++;
      } else {
        result.upcoming++;
      }
    });

    return result;
  }, [leads]);

  const handleViewLead = (lead: Lead) => {
    navigate(`/crm/leads/${lead.id}`);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanPhone}`, '_blank');
  };

  const handleScheduleFollowup = (lead: Lead) => {
    setSelectedLead(lead);
    setScheduleDialogOpen(true);
  };

  const handleFollowupSuccess = () => {
    mutate();
  };

  const getFollowupBadge = (lead: Lead) => {
    if (!lead.next_follow_up_at) {
      return <Badge variant="secondary">No Follow-up Set</Badge>;
    }

    const followUpDate = parseISO(lead.next_follow_up_at);
    const isOverdue = isPast(followUpDate) && !isToday(followUpDate);

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      );
    }

    if (isToday(followUpDate)) {
      return (
        <Badge variant="default" className="gap-1 bg-orange-500">
          <Clock className="h-3 w-3" />
          Today
        </Badge>
      );
    }

    if (isTomorrow(followUpDate)) {
      return (
        <Badge variant="secondary" className="gap-1 bg-blue-500 text-white">
          <Calendar className="h-3 w-3" />
          Tomorrow
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <Calendar className="h-3 w-3" />
        {formatDistanceToNow(followUpDate, { addSuffix: true })}
      </Badge>
    );
  };

  const columns: DataTableColumn<Lead>[] = [
    {
      header: 'Lead Name',
      key: 'name',
      cell: (lead) => (
        <div>
          <div className="font-medium">{lead.name}</div>
          {lead.title && <div className="text-sm text-muted-foreground">{lead.title}</div>}
          {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
        </div>
      ),
      accessor: (lead) => lead.name,
      sortable: true,
    },
    {
      header: 'Contact',
      key: 'phone',
      cell: (lead) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{lead.email}</span>
            </div>
          )}
        </div>
      ),
      accessor: (lead) => lead.phone,
    },
    {
      header: 'Follow-up Date',
      key: 'next_follow_up_at',
      cell: (lead) => (
        <div className="space-y-1">
          {lead.next_follow_up_at ? (
            <>
              <div className="text-sm font-medium">
                {format(parseISO(lead.next_follow_up_at), 'MMM dd, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(parseISO(lead.next_follow_up_at), 'hh:mm a')}
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Not set</span>
          )}
        </div>
      ),
      accessor: (lead) => lead.next_follow_up_at || '',
      sortable: true,
    },
    {
      header: 'Status',
      key: 'status',
      cell: (lead) => getFollowupBadge(lead),
      accessor: (lead) => lead.next_follow_up_at || '',
    },
    {
      header: 'Priority',
      key: 'priority',
      cell: (lead) => {
        const priorityColors = {
          LOW: 'bg-blue-100 text-blue-800',
          MEDIUM: 'bg-yellow-100 text-yellow-800',
          HIGH: 'bg-red-100 text-red-800',
        };
        return (
          <Badge variant="secondary" className={priorityColors[lead.priority] || ''}>
            {lead.priority}
          </Badge>
        );
      },
      accessor: (lead) => lead.priority,
      sortable: true,
    },
    {
      header: 'Value',
      key: 'value_amount',
      cell: (lead) => {
        if (!lead.value_amount) return <span className="text-sm text-muted-foreground">-</span>;
        return (
          <div className="text-sm font-medium">
            {formatCurrencyDynamic(parseFloat(lead.value_amount), lead.value_currency || 'INR')}
          </div>
        );
      },
      accessor: (lead) => lead.value_amount || '0',
      sortable: true,
    },
  ];

  // Render mobile card view
  const renderMobileCard = (lead: Lead, actions: any) => {
    return (
      <Card className="mb-3">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{lead.name}</h3>
              {lead.title && <p className="text-sm text-muted-foreground">{lead.title}</p>}
              {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleScheduleFollowup(lead)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Schedule Follow-up
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => lead.phone && handleCall(lead.phone)}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </DropdownMenuItem>
                {lead.email && (
                  <DropdownMenuItem onClick={() => handleEmail(lead.email)}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => lead.phone && handleWhatsApp(lead.phone)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contact Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span>{lead.email}</span>
              </div>
            )}
          </div>

          {/* Follow-up Info */}
          <div className="space-y-2">
            <div className="text-sm">
              {lead.next_follow_up_at ? (
                <>
                  <div className="font-medium">{format(parseISO(lead.next_follow_up_at), 'MMM dd, yyyy')}</div>
                  <div className="text-xs text-muted-foreground">{format(parseISO(lead.next_follow_up_at), 'hh:mm a')}</div>
                </>
              ) : (
                <span className="text-muted-foreground">No follow-up set</span>
              )}
            </div>
            {getFollowupBadge(lead)}
          </div>

          {/* Priority & Value */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={
              lead.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
              lead.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }>
              {lead.priority}
            </Badge>
            {lead.value_amount && (
              <span className="text-sm font-medium text-green-600">
                {formatCurrencyDynamic(parseFloat(lead.value_amount), lead.value_currency || 'INR')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarClock className="h-8 w-8" />
            Follow-ups
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your lead follow-up schedule
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard
          title="Overdue"
          value={counts.overdue}
          icon={<AlertCircle className="w-7 h-7 text-red-600" />}
          gradient={isDark
            ? 'bg-gradient-to-br from-red-900/20 via-gray-800 to-red-900/10'
            : 'bg-gradient-to-br from-red-50 via-white to-red-50/30'}
          isDark={isDark}
          loading={isLoading}
          onClick={() => setActiveTab('overdue')}
          isActive={activeTab === 'overdue'}
        />
        <StatCard
          title="Today"
          value={counts.today}
          icon={<Clock className="w-7 h-7 text-orange-600" />}
          gradient={isDark
            ? 'bg-gradient-to-br from-orange-900/20 via-gray-800 to-orange-900/10'
            : 'bg-gradient-to-br from-orange-50 via-white to-orange-50/30'}
          isDark={isDark}
          loading={isLoading}
          onClick={() => setActiveTab('today')}
          isActive={activeTab === 'today'}
        />
        <StatCard
          title="Tomorrow"
          value={counts.tomorrow}
          icon={<Calendar className="w-7 h-7 text-blue-600" />}
          gradient={isDark
            ? 'bg-gradient-to-br from-blue-900/20 via-gray-800 to-blue-900/10'
            : 'bg-gradient-to-br from-blue-50 via-white to-blue-50/30'}
          isDark={isDark}
          loading={isLoading}
          onClick={() => setActiveTab('tomorrow')}
          isActive={activeTab === 'tomorrow'}
        />
        <StatCard
          title="Upcoming"
          value={counts.upcoming}
          icon={<Calendar className="w-7 h-7 text-green-600" />}
          gradient={isDark
            ? 'bg-gradient-to-br from-green-900/20 via-gray-800 to-green-900/10'
            : 'bg-gradient-to-br from-green-50 via-white to-green-50/30'}
          isDark={isDark}
          loading={isLoading}
          onClick={() => setActiveTab('upcoming')}
          isActive={activeTab === 'upcoming'}
        />
        <StatCard
          title="No Date"
          value={counts.noDate}
          icon={<Calendar className="w-7 h-7 text-gray-600" />}
          gradient={isDark
            ? 'bg-gradient-to-br from-gray-900/20 via-gray-800 to-gray-900/10'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-50/30'}
          isDark={isDark}
          loading={isLoading}
          onClick={() => setActiveTab('no-date')}
          isActive={activeTab === 'no-date'}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FollowupFilter)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600 data-[state=active]:bg-red-50">
            Overdue ({counts.overdue})
          </TabsTrigger>
          <TabsTrigger value="today" className="text-orange-600 data-[state=active]:bg-orange-50">
            Today ({counts.today})
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="text-blue-600 data-[state=active]:bg-blue-50">
            Tomorrow ({counts.tomorrow})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-green-600 data-[state=active]:bg-green-50">
            Upcoming ({counts.upcoming})
          </TabsTrigger>
          <TabsTrigger value="no-date" className="text-gray-600 data-[state=active]:bg-gray-50">
            No Date ({counts.noDate})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' && 'All Follow-ups'}
                {activeTab === 'overdue' && 'Overdue Follow-ups'}
                {activeTab === 'today' && "Today's Follow-ups"}
                {activeTab === 'tomorrow' && "Tomorrow's Follow-ups"}
                {activeTab === 'upcoming' && 'Upcoming Follow-ups'}
                {activeTab === 'no-date' && 'Leads Without Follow-up Date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={filteredLeads}
                columns={columns}
                renderMobileCard={renderMobileCard}
                getRowId={(lead) => lead.id}
                getRowLabel={(lead) => lead.name}
                isLoading={isLoading}
                onView={handleViewLead}
                extraActions={(lead) => (
                  <>
                    <DropdownMenuItem onClick={() => handleScheduleFollowup(lead)}>
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Schedule Follow-up
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => lead.phone && handleCall(lead.phone)}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </DropdownMenuItem>
                    {lead.email && (
                      <DropdownMenuItem onClick={() => handleEmail(lead.email)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => lead.phone && handleWhatsApp(lead.phone)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </DropdownMenuItem>
                  </>
                )}
                emptyTitle={`No ${activeTab === 'all' ? '' : activeTab} follow-ups found`}
                emptySubtitle="Try adjusting your filters"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Follow-up Schedule Dialog */}
      <FollowupScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        lead={selectedLead}
        onSuccess={handleFollowupSuccess}
      />
    </div>
  );
};
