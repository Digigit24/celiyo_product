// src/types/appointment.types.ts

import type { AppointmentType } from './appointmentType.types';

export interface Doctor {
  id: number;
  full_name: string;
  specialties: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  consultation_fee: string;
}

export interface Patient {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
}

export interface Appointment {
  id: number;
  appointment_id: string;
  appointment_number: string; // Alias for appointment_id for backward compatibility
  doctor: Doctor;
  patient: Patient;
  appointment_date: string;
  appointment_time: string;
  end_time?: string;
  duration_minutes: number;
  appointment_type?: AppointmentType;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  chief_complaint?: string;
  symptoms?: string;
  notes?: string;
  is_follow_up: boolean;
  original_appointment?: number;
  consultation_fee: string;
  visit?: number;
  check_in_time?: string;
  checked_in_at?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  waiting_time_minutes?: number;
  cancelled_at?: string;
  cancelled_by_id?: string;
  cancellation_reason?: string;
  approved_by_id?: string;
  approved_at?: string;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentListParams {
  doctor_id?: number;
  patient_id?: number;
  date_from?: string;
  date_to?: string;
  appointment_date?: string;
  appointment_type_id?: number;
  status?: string; // Comma-separated status values
  priority?: string; // Comma-separated priority values
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface AppointmentCreateData {
  doctor_id: number;
  patient_id: number;
  appointment_date: string;
  appointment_time: string;
  end_time?: string;
  duration_minutes?: number;
  appointment_type_id?: number;
  status?: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  chief_complaint?: string;
  symptoms?: string;
  notes?: string;
  is_follow_up?: boolean;
  original_appointment_id?: number;
  consultation_fee?: number | string;
}

export interface AppointmentUpdateData {
  patient_id?: number;
  doctor_id?: number;
  appointment_date?: string;
  appointment_time?: string;
  end_time?: string;
  duration_minutes?: number;
  appointment_type_id?: number;
  status?: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  chief_complaint?: string;
  symptoms?: string;
  notes?: string;
  is_follow_up?: boolean;
  original_appointment_id?: number;
  consultation_fee?: number | string;
  cancellation_reason?: string;
}

export interface AppointmentCancelData {
  cancellation_reason: string;
}

export interface AppointmentRescheduleData {
  new_appointment_date: string;
  new_appointment_time: string;
  reason?: string;
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
