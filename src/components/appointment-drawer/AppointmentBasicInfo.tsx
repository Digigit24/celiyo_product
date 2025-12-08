// src/components/appointment-drawer/AppointmentBasicInfo.tsx
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Appointment, AppointmentCreateData, AppointmentUpdateData } from '@/types/appointment.types';
import type { Doctor } from '@/types/doctor.types';
import type { Patient } from '@/types/patient.types';
import { useDoctor } from '@/hooks/useDoctor';
import { usePatient } from '@/hooks/usePatient';
import { useAppointmentType } from '@/hooks/useAppointmentType';

// Validation schemas
const createAppointmentSchema = z.object({
  doctor_id: z.coerce.number().min(1, 'Doctor is required'),
  patient_id: z.coerce.number().min(1, 'Patient is required'),
  appointment_date: z.string().min(1, 'Appointment date is required'),
  appointment_time: z.string().min(1, 'Appointment time is required'),
  appointment_type_id: z.coerce.number().min(1, 'Appointment type is required'),
  duration_minutes: z.coerce.number().min(5, 'Duration must be at least 5 minutes').default(30),
  end_time: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  chief_complaint: z.string().optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  consultation_fee: z.coerce.number().min(0, 'Fee cannot be negative').optional(),
  is_follow_up: z.boolean().optional(),
  original_appointment_id: z.coerce.number().optional(),
});

const updateAppointmentSchema = z.object({
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  end_time: z.string().optional(),
  duration_minutes: z.coerce.number().min(5).optional(),
  appointment_type_id: z.coerce.number().optional(),
  status: z.enum(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  chief_complaint: z.string().optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  is_follow_up: z.boolean().optional(),
  original_appointment_id: z.coerce.number().optional(),
  cancellation_reason: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof createAppointmentSchema> | z.infer<typeof updateAppointmentSchema>;

export interface AppointmentBasicInfoHandle {
  getFormValues: () => Promise<AppointmentCreateData | AppointmentUpdateData | null>;
}

interface AppointmentBasicInfoProps {
  appointment?: Appointment | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const AppointmentBasicInfo = forwardRef<AppointmentBasicInfoHandle, AppointmentBasicInfoProps>(
  ({ appointment, mode, onSuccess }, ref) => {
    const isReadOnly = mode === 'view';
    const isCreateMode = mode === 'create';

    // Fetch doctors, patients, and appointment types for selects
    const { useDoctors } = useDoctor();
    const { usePatients } = usePatient();
    const { useAppointmentTypes } = useAppointmentType();
    const { data: doctorsData } = useDoctors({ page_size: 100 });
    const { data: patientsData } = usePatients({ page_size: 100 });
    const { data: appointmentTypesData } = useAppointmentTypes({ is_active: true, page_size: 100 });

    const doctors = doctorsData?.results || [];
    const patients = patientsData?.results || [];
    const appointmentTypes = appointmentTypesData?.results || [];

    const schema = isCreateMode ? createAppointmentSchema : updateAppointmentSchema;

    const defaultValues = isCreateMode
      ? {
          doctor_id: 0,
          patient_id: 0,
          appointment_date: '',
          appointment_time: '',
          duration_minutes: 30,
          appointment_type_id: 0,
          status: 'scheduled' as const,
          priority: 'normal' as const,
          chief_complaint: '',
          symptoms: '',
          notes: '',
          consultation_fee: 0,
          is_follow_up: false,
        }
      : {
          appointment_date: appointment?.appointment_date || '',
          appointment_time: appointment?.appointment_time || '',
          end_time: appointment?.end_time || '',
          duration_minutes: appointment?.duration_minutes || 30,
          appointment_type_id: appointment?.appointment_type?.id || 0,
          status: appointment?.status || 'scheduled',
          priority: appointment?.priority || 'normal',
          chief_complaint: appointment?.chief_complaint || '',
          symptoms: appointment?.symptoms || '',
          notes: appointment?.notes || '',
          consultation_fee: parseFloat(appointment?.consultation_fee || '0'),
          is_follow_up: appointment?.is_follow_up || false,
          original_appointment_id: appointment?.original_appointment || undefined,
        };

    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      setValue,
      trigger,
    } = useForm<any>({
      resolver: zodResolver(schema),
      defaultValues,
      mode: 'onBlur', // Validate on blur for immediate feedback
    });

    const watchedDoctorId = watch('doctor_id');
    const watchedAppointmentTypeId = watch('appointment_type_id');
    const watchedStatus = watch('status');
    const watchedPriority = watch('priority');

    // Auto-set fee based on selected doctor and appointment type
    useEffect(() => {
      if (isCreateMode && watchedDoctorId) {
        const selectedDoctor = doctors.find(d => d.id === Number(watchedDoctorId));
        const selectedAppointmentType = appointmentTypes.find(t => t.id === Number(watchedAppointmentTypeId));

        if (selectedDoctor) {
          // Prefer appointment type's base fee if available, otherwise use doctor's consultation fee
          const fee = selectedAppointmentType
            ? parseFloat(selectedAppointmentType.base_consultation_fee || '0')
            : parseFloat(selectedDoctor.consultation_fee || '0');
          setValue('consultation_fee', fee);
        }
      }
    }, [watchedDoctorId, watchedAppointmentTypeId, doctors, appointmentTypes, isCreateMode, setValue]);

    // Expose form validation and data collection to parent
    useImperativeHandle(ref, () => ({
      getFormValues: async (): Promise<AppointmentCreateData | AppointmentUpdateData | null> => {
        return new Promise((resolve) => {
          handleSubmit(
            (data) => {
              if (isCreateMode) {
                const appointmentTypeId = Number(data.appointment_type_id);
                const payload: AppointmentCreateData = {
                  doctor_id: Number(data.doctor_id),
                  patient_id: Number(data.patient_id),
                  appointment_date: data.appointment_date,
                  appointment_time: data.appointment_time,
                  end_time: data.end_time || undefined, // Don't send empty string
                  duration_minutes: Number(data.duration_minutes),
                  appointment_type_id: appointmentTypeId > 0 ? appointmentTypeId : undefined,
                  status: data.status,
                  priority: data.priority,
                  chief_complaint: data.chief_complaint || undefined,
                  symptoms: data.symptoms || undefined,
                  notes: data.notes || undefined,
                  consultation_fee: Number(data.consultation_fee),
                  is_follow_up: data.is_follow_up,
                  original_appointment_id: data.original_appointment_id || undefined,
                };
                resolve(payload);
              } else {
                const payload: AppointmentUpdateData = {
                  patient_id: appointment?.patient?.id,
                  doctor_id: appointment?.doctor?.id,
                  appointment_date: data.appointment_date,
                  appointment_time: data.appointment_time,
                  end_time: data.end_time || undefined, // Don't send empty string
                  duration_minutes: Number(data.duration_minutes),
                  appointment_type_id: data.appointment_type_id ? Number(data.appointment_type_id) : undefined,
                  status: data.status,
                  priority: data.priority,
                  chief_complaint: data.chief_complaint || undefined,
                  symptoms: data.symptoms || undefined,
                  notes: data.notes || undefined,
                  consultation_fee: Number(data.consultation_fee),
                  is_follow_up: data.is_follow_up,
                  original_appointment_id: data.original_appointment_id || undefined,
                  cancellation_reason: data.cancellation_reason || undefined,
                };
                resolve(payload);
              }
            },
            () => resolve(null)
          )();
        });
      },
    }));

    return (
      <div className="space-y-6">
        {/* Doctor & Patient Selection (Create Mode Only) */}
        {isCreateMode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Doctor & Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label htmlFor="doctor_id">Doctor *</Label>
                <Select
                  value={String(watchedDoctorId || '')}
                  onValueChange={(value) => setValue('doctor_id', Number(value))}
                >
                  <SelectTrigger className={errors.doctor_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={String(doctor.id)}>
                        {doctor.full_name} - {doctor.specialties?.map(s => s.name).join(', ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.doctor_id && (
                  <p className="text-sm text-destructive">{errors.doctor_id.message as string}</p>
                )}
              </div>

              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patient_id">Patient *</Label>
                <Select
                  value={String(watch('patient_id') || '')}
                  onValueChange={(value) => setValue('patient_id', Number(value))}
                >
                  <SelectTrigger className={errors.patient_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={String(patient.id)}>
                        {patient.full_name} - {patient.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.patient_id && (
                  <p className="text-sm text-destructive">{errors.patient_id.message as string}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Mode: Show Doctor & Patient Info */}
        {!isCreateMode && appointment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Doctor & Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Doctor</Label>
                  <p className="font-medium">{appointment.doctor?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {appointment.doctor?.specialties?.map(s => s.name).join(', ')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{appointment.patient?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{appointment.patient?.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Appointment Number (View/Edit only) */}
            {!isCreateMode && appointment && (
              <div className="space-y-2">
                <Label>Appointment Number</Label>
                <p className="font-mono font-medium">{appointment.appointment_number}</p>
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment_date">Appointment Date *</Label>
                <Input
                  id="appointment_date"
                  type="date"
                  {...register('appointment_date')}
                  disabled={isReadOnly}
                  className={errors.appointment_date ? 'border-destructive' : ''}
                />
                {errors.appointment_date && (
                  <p className="text-sm text-destructive">{errors.appointment_date.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_time">Appointment Time *</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  {...register('appointment_time')}
                  disabled={isReadOnly}
                  className={errors.appointment_time ? 'border-destructive' : ''}
                />
                {errors.appointment_time && (
                  <p className="text-sm text-destructive">{errors.appointment_time.message as string}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="5"
                step="5"
                {...register('duration_minutes')}
                disabled={isReadOnly}
                className={errors.duration_minutes ? 'border-destructive' : ''}
              />
              {errors.duration_minutes && (
                <p className="text-sm text-destructive">{errors.duration_minutes.message as string}</p>
              )}
            </div>

            {/* Appointment Type */}
            <div className="space-y-2">
              <Label htmlFor="appointment_type_id">
                Appointment Type *
              </Label>
              {isReadOnly ? (
                <div className="pt-2">
                  {appointment?.appointment_type ? (
                    <Badge variant="secondary" style={{ backgroundColor: appointment.appointment_type.color }}>
                      {appointment.appointment_type.name}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not specified</span>
                  )}
                </div>
              ) : (
                <>
                  <Select
                    value={String(watchedAppointmentTypeId || '0')}
                    onValueChange={async (value) => {
                      const numValue = Number(value);
                      setValue('appointment_type_id', numValue);
                      await trigger('appointment_type_id'); // Trigger validation
                    }}
                  >
                    <SelectTrigger className={errors.appointment_type_id ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select appointment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.length > 0 ? (
                        appointmentTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: type.color || '#3b82f6' }}
                              />
                              {type.name}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="0" disabled>
                          No appointment types available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.appointment_type_id && (
                    <p className="text-sm text-destructive">{errors.appointment_type_id.message as string}</p>
                  )}
                </>
              )}
            </div>

            {/* Divider */}
            {!isReadOnly && (
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-4">Optional Fields</p>
              </div>
            )}

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              {isReadOnly ? (
                <div className="pt-2">
                  <Badge
                    variant={
                      watchedPriority === 'urgent' ? 'destructive' :
                      watchedPriority === 'high' ? 'default' :
                      'secondary'
                    }
                  >
                    {(typeof watchedPriority === 'string' ? watchedPriority.toUpperCase() : 'NORMAL')}
                  </Badge>
                </div>
              ) : (
                <Select
                  value={watchedPriority || 'normal'}
                  onValueChange={(value) => setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Consultation Fee */}
            <div className="space-y-2">
              <Label htmlFor="consultation_fee">Consultation Fee</Label>
              <Input
                id="consultation_fee"
                type="number"
                min="0"
                step="0.01"
                {...register('consultation_fee')}
                disabled={isReadOnly}
                className={errors.consultation_fee ? 'border-destructive' : ''}
              />
              {errors.consultation_fee && (
                <p className="text-sm text-destructive">{errors.consultation_fee.message as string}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chief Complaint */}
            <div className="space-y-2">
              <Label htmlFor="chief_complaint">Chief Complaint</Label>
              <Textarea
                id="chief_complaint"
                {...register('chief_complaint')}
                placeholder="Primary reason for the appointment..."
                disabled={isReadOnly}
                rows={2}
              />
            </div>

            {/* Symptoms */}
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                {...register('symptoms')}
                placeholder="Patient symptoms..."
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes..."
                disabled={isReadOnly}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status (Edit/View Mode Only) */}
        {!isCreateMode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {isReadOnly ? (
                  <div className="pt-2">
                    <Badge
                      variant={
                        watchedStatus === 'completed' ? 'default' :
                        watchedStatus === 'cancelled' || watchedStatus === 'no_show' ? 'destructive' :
                        'secondary'
                      }
                      className={
                        watchedStatus === 'completed' ? 'bg-green-600' :
                        watchedStatus === 'in_progress' ? 'bg-blue-600' :
                        watchedStatus === 'confirmed' ? 'bg-purple-600' :
                        watchedStatus === 'checked_in' ? 'bg-yellow-600' : ''
                      }
                    >
                      {(typeof watchedStatus === 'string' ? watchedStatus.replace('_', ' ').toUpperCase() : 'N/A')}
                    </Badge>
                  </div>
                ) : (
                  <Select
                    value={watchedStatus}
                    onValueChange={(value) => setValue('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                      <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

AppointmentBasicInfo.displayName = 'AppointmentBasicInfo';

export default AppointmentBasicInfo;
