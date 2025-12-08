// src/types/appointmentType.types.ts

export interface AppointmentType {
  id: number;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  duration_default: number;
  base_consultation_fee: string;
  is_active: boolean;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentTypeListParams {
  search?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface AppointmentTypeCreateData {
  name: string;
  code: string;
  description?: string;
  duration_default?: number;
  base_consultation_fee?: string | number;
  is_active?: boolean;
  color?: string;
}

export interface AppointmentTypeUpdateData {
  name?: string;
  code?: string;
  description?: string;
  duration_default?: number;
  base_consultation_fee?: string | number;
  is_active?: boolean;
  color?: string;
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
