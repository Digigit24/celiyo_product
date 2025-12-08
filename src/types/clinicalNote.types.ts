// src/types/clinicalNote.types.ts

/**
 * Clinical Note Model Type Definitions
 * Matches: opd/models.py - ClinicalNote Model
 * API Endpoint: /api/opd/clinical-notes/
 */

/**
 * Full Clinical Note object returned from API
 */
export interface ClinicalNote {
  // Primary Fields
  id: number;
  visit: number; // OneToOneField
  ehr_number: string; // CharField(50), Electronic Health Record ID
  note_date: string; // DateTimeField - auto_now_add, ISO format

  // Related Model Names (read-only, from serializer)
  visit_number?: string;
  patient_name?: string;
  referred_doctor_name?: string;
  created_by_name?: string;

  // Clinical Information
  present_complaints: string; // TextField - Patient's presenting complaints
  observation: string; // TextField - Doctor's observations
  diagnosis: string; // TextField - Clinical diagnosis
  investigation: string; // TextField - Investigations ordered
  treatment_plan: string; // TextField - Recommended treatment
  medicines_prescribed: any; // JSONField - List of prescribed medicines (can be array or object)
  doctor_advice: string; // TextField - Doctor's advice to patient

  // Surgery/Referral
  suggested_surgery_name: string; // CharField(200)
  suggested_surgery_reason: string; // TextField
  referred_doctor: number | null; // ForeignKey to DoctorProfile

  // Follow-up
  next_followup_date: string | null; // DateField, format: YYYY-MM-DD

  // Audit Fields
  created_by: number | null;

  // Timestamps
  created_at: string; // DateTimeField - auto_now_add, ISO format
  updated_at: string; // DateTimeField - auto_now, ISO format
}

/**
 * Query parameters for listing/filtering clinical notes
 */
export interface ClinicalNoteListParams {
  page?: number;
  page_size?: number;
  visit?: number;
  note_date?: string; // YYYY-MM-DD
  search?: string;
  ordering?: string; // Default: ['-note_date']
  [key: string]: string | number | boolean | undefined;
}

/**
 * Data required to create a new clinical note
 */
export interface ClinicalNoteCreateData {
  visit: number;
  ehr_number?: string;
  present_complaints?: string;
  observation?: string;
  diagnosis?: string;
  investigation?: string;
  treatment_plan?: string;
  medicines_prescribed?: any; // Array or object
  doctor_advice?: string;
  suggested_surgery_name?: string;
  suggested_surgery_reason?: string;
  referred_doctor?: number;
  next_followup_date?: string; // YYYY-MM-DD
}

/**
 * Data for updating an existing clinical note
 */
export interface ClinicalNoteUpdateData extends Partial<ClinicalNoteCreateData> {
  // All fields from create are optional for update
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
