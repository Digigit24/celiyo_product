// src/components/patient-drawer/PatientAppointments.tsx
import { useState } from 'react';
import { useAppointment } from '@/hooks/useAppointment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Appointment } from '@/types/appointment.types';
import { Loader2, Eye, Calendar, User, Video, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface PatientAppointmentsProps {
  patientId: number;
  onViewAppointment?: (appointmentId: number) => void;
}

export default function PatientAppointments({ patientId, onViewAppointment }: PatientAppointmentsProps) {
  const { useAppointmentsByPatient } = useAppointment();
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: appointmentsData,
    error: appointmentsError,
    isLoading: appointmentsLoading,
  } = useAppointmentsByPatient(patientId, {
    ordering: '-appointment_date,-appointment_time',
    page: currentPage,
    page_size: 10,
  });

  const appointments = appointmentsData?.results || [];
  const totalCount = appointmentsData?.count || 0;
  const hasNext = !!appointmentsData?.next;
  const hasPrevious = !!appointmentsData?.previous;

  const statusConfig = {
    scheduled: { label: 'Scheduled', className: 'bg-blue-600' },
    confirmed: { label: 'Confirmed', className: 'bg-green-600' },
    in_progress: { label: 'In Progress', className: 'bg-purple-600' },
    completed: { label: 'Completed', className: 'bg-gray-600' },
    cancelled: { label: 'Cancelled', className: 'bg-red-600' },
    no_show: { label: 'No Show', className: 'bg-orange-600' },
  };

  const appointmentTypeConfig = {
    consultation: { label: 'Consultation', className: 'bg-blue-100 text-blue-800' },
    follow_up: { label: 'Follow-up', className: 'bg-green-100 text-green-800' },
    emergency: { label: 'Emergency', className: 'bg-red-100 text-red-800' },
    routine_checkup: { label: 'Routine', className: 'bg-purple-100 text-purple-800' },
  };

  const columns: DataTableColumn<Appointment>[] = [
    {
      header: 'Appointment',
      key: 'appointment_number',
      cell: (appointment) => {
        const appointmentDateTime = appointment.appointment_time
          ? `${appointment.appointment_date}T${appointment.appointment_time}`
          : appointment.appointment_date;
        const dateFormat = appointment.appointment_time ? 'MMM dd, yyyy h:mm a' : 'MMM dd, yyyy';

        return (
          <div className="flex flex-col">
            <span className="font-medium font-mono text-sm">
              {(appointment as any).appointment_id || appointment.appointment_number}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(appointmentDateTime), dateFormat)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Doctor',
      key: 'doctor',
      cell: (appointment) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{appointment.doctor.full_name}</span>
          {appointment.doctor.specialties && appointment.doctor.specialties.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {appointment.doctor.specialties.map((s) => s.name).join(', ')}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'appointment_type',
      cell: (appointment) => {
        const config = appointmentTypeConfig[appointment.appointment_type];
        return (
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Mode',
      key: 'consultation_mode',
      cell: (appointment) => (
        <div className="flex items-center gap-1 text-sm">
          {appointment.consultation_mode === 'online' ? (
            <>
              <Video className="h-4 w-4 text-blue-600" />
              <span>Online</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 text-green-600" />
              <span>Offline</span>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      cell: (appointment) => {
        const config = statusConfig[appointment.status];
        return (
          <Badge variant="default" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Fee',
      key: 'fee_amount',
      cell: (appointment) => (
        <div className="text-sm font-medium">₹{parseFloat(appointment.fee_amount).toLocaleString()}</div>
      ),
    },
  ];

  const renderMobileCard = (appointment: Appointment, actions: any) => {
    const statusConf = statusConfig[appointment.status];
    const typeConf = appointmentTypeConfig[appointment.appointment_type];

    const appointmentDateTime = appointment.appointment_time
      ? `${appointment.appointment_date}T${appointment.appointment_time}`
      : appointment.appointment_date;
    const dateFormat = appointment.appointment_time ? 'MMM dd, yyyy h:mm a' : 'MMM dd, yyyy';

    return (
      <>
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base font-mono">
              {(appointment as any).appointment_id || appointment.appointment_number}
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(appointmentDateTime), dateFormat)}
            </p>
          </div>
          <Badge variant="default" className={statusConf.className}>
            {statusConf.label}
          </Badge>
        </div>

        {/* Doctor Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{appointment.doctor.full_name}</span>
            {appointment.doctor.specialties && appointment.doctor.specialties.length > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                ({appointment.doctor.specialties.map((s) => s.name).join(', ')})
              </span>
            )}
          </div>
        </div>

        {/* Type & Mode */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={typeConf.className}>
            {typeConf.label}
          </Badge>
          <div className="flex items-center gap-1 text-sm">
            {appointment.consultation_mode === 'online' ? (
              <>
                <Video className="h-4 w-4 text-blue-600" />
                <span>Online</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 text-green-600" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Reason */}
        {appointment.reason_for_visit && (
          <div className="text-sm">
            <span className="text-muted-foreground">Reason: </span>
            <span className="line-clamp-2">{appointment.reason_for_visit}</span>
          </div>
        )}

        {/* Fee & Action */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Fee: </span>
            <span className="font-semibold">₹{parseFloat(appointment.fee_amount).toLocaleString()}</span>
          </div>
          {actions.view && (
            <Button size="sm" variant="outline" onClick={actions.view}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
        </div>
      </>
    );
  };

  const handleView = (appointment: Appointment) => {
    onViewAppointment?.(appointment.id);
  };

  if (appointmentsError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Failed to load appointments</p>
            <p className="text-sm text-muted-foreground mt-2">{appointmentsError.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Upcoming</div>
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter((a) => ['scheduled', 'confirmed'].includes(a.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter((a) => a.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Cancelled</div>
            <div className="text-2xl font-bold text-red-600">
              {appointments.filter((a) => ['cancelled', 'no_show'].includes(a.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardContent className="p-0">
          {appointmentsLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <DataTable
                rows={appointments}
                isLoading={appointmentsLoading}
                columns={columns}
                renderMobileCard={renderMobileCard}
                getRowId={(appointment) => appointment.id}
                getRowLabel={(appointment) => (appointment as any).appointment_id || appointment.appointment_number}
                onView={handleView}
                emptyTitle="No appointments found"
                emptySubtitle="This patient has no appointment history"
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
    </div>
  );
}
