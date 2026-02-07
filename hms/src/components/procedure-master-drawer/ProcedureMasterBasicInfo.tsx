// src/components/procedure-master-drawer/ProcedureMasterBasicInfo.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ProcedureMaster, ProcedureMasterCreateData, ProcedureCategory } from '@/types/procedureMaster.types';

const procedureMasterSchema = z.object({
  name: z.string().min(1, 'Procedure name is required'),
  code: z.string().min(1, 'Procedure code is required'),
  category: z.enum(['laboratory', 'radiology', 'cardiology', 'pathology', 'ultrasound', 'ct_scan', 'mri', 'ecg', 'xray', 'other']),
  description: z.string().optional(),
  default_charge: z.string().min(1, 'Default charge is required'),
  is_active: z.boolean(),
});

type ProcedureMasterFormData = z.infer<typeof procedureMasterSchema>;

interface ProcedureMasterBasicInfoProps {
  mode: 'create' | 'edit' | 'view';
  procedure?: ProcedureMaster;
  onSubmit: (data: ProcedureMasterCreateData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProcedureMasterBasicInfo: React.FC<ProcedureMasterBasicInfoProps> = ({
  mode,
  procedure,
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
  } = useForm<ProcedureMasterFormData>({
    resolver: zodResolver(procedureMasterSchema),
    defaultValues: procedure ? {
      name: procedure.name,
      code: procedure.code,
      category: procedure.category,
      description: procedure.description || '',
      default_charge: procedure.default_charge,
      is_active: procedure.is_active,
    } : {
      is_active: true,
      category: 'laboratory',
    },
  });

  const onFormSubmit = (data: ProcedureMasterFormData) => {
    onSubmit(data);
  };

  useEffect(() => {
    if (procedure) {
      reset({
        name: procedure.name,
        code: procedure.code,
        category: procedure.category,
        description: procedure.description || '',
        default_charge: procedure.default_charge,
        is_active: procedure.is_active,
      });
    }
  }, [procedure, reset]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Procedure Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Procedure Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g., Complete Blood Count"
          disabled={isReadOnly}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* Procedure Code */}
      <div className="space-y-2">
        <Label htmlFor="code">Procedure Code *</Label>
        <Input
          id="code"
          {...register('code')}
          placeholder="e.g., CBC001"
          disabled={isReadOnly}
        />
        {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <select
          id="category"
          {...register('category')}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isReadOnly}
        >
          <option value="laboratory">Laboratory</option>
          <option value="radiology">Radiology</option>
          <option value="cardiology">Cardiology</option>
          <option value="pathology">Pathology</option>
          <option value="ultrasound">Ultrasound</option>
          <option value="ct_scan">CT Scan</option>
          <option value="mri">MRI</option>
          <option value="ecg">ECG</option>
          <option value="xray">X-Ray</option>
          <option value="other">Other</option>
        </select>
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Procedure description or notes"
          rows={3}
          disabled={isReadOnly}
        />
      </div>

      {/* Default Charge */}
      <div className="space-y-2">
        <Label htmlFor="default_charge">Default Charge (₹) *</Label>
        <Input
          id="default_charge"
          {...register('default_charge')}
          placeholder="500.00"
          disabled={isReadOnly}
        />
        {errors.default_charge && <p className="text-sm text-destructive">{errors.default_charge.message}</p>}
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          className="h-4 w-4"
          disabled={isReadOnly}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Active
        </Label>
      </div>

      {/* Form Actions */}
      {!isReadOnly && (
        <div className="flex gap-2 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving...' : isCreateMode ? 'Create Procedure' : 'Update Procedure'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
};
