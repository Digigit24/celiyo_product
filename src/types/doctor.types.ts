// Doctor Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Specialty {
  id: number;
  name: string;
  code: string;
  description?: string;
  department?: string;
  is_active: boolean;
  doctors_count?: number;
}

export interface DoctorAvailability {
  id?: number;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  day_display: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments: number;
}

export interface Doctor {
  id: number;
  user: User;
  full_name: string;
  medical_license_number: string;
  license_issuing_authority?: string;
  license_issue_date?: string;
  license_expiry_date?: string;
  qualifications: string;
  specialties: Specialty[];
  years_of_experience: number;
  consultation_fee: string;
  follow_up_fee: string;
  consultation_duration: number;
  is_available_online: boolean;
  is_available_offline: boolean;
  average_rating: string;
  total_reviews: number;
  total_consultations: number;
  status: 'active' | 'on_leave' | 'inactive';
  is_license_valid: boolean;
  availability?: DoctorAvailability[];
}

export interface DoctorListParams {
  specialty?: string;
  status?: 'active' | 'on_leave' | 'inactive';
  available?: boolean;
  min_rating?: number;
  min_fee?: number;
  max_fee?: number;
  search?: string;
  page?: number;

  [key: string]: string | number | boolean | undefined;
}

export interface DoctorCreateData {
  create_user: boolean;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone: string;
  medical_license_number: string;
  license_issuing_authority: string;
  license_issue_date: string;
  license_expiry_date: string;
  qualifications: string;
  specialty_ids: number[];
  years_of_experience: number;
  consultation_fee: number;
  follow_up_fee: number;
  consultation_duration: number;
}

export interface DoctorUpdateData {
  qualifications?: string;
  specialty_ids?: number[];
  years_of_experience?: number;
  consultation_fee?: number;
  follow_up_fee?: number;
  consultation_duration?: number;
  status?: 'active' | 'on_leave' | 'inactive';
}

export interface SetAvailabilityData {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments: number;
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