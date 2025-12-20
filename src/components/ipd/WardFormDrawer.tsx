import { useState, useEffect } from 'react';
import { useIPD } from '@/hooks/useIPD';
import { Ward, WardFormData, WARD_TYPE_LABELS } from '@/types/ipd.types';
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

interface WardFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ward?: Ward | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export function WardFormDrawer({
  open,
  onOpenChange,
  ward,
  mode,
  onSuccess,
}: WardFormDrawerProps) {
  const { createWard, updateWard } = useIPD();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<WardFormData>({
    name: '',
    type: 'general',
    floor: '',
    total_beds: 0,
    description: '',
    is_active: true,
  });

  // Initialize form data when ward changes or dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && ward) {
        setFormData({
          name: ward.name,
          type: ward.type,
          floor: ward.floor,
          total_beds: ward.total_beds,
          description: ward.description || '',
          is_active: ward.is_active,
        });
      } else {
        // Reset for create mode
        setFormData({
          name: '',
          type: 'general',
          floor: '',
          total_beds: 0,
          description: '',
          is_active: true,
        });
      }
    }
  }, [open, mode, ward]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter ward name',
        variant: 'destructive',
      });
      return;
    }

    if (formData.total_beds < 0) {
      toast({
        title: 'Validation Error',
        description: 'Total beds cannot be negative',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'edit' && ward) {
        await updateWard(ward.id, formData);
        toast({
          title: 'Success',
          description: 'Ward updated successfully',
        });
      } else {
        await createWard(formData);
        toast({
          title: 'Success',
          description: 'Ward created successfully',
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${mode} ward`,
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
      title={mode === 'edit' ? 'Edit Ward' : 'Add New Ward'}
      description={mode === 'edit' ? 'Update ward information' : 'Create a new ward to organize beds and patients'}
      mode={mode}
      footerButtons={[
        {
          label: 'Cancel',
          onClick: () => onOpenChange(false),
          variant: 'outline',
          disabled: isSubmitting,
        },
        {
          label: mode === 'edit' ? 'Update Ward' : 'Create Ward',
          onClick: handleSubmit,
          loading: isSubmitting,
        },
      ]}
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Ward Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., General Ward A"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="type">Ward Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ward type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WARD_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="floor">Floor</Label>
          <Input
            id="floor"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
            placeholder="e.g., Ground Floor, 3rd Floor"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="total_beds">Total Beds *</Label>
          <Input
            id="total_beds"
            type="number"
            value={formData.total_beds}
            onChange={(e) => setFormData({ ...formData, total_beds: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Additional details about this ward"
            rows={3}
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
