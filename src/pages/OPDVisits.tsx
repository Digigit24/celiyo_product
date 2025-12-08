// src/pages/OPDVisits.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import OPDVisitFormDrawer from '@/components/OPDVisitFormDrawer';
import {
  Loader2,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import { OpdVisit, OpdVisitListParams } from '@/types/opdVisit.types';
import { format } from 'date-fns';

export const OPDVisits: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasModuleAccess } = useAuth();
  const {
    hasHMSAccess,
    useOpdVisits,
    deleteOpdVisit,
    useOpdVisitStatistics,
  } = useOpdVisit();

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'waiting' | 'in_consultation' | 'in_progress' | 'completed' | 'cancelled' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');

  // Build query params
  const queryParams: OpdVisitListParams = {
    page: currentPage,
    search: searchTerm || undefined,
    status: statusFilter || undefined,
  };

  // Fetch visits
  const {
    data: visitsData,
    error: visitsError,
    isLoading: visitsLoading,
    mutate: mutateVisits
  } = useOpdVisits(queryParams);

  // Fetch statistics
  const { data: statistics } = useOpdVisitStatistics();

  const visits = visitsData?.results || [];
  const totalCount = visitsData?.count || 0;
  const hasNext = !!visitsData?.next;
  const hasPrevious = !!visitsData?.previous;

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: 'waiting' | 'in_consultation' | 'in_progress' | 'completed' | 'cancelled' | '') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleView = (visit: OpdVisit) => {
    setSelectedVisitId(visit.id);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleEdit = (visit: OpdVisit) => {
    setSelectedVisitId(visit.id);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedVisitId(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleDelete = async (visit: OpdVisit) => {
    try {
      await deleteOpdVisit(visit.id);
      mutateVisits();
    } catch (error: any) {
      console.error('Delete failed:', error);
    }
  };

  const handleDrawerSuccess = () => {
    mutateVisits();
  };

  const handleDrawerDelete = () => {
    mutateVisits();
  };

  const handleBilling = (visit: OpdVisit) => {
    navigate(`/opd/billing/${visit.id}`);
  };

  const handleConsultation = (visit: OpdVisit) => {
    navigate(`/opd/consultation/${visit.id}`);
  };

  // Format date and time for display
  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, 'MMM dd, yyyy • hh:mm a');
    } catch {
      return `${date} • ${time}`;
    }
  };

  // DataTable columns configuration
  const columns: DataTableColumn<OpdVisit>[] = [
    {
      header: 'Visit',
      key: 'visit_number',
      className: 'w-[14%]',
      cell: (visit) => (
        <div className="flex flex-col">
          <span className="font-medium font-mono text-sm">{visit.visit_number}</span>
          {visit.queue_number && (
            <Badge variant="outline" className="text-xs w-fit mt-1">Queue #{visit.queue_number}</Badge>
          )}
          <span className="text-xs text-muted-foreground mt-1">
            {formatDateTime(visit.visit_date, visit.visit_time)}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient',
      key: 'patient',
      className: 'w-[20%]',
      cell: (visit) => (
        <div className="flex flex-col">
          <span className="font-medium">{visit.patient_details?.full_name || visit.patient_name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">
            {visit.patient_details?.patient_id || visit.patient_id || 'N/A'}
            {visit.patient_details?.mobile_primary && ` • ${visit.patient_details.mobile_primary}`}
          </span>
        </div>
      ),
    },
    {
      header: 'Doctor',
      key: 'doctor',
      className: 'w-[20%]',
      cell: (visit) => (
        <div className="flex flex-col">
          <span className="font-medium">{visit.doctor_details?.full_name || visit.doctor_name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">
            {visit.doctor_details?.specialties?.slice(0, 1).map(s => s.name).join(', ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      className: 'w-[13%]',
      cell: (visit) => (
        <div className="flex flex-col gap-1">
          <Badge variant="secondary" className="text-xs w-fit">
            {visit.visit_type ? visit.visit_type.replace('_', ' ').toUpperCase() : 'N/A'}
          </Badge>
          <Badge
            variant={visit.priority === 'urgent' || visit.priority === 'high' ? 'destructive' : 'outline'}
            className={`text-xs w-fit ${visit.priority === 'high' ? 'bg-orange-600 text-white' : ''}`}
          >
            {visit.priority ? visit.priority.toUpperCase() : 'NORMAL'}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      className: 'w-[11%]',
      cell: (visit) => {
        const statusConfig = {
          waiting: { label: 'Waiting', className: 'bg-orange-600' },
          in_consultation: { label: 'In Consultation', className: 'bg-blue-600' },
          in_progress: { label: 'In Progress', className: 'bg-blue-600' },
          completed: { label: 'Completed', className: 'bg-green-600' },
          cancelled: { label: 'Cancelled', className: 'bg-red-600' },
          no_show: { label: 'No Show', className: 'bg-gray-600' },
        };
        const config = visit.status ? statusConfig[visit.status] : { label: 'Unknown', className: 'bg-gray-600' };
        return (
          <Badge variant="default" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Payment',
      key: 'payment',
      className: 'w-[12%]',
      cell: (visit) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">₹{visit.total_amount || '0'}</span>
          <Badge
            variant={visit.payment_status === 'paid' ? 'default' : 'secondary'}
            className={`text-xs ${visit.payment_status === 'paid' ? 'bg-green-600' : ''}`}
          >
            {visit.payment_status ? visit.payment_status.replace('_', ' ').toUpperCase() : 'PENDING'}
          </Badge>
        </div>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (visit: OpdVisit, actions: any) => {
    return (
      <>
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm font-mono">{visit.visit_number}</h3>
            {visit.queue_number && (
              <Badge variant="outline" className="text-xs mt-1">Queue #{visit.queue_number}</Badge>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDateTime(visit.visit_date, visit.visit_time)}
            </p>
          </div>
          <Badge
            variant="default"
            className={
              visit.status === 'completed'
                ? 'bg-green-600'
                : visit.status === 'in_consultation' || visit.status === 'in_progress'
                ? 'bg-blue-600'
                : visit.status === 'waiting'
                ? 'bg-orange-600'
                : visit.status === 'cancelled' || visit.status === 'no_show'
                ? 'bg-red-600'
                : 'bg-gray-600'
            }
          >
            {visit.status ? visit.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
          </Badge>
        </div>

        {/* Patient & Doctor */}
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-muted-foreground">Patient: </span>
            <span className="font-medium">{visit.patient_details?.full_name || visit.patient_name || 'N/A'}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Doctor: </span>
            <span className="font-medium">{visit.doctor_details?.full_name || visit.doctor_name || 'N/A'}</span>
          </div>
        </div>

        {/* Details Row */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {visit.visit_type ? visit.visit_type.replace('_', ' ').toUpperCase() : 'N/A'}
          </Badge>
          <Badge
            variant={visit.priority === 'urgent' || visit.priority === 'high' ? 'destructive' : 'outline'}
            className={`text-xs ${visit.priority === 'high' ? 'bg-orange-600 text-white' : ''}`}
          >
            {visit.priority ? visit.priority.toUpperCase() : 'NORMAL'}
          </Badge>
          <Badge
            variant={visit.payment_status === 'paid' ? 'default' : 'secondary'}
            className={`text-xs ${visit.payment_status === 'paid' ? 'bg-green-600' : ''}`}
          >
            ₹{visit.total_amount || '0'} • {visit.payment_status ? visit.payment_status.replace('_', ' ').toUpperCase() : 'PENDING'}
          </Badge>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleBilling(visit);
            }}
            className="flex-1"
          >
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Billing
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleConsultation(visit);
            }}
            className="flex-1"
          >
            <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
            Consult
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {actions.view && (
            <Button size="sm" variant="outline" onClick={actions.view} className="flex-1">
              View
            </Button>
          )}
          {actions.edit && (
            <Button size="sm" variant="outline" onClick={actions.edit} className="flex-1">
              Edit
            </Button>
          )}
          {actions.askDelete && (
            <Button size="sm" variant="destructive" onClick={actions.askDelete}>
              Delete
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">OPD Visits</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage outpatient department visits
          </p>
        </div>
        <Button onClick={handleCreate} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Visit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Visits</p>
                <p className="text-xl sm:text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Waiting</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {statistics?.waiting_patients || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Today</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {statistics?.today_visits || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Revenue Today</p>
                <p className="text-xl sm:text-2xl font-bold">
                  ₹{statistics?.revenue_today || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by visit number, patient, doctor..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'waiting' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('waiting')}
              >
                Waiting
              </Button>
              <Button
                variant={statusFilter === 'in_consultation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('in_consultation')}
              >
                In Consultation
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('in_progress')}
              >
                In Progress
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('completed')}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">OPD Visits List</CardTitle>
            {visitsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {visitsError ? (
            <div className="p-8 text-center">
              <p className="text-destructive">{visitsError.message}</p>
            </div>
          ) : (
            <>
              <DataTable
                rows={visits}
                isLoading={visitsLoading}
                columns={columns}
                renderMobileCard={renderMobileCard}
                getRowId={(visit) => visit.id}
                getRowLabel={(visit) => visit.visit_number}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onConsultation={handleConsultation}
                onBilling={handleBilling}
                emptyTitle="No visits found"
                emptySubtitle="Try adjusting your search or filters, or create a new visit"
              />

              {/* Pagination */}
              {!visitsLoading && visits.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {visits.length} of {totalCount} visit(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPrevious}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNext}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      <OPDVisitFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        visitId={selectedVisitId}
        mode={drawerMode}
        onSuccess={handleDrawerSuccess}
        onDelete={handleDrawerDelete}
        onModeChange={(newMode) => setDrawerMode(newMode)}
      />
    </div>
  );
};

export default OPDVisits;
