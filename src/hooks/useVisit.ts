// src/hooks/useVisit.ts
// ==================== VISIT HOOKS ====================
// Mirrors the Doctor/Patient hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { visitService } from '@/services/visit.service';
import {
  Visit,
  VisitListParams,
  VisitCreateData,
  VisitUpdateData,
  VisitStatistics,
  PaginatedResponse,
} from '@/types/visit.types';
import { useAuth } from './useAuth';

export const useVisit = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== VISITS HOOKS ====================

  /**
   * Fetch list of visits with filters & pagination.
   *
   * @example
   * const { data, error, isLoading, mutate } = useVisits({
   *   status: 'waiting',
   *   visit_date: '2024-01-15',
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useVisits = (params?: VisitListParams) => {
    const key = ['visits', params];

    return useSWR<PaginatedResponse<Visit>>(
      key,
      () => visitService.getVisits(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch visits:', err);
          setError(err.message || 'Failed to fetch visits');
        },
      }
    );
  };

  /**
   * Fetch single visit by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useVisitById(12);
   */
  const useVisitById = (id: number | null) => {
    const key = id ? ['visit', id] : null;

    return useSWR<Visit>(
      key,
      () => visitService.getVisit(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch visit:', err);
          setError(err.message || 'Failed to fetch visit');
        },
      }
    );
  };

  /**
   * Fetch today's visits.
   *
   * @example
   * const { data, error, isLoading, mutate } = useTodayVisits();
   */
  const useTodayVisits = () => {
    const key = ['visits-today'];

    return useSWR<Visit[]>(
      key,
      () => visitService.getTodayVisits(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        refreshInterval: 30000, // Refresh every 30 seconds
        onError: (err) => {
          console.error("Failed to fetch today's visits:", err);
          setError(err.message || "Failed to fetch today's visits");
        },
      }
    );
  };

  /**
   * Fetch queue status.
   *
   * @example
   * const { data, error, isLoading, mutate } = useQueue();
   */
  const useQueue = () => {
    const key = ['visits-queue'];

    return useSWR<{
      waiting: Visit[];
      called: Visit[];
      in_consultation: Visit[];
    }>(
      key,
      () => visitService.getQueue(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        refreshInterval: 10000, // Refresh every 10 seconds
        onError: (err) => {
          console.error('Failed to fetch queue:', err);
          setError(err.message || 'Failed to fetch queue');
        },
      }
    );
  };

  /**
   * Fetch visit statistics.
   *
   * @example
   * const { data, error, isLoading, mutate } = useVisitStatistics();
   */
  const useVisitStatistics = (period: 'day' | 'week' | 'month' = 'day') => {
    const key = ['visit-statistics', period];

    return useSWR<VisitStatistics>(
      key,
      () => visitService.getVisitStatistics(period),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch visit statistics:', err);
          setError(err.message || 'Failed to fetch visit statistics');
        },
      }
    );
  };

  /**
   * Create a new visit (POST).
   *
   * @example
   * const { createVisit, isLoading } = useVisit();
   * await createVisit({ patient: 1, doctor: 2, visit_type: 'new' });
   */
  const createVisit = useCallback(
    async (visitData: VisitCreateData) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const newVisit = await visitService.createVisit(visitData);
        return newVisit;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create visit';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  /**
   * Update an existing visit (PUT - full update).
   *
   * @example
   * const { updateVisit, isLoading } = useVisit();
   * await updateVisit(12, { status: 'in_consultation' });
   */
  const updateVisit = useCallback(
    async (id: number, visitData: VisitUpdateData) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const updatedVisit = await visitService.updateVisit(id, visitData);
        return updatedVisit;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update visit';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  /**
   * Partially update an existing visit (PATCH).
   *
   * @example
   * const { patchVisit, isLoading } = useVisit();
   * await patchVisit(12, { status: 'completed' });
   */
  const patchVisit = useCallback(
    async (id: number, visitData: Partial<VisitUpdateData>) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const updatedVisit = await visitService.patchVisit(id, visitData);
        return updatedVisit;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update visit';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  /**
   * Delete a visit (DELETE).
   *
   * @example
   * const { deleteVisit, isLoading } = useVisit();
   * await deleteVisit(12);
   */
  const deleteVisit = useCallback(
    async (id: number) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        await visitService.deleteVisit(id);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to delete visit';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hasHMSAccess]
  );

  /**
   * Call next patient.
   *
   * @example
   * const { callNextPatient, isLoading } = useVisit();
   * await callNextPatient();
   */
  const callNextPatient = useCallback(async () => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await visitService.callNextPatient();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to call next patient';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Complete a visit.
   *
   * @example
   * const { completeVisit, isLoading } = useVisit();
   * await completeVisit(12);
   */
  const completeVisit = useCallback(
    async (id: number) => {
      if (!hasHMSAccess) {
        throw new Error('HMS module not enabled for this user');
      }

      setIsLoading(true);
      setError(null);

      try {
        const completedVisit = await visitService.completeVisit(id);
        return completedVisit;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to complete visit';
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

    // Visit CRUD
    useVisits,
    useVisitById,
    useTodayVisits,
    useQueue,
    useVisitStatistics,
    createVisit,
    updateVisit,
    patchVisit,
    deleteVisit,
    callNextPatient,
    completeVisit,
  };
};
