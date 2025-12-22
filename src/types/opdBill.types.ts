// src/types/opdBill.types.ts

// Payment mode type
export type PaymentMode = 'cash' | 'card' | 'upi' | 'bank' | 'multiple';

// Payment status type
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// OPD Type (replaces BillType)
export type OPDType = 'consultation' | 'follow_up' | 'emergency';

// Charge Type
export type ChargeType = 'first_visit' | 'revisit' | 'emergency';

// Bill Item Source Type
export type BillItemSource =
  | 'Consultation'
  | 'Pharmacy'
  | 'Lab'
  | 'Radiology'
  | 'Procedure'
  | 'Package'
  | 'Therapy'
  | 'Other';

// OPD Bill Item interface - matches backend OPDBillItem model
export interface OPDBillItem {
  id?: number;
  tenant_id?: string;
  bill?: number;
  item_name: string;
  source: BillItemSource;
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

// Main OPD Bill interface - matches backend OPDBill model
export interface OPDBill {
  id: number;
  tenant_id?: string;
  visit: number;
  bill_number: string;
  bill_date: string;
  doctor: number;
  opd_type: OPDType;
  opd_subtype?: string;
  charge_type: ChargeType;
  diagnosis?: string;
  remarks?: string;
  total_amount: string;
  discount_percent: string;
  discount_amount: string;
  payable_amount: string;
  payment_mode: PaymentMode;
  payment_details?: Record<string, any> | string;
  received_amount: string;
  balance_amount: string;
  payment_status: PaymentStatus;
  billed_by_id?: string;
  items: OPDBillItem[];
  created_at: string;
  updated_at: string;
}

// List parameters for fetching OPD bills
export interface OPDBillListParams {
  page?: number;
  page_size?: number;
  search?: string;
  payment_status?: PaymentStatus;
  opd_type?: OPDType;
  charge_type?: ChargeType;
  bill_date?: string;
  bill_date_from?: string;
  bill_date_to?: string;
  patient?: number;
  visit?: number;
  doctor?: number;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

// Create data for new OPD bill
export interface OPDBillCreateData {
  visit: number;
  doctor: number;
  opd_type: OPDType;
  opd_subtype?: string;
  charge_type: ChargeType;
  diagnosis?: string;
  remarks?: string;
  discount_percent?: string;
  discount_amount?: string;
  payment_mode?: PaymentMode;
  payment_details?: Record<string, any> | string;
  received_amount?: string;
  bill_date?: string;
}

// Create data for new OPD bill item
export interface OPDBillItemCreateData {
  bill: number;
  item_name: string;
  source: BillItemSource;
  quantity: number;
  unit_price: string;
  system_calculated_price?: string;
  notes?: string;
  origin_content_type?: number;
  origin_object_id?: number;
}

// Update data for existing OPD bill
export interface OPDBillUpdateData extends Partial<OPDBillCreateData> {
  // All fields from create are optional for update
}

// Update data for existing OPD bill item
export interface OPDBillItemUpdateData extends Partial<OPDBillItemCreateData> {
  // All fields from create are optional for update
}

// Payment record data
export interface PaymentRecordData {
  amount: string;
  payment_mode: PaymentMode;
  payment_details?: Record<string, any> | string;
  notes?: string;
}

// Print response
export interface OPDBillPrintResponse {
  success: boolean;
  pdf_url: string;
  message?: string;
}

// Statistics/Summary types - Matching actual API response
export interface OPDBillStatistics {
  total_bills: number;
  total_revenue: string;
  paid_revenue: string;
  pending_amount: string;
  total_discount: string;
  bills_paid: number;
  bills_partial: number;
  bills_unpaid: number;
  by_opd_type: Array<{
    opd_type: OPDType;
    count: number;
    revenue: number;
  }>;
  by_payment_mode: Array<{
    payment_mode: PaymentMode;
    count: number;
    amount: number;
  }>;
  average_bill_amount: string;
}

// Sync clinical charges response
export interface SyncClinicalChargesResponse {
  success: boolean;
  message: string;
  created_items: number;
  bill_id: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
