// src/types/procedureBill.types.ts

export type BillType = 'hospital';

export type PaymentMode = 'cash' | 'card' | 'upi' | 'bank' | 'multiple';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface ProcedureBillItem {
  id?: number;
  procedure: number;
  particular_name?: string;
  note?: string;
  quantity: number;
  unit_charge: string;
  item_order?: number;
}

export interface ProcedureBill {
  id: number;
  bill_number: string;
  bill_date: string;
  visit?: number;
  patient?: number;
  patient_name?: string;
  patient_phone?: string;
  doctor: number;
  doctor_name?: string;
  bill_type: BillType;
  category?: string;
  items: ProcedureBillItem[];
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
  created_at: string;
  updated_at: string;
}

export interface ProcedureBillListParams {
  page?: number;
  page_size?: number;
  payment_status?: PaymentStatus;
  search?: string;
  bill_date?: string;
  visit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface ProcedureBillCreateData {
  visit?: number;
  doctor: number;
  bill_type: BillType;
  category?: string;
  discount_percent?: string;
  payment_mode?: PaymentMode;
  payment_details?: string;
  received_amount?: string;
  items: Array<{
    procedure: number;
    particular_name?: string;
    note?: string;
    quantity: number;
    unit_charge: string;
    item_order?: number;
  }>;
}

export interface ProcedureBillUpdateData extends Partial<ProcedureBillCreateData> {}

export interface PaymentRecordData {
  amount: string;
  payment_mode: PaymentMode;
  payment_details?: Record<string, any>;
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

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}
