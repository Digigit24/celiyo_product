import { useState, useEffect } from 'react';
import { useIPD } from '@/hooks/useIPD';
import { Bed, BedFormData, BED_TYPE_LABELS, BED_STATUS_LABELS } from '@/types/ipd.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { SideDrawer } from '@/components/SideDrawer';

interface BedFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed?: Bed | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export function BedFormDrawer({
  open,
  onOpenChange,
  bed,
  mode,
  onSuccess,
}: BedFormDrawerProps) {
  const { createBed, updateBed, useWards } = useIPD();
  const { data: wardsData } = useWards({ is_active: true });
  const wards = wardsData?.results || [];
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<BedFormData>({
    ward: 0,
    bed_number: '',
    bed_type: 'general',
    daily_charge: '0',
    status: 'available',
    is_active: true,
    has_oxygen: false,
    has_ventilator: false,
    description: '',
  });

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && bed) {
        setFormData({
          ward: bed.ward,
          bed_number: bed.bed_number,
          bed_type: bed.bed_type,
          daily_charge: bed.daily_charge,
          status: bed.status,
          is_active: bed.is_active,
          has_oxygen: bed.has_oxygen,
          has_ventilator: bed.has_ventilator,
          description: bed.description || '',
        });
      } else {
        // Reset for create mode
        setFormData({
          ward: 0,
          bed_number: '',
          bed_type: 'general',
          daily_charge: '0',
          status: 'available',
          is_active: true,
          has_oxygen: false,
          has_ventilator: false,
          description: '',
        });
      }
    }
  }, [open, mode, bed]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.ward) {
      toast({
        title: 'Validation Error',
        description: 'Please select a ward',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.bed_number.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter bed number',
        variant: 'destructive',
      });
      return;
    }

    if (parseFloat(formData.daily_charge) < 0) {
      toast({
        title: 'Validation Error',
        description: 'Daily charge cannot be negative',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'edit' && bed) {
        await updateBed(bed.id, formData);
        toast({
          title: 'Success',
          description: 'Bed updated successfully',
        });
      } else {
        await createBed(formData);
        toast({
          title: 'Success',
          description: 'Bed created successfully',
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${mode} bed`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'edit' ? 'Edit Bed' : 'Add New Bed'}
      description={mode === 'edit' ? 'Update bed information' : 'Create a new bed in a ward'}
      mode={mode}
      footerButtons={[
        {
          label: 'Cancel',
          onClick: () => onOpenChange(false),
          variant: 'outline',
          disabled: isSubmitting,
        },
        {
          label: mode === 'edit' ? 'Update Bed' : 'Create Bed',
          onClick: handleSubmit,
          loading: isSubmitting,
        },
      ]}
    >
      <div className="grid gap-4 py-4">
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
                  {ward.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bed_number">Bed Number *</Label>
          <Input
            id="bed_number"
            value={formData.bed_number}
            onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
            placeholder="e.g., A-101, ICU-05"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bed_type">Bed Type *</Label>
          <Select
            value={formData.bed_type}
            onValueChange={(value: any) => setFormData({ ...formData, bed_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bed type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BED_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="daily_charge">Daily Charge (₹) *</Label>
          <Input
            id="daily_charge"
            type="number"
            step="0.01"
            value={formData.daily_charge}
            onChange={(e) => setFormData({ ...formData, daily_charge: e.target.value })}
            min="0"
          />
        </div>

        {mode === 'edit' && (
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BED_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="has_oxygen">Has Oxygen</Label>
          <Switch
            id="has_oxygen"
            checked={formData.has_oxygen}
            onCheckedChange={(checked) => setFormData({ ...formData, has_oxygen: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="has_ventilator">Has Ventilator</Label>
          <Switch
            id="has_ventilator"
            checked={formData.has_ventilator}
            onCheckedChange={(checked) => setFormData({ ...formData, has_ventilator: checked })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Additional details about this bed"
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="is_active">Active</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>
    </SideDrawer>
  );
}
