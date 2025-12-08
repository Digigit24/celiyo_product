// src/components/doctor-drawer/DoctorBasicInfo.tsx
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Doctor, DoctorCreateData, DoctorUpdateData, Specialty } from '@/types/doctor.types';

// Validation schemas
const createDoctorSchema = z.object({
  // User fields (required for account creation)
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(8, 'Password confirmation required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),

  // Doctor profile required field (per Django model - no blank=True)
  consultation_duration: z.coerce.number().min(5, 'Consultation duration must be at least 5 minutes'),

  // Optional doctor profile fields (all have blank=True and/or null=True in Django model)
  medical_license_number: z.string().optional(),
  license_issuing_authority: z.string().optional(),
  license_issue_date: z.string().optional(),
  license_expiry_date: z.string().optional(),
  qualifications: z.string().optional(),
  specialty_ids: z.array(z.number()).optional(),
  years_of_experience: z.coerce.number().min(0).optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  follow_up_fee: z.coerce.number().min(0).optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

const updateDoctorSchema = z.object({
  // All fields optional for update
  qualifications: z.string().optional(),
  specialty_ids: z.array(z.number()).optional(),
  years_of_experience: z.coerce.number().min(0).optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  follow_up_fee: z.coerce.number().min(0).optional(),
  consultation_duration: z.coerce.number().min(5).optional(),
  status: z.enum(['active', 'on_leave', 'inactive']).optional(),
});

type DoctorFormData = z.infer<typeof createDoctorSchema> | z.infer<typeof updateDoctorSchema>;

export interface DoctorBasicInfoHandle {
  getFormValues: () => Promise<DoctorCreateData | DoctorUpdateData | null>;
}

interface DoctorBasicInfoProps {
  doctor?: Doctor | null;
  specialties: Specialty[];
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const DoctorBasicInfo = forwardRef<DoctorBasicInfoHandle, DoctorBasicInfoProps>(
  ({ doctor, specialties, mode, onSuccess }, ref) => {
    const isReadOnly = mode === 'view';
    const isCreateMode = mode === 'create';

    const schema = isCreateMode ? createDoctorSchema : updateDoctorSchema;

    const defaultValues = isCreateMode
      ? {
          // Required user fields
          email: '',
          password: '',
          password_confirm: '',
          first_name: '',
          last_name: '',
          phone: '',
          // Required doctor field
          consultation_duration: 15,
          // Optional doctor fields
          medical_license_number: '',
          license_issuing_authority: '',
          license_issue_date: '',
          license_expiry_date: '',
          qualifications: '',
          specialty_ids: [],
          years_of_experience: 0,
          consultation_fee: 0,
          follow_up_fee: 0,
        }
      : {
          // All fields optional for update
          qualifications: doctor?.qualifications || '',
          specialty_ids: doctor?.specialties?.map((s) => s.id) || [],
          years_of_experience: doctor?.years_of_experience || 0,
          consultation_fee: parseFloat(doctor?.consultation_fee || '0'),
          follow_up_fee: parseFloat(doctor?.follow_up_fee || '0'),
          consultation_duration: doctor?.consultation_duration || 15,
          status: doctor?.status || 'active',
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

    const watchedSpecialtyIds = watch('specialty_ids') || [];
    const watchedStatus = watch('status');

    // Reset form when doctor data changes (for edit/view modes)
    useEffect(() => {
      if (!isCreateMode && doctor) {
        const formValues = {
          qualifications: doctor.qualifications || '',
          specialty_ids: doctor.specialties?.map((s) => s.id) || [],
          years_of_experience: doctor.years_of_experience || 0,
          consultation_fee: parseFloat(doctor.consultation_fee || '0'),
          follow_up_fee: parseFloat(doctor.follow_up_fee || '0'),
          consultation_duration: doctor.consultation_duration || 15,
          status: doctor.status || 'active',
        };
        reset(formValues);
      }
    }, [doctor, isCreateMode, reset]);

    // Expose form validation and data collection to parent
    useImperativeHandle(ref, () => ({
      getFormValues: async (): Promise<DoctorCreateData | DoctorUpdateData | null> => {
        return new Promise((resolve) => {
          handleSubmit(
            (data) => {
              if (isCreateMode) {
                // Create doctor with user account (per Django model)
                const payload: any = {
                  // User creation flag (required)
                  create_user: true,

                  // User account fields (required when create_user = true)
                  email: data.email,
                  password: data.password,
                  password_confirm: data.password_confirm,
                  first_name: data.first_name,
                  last_name: data.last_name,
                  phone: data.phone,

                  // Doctor profile required field (consultation_duration has no blank=True)
                  consultation_duration: Number(data.consultation_duration),
                };

                // Add optional doctor profile fields only if they have values
                if (data.medical_license_number) payload.medical_license_number = data.medical_license_number;
                if (data.license_issuing_authority) payload.license_issuing_authority = data.license_issuing_authority;
                if (data.license_issue_date) payload.license_issue_date = data.license_issue_date;
                if (data.license_expiry_date) payload.license_expiry_date = data.license_expiry_date;
                if (data.qualifications) payload.qualifications = data.qualifications;
                if (data.specialty_ids && data.specialty_ids.length > 0) payload.specialty_ids = data.specialty_ids;
                if (data.years_of_experience) payload.years_of_experience = Number(data.years_of_experience);
                if (data.consultation_fee) payload.consultation_fee = Number(data.consultation_fee);
                if (data.follow_up_fee) payload.follow_up_fee = Number(data.follow_up_fee);

                resolve(payload);
              } else {
                // Update doctor profile - all fields optional
                const payload: any = {};

                // Add only fields that have values
                if (data.qualifications) payload.qualifications = data.qualifications;
                if (data.specialty_ids) payload.specialty_ids = data.specialty_ids;
                if (data.years_of_experience !== undefined) payload.years_of_experience = Number(data.years_of_experience);
                if (data.consultation_fee !== undefined) payload.consultation_fee = Number(data.consultation_fee);
                if (data.follow_up_fee !== undefined) payload.follow_up_fee = Number(data.follow_up_fee);
                if (data.consultation_duration) payload.consultation_duration = Number(data.consultation_duration);
                if (data.status) payload.status = data.status;

                resolve(payload);
              }
            },
            () => resolve(null)
          )();
        });
      },
    }));

    const toggleSpecialty = (specialtyId: number) => {
      if (isReadOnly) return;

      const currentIds = watchedSpecialtyIds;
      if (currentIds.includes(specialtyId)) {
        setValue('specialty_ids', currentIds.filter((id: number) => id !== specialtyId));
      } else {
        setValue('specialty_ids', [...currentIds, specialtyId]);
      }
    };

    return (
      <div className="space-y-6">
        {/* User Account Information (Create Mode Only) */}
        {isCreateMode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="doctor@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message as string}</p>
                )}
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message as string}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirm">Confirm Password *</Label>
                  <Input
                    id="password_confirm"
                    type="password"
                    {...register('password_confirm')}
                    placeholder="••••••••"
                    className={errors.password_confirm ? 'border-destructive' : ''}
                  />
                  {errors.password_confirm && (
                    <p className="text-sm text-destructive">{errors.password_confirm.message as string}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCreateMode ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      {...register('first_name')}
                      placeholder="John"
                      className={errors.first_name ? 'border-destructive' : ''}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-destructive">{errors.first_name.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      {...register('last_name')}
                      placeholder="Smith"
                      className={errors.last_name ? 'border-destructive' : ''}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-destructive">{errors.last_name.message as string}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+1234567890"
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message as string}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{doctor?.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{doctor?.user?.email || 'N/A'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical License Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical License</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCreateMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="medical_license_number">License Number</Label>
                  <Input
                    id="medical_license_number"
                    {...register('medical_license_number')}
                    placeholder="MED-12345"
                    className={errors.medical_license_number ? 'border-destructive' : ''}
                  />
                  {errors.medical_license_number && (
                    <p className="text-sm text-destructive">
                      {errors.medical_license_number.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_issuing_authority">Issuing Authority</Label>
                  <Input
                    id="license_issuing_authority"
                    {...register('license_issuing_authority')}
                    placeholder="Medical Board of..."
                    className={errors.license_issuing_authority ? 'border-destructive' : ''}
                  />
                  {errors.license_issuing_authority && (
                    <p className="text-sm text-destructive">
                      {errors.license_issuing_authority.message as string}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_issue_date">Issue Date</Label>
                    <Input
                      id="license_issue_date"
                      type="date"
                      {...register('license_issue_date')}
                      className={errors.license_issue_date ? 'border-destructive' : ''}
                    />
                    {errors.license_issue_date && (
                      <p className="text-sm text-destructive">
                        {errors.license_issue_date.message as string}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license_expiry_date">Expiry Date</Label>
                    <Input
                      id="license_expiry_date"
                      type="date"
                      {...register('license_expiry_date')}
                      className={errors.license_expiry_date ? 'border-destructive' : ''}
                    />
                    {errors.license_expiry_date && (
                      <p className="text-sm text-destructive">
                        {errors.license_expiry_date.message as string}
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">License Number</Label>
                  <p className="font-mono">{doctor?.medical_license_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Issuing Authority</Label>
                  <p>{doctor?.license_issuing_authority || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Issue Date</Label>
                  <p>{doctor?.license_issue_date || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p>{doctor?.license_expiry_date || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">License Status</Label>
                  <p>
                    {doctor?.is_license_valid ? (
                      <Badge variant="default" className="bg-green-600">Valid</Badge>
                    ) : (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Qualifications */}
            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Textarea
                id="qualifications"
                {...register('qualifications')}
                placeholder="MBBS, MD, etc."
                disabled={isReadOnly}
                rows={3}
                className={errors.qualifications ? 'border-destructive' : ''}
              />
              {errors.qualifications && (
                <p className="text-sm text-destructive">{errors.qualifications.message as string}</p>
              )}
            </div>

            {/* Specialties */}
            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
                {specialties.map((specialty) => (
                  <Badge
                    key={specialty.id}
                    variant={watchedSpecialtyIds.includes(specialty.id) ? 'default' : 'outline'}
                    className={`cursor-pointer ${isReadOnly ? 'cursor-default' : ''}`}
                    onClick={() => toggleSpecialty(specialty.id)}
                  >
                    {specialty.name}
                    {watchedSpecialtyIds.includes(specialty.id) && !isReadOnly && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              {errors.specialty_ids && (
                <p className="text-sm text-destructive">{errors.specialty_ids.message as string}</p>
              )}
            </div>

            {/* Years of Experience */}
            <div className="space-y-2">
              <Label htmlFor="years_of_experience">Years of Experience</Label>
              <Input
                id="years_of_experience"
                type="number"
                min="0"
                {...register('years_of_experience')}
                disabled={isReadOnly}
                className={errors.years_of_experience ? 'border-destructive' : ''}
              />
              {errors.years_of_experience && (
                <p className="text-sm text-destructive">
                  {errors.years_of_experience.message as string}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consultation & Fees */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consultation & Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="consultation_duration">Consultation Duration (minutes) {isCreateMode && '*'}</Label>
              <Input
                id="consultation_duration"
                type="number"
                min="5"
                step="5"
                {...register('consultation_duration')}
                disabled={isReadOnly}
                className={errors.consultation_duration ? 'border-destructive' : ''}
              />
              {errors.consultation_duration && (
                <p className="text-sm text-destructive">
                  {errors.consultation_duration.message as string}
                </p>
              )}
            </div>

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
                  className={errors.consultation_fee ? 'border-destructive' : ''}
                />
                {errors.consultation_fee && (
                  <p className="text-sm text-destructive">
                    {errors.consultation_fee.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up_fee">Follow-up Fee</Label>
                <Input
                  id="follow_up_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('follow_up_fee')}
                  disabled={isReadOnly}
                  className={errors.follow_up_fee ? 'border-destructive' : ''}
                />
                {errors.follow_up_fee && (
                  <p className="text-sm text-destructive">
                    {errors.follow_up_fee.message as string}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status (Edit Mode Only) */}
        {!isCreateMode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="status">Doctor Status</Label>
                {isReadOnly ? (
                  <div className="pt-2">
                    <Badge
                      variant={
                        doctor?.status === 'active'
                          ? 'default'
                          : doctor?.status === 'on_leave'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={
                        doctor?.status === 'active'
                          ? 'bg-green-600'
                          : doctor?.status === 'on_leave'
                          ? 'bg-orange-600'
                          : ''
                      }
                    >
                      {doctor?.status === 'active' && 'Active'}
                      {doctor?.status === 'on_leave' && 'On Leave'}
                      {doctor?.status === 'inactive' && 'Inactive'}
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics (View Mode Only) */}
        {mode === 'view' && doctor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Average Rating</Label>
                  <p className="text-lg font-bold">{doctor.average_rating} ⭐</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Reviews</Label>
                  <p className="text-lg font-bold">{doctor.total_reviews}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Consultations</Label>
                  <p className="text-lg font-bold">{doctor.total_consultations}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Online Available</Label>
                  <p>
                    {doctor.is_available_online ? (
                      <Badge variant="default" className="bg-green-600">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Offline Available</Label>
                  <p>
                    {doctor.is_available_offline ? (
                      <Badge variant="default" className="bg-green-600">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

DoctorBasicInfo.displayName = 'DoctorBasicInfo';

export default DoctorBasicInfo;
