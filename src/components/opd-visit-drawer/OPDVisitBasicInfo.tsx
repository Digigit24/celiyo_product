// src/components/opd-visit-drawer/OPDVisitBasicInfo.tsx
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { OpdVisit, OpdVisitCreateData, OpdVisitUpdateData } from '@/types/opdVisit.types';
import { useDoctor } from '@/hooks/useDoctor';
import { usePatient } from '@/hooks/usePatient';

// Validation schemas
const createOpdVisitSchema = z.object({
  patient_id: z.coerce.number().min(1, 'Patient is required'),
  doctor_id: z.coerce.number().min(1, 'Doctor is required'),
  visit_date: z.string().min(1, 'Visit date is required'),
  visit_time: z.string().min(1, 'Visit time is required'),
  visit_type: z.enum(['new', 'follow_up', 'emergency', 'referral']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  chief_complaint: z.string().optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  temperature: z.string().optional(),
  blood_pressure_systolic: z.coerce.number().optional(),
  blood_pressure_diastolic: z.coerce.number().optional(),
  heart_rate: z.coerce.number().optional(),
  respiratory_rate: z.coerce.number().optional(),
  oxygen_saturation: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  additional_charges: z.coerce.number().min(0).optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().optional(),
  follow_up_notes: z.string().optional(),
});

const updateOpdVisitSchema = z.object({
  visit_date: z.string().optional(),
  visit_time: z.string().optional(),
  visit_type: z.enum(['new', 'follow_up', 'emergency', 'referral']).optional(),
  status: z.enum(['waiting', 'in_consultation', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  chief_complaint: z.string().optional(),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment_plan: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  temperature: z.string().optional(),
  blood_pressure_systolic: z.coerce.number().optional(),
  blood_pressure_diastolic: z.coerce.number().optional(),
  heart_rate: z.coerce.number().optional(),
  respiratory_rate: z.coerce.number().optional(),
  oxygen_saturation: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  additional_charges: z.coerce.number().min(0).optional(),
  payment_status: z.enum(['pending', 'paid', 'partially_paid', 'refunded']).optional(),
  payment_method: z.string().optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().optional(),
  follow_up_notes: z.string().optional(),
  referred_to: z.string().optional(),
  referral_reason: z.string().optional(),
});

export interface OPDVisitBasicInfoHandle {
  getFormValues: () => Promise<OpdVisitCreateData | OpdVisitUpdateData | null>;
}

interface OPDVisitBasicInfoProps {
  visit?: OpdVisit | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const OPDVisitBasicInfo = forwardRef<OPDVisitBasicInfoHandle, OPDVisitBasicInfoProps>(
  ({ visit, mode, onSuccess }, ref) => {
    const isReadOnly = mode === 'view';
    const isCreateMode = mode === 'create';

    // Fetch doctors and patients for selects
    const { useDoctors } = useDoctor();
    const { usePatients } = usePatient();
    const { data: doctorsData } = useDoctors({ page_size: 100 });
    const { data: patientsData } = usePatients({ page_size: 100 });

    const doctors = doctorsData?.results || [];
    const patients = patientsData?.results || [];

    const schema = isCreateMode ? createOpdVisitSchema : updateOpdVisitSchema;

    const defaultValues = isCreateMode
      ? {
          patient_id: 0,
          doctor_id: 0,
          visit_date: new Date().toISOString().split('T')[0],
          visit_time: new Date().toTimeString().slice(0, 5),
          visit_type: 'new' as const,
          priority: 'normal' as const,
          chief_complaint: '',
          symptoms: '',
          notes: '',
          temperature: '',
          blood_pressure_systolic: undefined,
          blood_pressure_diastolic: undefined,
          heart_rate: undefined,
          respiratory_rate: undefined,
          oxygen_saturation: '',
          weight: '',
          height: '',
          consultation_fee: 0,
          additional_charges: 0,
          follow_up_required: false,
          follow_up_date: '',
          follow_up_notes: '',
        }
      : {
          visit_date: visit?.visit_date || '',
          visit_time: visit?.visit_time || '',
          visit_type: visit?.visit_type || 'new',
          status: visit?.status || 'waiting',
          priority: visit?.priority || 'normal',
          chief_complaint: visit?.chief_complaint || '',
          symptoms: visit?.symptoms || '',
          diagnosis: visit?.diagnosis || '',
          treatment_plan: visit?.treatment_plan || '',
          prescription: visit?.prescription || '',
          notes: visit?.notes || '',
          temperature: visit?.temperature || '',
          blood_pressure_systolic: visit?.blood_pressure_systolic || undefined,
          blood_pressure_diastolic: visit?.blood_pressure_diastolic || undefined,
          heart_rate: visit?.heart_rate || undefined,
          respiratory_rate: visit?.respiratory_rate || undefined,
          oxygen_saturation: visit?.oxygen_saturation || '',
          weight: visit?.weight || '',
          height: visit?.height || '',
          consultation_fee: parseFloat(visit?.consultation_fee || '0'),
          additional_charges: parseFloat(visit?.additional_charges || '0'),
          payment_status: visit?.payment_status || 'pending',
          payment_method: visit?.payment_method || '',
          follow_up_required: visit?.follow_up_required || false,
          follow_up_date: visit?.follow_up_date || '',
          follow_up_notes: visit?.follow_up_notes || '',
          referred_to: visit?.referred_to || '',
          referral_reason: visit?.referral_reason || '',
        };

    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      setValue,
      reset,
    } = useForm<any>({
      resolver: zodResolver(schema),
      defaultValues,
    });

    const watchedDoctorId = watch('doctor_id');
    const watchedVisitType = watch('visit_type');
    const watchedPriority = watch('priority');
    const watchedStatus = watch('status');
    const watchedPaymentStatus = watch('payment_status');
    const watchedFollowUpRequired = watch('follow_up_required');

    // Reset form when visit data changes (for edit/view modes)
    useEffect(() => {
      if (!isCreateMode && visit) {
        const formValues = {
          visit_date: visit.visit_date || '',
          visit_time: visit.visit_time || '',
          visit_type: visit.visit_type || 'new',
          status: visit.status || 'waiting',
          priority: visit.priority || 'normal',
          chief_complaint: visit.chief_complaint || '',
          symptoms: visit.symptoms || '',
          diagnosis: visit.diagnosis || '',
          treatment_plan: visit.treatment_plan || '',
          prescription: visit.prescription || '',
          notes: visit.notes || '',
          temperature: visit.temperature || '',
          blood_pressure_systolic: visit.blood_pressure_systolic || undefined,
          blood_pressure_diastolic: visit.blood_pressure_diastolic || undefined,
          heart_rate: visit.heart_rate || undefined,
          respiratory_rate: visit.respiratory_rate || undefined,
          oxygen_saturation: visit.oxygen_saturation || '',
          weight: visit.weight || '',
          height: visit.height || '',
          consultation_fee: visit.consultation_fee ? parseFloat(visit.consultation_fee) : 0,
          additional_charges: visit.additional_charges ? parseFloat(visit.additional_charges) : 0,
          payment_status: visit.payment_status || 'pending',
          payment_method: visit.payment_method || '',
          follow_up_required: visit.follow_up_required || false,
          follow_up_date: visit.follow_up_date || '',
          follow_up_notes: visit.follow_up_notes || '',
          referred_to: visit.referred_to || '',
          referral_reason: visit.referral_reason || '',
        };
        reset(formValues);
      }
    }, [visit, isCreateMode, reset]);

    // Auto-set consultation fee based on selected doctor
    useEffect(() => {
      if (isCreateMode && watchedDoctorId) {
        const selectedDoctor = doctors.find(d => d.id === Number(watchedDoctorId));
        if (selectedDoctor) {
          const fee = watchedVisitType === 'follow_up'
            ? parseFloat(selectedDoctor.follow_up_fee || '0')
            : parseFloat(selectedDoctor.consultation_fee || '0');
          setValue('consultation_fee', fee);
        }
      }
    }, [watchedDoctorId, watchedVisitType, doctors, isCreateMode, setValue]);

    // Expose form validation and data collection to parent
    useImperativeHandle(ref, () => ({
      getFormValues: async (): Promise<OpdVisitCreateData | OpdVisitUpdateData | null> => {
        return new Promise((resolve) => {
          handleSubmit(
            (data) => {
              if (isCreateMode) {
                const payload: OpdVisitCreateData = {
                  // Backend expects 'patient' and 'doctor', not 'patient_id' and 'doctor_id'
                  patient: Number(data.patient_id),
                  doctor: Number(data.doctor_id),
                  visit_date: data.visit_date,
                  visit_time: data.visit_time,
                  visit_type: data.visit_type,
                  priority: data.priority,
                  chief_complaint: data.chief_complaint,
                  symptoms: data.symptoms,
                  notes: data.notes,
                  temperature: data.temperature,
                  blood_pressure_systolic: data.blood_pressure_systolic ? Number(data.blood_pressure_systolic) : undefined,
                  blood_pressure_diastolic: data.blood_pressure_diastolic ? Number(data.blood_pressure_diastolic) : undefined,
                  heart_rate: data.heart_rate ? Number(data.heart_rate) : undefined,
                  respiratory_rate: data.respiratory_rate ? Number(data.respiratory_rate) : undefined,
                  oxygen_saturation: data.oxygen_saturation,
                  weight: data.weight,
                  height: data.height,
                  consultation_fee: data.consultation_fee ? Number(data.consultation_fee) : undefined,
                  additional_charges: data.additional_charges ? Number(data.additional_charges) : undefined,
                  follow_up_required: data.follow_up_required,
                  follow_up_date: data.follow_up_date,
                  follow_up_notes: data.follow_up_notes,
                };
                resolve(payload);
              } else {
                const payload: OpdVisitUpdateData = {
                  visit_date: data.visit_date,
                  visit_time: data.visit_time,
                  visit_type: data.visit_type,
                  status: data.status,
                  priority: data.priority,
                  chief_complaint: data.chief_complaint,
                  symptoms: data.symptoms,
                  diagnosis: data.diagnosis,
                  treatment_plan: data.treatment_plan,
                  prescription: data.prescription,
                  notes: data.notes,
                  temperature: data.temperature,
                  blood_pressure_systolic: data.blood_pressure_systolic ? Number(data.blood_pressure_systolic) : undefined,
                  blood_pressure_diastolic: data.blood_pressure_diastolic ? Number(data.blood_pressure_diastolic) : undefined,
                  heart_rate: data.heart_rate ? Number(data.heart_rate) : undefined,
                  respiratory_rate: data.respiratory_rate ? Number(data.respiratory_rate) : undefined,
                  oxygen_saturation: data.oxygen_saturation,
                  weight: data.weight,
                  height: data.height,
                  consultation_fee: data.consultation_fee ? Number(data.consultation_fee) : undefined,
                  additional_charges: data.additional_charges ? Number(data.additional_charges) : undefined,
                  payment_status: data.payment_status,
                  payment_method: data.payment_method,
                  follow_up_required: data.follow_up_required,
                  follow_up_date: data.follow_up_date,
                  follow_up_notes: data.follow_up_notes,
                  referred_to: data.referred_to,
                  referral_reason: data.referral_reason,
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
                        {patient.full_name} - {patient.patient_id} - {patient.mobile_primary}
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
        {!isCreateMode && visit && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Doctor & Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Doctor</Label>
                  <p className="font-medium">{visit.doctor_details?.full_name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">
                    {visit.doctor_details?.specialties?.map(s => s.name).join(', ')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{visit.patient_details?.full_name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{visit.patient_details?.patient_id} • {visit.patient_details?.mobile_primary}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visit Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visit Number (View/Edit only) */}
            {!isCreateMode && visit && (
              <div className="space-y-2">
                <Label>Visit Number</Label>
                <p className="font-mono font-medium">{visit.visit_number}</p>
                {visit.queue_number && (
                  <Badge variant="secondary">Queue #{visit.queue_number}</Badge>
                )}
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visit_date">Visit Date *</Label>
                <Input
                  id="visit_date"
                  type="date"
                  {...register('visit_date')}
                  disabled={isReadOnly}
                  className={errors.visit_date ? 'border-destructive' : ''}
                />
                {errors.visit_date && (
                  <p className="text-sm text-destructive">{errors.visit_date.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit_time">Visit Time *</Label>
                <Input
                  id="visit_time"
                  type="time"
                  {...register('visit_time')}
                  disabled={isReadOnly}
                  className={errors.visit_time ? 'border-destructive' : ''}
                />
                {errors.visit_time && (
                  <p className="text-sm text-destructive">{errors.visit_time.message as string}</p>
                )}
              </div>
            </div>

            {/* Visit Type & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visit_type">Visit Type *</Label>
                {isReadOnly ? (
                  <div className="pt-2">
                    <Badge variant="secondary">
                      {watchedVisitType?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ) : (
                  <Select
                    value={watchedVisitType}
                    onValueChange={(value) => setValue('visit_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Visit</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                {isReadOnly ? (
                  <div className="pt-2">
                    <Badge
                      variant={watchedPriority === 'urgent' || watchedPriority === 'high' ? 'destructive' : 'secondary'}
                      className={watchedPriority === 'high' ? 'bg-orange-600' : ''}
                    >
                      {watchedPriority?.toUpperCase()}
                    </Badge>
                  </div>
                ) : (
                  <Select
                    value={watchedPriority}
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
            </div>
          </CardContent>
        </Card>

        {/* Clinical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clinical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chief Complaint */}
            <div className="space-y-2">
              <Label htmlFor="chief_complaint">Chief Complaint</Label>
              <Textarea
                id="chief_complaint"
                {...register('chief_complaint')}
                placeholder="Main reason for visit..."
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

            {/* Diagnosis (Edit/View Mode Only) */}
            {!isCreateMode && (
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  {...register('diagnosis')}
                  placeholder="Doctor's diagnosis..."
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
            )}

            {/* Treatment Plan (Edit/View Mode Only) */}
            {!isCreateMode && (
              <div className="space-y-2">
                <Label htmlFor="treatment_plan">Treatment Plan</Label>
                <Textarea
                  id="treatment_plan"
                  {...register('treatment_plan')}
                  placeholder="Recommended treatment..."
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
            )}

            {/* Prescription (Edit/View Mode Only) */}
            {!isCreateMode && (
              <div className="space-y-2">
                <Label htmlFor="prescription">Prescription</Label>
                <Textarea
                  id="prescription"
                  {...register('prescription')}
                  placeholder="Prescribed medications..."
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
            )}

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

        {/* Vitals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vitals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  {...register('temperature')}
                  placeholder="98.6"
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                <Input
                  id="heart_rate"
                  type="number"
                  {...register('heart_rate')}
                  placeholder="70"
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="respiratory_rate">Respiratory Rate</Label>
                <Input
                  id="respiratory_rate"
                  type="number"
                  {...register('respiratory_rate')}
                  placeholder="16"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_pressure_systolic">BP Systolic</Label>
                <Input
                  id="blood_pressure_systolic"
                  type="number"
                  {...register('blood_pressure_systolic')}
                  placeholder="120"
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blood_pressure_diastolic">BP Diastolic</Label>
                <Input
                  id="blood_pressure_diastolic"
                  type="number"
                  {...register('blood_pressure_diastolic')}
                  placeholder="80"
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oxygen_saturation">SpO2 (%)</Label>
                <Input
                  id="oxygen_saturation"
                  {...register('oxygen_saturation')}
                  placeholder="98"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  {...register('weight')}
                  placeholder="70"
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  {...register('height')}
                  placeholder="170"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Follow-up & Referral */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Follow-up & Referral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Follow-up Required */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow_up_required"
                checked={watchedFollowUpRequired}
                onCheckedChange={(checked) => setValue('follow_up_required', checked)}
                disabled={isReadOnly}
              />
              <Label htmlFor="follow_up_required" className="cursor-pointer">
                Follow-up Required
              </Label>
            </div>

            {watchedFollowUpRequired && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="follow_up_date">Follow-up Date</Label>
                  <Input
                    id="follow_up_date"
                    type="date"
                    {...register('follow_up_date')}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="follow_up_notes">Follow-up Notes</Label>
                  <Textarea
                    id="follow_up_notes"
                    {...register('follow_up_notes')}
                    placeholder="Follow-up instructions..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Referral (Edit/View Mode Only) */}
            {!isCreateMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="referred_to">Referred To</Label>
                  <Input
                    id="referred_to"
                    {...register('referred_to')}
                    placeholder="Specialist name..."
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referral_reason">Referral Reason</Label>
                  <Textarea
                    id="referral_reason"
                    {...register('referral_reason')}
                    placeholder="Reason for referral..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultation_fee">Consultation Fee</Label>
                <Input
                  id="consultation_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('consultation_fee')}
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_charges">Additional Charges</Label>
                <Input
                  id="additional_charges"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('additional_charges')}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Payment Status (Edit/View Mode Only) */}
            {!isCreateMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  {isReadOnly ? (
                    <div className="pt-2">
                      <Badge
                        variant={watchedPaymentStatus === 'paid' ? 'default' : 'secondary'}
                        className={watchedPaymentStatus === 'paid' ? 'bg-green-600' : ''}
                      >
                        {watchedPaymentStatus?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  ) : (
                    <Select
                      value={watchedPaymentStatus}
                      onValueChange={(value) => setValue('payment_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Input
                    id="payment_method"
                    {...register('payment_method')}
                    placeholder="Cash, Card, UPI, etc."
                    disabled={isReadOnly}
                  />
                </div>
              </>
            )}

            {/* Total Amount Display */}
            {!isCreateMode && visit && (
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <p className="text-2xl font-bold">₹{visit.total_amount}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status (Edit/View Mode Only) */}
        {!isCreateMode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visit Status</CardTitle>
            </CardHeader>
            <CardContent>
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
                        watchedStatus === 'in_consultation' || watchedStatus === 'in_progress' ? 'bg-blue-600' :
                        watchedStatus === 'waiting' ? 'bg-orange-600' : ''
                      }
                    >
                      {watchedStatus?.replace('_', ' ').toUpperCase()}
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
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="in_consultation">In Consultation</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
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

OPDVisitBasicInfo.displayName = 'OPDVisitBasicInfo';

export default OPDVisitBasicInfo;
