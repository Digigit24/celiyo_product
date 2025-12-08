// src/types/visit.types.ts

export type VisitType = 'new' | 'follow_up' | 'emergency';

export type VisitStatus =
  | 'waiting'
  | 'called'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

/**
 * Patient details nested in visit
 */
export interface PatientDetails {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  blood_group: string;
  mobile: string;
}

/**
 * Doctor details nested in visit
 */
export interface DoctorDetails {
  id: number;
  full_name: string;
  specialties: string[];
  consultation_fee: string;
  follow_up_fee: string;
}

/**
 * Full Visit object returned from API
 */
export interface Visit {
  // Primary Fields
  id: number;
  visit_number: string;

  // Related Models (IDs)
  patient: number;
  doctor: number | null;
  appointment: number | null;
  referred_by: number | null;
  created_by: number | null;

  // Related Model Names (read-only)
  patient_name?: string;
  patient_id?: string;
  doctor_name?: string;
  referred_by_name?: string;
  created_by_name?: string;

  // Detailed Related Objects
  patient_details?: PatientDetails;
  doctor_details?: DoctorDetails;

  // Visit Information
  visit_date: string; // YYYY-MM-DD
  visit_type: VisitType;
  entry_time: string; // ISO format
  is_follow_up: boolean;

  // Queue Management
  status: VisitStatus;
  queue_position: number | null;

  // Consultation Timing
  consultation_start_time: string | null; // ISO format
  consultation_end_time: string | null; // ISO format

  // Payment Information
  payment_status: PaymentStatus;
  total_amount: string; // Decimal
  paid_amount: string; // Decimal
  balance_amount: string; // Decimal

  // Computed Fields
  waiting_time?: number | null; // in minutes
  has_opd_bill?: boolean;
  has_clinical_note?: boolean;

  // Timestamps
  created_at: string; // ISO format
  updated_at: string; // ISO format
}

/**
 * Query parameters for listing/filtering visits
 */
export interface VisitListParams {
  page?: number;
  page_size?: number;
  patient?: number;
  doctor?: number;
  status?: VisitStatus;
  payment_status?: PaymentStatus;
  visit_type?: VisitType;
  visit_date?: string; // YYYY-MM-DD
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Data required to create a new visit
 */
export interface VisitCreateData {
  patient: number;
  doctor?: number;
  appointment?: number;
  visit_type: VisitType;
  is_follow_up?: boolean;
  referred_by?: number;
  status?: VisitStatus;
  queue_position?: number;
}

/**
 * Data for updating an existing visit
 */
export interface VisitUpdateData extends Partial<VisitCreateData> {
  payment_status?: PaymentStatus;
  total_amount?: number;
  paid_amount?: number;
}

/**
 * Visit statistics response
 */
export interface VisitStatistics {
  total_visits: number;
  waiting: number;
  in_consultation: number;
  completed: number;
  cancelled: number;
  no_show: number;
  total_revenue: string; // Decimal
  pending_amount: string; // Decimal
}

/**
 * Queue status response
 */
export interface QueueStatus {
  waiting: Visit[];
  called: Visit[];
  in_consultation: Visit[];
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
