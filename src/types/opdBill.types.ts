// src/types/opdBill.types.ts

// Payment mode type
export type PaymentMode = 'cash' | 'card' | 'upi' | 'bank' | 'multiple';

// Payment status type
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// Bill type
export type BillType = 'hospital' | 'consultation' | 'procedure';

// OPD Bill Item interface
export interface OPDBillItem {
  id?: number;
  particular: string;
  particular_name?: string;
  quantity: number;
  unit_charge: string;
  discount_amount: string;
  total_amount: string;
  item_order?: number;
  note?: string;
}

// Main OPD Bill interface
export interface OPDBill {
  id: number;
  bill_number: string;
  bill_date: string;
  patient: number;
  patient_name?: string;
  patient_phone?: string;
  visit?: number;
  visit_number?: string;
  doctor: number;
  doctor_name?: string;
  bill_type: BillType;
  category?: string;
  items: OPDBillItem[];
  subtotal_amount: string;
  discount_amount: string;
  discount_percent: string;
  tax_amount: string;
  total_amount: string;
  received_amount: string;
  balance_amount: string;
  payment_status: PaymentStatus;
  payment_mode: PaymentMode;
  payment_details?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

// List parameters for fetching OPD bills
export interface OPDBillListParams {
  page?: number;
  page_size?: number;
  search?: string;
  payment_status?: PaymentStatus;
  bill_type?: BillType;
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
  bill_number?: string;
  bill_date: string;
  patient?: number;
  visit?: number;
  doctor: number;
  bill_type: BillType;
  category?: string;
  items: Array<{
    particular: string;
    particular_name?: string;
    quantity: number;
    unit_charge: string;
    discount_amount?: string;
    total_amount?: string;
    item_order?: number;
    note?: string;
  }>;
  subtotal_amount?: string;
  discount_amount?: string;
  discount_percent?: string;
  tax_amount?: string;
  total_amount?: string;
  received_amount?: string;
  balance_amount?: string;
  payment_status?: PaymentStatus;
  payment_mode?: PaymentMode;
  payment_details?: string;
  notes?: string;
}

// Update data for existing OPD bill
export interface OPDBillUpdateData extends Partial<OPDBillCreateData> {
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

// Statistics/Summary types
export interface OPDBillStatistics {
  total_bills: number;
  total_amount: string;
  received_amount: string;
  balance_amount: string;
  paid_bills: number;
  unpaid_bills: number;
  partial_bills: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
