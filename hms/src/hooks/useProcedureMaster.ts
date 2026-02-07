// src/hooks/useProcedureMaster.ts
// ==================== PROCEDURE MASTER HOOKS ====================
// Mirrors the OPD Bill/Visit hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { procedureMasterService } from '@/services/procedureMaster.service';
import {
  ProcedureMaster,
  ProcedureMasterListParams,
  ProcedureMasterCreateData,
  ProcedureMasterUpdateData,
  PaginatedResponse,
} from '@/types/procedureMaster.types';
import { useAuth } from './useAuth';

export const useProcedureMaster = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== PROCEDURE MASTERS HOOKS ====================

  /**
   * Fetch list of procedure masters with filters & pagination.
   *
   * @example
   * const { data, error, isLoading, mutate } = useProcedureMasters({
   *   category: 'laboratory',
   *   is_active: true,
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useProcedureMasters = (params?: ProcedureMasterListParams) => {
    const key = ['procedure-masters', params];

    return useSWR<PaginatedResponse<ProcedureMaster>>(
      key,
      () => procedureMasterService.getProcedureMasters(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch procedure masters:', err);
          setError(err.message || 'Failed to fetch procedure masters');
        },
      }
    );
  };

  /**
   * Fetch single procedure master by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useProcedureMasterById(12);
   */
  const useProcedureMasterById = (id: number | null) => {
    const key = id ? ['procedure-master', id] : null;

    return useSWR<ProcedureMaster>(
      key,
      () => procedureMasterService.getProcedureMasterById(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch procedure master:', err);
          setError(err.message || 'Failed to fetch procedure master');
        },
      }
    );
  };

  /**
   * Fetch active procedure masters by category.
   *
   * @example
   * const { data, error, isLoading } = useActiveProcedureMasters('laboratory');
   */
  const useActiveProcedureMasters = (category?: string) => {
    const params: ProcedureMasterListParams = { is_active: true };
    if (category) params.category = category;

    const key = ['procedure-masters', 'active', params];

    return useSWR<PaginatedResponse<ProcedureMaster>>(
      key,
      () => procedureMasterService.getProcedureMasters(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch active procedure masters:', err);
          setError(err.message || 'Failed to fetch active procedure masters');
        },
      }
    );
  };

  // ==================== MUTATION CALLBACKS ====================

  /**
   * Create a new procedure master.
   *
   * @example
   * const { createProcedure } = useProcedureMaster();
   * await createProcedure({
   *   name: 'Complete Blood Count',
   *   code: 'CBC001',
   *   category: 'laboratory',
   *   default_charge: '500.00',
   * });
   */
  const createProcedure = useCallback(
    async (procedureData: ProcedureMasterCreateData): Promise<ProcedureMaster | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newProcedure = await procedureMasterService.createProcedureMaster(procedureData);
        return newProcedure;
      } catch (err: any) {
        setError(err.message || 'Failed to create procedure master');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update an existing procedure master.
   *
   * @example
   * const { updateProcedure } = useProcedureMaster();
   * await updateProcedure(123, { default_charge: '550.00' });
   */
  const updateProcedure = useCallback(
    async (id: number, procedureData: ProcedureMasterUpdateData): Promise<ProcedureMaster | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedProcedure = await procedureMasterService.updateProcedureMaster(id, procedureData);
        return updatedProcedure;
      } catch (err: any) {
        setError(err.message || 'Failed to update procedure master');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a procedure master.
   *
   * @example
   * const { deleteProcedure } = useProcedureMaster();
   * await deleteProcedure(123);
   */
  const deleteProcedure = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await procedureMasterService.deleteProcedureMaster(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete procedure master');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Query hooks
    useProcedureMasters,
    useProcedureMasterById,
    useActiveProcedureMasters,

    // Mutation callbacks
    createProcedure,
    updateProcedure,
    deleteProcedure,

    // State
    isLoading,
    error,
    hasHMSAccess,
  };
};
