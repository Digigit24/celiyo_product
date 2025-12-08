// src/components/clinical-note-drawer/ClinicalNoteBasicInfo.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ClinicalNote, ClinicalNoteCreateData } from '@/types/clinicalNote.types';
import useSWR from 'swr';
import { opdVisitService } from '@/services/opdVisit.service';
import { doctorService } from '@/services/doctorService';

const clinicalNoteSchema = z.object({
  visit: z.number().min(1, 'Visit is required'),
  ehr_number: z.string().optional(),
  present_complaints: z.string().min(1, 'Present complaints are required'),
  observation: z.string().optional(),
  diagnosis: z.string().optional(),
  investigation: z.string().optional(),
  treatment_plan: z.string().optional(),
  medicines_prescribed: z.string().optional(),
  doctor_advice: z.string().optional(),
  suggested_surgery_name: z.string().optional(),
  suggested_surgery_reason: z.string().optional(),
  referred_doctor: z.string().optional(),
  next_followup_date: z.string().optional(),
});

type ClinicalNoteFormData = z.infer<typeof clinicalNoteSchema>;

interface ClinicalNoteBasicInfoProps {
  mode: 'create' | 'edit' | 'view';
  note?: ClinicalNote;
  onSubmit: (data: ClinicalNoteCreateData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ClinicalNoteBasicInfo: React.FC<ClinicalNoteBasicInfoProps> = ({
  mode,
  note,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const isReadOnly = mode === 'view';
  const isCreateMode = mode === 'create';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ClinicalNoteFormData>({
    resolver: zodResolver(clinicalNoteSchema),
    defaultValues: note ? {
      visit: note.visit,
      ehr_number: note.ehr_number || '',
      present_complaints: note.present_complaints || '',
      observation: note.observation || '',
      diagnosis: note.diagnosis || '',
      investigation: note.investigation || '',
      treatment_plan: note.treatment_plan || '',
      medicines_prescribed: typeof note.medicines_prescribed === 'string' ? note.medicines_prescribed : JSON.stringify(note.medicines_prescribed, null, 2),
      doctor_advice: note.doctor_advice || '',
      suggested_surgery_name: note.suggested_surgery_name || '',
      suggested_surgery_reason: note.suggested_surgery_reason || '',
      referred_doctor: note.referred_doctor?.toString() || '',
      next_followup_date: note.next_followup_date || '',
    } : {},
  });

  // Fetch visits for dropdown
  const { data: visitsData } = useSWR(
    isCreateMode ? 'opd-visits-list' : null,
    () => opdVisitService.getOpdVisits({ page_size: 100 })
  );

  // Fetch doctors for referral dropdown
  const { data: doctorsData } = useSWR(
    'doctors-list',
    () => doctorService.getDoctors({ page_size: 100 })
  );

  const visits = visitsData?.results || [];
  const doctors = doctorsData?.results || [];

  const onFormSubmit = (data: ClinicalNoteFormData) => {
    const submitData: ClinicalNoteCreateData = {
      visit: data.visit,
      ehr_number: data.ehr_number,
      present_complaints: data.present_complaints,
      observation: data.observation,
      diagnosis: data.diagnosis,
      investigation: data.investigation,
      treatment_plan: data.treatment_plan,
      medicines_prescribed: data.medicines_prescribed ? data.medicines_prescribed : undefined,
      doctor_advice: data.doctor_advice,
      suggested_surgery_name: data.suggested_surgery_name,
      suggested_surgery_reason: data.suggested_surgery_reason,
      referred_doctor: data.referred_doctor ? parseInt(data.referred_doctor) : undefined,
      next_followup_date: data.next_followup_date || undefined,
    };
    onSubmit(submitData);
  };

  useEffect(() => {
    if (note) {
      reset({
        visit: note.visit,
        ehr_number: note.ehr_number || '',
        present_complaints: note.present_complaints || '',
        observation: note.observation || '',
        diagnosis: note.diagnosis || '',
        investigation: note.investigation || '',
        treatment_plan: note.treatment_plan || '',
        medicines_prescribed: typeof note.medicines_prescribed === 'string' ? note.medicines_prescribed : JSON.stringify(note.medicines_prescribed, null, 2),
        doctor_advice: note.doctor_advice || '',
        suggested_surgery_name: note.suggested_surgery_name || '',
        suggested_surgery_reason: note.suggested_surgery_reason || '',
        referred_doctor: note.referred_doctor?.toString() || '',
        next_followup_date: note.next_followup_date || '',
      });
    }
  }, [note, reset]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Visit Selection */}
      <div className="space-y-2">
        <Label htmlFor="visit">Visit *</Label>
        {isCreateMode ? (
          <select
            id="visit"
            {...register('visit', { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isReadOnly}
          >
            <option value="">Select visit</option>
            {visits.map((visit) => (
              <option key={visit.id} value={visit.id}>
                {visit.visit_number} - {visit.patient?.name}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id="visit"
            value={note?.visit_number || `Visit #${note?.visit}`}
            disabled
          />
        )}
        {errors.visit && <p className="text-sm text-destructive">{errors.visit.message}</p>}
      </div>

      {/* EHR Number */}
      <div className="space-y-2">
        <Label htmlFor="ehr_number">EHR Number</Label>
        <Input
          id="ehr_number"
          {...register('ehr_number')}
          placeholder="Electronic Health Record ID"
          disabled={isReadOnly}
        />
      </div>

      {/* Present Complaints */}
      <div className="space-y-2">
        <Label htmlFor="present_complaints">Present Complaints *</Label>
        <Textarea
          id="present_complaints"
          {...register('present_complaints')}
          placeholder="Patient's presenting complaints"
          rows={3}
          disabled={isReadOnly}
        />
        {errors.present_complaints && <p className="text-sm text-destructive">{errors.present_complaints.message}</p>}
      </div>

      {/* Observation */}
      <div className="space-y-2">
        <Label htmlFor="observation">Observation</Label>
        <Textarea
          id="observation"
          {...register('observation')}
          placeholder="Doctor's observations"
          rows={3}
          disabled={isReadOnly}
        />
      </div>

      {/* Diagnosis */}
      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Textarea
          id="diagnosis"
          {...register('diagnosis')}
          placeholder="Clinical diagnosis"
          rows={2}
          disabled={isReadOnly}
        />
      </div>

      {/* Investigation */}
      <div className="space-y-2">
        <Label htmlFor="investigation">Investigation</Label>
        <Textarea
          id="investigation"
          {...register('investigation')}
          placeholder="Investigations ordered"
          rows={2}
          disabled={isReadOnly}
        />
      </div>

      {/* Treatment Plan */}
      <div className="space-y-2">
        <Label htmlFor="treatment_plan">Treatment Plan</Label>
        <Textarea
          id="treatment_plan"
          {...register('treatment_plan')}
          placeholder="Recommended treatment"
          rows={3}
          disabled={isReadOnly}
        />
      </div>

      {/* Medicines Prescribed */}
      <div className="space-y-2">
        <Label htmlFor="medicines_prescribed">Medicines Prescribed</Label>
        <Textarea
          id="medicines_prescribed"
          {...register('medicines_prescribed')}
          placeholder="List of prescribed medicines (JSON or text)"
          rows={3}
          disabled={isReadOnly}
        />
      </div>

      {/* Doctor Advice */}
      <div className="space-y-2">
        <Label htmlFor="doctor_advice">Doctor Advice</Label>
        <Textarea
          id="doctor_advice"
          {...register('doctor_advice')}
          placeholder="Doctor's advice to patient"
          rows={2}
          disabled={isReadOnly}
        />
      </div>

      {/* Surgery Section */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-4">Surgery Recommendation</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suggested_surgery_name">Suggested Surgery</Label>
            <Input
              id="suggested_surgery_name"
              {...register('suggested_surgery_name')}
              placeholder="Surgery name"
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suggested_surgery_reason">Surgery Reason</Label>
            <Textarea
              id="suggested_surgery_reason"
              {...register('suggested_surgery_reason')}
              placeholder="Reason for surgery"
              rows={2}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-4">Referral & Follow-up</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="referred_doctor">Referred Doctor</Label>
            <select
              id="referred_doctor"
              {...register('referred_doctor')}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isReadOnly}
            >
              <option value="">None</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_followup_date">Next Follow-up Date</Label>
            <Input
              id="next_followup_date"
              type="date"
              {...register('next_followup_date')}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      {!isReadOnly && (
        <div className="flex gap-2 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving...' : isCreateMode ? 'Create Note' : 'Update Note'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
};
