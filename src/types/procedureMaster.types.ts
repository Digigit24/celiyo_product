// src/types/procedureMaster.types.ts

/**
 * Procedure Master Model Type Definitions
 * Matches: opd/models.py - ProcedureMaster Model
 * API Endpoint: /api/opd/procedure-masters/
 */

export type ProcedureCategory =
  | 'laboratory'
  | 'radiology'
  | 'cardiology'
  | 'pathology'
  | 'ultrasound'
  | 'ct_scan'
  | 'mri'
  | 'ecg'
  | 'xray'
  | 'other';

/**
 * Full Procedure Master object returned from API
 */
export interface ProcedureMaster {
  // Primary Fields
  id: number;
  name: string; // CharField(200)
  code: string; // CharField(50), unique
  category: ProcedureCategory;
  description: string; // TextField

  // Pricing
  default_charge: string; // DecimalField(10, 2)

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string; // DateTimeField - auto_now_add, ISO format
  updated_at: string; // DateTimeField - auto_now, ISO format
}

/**
 * Query parameters for listing/filtering procedure masters
 */
export interface ProcedureMasterListParams {
  page?: number;
  page_size?: number;
  category?: string;
  is_active?: boolean;
  search?: string;
  ordering?: string; // Default: ['category', 'name']
  [key: string]: string | number | boolean | undefined;
}

/**
 * Data required to create a new procedure master
 */
export interface ProcedureMasterCreateData {
  name: string;
  code: string;
  category: ProcedureCategory;
  description?: string;
  default_charge: string;
  is_active?: boolean;
}

/**
 * Data for updating an existing procedure master
 */
export interface ProcedureMasterUpdateData extends Partial<ProcedureMasterCreateData> {}

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
  success?: boolean;
  message?: string;
  data: T;
}
