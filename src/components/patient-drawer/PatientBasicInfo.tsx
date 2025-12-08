// src/components/patient-drawer/PatientBasicInfo.tsx
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Patient, PatientCreateData, PatientUpdateData } from '@/types/patient.types';

// Validation schemas
const createPatientSchema = z.object({
  // Personal Info (REQUIRED)
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  middle_name: z.string().optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),

  // Contact (REQUIRED)
  mobile_primary: z.string().min(10, 'Mobile number must be at least 10 digits'),
  mobile_secondary: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),

  // Address (REQUIRED)
  address_line1: z.string().min(1, 'Address line 1 is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().default('India'),
  pincode: z.string().min(4, 'Pincode must be at least 4 digits'),

  // Medical Info (OPTIONAL)
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  height: z.coerce.number().min(0).optional().or(z.literal('')),
  weight: z.coerce.number().min(0).optional().or(z.literal('')),

  // Social Info (OPTIONAL)
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  occupation: z.string().optional(),

  // Emergency Contact (REQUIRED)
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Emergency contact phone must be at least 10 digits'),
  emergency_contact_relation: z.string().min(1, 'Emergency contact relation is required'),

  // Insurance (OPTIONAL)
  insurance_provider: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_expiry_date: z.string().optional(),
});

const updatePatientSchema = z.object({
  // Personal Info
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),

  // Contact
  mobile_primary: z.string().optional(),
  mobile_secondary: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),

  // Address
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),

  // Medical Info
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  height: z.coerce.number().min(0).optional().or(z.literal('')),
  weight: z.coerce.number().min(0).optional().or(z.literal('')),

  // Social Info
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  occupation: z.string().optional(),

  // Emergency Contact
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),

  // Insurance
  insurance_provider: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_expiry_date: z.string().optional(),

  // Status
  status: z.enum(['active', 'inactive', 'deceased']).optional(),
});

type PatientFormData = z.infer<typeof createPatientSchema> | z.infer<typeof updatePatientSchema>;

export interface PatientBasicInfoHandle {
  getFormValues: () => Promise<PatientCreateData | PatientUpdateData | null>;
}

interface PatientBasicInfoProps {
  patient?: Patient | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const PatientBasicInfo = forwardRef<PatientBasicInfoHandle, PatientBasicInfoProps>(
  ({ patient, mode, onSuccess }, ref) => {
    const isReadOnly = mode === 'view';
    const isCreateMode = mode === 'create';

    const schema = isCreateMode ? createPatientSchema : updatePatientSchema;

    const defaultValues = isCreateMode
      ? {
          first_name: '',
          last_name: '',
          middle_name: '',
          date_of_birth: '',
          gender: 'male' as const,
          mobile_primary: '',
          mobile_secondary: '',
          email: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          country: 'India',
          pincode: '',
          blood_group: undefined,
          height: '' as any,
          weight: '' as any,
          marital_status: undefined,
          occupation: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          emergency_contact_relation: '',
          insurance_provider: '',
          insurance_policy_number: '',
          insurance_expiry_date: '',
        }
      : {
          first_name: patient?.first_name || '',
          last_name: patient?.last_name || '',
          middle_name: patient?.middle_name || '',
          date_of_birth: patient?.date_of_birth || '',
          gender: patient?.gender || 'male',
          mobile_primary: patient?.mobile_primary || '',
          mobile_secondary: patient?.mobile_secondary || '',
          email: patient?.email || '',
          address_line1: patient?.address_line1 || '',
          address_line2: patient?.address_line2 || '',
          city: patient?.city || '',
          state: patient?.state || '',
          country: patient?.country || 'India',
          pincode: patient?.pincode || '',
          blood_group: patient?.blood_group || undefined,
          height: patient?.height || '' as any,
          weight: patient?.weight || '' as any,
          marital_status: patient?.marital_status || undefined,
          occupation: patient?.occupation || '',
          emergency_contact_name: patient?.emergency_contact_name || '',
          emergency_contact_phone: patient?.emergency_contact_phone || '',
          emergency_contact_relation: patient?.emergency_contact_relation || '',
          insurance_provider: patient?.insurance_provider || '',
          insurance_policy_number: patient?.insurance_policy_number || '',
          insurance_expiry_date: patient?.insurance_expiry_date || '',
          status: patient?.status || 'active',
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

    const watchedGender = watch('gender');
    const watchedStatus = watch('status');
    const watchedBloodGroup = watch('blood_group');
    const watchedMaritalStatus = watch('marital_status');

    // Reset form when patient data changes (for edit/view modes)
    useEffect(() => {
      if (!isCreateMode && patient) {
        const formValues = {
          first_name: patient.first_name || '',
          last_name: patient.last_name || '',
          middle_name: patient.middle_name || '',
          date_of_birth: patient.date_of_birth || '',
          gender: patient.gender || 'male',
          mobile_primary: patient.mobile_primary || '',
          mobile_secondary: patient.mobile_secondary || '',
          email: patient.email || '',
          address_line1: patient.address_line1 || '',
          address_line2: patient.address_line2 || '',
          city: patient.city || '',
          state: patient.state || '',
          country: patient.country || 'India',
          pincode: patient.pincode || '',
          blood_group: patient.blood_group || undefined,
          height: patient.height || '',
          weight: patient.weight || '',
          marital_status: patient.marital_status || undefined,
          occupation: patient.occupation || '',
          emergency_contact_name: patient.emergency_contact_name || '',
          emergency_contact_phone: patient.emergency_contact_phone || '',
          emergency_contact_relation: patient.emergency_contact_relation || '',
          insurance_provider: patient.insurance_provider || '',
          insurance_policy_number: patient.insurance_policy_number || '',
          insurance_expiry_date: patient.insurance_expiry_date || '',
          status: patient.status || 'active',
        };
        reset(formValues);
      }
    }, [patient, isCreateMode, reset]);

    // Expose form validation and data collection to parent
    useImperativeHandle(ref, () => ({
      getFormValues: async (): Promise<PatientCreateData | PatientUpdateData | null> => {
        return new Promise((resolve) => {
          handleSubmit(
            (data) => {
              // Clean up empty strings to undefined
              const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
                acc[key] = value === '' ? undefined : value;
                return acc;
              }, {} as any);

              if (isCreateMode) {
                const payload: PatientCreateData = {
                  create_user: false,
                  first_name: cleanData.first_name,
                  last_name: cleanData.last_name,
                  middle_name: cleanData.middle_name,
                  date_of_birth: cleanData.date_of_birth,
                  gender: cleanData.gender,
                  mobile_primary: cleanData.mobile_primary,
                  mobile_secondary: cleanData.mobile_secondary,
                  email: cleanData.email,
                  address_line1: cleanData.address_line1,
                  address_line2: cleanData.address_line2,
                  city: cleanData.city,
                  state: cleanData.state,
                  country: cleanData.country || 'India',
                  pincode: cleanData.pincode,
                  blood_group: cleanData.blood_group,
                  height: cleanData.height ? Number(cleanData.height) : undefined,
                  weight: cleanData.weight ? Number(cleanData.weight) : undefined,
                  marital_status: cleanData.marital_status,
                  occupation: cleanData.occupation,
                  emergency_contact_name: cleanData.emergency_contact_name,
                  emergency_contact_phone: cleanData.emergency_contact_phone,
                  emergency_contact_relation: cleanData.emergency_contact_relation,
                  insurance_provider: cleanData.insurance_provider,
                  insurance_policy_number: cleanData.insurance_policy_number,
                  insurance_expiry_date: cleanData.insurance_expiry_date,
                };
                resolve(payload);
              } else {
                const payload: PatientUpdateData = {
                  first_name: cleanData.first_name,
                  last_name: cleanData.last_name,
                  middle_name: cleanData.middle_name,
                  date_of_birth: cleanData.date_of_birth,
                  gender: cleanData.gender,
                  mobile_primary: cleanData.mobile_primary,
                  mobile_secondary: cleanData.mobile_secondary,
                  email: cleanData.email,
                  address_line1: cleanData.address_line1,
                  address_line2: cleanData.address_line2,
                  city: cleanData.city,
                  state: cleanData.state,
                  country: cleanData.country,
                  pincode: cleanData.pincode,
                  blood_group: cleanData.blood_group,
                  height: cleanData.height ? Number(cleanData.height) : undefined,
                  weight: cleanData.weight ? Number(cleanData.weight) : undefined,
                  marital_status: cleanData.marital_status,
                  occupation: cleanData.occupation,
                  emergency_contact_name: cleanData.emergency_contact_name,
                  emergency_contact_phone: cleanData.emergency_contact_phone,
                  emergency_contact_relation: cleanData.emergency_contact_relation,
                  insurance_provider: cleanData.insurance_provider,
                  insurance_policy_number: cleanData.insurance_policy_number,
                  insurance_expiry_date: cleanData.insurance_expiry_date,
                  status: cleanData.status,
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
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCreateMode || !isReadOnly ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      {...register('first_name')}
                      placeholder="John"
                      disabled={isReadOnly}
                      className={errors.first_name ? 'border-destructive' : ''}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-destructive">{errors.first_name.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      {...register('middle_name')}
                      placeholder="M."
                      disabled={isReadOnly}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      {...register('last_name')}
                      placeholder="Doe"
                      disabled={isReadOnly}
                      className={errors.last_name ? 'border-destructive' : ''}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-destructive">{errors.last_name.message as string}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      {...register('date_of_birth')}
                      disabled={isReadOnly}
                      className={errors.date_of_birth ? 'border-destructive' : ''}
                    />
                    {errors.date_of_birth && (
                      <p className="text-sm text-destructive">{errors.date_of_birth.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={watchedGender}
                      onValueChange={(value) => setValue('gender', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-destructive">{errors.gender.message as string}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{patient?.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Patient ID</Label>
                  <p className="font-mono">{patient?.patient_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p>{patient?.date_of_birth}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Age</Label>
                  <p>{patient?.age} years</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="capitalize">{patient?.gender}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile_primary">Primary Mobile *</Label>
                <Input
                  id="mobile_primary"
                  {...register('mobile_primary')}
                  placeholder="+1234567890"
                  disabled={isReadOnly}
                  className={errors.mobile_primary ? 'border-destructive' : ''}
                />
                {errors.mobile_primary && (
                  <p className="text-sm text-destructive">{errors.mobile_primary.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_secondary">Secondary Mobile</Label>
                <Input
                  id="mobile_secondary"
                  {...register('mobile_secondary')}
                  placeholder="+1234567890"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="patient@example.com"
                disabled={isReadOnly}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message as string}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Input
                id="address_line1"
                {...register('address_line1')}
                placeholder="Street address"
                disabled={isReadOnly}
                className={errors.address_line1 ? 'border-destructive' : ''}
              />
              {errors.address_line1 && (
                <p className="text-sm text-destructive">{errors.address_line1.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                {...register('address_line2')}
                placeholder="Apartment, suite, etc."
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="City"
                  disabled={isReadOnly}
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="State"
                  disabled={isReadOnly}
                  className={errors.state ? 'border-destructive' : ''}
                />
                {errors.state && (
                  <p className="text-sm text-destructive">{errors.state.message as string}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  {...register('pincode')}
                  placeholder="123456"
                  disabled={isReadOnly}
                  className={errors.pincode ? 'border-destructive' : ''}
                />
                {errors.pincode && (
                  <p className="text-sm text-destructive">{errors.pincode.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...register('country')}
                  placeholder="India"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_group">Blood Group</Label>
                <Select
                  value={watchedBloodGroup || undefined}
                  onValueChange={(value) => setValue('blood_group', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  {...register('height')}
                  placeholder="175.5"
                  disabled={isReadOnly}
                  className={errors.height ? 'border-destructive' : ''}
                />
                {errors.height && (
                  <p className="text-sm text-destructive">{errors.height.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  {...register('weight')}
                  placeholder="70.5"
                  disabled={isReadOnly}
                  className={errors.weight ? 'border-destructive' : ''}
                />
                {errors.weight && (
                  <p className="text-sm text-destructive">{errors.weight.message as string}</p>
                )}
              </div>
            </div>

            {mode === 'view' && patient?.bmi && (
              <div className="text-sm">
                <Label className="text-muted-foreground">BMI</Label>
                <p className="font-medium">{patient.bmi.toFixed(2)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Social Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select
                  value={watchedMaritalStatus || undefined}
                  onValueChange={(value) => setValue('marital_status', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  {...register('occupation')}
                  placeholder="Software Engineer"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact Name *</Label>
              <Input
                id="emergency_contact_name"
                {...register('emergency_contact_name')}
                placeholder="Jane Doe"
                disabled={isReadOnly}
                className={errors.emergency_contact_name ? 'border-destructive' : ''}
              />
              {errors.emergency_contact_name && (
                <p className="text-sm text-destructive">{errors.emergency_contact_name.message as string}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
                <Input
                  id="emergency_contact_phone"
                  {...register('emergency_contact_phone')}
                  placeholder="+1234567890"
                  disabled={isReadOnly}
                  className={errors.emergency_contact_phone ? 'border-destructive' : ''}
                />
                {errors.emergency_contact_phone && (
                  <p className="text-sm text-destructive">{errors.emergency_contact_phone.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relation">Relation *</Label>
                <Input
                  id="emergency_contact_relation"
                  {...register('emergency_contact_relation')}
                  placeholder="Spouse, Parent, Sibling..."
                  disabled={isReadOnly}
                  className={errors.emergency_contact_relation ? 'border-destructive' : ''}
                />
                {errors.emergency_contact_relation && (
                  <p className="text-sm text-destructive">{errors.emergency_contact_relation.message as string}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insurance Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="insurance_provider">Insurance Provider</Label>
              <Input
                id="insurance_provider"
                {...register('insurance_provider')}
                placeholder="Insurance Company Name"
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance_policy_number">Policy Number</Label>
                <Input
                  id="insurance_policy_number"
                  {...register('insurance_policy_number')}
                  placeholder="POL123456"
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_expiry_date">Expiry Date</Label>
                <Input
                  id="insurance_expiry_date"
                  type="date"
                  {...register('insurance_expiry_date')}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {mode === 'view' && patient?.insurance_provider && (
              <div className="text-sm">
                <Label className="text-muted-foreground">Insurance Status</Label>
                <p>
                  {patient?.is_insurance_valid ? (
                    <Badge variant="default" className="bg-green-600">Valid</Badge>
                  ) : (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                </p>
              </div>
            )}
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
                <Label htmlFor="status">Patient Status</Label>
                {isReadOnly ? (
                  <div className="pt-2">
                    <Badge
                      variant={
                        patient?.status === 'active'
                          ? 'default'
                          : patient?.status === 'inactive'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={
                        patient?.status === 'active'
                          ? 'bg-green-600'
                          : patient?.status === 'inactive'
                          ? 'bg-gray-600'
                          : 'bg-red-600'
                      }
                    >
                      {patient?.status === 'active' && 'Active'}
                      {patient?.status === 'inactive' && 'Inactive'}
                      {patient?.status === 'deceased' && 'Deceased'}
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
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics (View Mode Only) */}
        {mode === 'view' && patient && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hospital Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Total Visits</Label>
                  <p className="text-lg font-bold">{patient.total_visits}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Visit</Label>
                  <p className="text-lg font-bold">
                    {patient.last_visit_date
                      ? new Date(patient.last_visit_date).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registration Date</Label>
                  <p className="text-lg font-bold">
                    {new Date(patient.registration_date).toLocaleDateString()}
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

PatientBasicInfo.displayName = 'PatientBasicInfo';

export default PatientBasicInfo;
