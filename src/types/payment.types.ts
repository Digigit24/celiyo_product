// Payment Types

// ==================== ENUMS ====================

export type CategoryType = 'income' | 'expense' | 'refund' | 'adjustment';

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'upi'
  | 'net_banking'
  | 'online'
  | 'cheque'
  | 'insurance'
  | 'other';

export type TransactionType =
  | 'payment'
  | 'refund'
  | 'expense'
  | 'adjustment';

export type PeriodType = 'monthly' | 'quarterly' | 'annual';

// ==================== PAYMENT CATEGORY ====================

export interface PaymentCategory {
  id: number;
  tenant_id: string;
  name: string;
  category_type: CategoryType;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentCategoryCreateData {
  name: string;
  category_type: CategoryType;
  description?: string;
}

export interface PaymentCategoryUpdateData extends Partial<PaymentCategoryCreateData> {}

export interface PaymentCategoryListParams {
  category_type?: CategoryType;
  search?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

// ==================== TRANSACTION ====================

export interface TransactionRelatedObject {
  content_type?: string;
  object_details?: {
    id: number;
    order_number?: string;
    appointment_id?: string;
    total_amount?: string;
    doctor?: string;
    [key: string]: any;
  };
}

export interface Transaction {
  id: string; // UUID
  tenant_id: string;
  transaction_number: string;
  amount: string;
  category: PaymentCategory;
  transaction_type: TransactionType;
  payment_method?: PaymentMethod;
  content_type?: number;
  object_id?: number;
  related_object_details?: TransactionRelatedObject;
  user_id?: string;
  description?: string;
  is_reconciled: boolean;
  reconciled_at?: string;
  reconciled_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreateData {
  amount: string | number;
  category_id: number;
  transaction_type: TransactionType;
  payment_method?: PaymentMethod;
  content_type?: number;
  object_id?: number;
  user_id?: string;
  description?: string;
}

export interface TransactionUpdateData extends Partial<TransactionCreateData> {}

export interface TransactionListParams {
  transaction_type?: TransactionType;
  payment_method?: PaymentMethod;
  category?: number;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  is_reconciled?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface TransactionStatistics {
  overall_stats: {
    total_transactions: number;
    total_amount: number;
    total_payments: number;
    total_expenses: number;
    total_refunds: number;
  };
  payment_method_breakdown: Array<{
    payment_method: PaymentMethod;
    count: number;
    total_amount: number;
  }>;
  transaction_type_breakdown: Array<{
    transaction_type: TransactionType;
    count: number;
    total_amount: number;
  }>;
}

export interface ReconcileTransactionResponse {
  success: boolean;
  message: string;
  data: Transaction;
}

// ==================== ACCOUNTING PERIOD ====================

export interface AccountingPeriod {
  id: number;
  tenant_id: string;
  name: string;
  start_date: string;
  end_date: string;
  period_type: PeriodType;
  total_income: string;
  total_expenses: string;
  net_profit: string;
  is_closed: boolean;
  closed_at?: string;
  closed_by_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccountingPeriodCreateData {
  name: string;
  start_date: string;
  end_date: string;
  period_type: PeriodType;
}

export interface AccountingPeriodUpdateData extends Partial<AccountingPeriodCreateData> {
  is_closed?: boolean;
}

export interface AccountingPeriodListParams {
  period_type?: PeriodType;
  is_closed?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface AccountingPeriodRecalculateResponse {
  success: boolean;
  message: string;
  data: AccountingPeriod;
  summary: {
    total_income: string;
    total_expenses: string;
    net_profit: string;
  };
}

export interface AccountingPeriodCloseResponse {
  success: boolean;
  message: string;
  data: AccountingPeriod;
}

// ==================== COMMON INTERFACES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
