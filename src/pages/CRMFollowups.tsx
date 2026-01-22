// src/pages/CRMFollowups.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '@/hooks/useCRM';
import { useCurrency } from '@/hooks/useCurrency';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { FollowupScheduleDialog } from '@/components/FollowupScheduleDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, AlertCircle, Phone, Mail, MessageCircle, Eye, CalendarClock, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, isWithinInterval, addDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import type { Lead, LeadsQueryParams } from '@/types/crmTypes';

type FollowupFilter = 'all' | 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'no-date';

export const CRMFollowups: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className={activeTab === 'overdue' ? 'ring-2 ring-red-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{counts.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={activeTab === 'today' ? 'ring-2 ring-orange-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-orange-600">{counts.today}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={activeTab === 'tomorrow' ? 'ring-2 ring-blue-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tomorrow</p>
                <p className="text-2xl font-bold text-blue-600">{counts.tomorrow}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={activeTab === 'upcoming' ? 'ring-2 ring-green-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-green-600">{counts.upcoming}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={activeTab === 'no-date' ? 'ring-2 ring-gray-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No Date</p>
                <p className="text-2xl font-bold text-gray-600">{counts.noDate}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
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
