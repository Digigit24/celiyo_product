// src/types/opdVisit.types.ts
// OPD Visit Types - Matches Django backend fields

import { Patient } from './patient.types';
import { Doctor } from './doctor.types';

// ==================== ENUMS & CONSTANTS ====================
export type VisitStatus = 'waiting' | 'in_consultation' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type VisitType = 'new' | 'follow_up' | 'emergency' | 'referral';
export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'refunded';
export type VisitPriority = 'low' | 'normal' | 'high' | 'urgent';

// ==================== PATIENT & DOCTOR DETAILS ====================
export interface PatientDetails {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  blood_group: string;
  mobile_primary: string;
}

export interface DoctorDetails {
  id: number;
  full_name: string;
  specialties: Array<{ id: number; name: string }>;
  consultation_fee: string;
  follow_up_fee: string;
}

// ==================== MAIN OPD VISIT INTERFACE ====================
export interface OpdVisit {
  id: number;
  visit_number: string; // Unique visit ID like OPD2025XXXX

  // Patient & Doctor (IDs)
  patient: number;
  doctor: number;

  // Patient & Doctor (Nested Objects from API)
  patient_details?: PatientDetails;
  doctor_details?: DoctorDetails;

  // Patient & Doctor (Flat fields - fallback when nested objects not provided)
  patient_name?: string;
  patient_id?: string;
  doctor_name?: string;

  // Visit Details
  visit_date: string;
  visit_time: string;
  visit_type: VisitType;
  status: VisitStatus;
  priority: VisitPriority;

  // Queue Management
  queue_number: number | null;
  called_at: string | null;
  started_at: string | null;
  completed_at: string | null;

  // Clinical Information
  chief_complaint: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  prescription: string | null;
  notes: string | null;

  // Vitals (optional, can be added during visit)
  temperature: string | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  blood_pressure: string | null; // Computed "120/80"
  heart_rate: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: string | null;
  weight: string | null;
  height: string | null;
  bmi: string | null;

  // Follow-up
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_notes: string | null;

  // Referrals
  referred_to: string | null;
  referral_reason: string | null;

  // Billing
  consultation_fee: string;
  additional_charges: string;
  total_amount: string;
  payment_status: PaymentStatus;
  payment_method: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: number | null;
}

// ==================== LIST PARAMETERS ====================
export interface OpdVisitListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: VisitStatus;
  visit_type?: VisitType;
  priority?: VisitPriority;
  payment_status?: PaymentStatus;
  doctor_id?: number;
  patient_id?: number;
  visit_date?: string;
  date_from?: string;
  date_to?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

// ==================== CREATE DATA ====================
export interface OpdVisitCreateData {
  // Required - backend expects 'patient' and 'doctor' not 'patient_id' and 'doctor_id'
  patient: number;
  doctor: number;
  visit_date: string;
  visit_time: string;
  visit_type: VisitType;

  // Optional
  priority?: VisitPriority;
  chief_complaint?: string;
  symptoms?: string;
  notes?: string;

  // Vitals (optional)
  temperature?: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: string;
  weight?: string;
  height?: string;

  // Billing
  consultation_fee?: number;
  additional_charges?: number;

  // Follow-up
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
}

// ==================== UPDATE DATA ====================
export interface OpdVisitUpdateData {
  // Visit Details
  visit_date?: string;
  visit_time?: string;
  visit_type?: VisitType;
  status?: VisitStatus;
  priority?: VisitPriority;

  // Clinical Information
  chief_complaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescription?: string;
  notes?: string;

  // Vitals
  temperature?: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: string;
  weight?: string;
  height?: string;

  // Follow-up
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;

  // Referrals
  referred_to?: string;
  referral_reason?: string;

  // Billing
  consultation_fee?: number;
  additional_charges?: number;
  payment_status?: PaymentStatus;
  payment_method?: string;
}

// ==================== COMPLETE VISIT DATA ====================
export interface CompleteVisitData {
  diagnosis: string;
  treatment_plan?: string;
  prescription?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  notes?: string;
}

// ==================== STATISTICS ====================
export interface OpdVisitStatistics {
  total_visits: number;
  today_visits: number;
  waiting_patients: number;
  in_progress_patients: number;
  completed_today: number;
  average_waiting_time: string;
  visits_by_type: {
    new: number;
    follow_up: number;
    emergency: number;
    referral: number;
  };
  visits_by_status: {
    waiting: number;
    in_consultation: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    no_show: number;
  };
  revenue_today: string;
  pending_payments: number;
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

// ==================== QUEUE ITEM ====================
export interface QueueItem {
  id: number;
  visit_number: string;
  patient_name: string;
  queue_number: number;
  wait_time: string;
  priority: VisitPriority;
}
