// src/components/visit-finding-drawer/VisitFindingBasicInfo.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { VisitFinding, VisitFindingCreateData, FindingType } from '@/types/visitFinding.types';
import useSWR from 'swr';
import { opdVisitService } from '@/services/opdVisit.service';

const visitFindingSchema = z.object({
  visit: z.number().min(1, 'Visit is required'),
  finding_type: z.enum(['examination', 'systemic']),
  // Vitals
  temperature: z.string().optional(),
  pulse: z.string().optional(),
  bp_systolic: z.string().optional(),
  bp_diastolic: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  spo2: z.string().optional(),
  respiratory_rate: z.string().optional(),
  // Systemic
  tongue: z.string().optional(),
  throat: z.string().optional(),
  cns: z.string().optional(),
  rs: z.string().optional(),
  cvs: z.string().optional(),
  pa: z.string().optional(),
});

type VisitFindingFormData = z.infer<typeof visitFindingSchema>;

interface VisitFindingBasicInfoProps {
  mode: 'create' | 'edit' | 'view';
  finding?: VisitFinding;
  onSubmit: (data: VisitFindingCreateData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const VisitFindingBasicInfo: React.FC<VisitFindingBasicInfoProps> = ({
  mode,
  finding,
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
    watch,
  } = useForm<VisitFindingFormData>({
    resolver: zodResolver(visitFindingSchema),
    defaultValues: finding ? {
      visit: finding.visit,
      finding_type: finding.finding_type,
      temperature: finding.temperature || '',
      pulse: finding.pulse?.toString() || '',
      bp_systolic: finding.bp_systolic?.toString() || '',
      bp_diastolic: finding.bp_diastolic?.toString() || '',
      weight: finding.weight || '',
      height: finding.height || '',
      spo2: finding.spo2?.toString() || '',
      respiratory_rate: finding.respiratory_rate?.toString() || '',
      tongue: finding.tongue || '',
      throat: finding.throat || '',
      cns: finding.cns || '',
      rs: finding.rs || '',
      cvs: finding.cvs || '',
      pa: finding.pa || '',
    } : {
      finding_type: 'examination',
    },
  });

  const findingType = watch('finding_type');

  // Fetch visits for dropdown
  const { data: visitsData } = useSWR(
    isCreateMode ? 'opd-visits-list' : null,
    () => opdVisitService.getOpdVisits({ page_size: 100 })
  );

  const visits = visitsData?.results || [];

  const onFormSubmit = (data: VisitFindingFormData) => {
    const submitData: VisitFindingCreateData = {
      visit: data.visit,
      finding_type: data.finding_type,
      temperature: data.temperature || undefined,
      pulse: data.pulse ? parseInt(data.pulse) : undefined,
      bp_systolic: data.bp_systolic ? parseInt(data.bp_systolic) : undefined,
      bp_diastolic: data.bp_diastolic ? parseInt(data.bp_diastolic) : undefined,
      weight: data.weight || undefined,
      height: data.height || undefined,
      spo2: data.spo2 ? parseInt(data.spo2) : undefined,
      respiratory_rate: data.respiratory_rate ? parseInt(data.respiratory_rate) : undefined,
      tongue: data.tongue || undefined,
      throat: data.throat || undefined,
      cns: data.cns || undefined,
      rs: data.rs || undefined,
      cvs: data.cvs || undefined,
      pa: data.pa || undefined,
    };
    onSubmit(submitData);
  };

  useEffect(() => {
    if (finding) {
      reset({
        visit: finding.visit,
        finding_type: finding.finding_type,
        temperature: finding.temperature || '',
        pulse: finding.pulse?.toString() || '',
        bp_systolic: finding.bp_systolic?.toString() || '',
        bp_diastolic: finding.bp_diastolic?.toString() || '',
        weight: finding.weight || '',
        height: finding.height || '',
        spo2: finding.spo2?.toString() || '',
        respiratory_rate: finding.respiratory_rate?.toString() || '',
        tongue: finding.tongue || '',
        throat: finding.throat || '',
        cns: finding.cns || '',
        rs: finding.rs || '',
        cvs: finding.cvs || '',
        pa: finding.pa || '',
      });
    }
  }, [finding, reset]);

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
            value={finding?.visit_number || `Visit #${finding?.visit}`}
            disabled
          />
        )}
        {errors.visit && <p className="text-sm text-destructive">{errors.visit.message}</p>}
      </div>

      {/* Finding Type */}
      <div className="space-y-2">
        <Label htmlFor="finding_type">Finding Type *</Label>
        <select
          id="finding_type"
          {...register('finding_type')}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isReadOnly}
        >
          <option value="examination">Examination (Vitals)</option>
          <option value="systemic">Systemic</option>
        </select>
        {errors.finding_type && <p className="text-sm text-destructive">{errors.finding_type.message}</p>}
      </div>

      {/* Vitals Section - Show for examination type */}
      {findingType === 'examination' && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Vital Signs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="pulse">Pulse (bpm)</Label>
              <Input
                id="pulse"
                type="number"
                {...register('pulse')}
                placeholder="70"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp_systolic">BP Systolic</Label>
              <Input
                id="bp_systolic"
                type="number"
                {...register('bp_systolic')}
                placeholder="120"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp_diastolic">BP Diastolic</Label>
              <Input
                id="bp_diastolic"
                type="number"
                {...register('bp_diastolic')}
                placeholder="80"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                {...register('weight')}
                placeholder="70.5"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                {...register('height')}
                placeholder="170.0"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spo2">SpO2 (%)</Label>
              <Input
                id="spo2"
                type="number"
                {...register('spo2')}
                placeholder="98"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="respiratory_rate">Respiratory Rate (breaths/min)</Label>
              <Input
                id="respiratory_rate"
                type="number"
                {...register('respiratory_rate')}
                placeholder="16"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>
      )}

      {/* Systemic Section - Show for systemic type */}
      {findingType === 'systemic' && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Systemic Examination</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tongue">Tongue</Label>
              <Input
                id="tongue"
                {...register('tongue')}
                placeholder="Tongue examination findings"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="throat">Throat</Label>
              <Input
                id="throat"
                {...register('throat')}
                placeholder="Throat examination findings"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cns">CNS (Central Nervous System)</Label>
              <Input
                id="cns"
                {...register('cns')}
                placeholder="CNS examination findings"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs">RS (Respiratory System)</Label>
              <Input
                id="rs"
                {...register('rs')}
                placeholder="Respiratory system findings"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvs">CVS (Cardiovascular System)</Label>
              <Input
                id="cvs"
                {...register('cvs')}
                placeholder="Cardiovascular system findings"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pa">PA (Per Abdomen)</Label>
              <Input
                id="pa"
                {...register('pa')}
                placeholder="Abdomen examination findings"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      {!isReadOnly && (
        <div className="flex gap-2 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving...' : isCreateMode ? 'Create Finding' : 'Update Finding'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
};
