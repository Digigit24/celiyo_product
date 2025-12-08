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

  // Personal Info
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: Gender;

  // Contact
  mobile_primary: string;
  mobile_secondary?: string;
  email?: string;

  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country: string;
  pincode?: string;
  full_address?: string;

  // Medical Info
  blood_group?: BloodGroup;
  height?: number;
  weight?: number;
  bmi?: number;

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
  is_insurance_valid?: boolean;

  // Hospital Info
  registration_date: string;
  last_visit_date?: string;
  total_visits: number;

  // Status
  status: PatientStatus;

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

  // Personal Info (REQUIRED)
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: Gender;

  // Contact (REQUIRED)
  mobile_primary: string;
  mobile_secondary?: string;
  email?: string;

  // Address (REQUIRED)
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;

  // Medical Info (OPTIONAL)
  blood_group?: BloodGroup;
  height?: number;
  weight?: number;

  // Social Info (OPTIONAL)
  marital_status?: MaritalStatus;
  occupation?: string;

  // Emergency Contact (REQUIRED)
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;

  // Insurance (OPTIONAL)
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
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
