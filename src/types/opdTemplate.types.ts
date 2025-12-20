// src/types/opdTemplate.types.ts

// ==================== TEMPLATE GROUP ====================
export interface TemplateGroup {
  id: number;
  tenant_id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateGroupPayload {
  name: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateTemplateGroupPayload {
  name?: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface TemplateGroupsQueryParams {
  show_inactive?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
}

export interface TemplateGroupsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TemplateGroup[];
}

// ==================== TEMPLATE ====================
export interface Template {
  id: number;
  tenant_id: string;
  name: string;
  code: string;
  group: number;
  group_name?: string;
  description: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  fields?: TemplateField[];
}

export interface CreateTemplatePayload {
  name: string;
  code: string;
  group: number;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateTemplatePayload {
  name?: string;
  code?: string;
  group?: number;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface TemplatesQueryParams {
  group?: number;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
}

export interface TemplatesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Template[];
}

// ==================== TEMPLATE FIELD ====================
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'image'
  | 'file'
  | 'json'
  | 'canvas'; // New field type for Excalidraw

export interface TemplateField {
  id: number;
  tenant_id: string;
  template: number;
  field_type: FieldType;
  field_label: string;
  field_name: string;
  field_key: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  default_value?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: TemplateFieldOption[];
}

export interface CreateTemplateFieldPayload {
  template: number;
  field_type: FieldType;
  field_label: string;
  field_name: string;
  field_key: string;
  placeholder?: string;
  help_text?: string;
  is_required?: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  default_value?: string;
  display_order?: number;
  is_active?: boolean;
  // Nested options for select/radio/multiselect/checkbox fields
  options?: Array<{
    option_label: string;
    option_value: string;
    display_order: number;
    is_active?: boolean;
    metadata?: Record<string, any>;
  }>;
}

export interface UpdateTemplateFieldPayload {
  field_type?: FieldType;
  field_label?: string;
  field_name?: string;
  field_key?: string;
  placeholder?: string;
  help_text?: string;
  is_required?: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  default_value?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface TemplateFieldsQueryParams {
  template?: number;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface TemplateFieldsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TemplateField[];
}

// ==================== TEMPLATE FIELD OPTION ====================
export interface TemplateFieldOption {
  id: number;
  tenant_id?: string;
  field?: number; // Field ID
  option_label: string;
  option_value: string;
  display_order: number;
  is_active?: boolean; // Optional since API may not return it
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTemplateFieldOptionPayload {
  field: number; // Field ID
  option_label: string;
  option_value: string;
  display_order?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateTemplateFieldOptionPayload {
  option_label?: string;
  option_value?: string;
  display_order?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface TemplateFieldOptionsQueryParams {
  field_id?: number; // Filter by field ID
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface TemplateFieldOptionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TemplateFieldOption[];
}

// ==================== TEMPLATE RESPONSE ====================
export type TemplateResponseStatus = 'draft' | 'completed' | 'reviewed';

export interface TemplateResponse {
  id: number;
  tenant_id?: string;
  
  // Generic Encounter Fields
  content_type?: number; // Optional, backend handles it
  object_id: number;
  encounter_type: 'visit' | 'admission'; // 'visit' or 'admission'
  encounter_display?: string; // Human readable string e.g. "OPD Visit: ..."

  // Deprecated but might still be present in older responses
  visit?: number;
  visit_number?: string;
  patient_name?: string;

  template: number;
  template_name?: string;
  status: TemplateResponseStatus;
  filled_by_id: string; // UUID
  filled_by_name?: string;
  reviewed_by_id: string | null; // UUID
  reviewed_at: string | null;
  completed_at?: string | null;
  response_date: string;
  created_at?: string;
  updated_at?: string;
  field_response_count?: number;
  field_responses?: TemplateFieldResponse[];

  // New fields for multiple doctor support and review workflow
  response_sequence: number;
  is_reviewed: boolean;
  doctor_switched_reason: string | null;
  original_assigned_doctor_id: number | null;
  canvas_data: any | null; // For full-template canvas images
}

export interface FieldResponsePayload {
  field: number;
  value_text?: string | null;
  value_number?: number | null;
  value_date?: string | null;
  value_datetime?: string | null;
  value_boolean?: boolean | null;
  selected_options?: number[];
  full_canvas_json?: any | null;
}

export interface CreateTemplateResponsePayload {
  encounter_type: 'visit' | 'admission';
  object_id: number;
  template: number;
  status?: TemplateResponseStatus;
  doctor_switched_reason?: string;
  field_responses?: FieldResponsePayload[];
}

export interface UpdateTemplateResponsePayload {
  status?: TemplateResponseStatus;
  is_reviewed?: boolean;
  completed_at?: string | null;
  canvas_data?: any | null;
  field_responses?: FieldResponsePayload[];
}

export interface TemplateResponsesQueryParams {
  encounter_type?: 'visit' | 'admission';
  object_id?: number;
  template?: number;
  status?: TemplateResponseStatus;
  filled_by?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface TemplateResponsesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TemplateResponse[];
}

// ==================== TEMPLATE FIELD RESPONSE ====================
export interface TemplateFieldResponse {
  id: number;
  tenant_id: string;
  response: number;
  field: number;
  field_name?: string; // Backend may include field_name for reference
  field_type?: FieldType;
  
  // Value fields (only one will be populated based on field_type)
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_datetime: string | null;
  value_boolean: boolean | null;
  
  // For select/radio/multiselect
  selected_options: number[]; // Array of TemplateFieldOption IDs
  selected_option_labels?: string[]; // Read-only, populated by backend
  
  // New canvas-related fields
  full_canvas_json: any | null; // Stores Excalidraw JSON
  canvas_thumbnail: string | null; // URL to a generated thumbnail
  canvas_version_history: any[]; // Tracks changes to the canvas JSON

  created_at: string;
  updated_at: string;
}

export interface CreateTemplateFieldResponsePayload {
  response: number;
  field: number;
  value_text?: string | null;
  value_number?: number | null;
  value_date?: string | null;
  value_datetime?: string | null;
  value_boolean?: boolean | null;
  selected_options?: number[];
  full_canvas_json?: any | null;
}

export interface UpdateTemplateFieldResponsePayload {
  value_text?: string | null;
  value_number?: number | null;
  value_date?: string | null;
  value_datetime?: string | null;
  value_boolean?: boolean | null;
  selected_options?: number[];
  full_canvas_json?: any | null;
}

export interface TemplateFieldResponsesQueryParams {
  response?: number;
  field?: number;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface TemplateFieldResponsesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TemplateFieldResponse[];
}

// ==================== RESPONSE TEMPLATE (for Copy-Paste) ====================
export interface ResponseTemplate {
  id: number;
  tenant_id: string;
  name: string;
  template: number; // The original template this was based on
  template_name?: string;
  created_by: number;
  created_by_name?: string;
  template_field_values: Record<string, any>; // JSON field holding field values
  usage_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateResponseTemplatePayload {
  name: string;
  template: number;
  template_field_values: Record<string, any>;
  is_public?: boolean;
}

export interface UpdateResponseTemplatePayload {
  name?: string;
  template_field_values?: Record<string, any>;
  is_public?: boolean;
}

export interface ResponseTemplatesQueryParams {
  template?: number;
  created_by?: number;
  is_public?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
}

export interface ResponseTemplatesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ResponseTemplate[];
}
