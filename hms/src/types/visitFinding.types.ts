// src/types/visitFinding.types.ts

/**
 * Visit Finding Model Type Definitions
 * Matches: opd/models.py - VisitFinding Model
 * API Endpoint: /api/opd/visit-findings/
 */

export type FindingType = 'examination' | 'systemic';

/**
 * Full Visit Finding object returned from API
 */
export interface VisitFinding {
  // Primary Fields
  id: number;
  visit: number; // ForeignKey
  finding_date: string; // DateTimeField - auto_now_add, ISO format
  finding_type: FindingType;

  // Related Model Names (read-only, from serializer)
  visit_number?: string;
  patient_name?: string;
  recorded_by_name?: string;

  // Computed Properties (from model @property)
  blood_pressure?: string; // Formatted as "systolic/diastolic"
  bmi_category?: string; // "Underweight" | "Normal" | "Overweight" | "Obese"

  // Vital Signs
  temperature: string | null; // DecimalField(4, 1), °F, range: 90.0-110.0
  pulse: number | null; // IntegerField, per minute, range: 30-300
  bp_systolic: number | null; // IntegerField, range: 50-300
  bp_diastolic: number | null; // IntegerField, range: 30-200
  weight: string | null; // DecimalField(5, 2), kg, range: 0.5-500.0
  height: string | null; // DecimalField(5, 2), cm, range: 30.0-300.0
  bmi: string | null; // DecimalField(5, 2), auto-calculated, read-only
  spo2: number | null; // IntegerField, %, range: 0-100
  respiratory_rate: number | null; // IntegerField, breaths per minute, range: 5-60

  // Systemic Examination
  tongue: string; // CharField(200)
  throat: string; // CharField(200)
  cns: string; // CharField(200) - Central Nervous System
  rs: string; // CharField(200) - Respiratory System
  cvs: string; // CharField(200) - Cardiovascular System
  pa: string; // CharField(200) - Per Abdomen

  // Audit Fields
  recorded_by: number | null;

  // Timestamps
  created_at: string; // DateTimeField - auto_now_add, ISO format
  updated_at: string; // DateTimeField - auto_now, ISO format
}

/**
 * Query parameters for listing/filtering visit findings
 */
export interface VisitFindingListParams {
  page?: number;
  page_size?: number;
  visit?: number;
  finding_type?: FindingType;
  finding_date?: string; // YYYY-MM-DD
  search?: string;
  ordering?: string; // Default: ['-finding_date']
  [key: string]: string | number | boolean | undefined;
}

/**
 * Data required to create a new visit finding
 */
export interface VisitFindingCreateData {
  visit: number;
  finding_type: FindingType;

  // Vital Signs (all optional)
  temperature?: string;
  pulse?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  weight?: string;
  height?: string;
  spo2?: number;
  respiratory_rate?: number;

  // Systemic Examination (all optional)
  tongue?: string;
  throat?: string;
  cns?: string;
  rs?: string;
  cvs?: string;
  pa?: string;
}

/**
 * Data for updating an existing visit finding
 */
export interface VisitFindingUpdateData extends Partial<Omit<VisitFindingCreateData, 'visit'>> {}

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
