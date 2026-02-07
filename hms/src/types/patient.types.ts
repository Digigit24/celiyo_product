// src/types/patient.types.ts

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type PatientStatus = 'active' | 'inactive' | 'deceased';

export interface Patient {
  id: number;
  patient_id: string; // Unique ID like PAT2025XXXX

  // Personal Info - Matching backend model
  first_name: string; // Required
  last_name?: string; // Optional (null=True, blank=True in backend)
  middle_name?: string;
  full_name: string; // Computed property
  date_of_birth?: string; // Optional (null=True, blank=True in backend)
  age: number; // Auto-calculated from date_of_birth
  gender: Gender; // Required

  // Contact - mobile_primary required, rest optional
  mobile_primary: string; // Required (max 15 chars)
  mobile_secondary?: string; // Optional (max 15 chars)
  email?: string; // Optional

  // Address - All optional in backend
  address_line1?: string; // Optional (max 200 chars)
  address_line2?: string; // Optional (max 200 chars)
  city?: string; // Optional (max 100 chars)
  state?: string; // Optional (max 100 chars)
  country: string; // Default='India'
  pincode?: string; // Optional (max 10 chars)
  full_address?: string; // Computed property

  // Medical Info - All optional
  blood_group?: BloodGroup;
  height?: number; // Decimal(5,2) - cm
  weight?: number; // Decimal(5,2) - kg
  bmi?: number; // Decimal(4,2) - auto-calculated

  // Social Info - All optional
  marital_status?: MaritalStatus; // Default='single' in backend
  occupation?: string; // Optional (max 100 chars)

  // Emergency Contact - All optional (null=True, blank=True in backend)
  emergency_contact_name?: string; // Optional (max 100 chars)
  emergency_contact_phone?: string; // Optional (max 15 chars)
  emergency_contact_relation?: string; // Optional (max 50 chars)

  // Insurance - All optional
  insurance_provider?: string; // Optional (max 200 chars)
  insurance_policy_number?: string; // Optional (max 100 chars)
  insurance_expiry_date?: string; // Optional
  is_insurance_valid?: boolean; // Computed property

  // Hospital Info
  registration_date: string; // Auto-generated
  last_visit_date?: string;
  total_visits: number; // Default=0

  // Status
  status: PatientStatus; // Default='active'

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface PatientListParams {
  gender?: Gender;
  blood_group?: BloodGroup;
  status?: PatientStatus;
  city?: string;
  state?: string;
  age_min?: number;
  age_max?: number;
  has_insurance?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface PatientCreateData {
  // Flag to skip user account creation
  create_user: boolean;

  // Personal Info - Matching backend required fields exactly
  first_name: string; // REQUIRED (max 100 chars)
  last_name?: string; // OPTIONAL (null=True, blank=True, max 100 chars)
  middle_name?: string; // OPTIONAL (max 100 chars)
  date_of_birth?: string; // OPTIONAL (null=True, blank=True) - age auto-calculated in backend
  gender: Gender; // REQUIRED

  // Contact - Only mobile_primary required
  mobile_primary: string; // REQUIRED (9-15 digits)
  mobile_secondary?: string; // OPTIONAL (max 15 chars)
  email?: string; // OPTIONAL

  // Address - All optional in backend
  address_line1?: string; // OPTIONAL (max 200 chars)
  address_line2?: string; // OPTIONAL (max 200 chars)
  city?: string; // OPTIONAL (max 100 chars)
  state?: string; // OPTIONAL (max 100 chars)
  country?: string; // Default='India'
  pincode?: string; // OPTIONAL (max 10 chars)

  // Medical Info - All optional
  blood_group?: BloodGroup;
  height?: number; // Decimal(5,2)
  weight?: number; // Decimal(5,2)

  // Social Info - All optional
  marital_status?: MaritalStatus; // Default='single' in backend
  occupation?: string; // OPTIONAL (max 100 chars)

  // Emergency Contact - All optional (null=True, blank=True in backend)
  emergency_contact_name?: string; // OPTIONAL (max 100 chars)
  emergency_contact_phone?: string; // OPTIONAL (max 15 chars)
  emergency_contact_relation?: string; // OPTIONAL (max 50 chars)

  // Insurance - All optional
  insurance_provider?: string; // OPTIONAL (max 200 chars)
  insurance_policy_number?: string; // OPTIONAL (max 100 chars)
  insurance_expiry_date?: string; // OPTIONAL
}

export interface PatientUpdateData {
  // Personal Info
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: Gender;

  // Contact
  mobile_primary?: string;
  mobile_secondary?: string;
  email?: string;

  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  // Medical Info
  blood_group?: BloodGroup;
  height?: number;
  weight?: number;

  // Social Info
  marital_status?: MaritalStatus;
  occupation?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;

  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;

  // Status
  status?: PatientStatus;
}

export interface PatientStatistics {
  total_patients: number;
  active_patients: number;
  inactive_patients: number;
  deceased_patients: number;
  patients_with_insurance: number;
  average_age: number;
  total_visits: number;
  gender_distribution: {
    Male: number;
    Female: number;
    Other: number;
  };
  blood_group_distribution: Record<string, number>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
