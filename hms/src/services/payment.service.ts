// src/services/payment.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  PaymentCategory,
  PaymentCategoryCreateData,
  PaymentCategoryUpdateData,
  PaymentCategoryListParams,
  Transaction,
  TransactionCreateData,
  TransactionUpdateData,
  TransactionListParams,
  TransactionStatistics,
  ReconcileTransactionResponse,
  AccountingPeriod,
  AccountingPeriodCreateData,
  AccountingPeriodUpdateData,
  AccountingPeriodListParams,
  AccountingPeriodRecalculateResponse,
  AccountingPeriodCloseResponse,
  PaginatedResponse,
  ApiResponse,
} from '@/types/payment.types';

interface ApiResponseWrapper<T> {
  data?: T;
  success?: boolean;
  message?: string;
  [key: string]: any;
}

class PaymentService {
  // ==================== PAYMENT CATEGORIES ====================

  // Get payment categories with optional query parameters
  async getPaymentCategories(
    params?: PaymentCategoryListParams
  ): Promise<PaginatedResponse<PaymentCategory>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<ApiResponseWrapper<PaymentCategory[]>>(
        `${API_CONFIG.HMS.PAYMENTS.CATEGORIES.LIST}${queryString}`
      );

      // Handle both wrapped and direct responses
      if (response.data.success && response.data.data) {
        // Wrapped response: {success: true, data: [...]}
        return {
          count: response.data.data.length,
          next: null,
          previous: null,
          results: response.data.data,
        };
      }

      // Direct paginated response
      return response.data as PaginatedResponse<PaymentCategory>;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch payment categories';
      throw new Error(message);
    }
  }

  // Get single payment category by ID
  async getPaymentCategory(id: number): Promise<PaymentCategory> {
    try {
      const response = await hmsClient.get<ApiResponseWrapper<PaymentCategory>>(
        API_CONFIG.HMS.PAYMENTS.CATEGORIES.DETAIL.replace(':id', id.toString())
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch payment category';
      throw new Error(message);
    }
  }

  // Create new payment category
  async createPaymentCategory(
    categoryData: PaymentCategoryCreateData
  ): Promise<PaymentCategory> {
    try {
      const response = await hmsClient.post<ApiResponseWrapper<PaymentCategory>>(
        API_CONFIG.HMS.PAYMENTS.CATEGORIES.CREATE,
        categoryData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create payment category';
      throw new Error(message);
    }
  }

  // Update payment category
  async updatePaymentCategory(
    id: number,
    categoryData: PaymentCategoryUpdateData
  ): Promise<PaymentCategory> {
    try {
      const response = await hmsClient.patch<ApiResponseWrapper<PaymentCategory>>(
        API_CONFIG.HMS.PAYMENTS.CATEGORIES.UPDATE.replace(':id', id.toString()),
        categoryData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update payment category';
      throw new Error(message);
    }
  }

  // Delete payment category
  async deletePaymentCategory(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.PAYMENTS.CATEGORIES.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete payment category';
      throw new Error(message);
    }
  }

  // ==================== TRANSACTIONS ====================

  // Get transactions with optional query parameters
  async getTransactions(
    params?: TransactionListParams
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Transaction>>(
        `${API_CONFIG.HMS.PAYMENTS.TRANSACTIONS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch transactions';
      throw new Error(message);
    }
  }

  // Get single transaction by ID
  async getTransaction(id: string): Promise<Transaction> {
    try {
      const response = await hmsClient.get<ApiResponseWrapper<Transaction>>(
        API_CONFIG.HMS.PAYMENTS.TRANSACTIONS.DETAIL.replace(':id', id)
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch transaction';
      throw new Error(message);
    }
  }

  // Create new transaction
  async createTransaction(
    transactionData: TransactionCreateData
  ): Promise<Transaction> {
    try {
      const response = await hmsClient.post<ApiResponseWrapper<Transaction>>(
        API_CONFIG.HMS.PAYMENTS.TRANSACTIONS.CREATE,
        transactionData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create transaction';
      throw new Error(message);
    }
  }

  // Update transaction
  async updateTransaction(
    id: string,
    transactionData: TransactionUpdateData
  ): Promise<Transaction> {
    try {
      const response = await hmsClient.patch<ApiResponseWrapper<Transaction>>(
        API_CONFIG.HMS.PAYMENTS.TRANSACTIONS.UPDATE.replace(':id', id),
        transactionData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update transaction';
      throw new Error(message);
    }
  }

  // Delete transaction
  async deleteTransaction(id: string): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.PAYMENTS.TRANSACTIONS.DELETE.replace(':id', id)
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete transaction';
      throw new Error(message);
    }
  }

  // Get transaction statistics
  async getTransactionStatistics(
    params?: Record<string, any>
  ): Promise<TransactionStatistics> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<ApiResponseWrapper<TransactionStatistics>>(
        `${API_CONFIG.HMS.PAYMENTS.TRANSACTIONS.STATISTICS}${queryString}`
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch transaction statistics';
      throw new Error(message);
    }
  }

  // Reconcile transaction
  async reconcileTransaction(id: string): Promise<ReconcileTransactionResponse> {
    try {
      const response = await hmsClient.post<ReconcileTransactionResponse>(
        API_CONFIG.HMS.PAYMENTS.TRANSACTIONS.RECONCILE.replace(':id', id)
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to reconcile transaction';
      throw new Error(message);
    }
  }

  // ==================== ACCOUNTING PERIODS ====================

  // Get accounting periods with optional query parameters
  async getAccountingPeriods(
    params?: AccountingPeriodListParams
  ): Promise<PaginatedResponse<AccountingPeriod>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<AccountingPeriod>>(
        `${API_CONFIG.HMS.PAYMENTS.ACCOUNTING_PERIODS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch accounting periods';
      throw new Error(message);
    }
  }

  // Get single accounting period by ID
  async getAccountingPeriod(id: number): Promise<AccountingPeriod> {
    try {
      const response = await hmsClient.get<ApiResponseWrapper<AccountingPeriod>>(
        API_CONFIG.HMS.PAYMENTS.ACCOUNTING_PERIODS.DETAIL.replace(':id', id.toString())
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch accounting period';
      throw new Error(message);
    }
  }

  // Create new accounting period
  async createAccountingPeriod(
    periodData: AccountingPeriodCreateData
  ): Promise<AccountingPeriod> {
    try {
      const response = await hmsClient.post<ApiResponseWrapper<AccountingPeriod>>(
        API_CONFIG.HMS.PAYMENTS.ACCOUNTING_PERIODS.CREATE,
        periodData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create accounting period';
      throw new Error(message);
    }
  }

  // Update accounting period
  async updateAccountingPeriod(
    id: number,
    periodData: AccountingPeriodUpdateData
  ): Promise<AccountingPeriod> {
    try {
      const response = await hmsClient.patch<ApiResponseWrapper<AccountingPeriod>>(
        API_CONFIG.HMS.PAYMENTS.ACCOUNTING_PERIODS.UPDATE.replace(':id', id.toString()),
        periodData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update accounting period';
      throw new Error(message);
    }
  }

  // Delete accounting period
  async deleteAccountingPeriod(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.PAYMENTS.ACCOUNTING_PERIODS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete accounting period';
      throw new Error(message);
    }
  }

  // Recalculate accounting period financial summary
  async recalculateAccountingPeriod(
    id: number
  ): Promise<AccountingPeriodRecalculateResponse> {
    try {
      const response = await hmsClient.post<AccountingPeriodRecalculateResponse>(
        API_CONFIG.HMS.PAYMENTS.ACCOUNTING_PERIODS.RECALCULATE.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to recalculate accounting period';
      throw new Error(message);
    }
  }

  // Close accounting period
  async closeAccountingPeriod(id: number): Promise<AccountingPeriodCloseResponse> {
    try {
      const response = await hmsClient.post<AccountingPeriodCloseResponse>(
        API_CONFIG.HMS.PAYMENTS.ACCOUNTING_PERIODS.CLOSE.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to close accounting period';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
