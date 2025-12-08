// src/types/doctor.types.ts
// ==================== DOCTOR TYPES ====================
// Updated to match Django backend API response exactly

// ==================== USER TYPE ====================
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  alternate_phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  full_address: string;
  profile_picture: string | null;
  bio: string | null;
  employee_id: string | null;
  department: string | null;
  joining_date: string | null;
  is_verified: boolean;
  is_active: boolean;
  role: string;
  groups: string[];
  has_doctor_profile: boolean;
  has_patient_profile: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== SPECIALTY TYPE ====================
export interface Specialty {
  id: number;
  name: string;
  code: string;
  description: string | null;
  department: string | null;
  is_active: boolean;
  doctors_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ==================== DOCTOR AVAILABILITY TYPE ====================
export interface DoctorAvailability {
  id?: number;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  day_display?: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments: number;
  created_at?: string;
  updated_at?: string;
}

// ==================== MAIN DOCTOR INTERFACE ====================
export interface Doctor {
  id: number;
  user: User;
  full_name: string;
  
  // License Information
  medical_license_number: string;
  license_issuing_authority: string | null;
  license_issue_date: string | null;
  license_expiry_date: string | null;
  is_license_valid: boolean | null;
  
  // Professional Information
  qualifications: string | null;
  specialties: Specialty[];
  years_of_experience: number;
  
  // Consultation Settings
  consultation_fee: string; // Decimal as string from backend
  follow_up_fee: string; // Decimal as string from backend
  consultation_duration: number;
  is_available_online: boolean;
  is_available_offline: boolean;
  
  // Statistics (read-only)
  average_rating: string; // Decimal as string from backend
  total_reviews: number;
  total_consultations: number;
  
  // Status
  status: 'active' | 'on_leave' | 'inactive';
  
  // Optional fields
  signature?: string | null;
  languages_spoken?: string | null;
  availability?: DoctorAvailability[];
  
  // Timestamps
  created_at: string;
  updated_at?: string;
}

// ==================== LIST FILTERS ====================
export interface DoctorListParams {
  page?: number;
  page_size?: number;
  search?: string;
  specialty?: string; // Can be specialty ID or name
  status?: 'active' | 'on_leave' | 'inactive';
  available?: boolean;
  min_rating?: number;
  min_fee?: number;
  max_fee?: number;
  ordering?: string;
  
  [key: string]: string | number | boolean | undefined;
}

// ==================== SPECIALTY LIST FILTERS ====================
export interface SpecialtyListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  ordering?: string;
  
  [key: string]: string | number | boolean | undefined;
}

// ==================== CREATE DATA ====================
export interface DoctorCreateData {
  // User fields (required for registration)
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone: string;
  
  // License fields
  medical_license_number: string;
  license_issuing_authority: string;
  license_issue_date: string;
  license_expiry_date: string;
  
  // Professional fields
  qualifications: string;
  specialty_ids: number[];
  years_of_experience: number;
  
  // Consultation settings
  consultation_fee: number;
  follow_up_fee: number;
  consultation_duration: number;
}

// ==================== UPDATE DATA ====================
export interface DoctorUpdateData {
  qualifications?: string;
  specialty_ids?: number[];
  years_of_experience?: number;
  consultation_fee?: number;
  follow_up_fee?: number;
  consultation_duration?: number;
  is_available_online?: boolean;
  is_available_offline?: boolean;
  status?: 'active' | 'on_leave' | 'inactive';
  signature?: string;
  languages_spoken?: string;
}

// ==================== AVAILABILITY DATA ====================
export interface SetAvailabilityData {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments: number;
}

// ==================== API RESPONSE WRAPPERS ====================
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

// ==================== STATISTICS ====================
export interface DoctorStatistics {
  total_doctors: number;
  active_doctors: number;
  on_leave_doctors: number;
  inactive_doctors: number;
  doctors_by_specialty: {
    [specialty: string]: number;
  };
  average_experience: number;
  average_consultation_fee: number;
  total_consultations: number;
}