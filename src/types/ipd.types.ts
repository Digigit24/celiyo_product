// src/types/ipd.types.ts

export type WardType =
  | 'general'
  | 'icu'
  | 'private'
  | 'semi_private'
  | 'deluxe'
  | 'nicu'
  | 'picu'
  | 'emergency'
  | 'maternity'
  | 'pediatric'
  | 'surgical'
  | 'other';

export type BedType =
  | 'general'
  | 'icu'
  | 'ventilator'
  | 'private'
  | 'semi_private'
  | 'deluxe'
  | 'cabin'
  | 'other';

export type BedStatus =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'reserved'
  | 'cleaning';

export type AdmissionStatus =
  | 'admitted'
  | 'discharged'
  | 'transferred'
  | 'absconded'
  | 'referred'
  | 'death';

export type BillingStatus =
  | 'pending'
  | 'partial'
  | 'paid'
  | 'cancelled';

export type BillItemSource =
  | 'Bed'
  | 'Pharmacy'
  | 'Lab'
  | 'Radiology'
  | 'Consultation'
  | 'Procedure'
  | 'Surgery'
  | 'Other';

// ============================================
// Ward
// ============================================
export interface Ward {
  id: number;
  tenant_id: string;
  name: string;
  type: WardType;
  floor: string;
  total_beds: number;
  description: string;
  is_active: boolean;
  available_beds_count?: number;
  occupied_beds_count?: number;
  created_at: string;
  updated_at: string;
}

export interface WardFormData {
  name: string;
  type: WardType;
  floor: string;
  total_beds: number;
  description?: string;
  is_active?: boolean;
}

// ============================================
// Bed
// ============================================
export interface Bed {
  id: number;
  tenant_id: string;
  ward: number;
  ward_name?: string;
  bed_number: string;
  bed_type: BedType;
  daily_charge: string;
  is_occupied: boolean;
  status: BedStatus;
  is_active: boolean;
  has_oxygen: boolean;
  has_ventilator: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface BedFormData {
  ward: number;
  bed_number: string;
  bed_type: BedType;
  daily_charge: string;
  status?: BedStatus;
  is_active?: boolean;
  has_oxygen?: boolean;
  has_ventilator?: boolean;
  description?: string;
}

export interface BedListItem {
  id: number;
  ward: number;
  ward_name: string;
  bed_number: string;
  bed_type: BedType;
  daily_charge: string;
  is_occupied: boolean;
  status: BedStatus;
}

// ============================================
// Admission
// ============================================
export interface Admission {
  id: number;
  tenant_id: string;
  admission_id: string;
  patient: number;
  patient_name?: string;
  doctor_id: string;
  ward: number;
  ward_name?: string;
  bed: number | null;
  bed_number?: string;
  admission_date: string;
  reason: string;
  provisional_diagnosis: string;
  final_diagnosis: string;
  discharge_date: string | null;
  discharge_summary: string;
  discharge_type: string;
  status: AdmissionStatus;
  length_of_stay?: number;
  created_by_user_id: string | null;
  discharged_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdmissionFormData {
  patient: number;
  doctor_id: string;
  ward: number;
  bed?: number | null;
  admission_date?: string;
  reason: string;
  provisional_diagnosis?: string;
  final_diagnosis?: string;
}

export interface AdmissionListItem {
  id: number;
  admission_id: string;
  patient: number;
  patient_name: string;
  doctor_id: string;
  ward_name: string;
  bed_number: string;
  admission_date: string;
  status: AdmissionStatus;
}

export interface DischargeData {
  discharge_type: string;
  discharge_summary: string;
}

// ============================================
// Bed Transfer
// ============================================
export interface BedTransfer {
  id: number;
  tenant_id: string;
  admission: number;
  admission_id?: string;
  from_bed: number;
  from_bed_info?: string;
  to_bed: number;
  to_bed_info?: string;
  transfer_date: string;
  reason: string;
  performed_by_user_id: string | null;
  created_at: string;
}

export interface BedTransferFormData {
  admission: number;
  from_bed: number;
  to_bed: number;
  transfer_date?: string;
  reason: string;
}

// ============================================
// IPD Billing
// ============================================
export interface IPDBillItem {
  id: number;
  tenant_id: string;
  billing: number;
  item_name: string;
  source: BillItemSource;
  quantity: number;
  unit_price: string;
  total_price: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface IPDBillItemFormData {
  billing: number;
  item_name: string;
  source: BillItemSource;
  quantity: number;
  unit_price: string;
  notes?: string;
}

export interface IPDBilling {
  id: number;
  tenant_id: string;
  admission: number;
  admission_id?: string;
  patient_name?: string;
  bill_number: string;
  bill_date: string;
  total_amount: string;
  discount: string;
  tax: string;
  paid_amount: string;
  balance_amount: string;
  status: BillingStatus;
  items?: IPDBillItem[];
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IPDBillingFormData {
  admission: number;
  discount?: string;
  tax?: string;
}

export interface IPDBillingListItem {
  id: number;
  bill_number: string;
  admission_id: string;
  patient_name: string;
  bill_date: string;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  status: BillingStatus;
}

export interface PaymentData {
  amount: string;
}

// ============================================
// Filter Types
// ============================================
export interface WardFilters {
  type?: WardType;
  is_active?: boolean;
  floor?: string;
  search?: string;
}

export interface BedFilters {
  ward?: number;
  bed_type?: BedType;
  is_occupied?: boolean;
  status?: BedStatus;
  is_active?: boolean;
  search?: string;
}

export interface AdmissionFilters {
  status?: AdmissionStatus;
  ward?: number;
  doctor_id?: string;
  patient?: number;
  search?: string;
}

export interface BillingFilters {
  status?: BillingStatus;
  admission?: number;
  search?: string;
}

// ============================================
// Label Mappings
// ============================================
export const WARD_TYPE_LABELS: Record<WardType, string> = {
  general: 'General Ward',
  icu: 'ICU',
  private: 'Private',
  semi_private: 'Semi-Private',
  deluxe: 'Deluxe',
  nicu: 'NICU',
  picu: 'PICU',
  emergency: 'Emergency',
  maternity: 'Maternity',
  pediatric: 'Pediatric',
  surgical: 'Surgical',
  other: 'Other',
};

export const BED_TYPE_LABELS: Record<BedType, string> = {
  general: 'General Bed',
  icu: 'ICU Bed',
  ventilator: 'Ventilator Bed',
  private: 'Private Bed',
  semi_private: 'Semi-Private Bed',
  deluxe: 'Deluxe Bed',
  cabin: 'Cabin',
  other: 'Other',
};

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  maintenance: 'Under Maintenance',
  reserved: 'Reserved',
  cleaning: 'Cleaning',
};

export const ADMISSION_STATUS_LABELS: Record<AdmissionStatus, string> = {
  admitted: 'Admitted',
  discharged: 'Discharged',
  transferred: 'Transferred',
  absconded: 'Absconded',
  referred: 'Referred',
  death: 'Death',
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  pending: 'Pending',
  partial: 'Partially Paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const BILL_ITEM_SOURCE_LABELS: Record<BillItemSource, string> = {
  Bed: 'Bed Charges',
  Pharmacy: 'Pharmacy',
  Lab: 'Laboratory',
  Radiology: 'Radiology',
  Consultation: 'Consultation',
  Procedure: 'Procedure',
  Surgery: 'Surgery',
  Other: 'Other',
};
