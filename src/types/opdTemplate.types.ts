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
  | 'json';

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
export type TemplateResponseStatus = 'draft' | 'completed';

export interface TemplateResponse {
  id: number;
  tenant_id: string;
  visit: number;
  template: number;
  template_name?: string;
  status: TemplateResponseStatus;
  filled_by: string; // UUID
  filled_by_name?: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  field_responses?: TemplateFieldResponse[];
}

export interface FieldResponsePayload {
  field: number;
  value_text?: string | null;
  value_number?: number | null;
  value_date?: string | null;
  value_datetime?: string | null;
  value_boolean?: boolean | null;
  selected_options?: number[];
}

export interface CreateTemplateResponsePayload {
  template: number;
  status?: TemplateResponseStatus;
  field_responses?: FieldResponsePayload[];
}

export interface UpdateTemplateResponsePayload {
  status?: TemplateResponseStatus;
  completed_at?: string | null;
  field_responses?: FieldResponsePayload[];
}

export interface TemplateResponsesQueryParams {
  visit?: number;
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
}

export interface UpdateTemplateFieldResponsePayload {
  value_text?: string | null;
  value_number?: number | null;
  value_date?: string | null;
  value_datetime?: string | null;
  value_boolean?: boolean | null;
  selected_options?: number[];
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
