// src/types/specialty.types.ts

export interface Specialty {
  id: number;
  name: string;
  code: string;
  description: string | null;
  department: string | null;
  is_active: boolean;
  doctors_count: number;
  created_at: string;
  updated_at: string;
}

// Filter parameters for specialty list
export interface SpecialtyListParams {
  is_active?: boolean;
  department?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface SpecialtyCreateData {
  name: string;
  code: string;
  description?: string;
  department?: string;
  is_active?: boolean;
}

export interface SpecialtyUpdateData {
  name?: string;
  code?: string;
  description?: string;
  department?: string;
  is_active?: boolean;
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
