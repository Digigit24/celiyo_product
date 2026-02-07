// src/hooks/useOPDBill.ts
// ==================== OPD BILL HOOKS ====================
// Mirrors the Visit/Patient hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { opdBillService } from '@/services/opdBill.service';
import {
  OPDBill,
  OPDBillListParams,
  OPDBillCreateData,
  OPDBillUpdateData,
  PaymentRecordData,
  OPDBillStatistics,
  PaginatedResponse,
} from '@/types/opdBill.types';
import { UnbilledRequisitionsResponse } from '@/types/diagnostics.types';
import { useAuth } from './useAuth';

export const useOPDBill = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== OPD BILLS HOOKS ====================

  /**
   * Fetch list of OPD bills with filters & pagination.
   *
   * @example
   * const { data, error, isLoading, mutate } = useOPDBills({
   *   payment_status: 'unpaid',
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useOPDBills = (params?: OPDBillListParams) => {
    // Create a stable key that will be null if params is undefined (prevents unnecessary fetching)
    const key = params ? ['opd-bills', params] : null;

    return useSWR<PaginatedResponse<OPDBill>>(
      key,
      () => opdBillService.getOPDBills(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch OPD bills:', err);
          setError(err.message || 'Failed to fetch OPD bills');
        },
      }
    );
  };

  /**
   * Fetch single OPD bill by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useOPDBillById(12);
   */
  const useOPDBillById = (id: number | null) => {
    const key = id ? ['opd-bill', id] : null;

    return useSWR<OPDBill>(
      key,
      () => opdBillService.getOPDBillById(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch OPD bill:', err);
          setError(err.message || 'Failed to fetch OPD bill');
        },
      }
    );
  };

  /**
   * Fetch OPD bill statistics.
   *
   * @example
   * const { data, error, isLoading, mutate } = useOPDBillStatistics();
   */
  const useOPDBillStatistics = (params?: Record<string, any>) => {
    const key = ['opd-bills-statistics', params];

    return useSWR<OPDBillStatistics>(
      key,
      () => opdBillService.getOPDBillStatistics(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch bill statistics:', err);
          setError(err.message || 'Failed to fetch bill statistics');
        },
      }
    );
  };

  /**
   * Fetch unbilled requisitions for a visit.
   *
   * @example
   * const { data, error, isLoading, mutate } = useUnbilledRequisitions(visitId);
   */
  const useUnbilledRequisitions = (visitId: number | null) => {
    const key = visitId ? ['unbilled-requisitions', visitId] : null;

    return useSWR<UnbilledRequisitionsResponse>(
      key,
      () => opdBillService.getUnbilledRequisitions(visitId!),
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
   * Create a new OPD bill.
   *
   * @example
   * const { createBill } = useOPDBill();
   * await createBill({
   *   patient: 123,
   *   doctor: 45,
   *   bill_type: 'consultation',
   *   items: [...],
   * });
   */
  const createBill = useCallback(
    async (billData: OPDBillCreateData): Promise<OPDBill | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newBill = await opdBillService.createOPDBill(billData);
        return newBill;
      } catch (err: any) {
        setError(err.message || 'Failed to create OPD bill');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update an existing OPD bill.
   *
   * @example
   * const { updateBill } = useOPDBill();
   * await updateBill(123, { notes: 'Updated notes' });
   */
  const updateBill = useCallback(
    async (id: number, billData: OPDBillUpdateData): Promise<OPDBill | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBill = await opdBillService.updateOPDBill(id, billData);
        return updatedBill;
      } catch (err: any) {
        setError(err.message || 'Failed to update OPD bill');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete an OPD bill.
   *
   * @example
   * const { deleteBill } = useOPDBill();
   * await deleteBill(123);
   */
  const deleteBill = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await opdBillService.deleteOPDBill(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete OPD bill');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Record a payment for an OPD bill.
   *
   * @example
   * const { recordBillPayment } = useOPDBill();
   * await recordBillPayment(123, {
   *   amount: '250',
   *   payment_mode: 'cash',
   * });
   */
  const recordBillPayment = useCallback(
    async (id: number, paymentData: PaymentRecordData): Promise<OPDBill | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBill = await opdBillService.recordPayment(id, paymentData);
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
   * Print/generate PDF for an OPD bill.
   *
   * @example
   * const { printBill } = useOPDBill();
   * const result = await printBill(123);
   * // result.pdf_url contains the PDF download link
   */
  const printBill = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await opdBillService.printOPDBill(id);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to print bill');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Import requisition orders as bill items.
   *
   * @example
   * const { importRequisition } = useOPDBill();
   * await importRequisition(billId, requisitionId);
   */
  const importRequisition = useCallback(
    async (billId: number, requisitionId: number): Promise<OPDBill | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBill = await opdBillService.importRequisition(billId, requisitionId);
        return updatedBill;
      } catch (err: any) {
        setError(err.message || 'Failed to import requisition');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const syncClinicalCharges = useCallback(
    async (visitId: number): Promise<OPDBill | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBill = await opdBillService.syncClinicalCharges(visitId);
        return updatedBill;
      } catch (err: any) {
        setError(err.message || 'Failed to import clinical charges');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    // Query hooks
    useOPDBills,
    useOPDBillById,
    useOPDBillStatistics,
    useUnbilledRequisitions,

    // Mutation callbacks
    createBill,
    updateBill,
    deleteBill,
    recordBillPayment,
    printBill,
    importRequisition,
    syncClinicalCharges,

    // State
    isLoading,
    error,
    hasHMSAccess,
  };
};
