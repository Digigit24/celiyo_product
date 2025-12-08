// src/components/appointment-type-drawer/AppointmentTypeBasicInfo.tsx
import { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import type { AppointmentType, AppointmentTypeCreateData, AppointmentTypeUpdateData } from '@/types/appointmentType.types';

// Validation schemas
const createAppointmentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  duration_default: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
  base_consultation_fee: z.string().min(0, 'Fee cannot be negative'),
  is_active: z.boolean(),
  color: z.string().min(1, 'Color is required'),
});

const updateAppointmentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  code: z.string().min(1, 'Code is required').optional(),
  description: z.string().optional(),
  duration_default: z.coerce.number().min(5, 'Duration must be at least 5 minutes').optional(),
  base_consultation_fee: z.string().optional(),
  is_active: z.boolean().optional(),
  color: z.string().optional(),
});

type AppointmentTypeFormData = z.infer<typeof createAppointmentTypeSchema> | z.infer<typeof updateAppointmentTypeSchema>;

export interface AppointmentTypeBasicInfoHandle {
  getFormValues: () => Promise<AppointmentTypeCreateData | AppointmentTypeUpdateData | null>;
}

interface AppointmentTypeBasicInfoProps {
  appointmentType?: AppointmentType | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const AppointmentTypeBasicInfo = forwardRef<AppointmentTypeBasicInfoHandle, AppointmentTypeBasicInfoProps>(
  ({ appointmentType, mode, onSuccess }, ref) => {
    const isReadOnly = mode === 'view';
    const isCreateMode = mode === 'create';

    const schema = isCreateMode ? createAppointmentTypeSchema : updateAppointmentTypeSchema;

    const defaultValues = isCreateMode
      ? {
          name: '',
          code: '',
          description: '',
          duration_default: 30,
          base_consultation_fee: '0.00',
          is_active: true,
          color: '#3b82f6',
        }
      : {
          name: appointmentType?.name || '',
          code: appointmentType?.code || '',
          description: appointmentType?.description || '',
          duration_default: appointmentType?.duration_default || 30,
          base_consultation_fee: appointmentType?.base_consultation_fee || '0.00',
          is_active: appointmentType?.is_active ?? true,
          color: appointmentType?.color || '#3b82f6',
        };

    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      setValue,
    } = useForm<any>({
      resolver: zodResolver(schema),
      defaultValues,
    });

    const watchedColor = watch('color');
    const watchedIsActive = watch('is_active');
    const watchedCode = watch('code');

    // Auto-format code as lowercase with underscores
    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      setValue('code', formatted);
    };

    // Expose form validation and data collection to parent
    useImperativeHandle(ref, () => ({
      getFormValues: async (): Promise<AppointmentTypeCreateData | AppointmentTypeUpdateData | null> => {
        return new Promise((resolve) => {
          handleSubmit(
            (data) => {
              if (isCreateMode) {
                const payload: AppointmentTypeCreateData = {
                  name: data.name.trim(),
                  code: data.code.trim(),
                  description: data.description?.trim() || undefined,
                  duration_default: Number(data.duration_default),
                  base_consultation_fee: data.base_consultation_fee,
                  is_active: data.is_active,
                  color: data.color,
                };
                resolve(payload);
              } else {
                const payload: AppointmentTypeUpdateData = {
                  name: data.name?.trim(),
                  code: data.code?.trim(),
                  description: data.description?.trim() || undefined,
                  duration_default: data.duration_default ? Number(data.duration_default) : undefined,
                  base_consultation_fee: data.base_consultation_fee,
                  is_active: data.is_active,
                  color: data.color,
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Consultation"
                disabled={isReadOnly}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message as string}</p>
              )}
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={watchedCode || ''}
                onChange={handleCodeChange}
                placeholder="e.g., consultation"
                disabled={isReadOnly}
                className={`font-mono ${errors.code ? 'border-destructive' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, use underscores)
              </p>
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message as string}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe this appointment type..."
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="cursor-pointer">Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  {watchedIsActive ? 'This type is currently active' : 'This type is currently inactive'}
                </p>
              </div>
              {isReadOnly ? (
                <Badge variant={watchedIsActive ? 'default' : 'secondary'}>
                  {watchedIsActive ? 'Active' : 'Inactive'}
                </Badge>
              ) : (
                <Switch
                  id="is_active"
                  checked={watchedIsActive}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Duration Default */}
            <div className="space-y-2">
              <Label htmlFor="duration_default">Default Duration (minutes) *</Label>
              <Input
                id="duration_default"
                type="number"
                min="5"
                step="5"
                {...register('duration_default')}
                placeholder="30"
                disabled={isReadOnly}
                className={errors.duration_default ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Default appointment duration in minutes
              </p>
              {errors.duration_default && (
                <p className="text-sm text-destructive">{errors.duration_default.message as string}</p>
              )}
            </div>

            {/* Base Consultation Fee */}
            <div className="space-y-2">
              <Label htmlFor="base_consultation_fee">Base Consultation Fee</Label>
              <Input
                id="base_consultation_fee"
                type="number"
                min="0"
                step="0.01"
                {...register('base_consultation_fee')}
                placeholder="0.00"
                disabled={isReadOnly}
                className={errors.base_consultation_fee ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Default fee for this appointment type
              </p>
              {errors.base_consultation_fee && (
                <p className="text-sm text-destructive">{errors.base_consultation_fee.message as string}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Display Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    id="color"
                    type="color"
                    {...register('color')}
                    disabled={isReadOnly}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={watchedColor || '#3b82f6'}
                    onChange={(e) => setValue('color', e.target.value)}
                    disabled={isReadOnly}
                    className="font-mono flex-1"
                    placeholder="#3b82f6"
                  />
                </div>
                <div
                  className="w-10 h-10 rounded-md border-2 border-gray-200"
                  style={{ backgroundColor: watchedColor || '#3b82f6' }}
                  title="Preview"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Color used to display this appointment type in the UI
              </p>
              {errors.color && (
                <p className="text-sm text-destructive">{errors.color.message as string}</p>
              )}
            </div>

            {/* Preview */}
            {!isReadOnly && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: watchedColor || '#3b82f6' }}
                  />
                  <span className="font-medium">{watch('name') || 'Appointment Type Name'}</span>
                  <Badge variant={watchedIsActive ? 'default' : 'secondary'} className="ml-auto">
                    {watchedIsActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

AppointmentTypeBasicInfo.displayName = 'AppointmentTypeBasicInfo';

export default AppointmentTypeBasicInfo;
