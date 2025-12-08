// src/components/specialty-drawer/SpecialtyBasicInfo.tsx
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { Specialty, SpecialtyCreateData, SpecialtyUpdateData } from '@/types/specialty.types';

// Validation schemas
const createSpecialtySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(10, 'Code must be 10 characters or less'),
  description: z.string().optional(),
  department: z.string().optional(),
  is_active: z.boolean().optional(),
});

const updateSpecialtySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  code: z.string().min(1, 'Code is required').max(10, 'Code must be 10 characters or less').optional(),
  description: z.string().optional(),
  department: z.string().optional(),
  is_active: z.boolean().optional(),
});

export interface SpecialtyBasicInfoHandle {
  getFormValues: () => Promise<SpecialtyCreateData | SpecialtyUpdateData | null>;
}

interface SpecialtyBasicInfoProps {
  specialty?: Specialty | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const SpecialtyBasicInfo = forwardRef<SpecialtyBasicInfoHandle, SpecialtyBasicInfoProps>(
  ({ specialty, mode, onSuccess }, ref) => {
    const isReadOnly = mode === 'view';
    const isCreateMode = mode === 'create';

    const schema = isCreateMode ? createSpecialtySchema : updateSpecialtySchema;

    const defaultValues = isCreateMode
      ? {
          name: '',
          code: '',
          description: '',
          department: '',
          is_active: true,
        }
      : {
          name: specialty?.name || '',
          code: specialty?.code || '',
          description: specialty?.description || '',
          department: specialty?.department || '',
          is_active: specialty?.is_active ?? true,
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

    const watchedIsActive = watch('is_active');

    // Reset form when specialty data changes (for edit/view modes)
    useEffect(() => {
      if (!isCreateMode && specialty) {
        const formValues = {
          name: specialty.name || '',
          code: specialty.code || '',
          description: specialty.description || '',
          department: specialty.department || '',
          is_active: specialty.is_active ?? true,
        };
        reset(formValues);
      }
    }, [specialty, isCreateMode, reset]);

    // Expose form validation and data collection to parent
    useImperativeHandle(ref, () => ({
      getFormValues: async (): Promise<SpecialtyCreateData | SpecialtyUpdateData | null> => {
        return new Promise((resolve) => {
          handleSubmit(
            (data) => {
              if (isCreateMode) {
                const payload: SpecialtyCreateData = {
                  name: data.name,
                  code: data.code,
                  description: data.description || undefined,
                  department: data.department || undefined,
                  is_active: data.is_active ?? true,
                };
                resolve(payload);
              } else {
                const payload: SpecialtyUpdateData = {
                  name: data.name,
                  code: data.code,
                  description: data.description || undefined,
                  department: data.department || undefined,
                  is_active: data.is_active,
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
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Specialty Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Cardiology"
                disabled={isReadOnly}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message as string}</p>
              )}
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Specialty Code *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="e.g., CARD"
                disabled={isReadOnly || !isCreateMode}
                className={errors.code ? 'border-destructive' : ''}
                maxLength={10}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message as string}</p>
              )}
              {!isCreateMode && (
                <p className="text-xs text-muted-foreground">Code cannot be changed after creation</p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="e.g., Internal Medicine"
                disabled={isReadOnly}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe the specialty and its focus areas..."
                disabled={isReadOnly}
                rows={4}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={watchedIsActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
                disabled={isReadOnly}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active Specialty
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Statistics (View Mode Only) */}
        {mode === 'view' && specialty && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Total Doctors</Label>
                  <p className="text-2xl font-bold">{specialty.doctors_count}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="mt-1">
                    {specialty.is_active ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">{new Date(specialty.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">{new Date(specialty.updated_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Specialty ID</Label>
                  <p className="font-mono text-sm">{specialty.id}</p>
                </div>
                {specialty.department && (
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="text-sm">{specialty.department}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

SpecialtyBasicInfo.displayName = 'SpecialtyBasicInfo';

export default SpecialtyBasicInfo;
