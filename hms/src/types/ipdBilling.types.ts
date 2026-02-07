// src/types/ipdBilling.types.ts

// Payment mode type for IPD (includes more options than OPD)
export type IPDPaymentMode = 'cash' | 'card' | 'upi' | 'netbanking' | 'insurance' | 'cheque' | 'other';

// Payment status type
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// Bill Item Source Type for IPD
export type IPDBillItemSource =
  | 'Bed'
  | 'Pharmacy'
  | 'Lab'
  | 'Radiology'
  | 'Consultation'
  | 'Procedure'
  | 'Surgery'
  | 'Therapy'
  | 'Package'
  | 'Other';

// IPD Bill Item interface - matches backend IPDBillItem model
export interface IPDBillItem {
  id?: number;
  tenant_id?: string;
  bill?: number;
  item_name: string;
  source: IPDBillItemSource;
  quantity: number;
  system_calculated_price: string;
  unit_price: string;
  total_price: string;
  is_price_overridden?: boolean;
  origin_content_type?: number;
  origin_object_id?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Main IPD Billing interface - matches backend IPDBilling model
export interface IPDBilling {
  id: number;
  tenant_id?: string;
  admission: number;
  admission_number?: string;  // Read-only from backend
  patient_name?: string;      // Read-only from backend
  bill_number: string;
  bill_date: string;
  doctor_id?: string;
  diagnosis?: string;
  remarks?: string;
  total_amount: string;
  discount_percent: string;
  discount_amount: string;
  payable_amount: string;
  payment_mode: IPDPaymentMode;
  payment_details?: Record<string, any>;
  received_amount: string;
  balance_amount: string;
  payment_status: PaymentStatus;
  billed_by_id?: string;
  items: IPDBillItem[];
  created_at: string;
  updated_at: string;
}

// List parameters for fetching IPD bills
export interface IPDBillingListParams {
  page?: number;
  page_size?: number;
  search?: string;
  payment_status?: PaymentStatus;
  admission?: number;
  patient?: number;
  doctor_id?: string;
  bill_date?: string;
  bill_date_from?: string;
  bill_date_to?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

// Create data for new IPD bill
export interface IPDBillingCreateData {
  admission: number;
  doctor_id?: string;
  diagnosis?: string;
  remarks?: string;
  discount_percent?: string;
  discount_amount?: string;
  payment_mode?: IPDPaymentMode;
  payment_details?: Record<string, any>;
  received_amount?: string;
  bill_date?: string;
}

// Create data for new IPD bill item
export interface IPDBillItemCreateData {
  bill: number;
  item_name: string;
  source: IPDBillItemSource;
  quantity: number;
  unit_price: string;
  system_calculated_price?: string;
  notes?: string;
  origin_content_type?: number;
  origin_object_id?: number;
}

// Update data for existing IPD bill
export interface IPDBillingUpdateData extends Partial<IPDBillingCreateData> {
  // All fields from create are optional for update
}

// Update data for existing IPD bill item
export interface IPDBillItemUpdateData {
  quantity?: number;
  unit_price?: string;
  is_price_overridden?: boolean;
  notes?: string;
}

// Payment record data
export interface IPDPaymentRecordData {
  amount: string;
  payment_mode: IPDPaymentMode;
  payment_details?: Record<string, any>;
  notes?: string;
}

// Sync clinical charges response
export interface SyncClinicalChargesResponse {
  success: boolean;
  message: string;
  created_items: number;
  updated_orders: number;
  bill_id: number;
}

// Unbilled requisitions response
export interface UnbilledRequisition {
  requisition_id: number;
  requisition_number: string;
  requisition_type: 'investigation' | 'medicine' | 'procedure' | 'package';
  status: string;
  unbilled_orders: Array<{
    type: string;
    id: number;
    name: string;
    category?: string;
    price: string;
  }>;
}

export interface UnbilledRequisitionsResponse {
  success: boolean;
  admission_id: number;
  admission_number: string;
  total_unbilled_items: number;
  estimated_amount: number;
  requisitions: UnbilledRequisition[];
}

// Paginated response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Admission interface (minimal, for reference)
export interface Admission {
  id: number;
  admission_id: string;
  patient: number;
  patient_name?: string;
  doctor_id?: string;
  doctor_name?: string;
  ward?: number;
  bed?: number;
  admission_date: string;
  discharge_date?: string;
  status: 'admitted' | 'discharged' | 'transferred' | 'absconded' | 'referred' | 'death';
  reason?: string;
  provisional_diagnosis?: string;
  final_diagnosis?: string;
}
