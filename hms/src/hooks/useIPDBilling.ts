// src/hooks/useIPDBilling.ts
// ==================== IPD BILLING HOOKS ====================
// Mirrors the OPD billing hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { ipdBillingService } from '@/services/ipdBilling.service';
import {
  IPDBilling,
  IPDBillingListParams,
  IPDBillingCreateData,
  IPDBillingUpdateData,
  IPDPaymentRecordData,
  PaginatedResponse,
  UnbilledRequisitionsResponse,
  SyncClinicalChargesResponse,
} from '@/types/ipdBilling.types';
import { useAuth } from './useAuth';

export const useIPDBilling = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== IPD BILLING HOOKS ====================

  /**
   * Fetch list of IPD bills with filters & pagination.
   *
   * @example
   * const { data, error, isLoading, mutate } = useIPDBillings({
   *   payment_status: 'unpaid',
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useIPDBillings = (params?: IPDBillingListParams) => {
    // Create a stable key that will be null if params is undefined (prevents unnecessary fetching)
    const key = params ? ['ipd-billings', params] : null;

    return useSWR<PaginatedResponse<IPDBilling>>(
      key,
      () => ipdBillingService.getIPDBillings(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch IPD bills:', err);
          setError(err.message || 'Failed to fetch IPD bills');
        },
      }
    );
  };

  /**
   * Fetch single IPD bill by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useIPDBillingById(12);
   */
  const useIPDBillingById = (id: number | null) => {
    const key = id ? ['ipd-billing', id] : null;

    return useSWR<IPDBilling>(
      key,
      () => ipdBillingService.getIPDBillingById(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch IPD bill:', err);
          setError(err.message || 'Failed to fetch IPD bill');
        },
      }
    );
  };

  /**
   * Fetch unbilled requisitions for an admission.
   *
   * @example
   * const { data, error, isLoading, mutate } = useUnbilledRequisitions(admissionId);
   */
  const useUnbilledRequisitions = (admissionId: number | null) => {
    const key = admissionId ? ['unbilled-requisitions-ipd', admissionId] : null;

    return useSWR<UnbilledRequisitionsResponse>(
      key,
      () => ipdBillingService.getUnbilledRequisitions(admissionId!),
      {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        refreshInterval: 10000, // Refresh every 10 seconds to catch new requisitions
        onError: (err) => {
          console.error('Failed to fetch unbilled requisitions:', err);
          setError(err.message || 'Failed to fetch unbilled requisitions');
        },
      }
    );
  };

  // ==================== MUTATION CALLBACKS ====================

  /**
   * Create a new IPD bill.
   *
   * @example
   * const { createBilling } = useIPDBilling();
   * await createBilling({
   *   admission: 123,
   *   doctor_id: 'uuid-here',
   *   payment_mode: 'cash',
   * });
   */
  const createBilling = useCallback(
    async (billData: IPDBillingCreateData): Promise<IPDBilling | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newBill = await ipdBillingService.createIPDBilling(billData);
        return newBill;
      } catch (err: any) {
        setError(err.message || 'Failed to create IPD bill');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update an existing IPD bill.
   *
   * @example
   * const { updateBilling } = useIPDBilling();
   * await updateBilling(123, { remarks: 'Updated remarks' });
   */
  const updateBilling = useCallback(
    async (id: number, billData: IPDBillingUpdateData): Promise<IPDBilling | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBill = await ipdBillingService.updateIPDBilling(id, billData);
        return updatedBill;
      } catch (err: any) {
        setError(err.message || 'Failed to update IPD bill');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete an IPD bill.
   *
   * @example
   * const { deleteBilling } = useIPDBilling();
   * await deleteBilling(123);
   */
  const deleteBilling = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await ipdBillingService.deleteIPDBilling(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete IPD bill');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add bed charges to an IPD bill.
   *
   * @example
   * const { addBedCharges } = useIPDBilling();
   * await addBedCharges(123);
   */
  const addBedCharges = useCallback(
    async (billId: number): Promise<IPDBilling | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBill = await ipdBillingService.addBedCharges(billId);
        return updatedBill;
      } catch (err: any) {
        setError(err.message || 'Failed to add bed charges');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Record a payment for an IPD bill.
   *
   * @example
   * const { addPayment } = useIPDBilling();
   * await addPayment(123, {
   *   amount: '5000',
   *   payment_mode: 'card',
   * });
   */
  const addPayment = useCallback(
    async (billId: number, paymentData: IPDPaymentRecordData): Promise<IPDBilling | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBill = await ipdBillingService.addPayment(billId, paymentData);
        return updatedBill;
      } catch (err: any) {
        setError(err.message || 'Failed to record payment');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Sync clinical charges from requisitions to bill.
   *
   * @example
   * const { syncClinicalCharges } = useIPDBilling();
   * await syncClinicalCharges(admissionId);
   */
  const syncClinicalCharges = useCallback(
    async (admissionId: number): Promise<SyncClinicalChargesResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await ipdBillingService.syncClinicalCharges(admissionId);
        return result;
      } catch (err: any) {
        setError(err.message || 'Failed to sync clinical charges');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    // Query hooks
    useIPDBillings,
    useIPDBillingById,
    useUnbilledRequisitions,

    // Mutation callbacks
    createBilling,
    updateBilling,
    deleteBilling,
    addBedCharges,
    addPayment,
    syncClinicalCharges,

    // State
    isLoading,
    error,
    hasHMSAccess,
  };
};
