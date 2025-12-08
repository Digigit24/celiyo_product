// src/hooks/useProcedureBill.ts
// ==================== PROCEDURE BILL HOOKS ====================
// Mirrors the OPD Bill/Visit hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { procedureBillService } from '@/services/procedureBill.service';
import {
  ProcedureBill,
  ProcedureBillItem,
  ProcedureBillListParams,
  ProcedureBillCreateData,
  ProcedureBillUpdateData,
  PaymentRecordData,
  PaginatedResponse,
} from '@/types/procedureBill.types';
import { useAuth } from './useAuth';

export const useProcedureBill = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== PROCEDURE BILLS HOOKS ====================

  /**
   * Fetch list of procedure bills with filters & pagination.
   *
   * @example
   * const { data, error, isLoading, mutate } = useProcedureBills({
   *   payment_status: 'unpaid',
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useProcedureBills = (params?: ProcedureBillListParams) => {
    const key = ['procedure-bills', params];

    return useSWR<PaginatedResponse<ProcedureBill>>(
      key,
      () => procedureBillService.getProcedureBills(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch procedure bills:', err);
          setError(err.message || 'Failed to fetch procedure bills');
        },
      }
    );
  };

  /**
   * Fetch single procedure bill by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useProcedureBillById(12);
   */
  const useProcedureBillById = (id: number | null) => {
    const key = id ? ['procedure-bill', id] : null;

    return useSWR<ProcedureBill>(
      key,
      () => procedureBillService.getProcedureBillById(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch procedure bill:', err);
          setError(err.message || 'Failed to fetch procedure bill');
        },
      }
    );
  };

  /**
   * Fetch all procedure bill items.
   *
   * @example
   * const { data, error, isLoading } = useProcedureBillItems();
   */
  const useProcedureBillItems = () => {
    const key = ['procedure-bill-items'];

    return useSWR<PaginatedResponse<ProcedureBillItem>>(
      key,
      () => procedureBillService.getProcedureBillItems(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch procedure bill items:', err);
          setError(err.message || 'Failed to fetch procedure bill items');
        },
      }
    );
  };

  /**
   * Fetch single procedure bill item by ID.
   *
   * @example
   * const { data, error, isLoading } = useProcedureBillItemById(5);
   */
  const useProcedureBillItemById = (id: number | null) => {
    const key = id ? ['procedure-bill-item', id] : null;

    return useSWR<ProcedureBillItem>(
      key,
      () => procedureBillService.getProcedureBillItemById(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch procedure bill item:', err);
          setError(err.message || 'Failed to fetch procedure bill item');
        },
      }
    );
  };

  // ==================== MUTATION CALLBACKS ====================

  /**
   * Create a new procedure bill.
   *
   * @example
   * const { createBill } = useProcedureBill();
   * await createBill({
   *   doctor: 1,
   *   bill_type: 'hospital',
   *   items: [{ procedure: 1, quantity: 1, unit_charge: '500.00' }],
   * });
   */
  const createBill = useCallback(
    async (billData: ProcedureBillCreateData): Promise<ProcedureBill | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newBill = await procedureBillService.createProcedureBill(billData);
        return newBill;
      } catch (err: any) {
        setError(err.message || 'Failed to create procedure bill');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update an existing procedure bill.
   *
   * @example
   * const { updateBill } = useProcedureBill();
   * await updateBill(123, { payment_mode: 'card' });
   */
  const updateBill = useCallback(
    async (id: number, billData: ProcedureBillUpdateData): Promise<ProcedureBill | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBill = await procedureBillService.updateProcedureBill(id, billData);
        return updatedBill;
      } catch (err: any) {
        setError(err.message || 'Failed to update procedure bill');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a procedure bill.
   *
   * @example
   * const { deleteBill } = useProcedureBill();
   * await deleteBill(123);
   */
  const deleteBill = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await procedureBillService.deleteProcedureBill(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete procedure bill');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Record a payment for a procedure bill.
   *
   * @example
   * const { recordPayment } = useProcedureBill();
   * await recordPayment(123, {
   *   amount: '500.00',
   *   payment_mode: 'cash',
   * });
   */
  const recordPayment = useCallback(
    async (id: number, paymentData: PaymentRecordData): Promise<ProcedureBill | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBill = await procedureBillService.recordProcedureBillPayment(id, paymentData);
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
   * Print/generate PDF for a procedure bill.
   *
   * @example
   * const { printBill } = useProcedureBill();
   * const result = await printBill(123);
   */
  const printBill = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await procedureBillService.printProcedureBill(id);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to print bill');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Query hooks
    useProcedureBills,
    useProcedureBillById,
    useProcedureBillItems,
    useProcedureBillItemById,

    // Mutation callbacks
    createBill,
    updateBill,
    deleteBill,
    recordPayment,
    printBill,

    // State
    isLoading,
    error,
    hasHMSAccess,
  };
};
