// src/hooks/usePayment.ts
import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { paymentService } from '@/services/payment.service';
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
  AccountingPeriod,
  AccountingPeriodCreateData,
  AccountingPeriodUpdateData,
  AccountingPeriodListParams,
  PaginatedResponse,
} from '@/types/payment.types';
import { useAuth } from './useAuth';

export const usePayment = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== PAYMENT CATEGORIES HOOKS ====================

  // Get payment categories with SWR caching
  const usePaymentCategories = (params?: PaymentCategoryListParams) => {
    const key = ['payment-categories', params];

    return useSWR<PaginatedResponse<PaymentCategory>>(
      key,
      () => paymentService.getPaymentCategories(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch payment categories:', err);
          setError(err.message || 'Failed to fetch payment categories');
        },
      }
    );
  };

  // Get single payment category with SWR caching
  const usePaymentCategory = (id: number | null) => {
    const key = id ? ['payment-category', id] : null;

    return useSWR<PaymentCategory>(
      key,
      () => paymentService.getPaymentCategory(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch payment category:', err);
          setError(err.message || 'Failed to fetch payment category');
        },
      }
    );
  };

  // Create payment category
  const createPaymentCategory = useCallback(
    async (categoryData: PaymentCategoryCreateData) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const newCategory = await paymentService.createPaymentCategory(categoryData);
        return newCategory;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create payment category';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // Update payment category
  const updatePaymentCategory = useCallback(
    async (id: number, categoryData: PaymentCategoryUpdateData) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const updatedCategory = await paymentService.updatePaymentCategory(
          id,
          categoryData
        );
        return updatedCategory;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update payment category';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // Delete payment category
  const deletePaymentCategory = useCallback(
    async (id: number) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        await paymentService.deletePaymentCategory(id);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to delete payment category';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // ==================== TRANSACTIONS HOOKS ====================

  // Get transactions with SWR caching
  const useTransactions = (params?: TransactionListParams) => {
    const key = ['transactions', params];

    return useSWR<PaginatedResponse<Transaction>>(
      key,
      () => paymentService.getTransactions(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch transactions:', err);
          setError(err.message || 'Failed to fetch transactions');
        },
      }
    );
  };

  // Get single transaction with SWR caching
  const useTransaction = (id: string | null) => {
    const key = id ? ['transaction', id] : null;

    return useSWR<Transaction>(
      key,
      () => paymentService.getTransaction(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch transaction:', err);
          setError(err.message || 'Failed to fetch transaction');
        },
      }
    );
  };

  // Create transaction
  const createTransaction = useCallback(
    async (transactionData: TransactionCreateData) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const newTransaction = await paymentService.createTransaction(transactionData);
        return newTransaction;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create transaction';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // Update transaction
  const updateTransaction = useCallback(
    async (id: string, transactionData: TransactionUpdateData) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const updatedTransaction = await paymentService.updateTransaction(
          id,
          transactionData
        );
        return updatedTransaction;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update transaction';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // Delete transaction
  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        await paymentService.deleteTransaction(id);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to delete transaction';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // Get transaction statistics with SWR caching
  const useTransactionStatistics = (params?: Record<string, any>) => {
    const key = ['transaction-statistics', params];

    return useSWR<TransactionStatistics>(
      key,
      () => paymentService.getTransactionStatistics(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch transaction statistics:', err);
          setError(err.message || 'Failed to fetch transaction statistics');
        },
      }
    );
  };

  // Reconcile transaction
  const reconcileTransaction = useCallback(
    async (id: string) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await paymentService.reconcileTransaction(id);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to reconcile transaction';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // ==================== ACCOUNTING PERIODS HOOKS ====================

  // Get accounting periods with SWR caching
  const useAccountingPeriods = (params?: AccountingPeriodListParams) => {
    const key = ['accounting-periods', params];

    return useSWR<PaginatedResponse<AccountingPeriod>>(
      key,
      () => paymentService.getAccountingPeriods(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch accounting periods:', err);
          setError(err.message || 'Failed to fetch accounting periods');
        },
      }
    );
  };

  // Get single accounting period with SWR caching
  const useAccountingPeriod = (id: number | null) => {
    const key = id ? ['accounting-period', id] : null;

    return useSWR<AccountingPeriod>(
      key,
      () => paymentService.getAccountingPeriod(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch accounting period:', err);
          setError(err.message || 'Failed to fetch accounting period');
        },
      }
    );
  };

  // Create accounting period
  const createAccountingPeriod = useCallback(
    async (periodData: AccountingPeriodCreateData) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const newPeriod = await paymentService.createAccountingPeriod(periodData);
        return newPeriod;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create accounting period';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // Update accounting period
  const updateAccountingPeriod = useCallback(
    async (id: number, periodData: AccountingPeriodUpdateData) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const updatedPeriod = await paymentService.updateAccountingPeriod(
          id,
          periodData
        );
        return updatedPeriod;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update accounting period';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // Delete accounting period
  const deleteAccountingPeriod = useCallback(
    async (id: number) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        await paymentService.deleteAccountingPeriod(id);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to delete accounting period';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // Recalculate accounting period
  const recalculateAccountingPeriod = useCallback(
    async (id: number) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await paymentService.recalculateAccountingPeriod(id);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to recalculate accounting period';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  // Close accounting period
  const closeAccountingPeriod = useCallback(
    async (id: number) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await paymentService.closeAccountingPeriod(id);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to close accounting period';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  return {
    hasHMSAccess,
    isLoading,
    error,

    // Payment Categories
    usePaymentCategories,
    usePaymentCategory,
    createPaymentCategory,
    updatePaymentCategory,
    deletePaymentCategory,

    // Transactions
    useTransactions,
    useTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    useTransactionStatistics,
    reconcileTransaction,

    // Accounting Periods
    useAccountingPeriods,
    useAccountingPeriod,
    createAccountingPeriod,
    updateAccountingPeriod,
    deleteAccountingPeriod,
    recalculateAccountingPeriod,
    closeAccountingPeriod,
  };
};
