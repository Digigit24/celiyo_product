// src/types/diagnostics.types.ts

export type InvestigationCategory =
  | 'laboratory'
  | 'radiology'
  | 'pathology'
  | 'cardiology'
  | 'ultrasound'
  | 'ct_scan'
  | 'mri'
  | 'xray'
  | 'other';

export type RequisitionStatus = 'ordered' | 'sample_collected' | 'completed' | 'cancelled';

export type RequisitionPriority = 'routine' | 'urgent' | 'stat';

export type RequisitionType = 'investigation' | 'medicine' | 'procedure' | 'package';

export type ClinicalOrderType = 'diagnostic' | 'medicine' | 'procedure' | 'package';

export interface UnbilledOrderSummary {
  type: ClinicalOrderType | 'investigation';
  id: number;
  name: string;
  quantity?: number;
  price: string;
  total?: string;
  status: string;
  category?: string;
}

export interface UnbilledRequisitionSummary {
  requisition_id: number;
  requisition_number: string;
  requisition_type: RequisitionType;
  status: RequisitionStatus;
  order_date: string;
  priority?: RequisitionPriority;
  unbilled_orders: UnbilledOrderSummary[];
}

export interface UnbilledRequisitionsResponse {
  success?: boolean;
  visit_id: number;
  visit_number: string;
  total_unbilled_items: number;
  estimated_amount: number;
  requisitions: UnbilledRequisitionSummary[];
}

export type DiagnosticOrderStatus = 'pending' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';

export type EncounterType = 'opd.visit' | 'ipd.admission';

export type Gender = 'Male' | 'Female' | 'Any';

export interface Investigation {
  id: number;
  tenant_id: string;
  name: string;
  code: string;
  category: InvestigationCategory;
  base_charge: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestigationRange {
  id: number;
  tenant_id: string;
  investigation: number;
  gender: Gender;
  min_age: number;
  max_age: number;
  min_value: string | null;
  max_value: string | null;
  unit: string;
  text_reference: string;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticOrder {
  id: number;
  tenant_id: string;
  requisition: number;
  investigation: number;
  investigation_name: string;
  status: DiagnosticOrderStatus;
  sample_id: string;
  price: string;
  created_at: string;
  updated_at: string;
}

export interface MedicineOrder {
  id: number;
  tenant_id: string;
  requisition: number;
  product: number;
  product_name: string;
  quantity: number;
  price: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProcedureOrder {
  id: number;
  tenant_id: string;
  requisition: number;
  procedure: number;
  procedure_name: string;
  quantity: number;
  price: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PackageOrder {
  id: number;
  tenant_id: string;
  requisition: number;
  package: number;
  package_name: string;
  quantity: number;
  price: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Requisition {
  id: number;
  tenant_id: string;
  requisition_number: string;
  patient: number;
  patient_name: string;
  requesting_doctor_id: string;
  requisition_type: RequisitionType;
  status: RequisitionStatus;
  priority: RequisitionPriority;
  order_date: string;
  clinical_notes: string;
  billing_target: string | null;
  // Type-specific order arrays
  investigation_orders: DiagnosticOrder[];
  medicine_orders: MedicineOrder[];
  procedure_orders: ProcedureOrder[];
  package_orders: PackageOrder[];
  // EncounterMixin fields
  content_type: number;
  object_id: number;
  encounter_display: string;
  created_at: string;
  updated_at: string;
}

export interface LabReport {
  id: number;
  tenant_id: string;
  diagnostic_order: number;
  result_data: Record<string, any>;
  attachment: string | null;
  technician_id: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Create/Update DTOs
export interface CreateInvestigationPayload {
  name: string;
  code: string;
  category: InvestigationCategory;
  base_charge: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateInvestigationPayload extends Partial<CreateInvestigationPayload> {}

export interface CreateRequisitionPayload {
  patient: number;
  requesting_doctor_id: string;
  requisition_type: RequisitionType;
  status?: RequisitionStatus;
  priority?: RequisitionPriority;
  clinical_notes?: string;
  encounter_type?: EncounterType;
  encounter_id?: number;
  investigation_ids?: number[];
  content_type?: number;
  object_id?: number;
}

export interface UpdateRequisitionPayload extends Partial<CreateRequisitionPayload> {}

export interface AddMedicineToRequisitionPayload {
  product_id: number;
  quantity: number;
  price?: string;
}

export interface AddProcedureToRequisitionPayload {
  procedure_id: number;
  quantity: number;
  price?: string;
}

export interface AddPackageToRequisitionPayload {
  package_id: number;
  quantity: number;
  price?: string;
}

export interface CreateDiagnosticOrderPayload {
  requisition: number;
  investigation: number;
  status?: DiagnosticOrderStatus;
  sample_id?: string;
  price?: string;
}

export interface UpdateDiagnosticOrderPayload extends Partial<CreateDiagnosticOrderPayload> {}

export interface CreateLabReportPayload {
  diagnostic_order: number;
  result_data?: Record<string, any>;
  attachment?: File | null;
  technician_id?: string;
  verified_by?: string;
  verified_at?: string;
}

export interface UpdateLabReportPayload extends Partial<CreateLabReportPayload> {}

export interface CreateInvestigationRangePayload {
  investigation: number;
  gender?: Gender;
  min_age?: number;
  max_age?: number;
  min_value?: string;
  max_value?: string;
  unit?: string;
  text_reference?: string;
}

export interface UpdateInvestigationRangePayload extends Partial<CreateInvestigationRangePayload> {}

// API Response types
export interface PaginatedInvestigationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Investigation[];
}

export interface PaginatedRequisitionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Requisition[];
}

export interface PaginatedDiagnosticOrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DiagnosticOrder[];
}

export interface PaginatedLabReportsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LabReport[];
}

export interface PaginatedInvestigationRangesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: InvestigationRange[];
}
