// src/components/AppointmentCalendarView.tsx
import React, { useState, useMemo } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types/appointment.types';

interface AppointmentCalendarViewProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  isLoading?: boolean;
}

// Color mapping for appointment statuses
const getStatusColor = (status: string) => {
  const colors = {
    scheduled: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
    confirmed: 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700',
    in_progress: 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700',
    completed: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700',
    cancelled: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
    no_show: 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500 hover:bg-gray-600';
};

export const AppointmentCalendarView: React.FC<AppointmentCalendarViewProps> = ({
  appointments,
  onAppointmentClick,
  isLoading,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get days in current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the first day of the month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = monthStart.getDay();

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};

    appointments.forEach((appointment) => {
      try {
        const dateKey = format(parseISO(appointment.appointment_date), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(appointment);
      } catch (error) {
        console.error('Error parsing appointment date:', error);
      }
    });

    // Sort appointments by time within each day
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        return a.appointment_time.localeCompare(b.appointment_time);
      });
    });

    return grouped;
  }, [appointments]);

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return appointmentsByDate[dateKey] || [];
  };

  const isToday = (day: Date) => isSameDay(day, new Date());

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={previousMonth} disabled={isLoading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} disabled={isLoading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-2 sm:p-4 relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Loading appointments...</span>
              </div>
            </div>
          )}

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[80px] sm:min-h-[120px]" />
            ))}

            {/* Days of the month */}
            {daysInMonth.map((day) => {
              const dayAppointments = getAppointmentsForDay(day);
              const hasAppointments = dayAppointments.length > 0;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 rounded-lg border transition-colors',
                    'bg-card hover:bg-accent/50',
                    isToday(day) && 'border-primary border-2 bg-accent/20'
                  )}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isToday(day) && 'text-primary font-bold'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {hasAppointments && (
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        {dayAppointments.length}
                      </Badge>
                    )}
                  </div>

                  {/* Appointment Chips */}
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayAppointments.slice(0, 3).map((appointment, idx) => (
                      <button
                        key={appointment.id}
                        onClick={() => onAppointmentClick(appointment)}
                        className={cn(
                          'w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium',
                          'text-white transition-colors cursor-pointer',
                          'truncate',
                          getStatusColor(appointment.status)
                        )}
                        title={`${appointment.appointment_time} - ${appointment.patient?.full_name} - ${appointment.doctor?.full_name}`}
                      >
                        <div className="truncate">
                          <span className="hidden sm:inline">{appointment.appointment_time} </span>
                          {appointment.patient?.full_name?.split(' ')[0]}
                        </div>
                      </button>
                    ))}

                    {/* Show "more" indicator if there are more than 3 appointments */}
                    {dayAppointments.length > 3 && (
                      <div className="text-[10px] sm:text-xs text-muted-foreground text-center py-0.5 sm:py-1">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 sm:items-center">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Status Legend:</span>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
              {[
                { status: 'scheduled', label: 'Scheduled' },
                { status: 'confirmed', label: 'Confirmed' },
                { status: 'in_progress', label: 'In Progress' },
                { status: 'completed', label: 'Completed' },
                { status: 'cancelled', label: 'Cancelled' },
                { status: 'no_show', label: 'No Show' },
              ].map(({ status, label }) => (
                <div key={status} className="flex items-center gap-1.5 sm:gap-2">
                  <div className={cn('w-2.5 h-2.5 sm:w-3 sm:h-3 rounded', getStatusColor(status))} />
                  <span className="text-[10px] sm:text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendarView;
