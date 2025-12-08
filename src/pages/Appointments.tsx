// src/pages/Appointments.tsx
import React, { useState } from 'react';
import { useAppointment } from '@/hooks/useAppointment';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import AppointmentFormDrawer from '@/components/AppointmentFormDrawer';
import AppointmentCalendarView from '@/components/AppointmentCalendarView';
import AppointmentTypes from '@/components/AppointmentTypes';
import {
  Loader2,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  List,
  CalendarDays,
  Tag,
} from 'lucide-react';
import { Appointment, AppointmentListParams } from '@/types/appointment.types';
import { format } from 'date-fns';

export const Appointments: React.FC = () => {
  const { user, hasModuleAccess } = useAuth();
  const {
    hasHMSAccess,
    useAppointments,
    deleteAppointment,
    useAppointmentStatistics,
  } = useAppointment();

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeTab, setActiveTab] = useState<'appointments' | 'types'>('appointments');

  // Debug logging
  console.log('Appointments component rendering...');
  console.log('HMS Access:', hasHMSAccess);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');

  // Build query params
  const queryParams: AppointmentListParams = {
    page: currentPage,
    search: searchTerm || undefined,
    status: statusFilter || undefined,
  };

  // Fetch appointments
  const {
    data: appointmentsData,
    error: appointmentsError,
    isLoading: appointmentsLoading,
    mutate: mutateAppointments
  } = useAppointments(queryParams);

  // Fetch statistics
  const { data: statistics } = useAppointmentStatistics();

  const appointments = appointmentsData?.results || [];
  const totalCount = appointmentsData?.count || 0;
  const hasNext = !!appointmentsData?.next;
  const hasPrevious = !!appointmentsData?.previous;

  // Debug logging
  console.log('Appointments data:', { appointments, totalCount, isLoading: appointmentsLoading, error: appointmentsError });

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleStatusFilter = (status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | '') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleView = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedAppointmentId(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleDelete = async (appointment: Appointment) => {
    try {
      await deleteAppointment(appointment.id);
      mutateAppointments();
    } catch (error: any) {
      console.error('Delete failed:', error);
    }
  };

  const handleDrawerSuccess = () => {
    mutateAppointments();
  };

  const handleDrawerDelete = () => {
    mutateAppointments();
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
  const columns: DataTableColumn<Appointment>[] = [
    {
      header: 'Appointment',
      key: 'appointment_number',
      cell: (appointment) => (
        <div className="flex flex-col">
          <span className="font-medium font-mono text-sm">{appointment.appointment_number}</span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
          </span>
        </div>
      ),
    },
    {
      header: 'Doctor',
      key: 'doctor',
      cell: (appointment) => (
        <div className="flex flex-col">
          <span className="font-medium">{appointment.doctor?.full_name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">
            {appointment.doctor?.specialties?.slice(0, 2).map(s => s.name).join(', ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient',
      key: 'patient',
      cell: (appointment) => (
        <div className="flex flex-col">
          <span className="font-medium">{appointment.patient?.full_name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">{appointment.patient?.phone}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      cell: (appointment) => (
        <Badge variant="secondary" className="text-xs">
          {appointment.appointment_type?.replace('_', ' ').toUpperCase() || 'N/A'}
        </Badge>
      ),
    },
    {
      header: 'Mode',
      key: 'mode',
      cell: (appointment) => (
        <Badge variant={appointment.consultation_mode === 'online' ? 'default' : 'outline'} className="text-xs">
          {appointment.consultation_mode?.toUpperCase() || 'N/A'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      cell: (appointment) => {
        const statusConfig = {
          scheduled: { label: 'Scheduled', className: 'bg-blue-600' },
          confirmed: { label: 'Confirmed', className: 'bg-purple-600' },
          in_progress: { label: 'In Progress', className: 'bg-orange-600' },
          completed: { label: 'Completed', className: 'bg-green-600' },
          cancelled: { label: 'Cancelled', className: 'bg-red-600' },
          no_show: { label: 'No Show', className: 'bg-gray-600' },
        };
        const config = statusConfig[appointment.status];
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
      cell: (appointment) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">${appointment.fee_amount ?? 0}</span>
          <Badge
            variant={appointment.payment_status === 'paid' ? 'default' : 'secondary'}
            className={`text-xs ${appointment.payment_status === 'paid' ? 'bg-green-600' : ''}`}
          >
            {appointment.payment_status?.replace('_', ' ').toUpperCase() || 'N/A'}
          </Badge>
        </div>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (appointment: Appointment, actions: any) => {
    return (
      <>
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm font-mono">{appointment.appointment_number}</h3>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
            </p>
          </div>
          <Badge
            variant="default"
            className={
              appointment.status === 'completed'
                ? 'bg-green-600'
                : appointment.status === 'in_progress'
                ? 'bg-orange-600'
                : appointment.status === 'confirmed'
                ? 'bg-purple-600'
                : appointment.status === 'cancelled' || appointment.status === 'no_show'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }
          >
            {appointment.status?.replace('_', ' ').toUpperCase() || 'N/A'}
          </Badge>
        </div>

        {/* Doctor & Patient */}
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-muted-foreground">Doctor: </span>
            <span className="font-medium">{appointment.doctor?.full_name}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Patient: </span>
            <span className="font-medium">{appointment.patient?.full_name}</span>
          </div>
        </div>

        {/* Details Row */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {appointment.appointment_type?.replace('_', ' ').toUpperCase() || 'N/A'}
          </Badge>
          <Badge variant={appointment.consultation_mode === 'online' ? 'default' : 'outline'} className="text-xs">
            {appointment.consultation_mode?.toUpperCase() || 'N/A'}
          </Badge>
          <Badge
            variant={appointment.payment_status === 'paid' ? 'default' : 'secondary'}
            className={`text-xs ${appointment.payment_status === 'paid' ? 'bg-green-600' : ''}`}
          >
            ${appointment.fee_amount ?? 0} • {appointment.payment_status?.replace('_', ' ').toUpperCase() || 'N/A'}
          </Badge>
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
          <h1 className="text-2xl sm:text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage patient appointments and types
          </p>
        </div>
        {activeTab === 'appointments' && (
          <div className="flex gap-2 w-full sm:w-auto">
            {/* View Toggle */}
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </Button>
            </div>
            <Button onClick={handleCreate} size="default" className="flex-1 sm:flex-initial">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Appointment</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'appointments' | 'types')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2">
            <Tag className="h-4 w-4" />
            Types
          </TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6 mt-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                <p className="text-xl sm:text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Upcoming</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {statistics?.upcoming_count || 0}
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
                <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {appointments.filter((a) => a.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending Payment</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {appointments.filter((a) => a.payment_status === 'pending').length}
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
                placeholder="Search by appointment number, patient, doctor..."
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
                variant={statusFilter === 'scheduled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('scheduled')}
              >
                Scheduled
              </Button>
              <Button
                variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('confirmed')}
              >
                Confirmed
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

      {/* Appointments View - List or Calendar */}
      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Appointments List</CardTitle>
              {appointmentsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {appointmentsError ? (
              <div className="p-8 text-center">
                <p className="text-destructive">{appointmentsError.message}</p>
              </div>
            ) : (
              <>
                <DataTable
                  rows={appointments}
                  isLoading={appointmentsLoading}
                  columns={columns}
                  renderMobileCard={renderMobileCard}
                  getRowId={(appointment) => appointment.id}
                  getRowLabel={(appointment) => appointment.appointment_number}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  emptyTitle="No appointments found"
                  emptySubtitle="Try adjusting your search or filters, or create a new appointment"
                />

                {/* Pagination */}
                {!appointmentsLoading && appointments.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {appointments.length} of {totalCount} appointment(s)
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
      ) : (
        <AppointmentCalendarView
          appointments={appointments}
          onAppointmentClick={handleView}
          isLoading={appointmentsLoading}
        />
      )}
        </TabsContent>

        {/* Appointment Types Tab */}
        <TabsContent value="types" className="mt-6">
          <AppointmentTypes />
        </TabsContent>
      </Tabs>

      {/* Drawer */}
      <AppointmentFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        appointmentId={selectedAppointmentId}
        mode={drawerMode}
        onSuccess={handleDrawerSuccess}
        onDelete={handleDrawerDelete}
        onModeChange={(newMode) => setDrawerMode(newMode)}
      />
    </div>
  );
};

export default Appointments;
