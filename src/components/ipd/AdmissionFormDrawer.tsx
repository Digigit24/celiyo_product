import { useState } from 'react';
import { useIPD } from '@/hooks/useIPD';
import { AdmissionFormData } from '@/types/ipd.types';
import { PatientSelect } from '@/components/form/PatientSelect';
import { DoctorSelect } from '@/components/form/DoctorSelect';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { SideDrawer } from '@/components/SideDrawer';

interface AdmissionFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AdmissionFormDrawer({ open, onOpenChange, onSuccess }: AdmissionFormDrawerProps) {
  // Form state
  const [formData, setFormData] = useState<AdmissionFormData>({
    patient: 0,
    doctor_id: '',
    ward: 0,
    bed: null,
    reason: '',
    provisional_diagnosis: '',
  });

  const { createAdmission, useWards, useAvailableBeds } = useIPD();

  const { data: wardsData } = useWards({ is_active: true });
  const { data: availableBeds } = useAvailableBeds();

  const wards = wardsData?.results || [];
  const beds = availableBeds || [];

  const resetForm = () => {
    setFormData({
      patient: 0,
      doctor_id: '',
      ward: 0,
      bed: null,
      reason: '',
      provisional_diagnosis: '',
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.patient) {
      toast({
        title: 'Validation Error',
        description: 'Please select a patient',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.doctor_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a doctor',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.ward) {
      toast({
        title: 'Validation Error',
        description: 'Please select a ward',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter reason for admission',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAdmission(formData);
      toast({
        title: 'Success',
        description: 'Patient admitted successfully',
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to admit patient',
        variant: 'destructive',
      });
    }
  };

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="New Patient Admission"
      description="Admit a patient to the IPD ward"
      mode="create"
      footerButtons={[
        {
          label: 'Cancel',
          onClick: () => onOpenChange(false),
          variant: 'outline',
        },
        {
          label: 'Admit Patient',
          onClick: handleSubmit,
        },
      ]}
    >
      <div className="grid gap-4 py-4">
        <PatientSelect
          value={formData.patient || null}
          onChange={(patientId) => setFormData({ ...formData, patient: patientId })}
          label="Patient"
          required={true}
        />

        <DoctorSelect
          value={formData.doctor_id || null}
          onChange={(doctorUserId) => setFormData({ ...formData, doctor_id: doctorUserId as string })}
          label="Doctor"
          required={true}
          returnUserId={true}
        />

        <div className="grid gap-2">
          <Label htmlFor="ward">Ward *</Label>
          <Select
            value={formData.ward ? formData.ward.toString() : ''}
            onValueChange={(value) => setFormData({ ...formData, ward: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((ward) => (
                <SelectItem key={ward.id} value={ward.id.toString()}>
                  {ward.name} ({ward.available_beds_count} available)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bed">Bed (Optional)</Label>
          <Select
            value={formData.bed ? formData.bed.toString() : ''}
            onValueChange={(value) => setFormData({ ...formData, bed: (value && value !== 'unassigned') ? parseInt(value) : null })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bed (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">No bed assigned</SelectItem>
              {beds.filter(bed => bed.ward === formData.ward).map((bed) => (
                <SelectItem key={bed.id} value={bed.id.toString()}>
                  {bed.bed_number} - {bed.ward_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="reason">Reason for Admission *</Label>
          <Textarea
            id="reason"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Enter reason for admission"
            rows={3}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="provisional_diagnosis">Provisional Diagnosis</Label>
          <Textarea
            id="provisional_diagnosis"
            value={formData.provisional_diagnosis}
            onChange={(e) => setFormData({ ...formData, provisional_diagnosis: e.target.value })}
            placeholder="Enter initial diagnosis"
            rows={3}
          />
        </div>
      </div>
    </SideDrawer>
  );
}
