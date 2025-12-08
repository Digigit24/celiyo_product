// src/hooks/useOpdVisit.ts
// ==================== OPD VISIT HOOKS ====================
// Mirrors the Appointment hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { opdVisitService } from '@/services/opdVisit.service';
import {
  OpdVisit,
  OpdVisitListParams,
  OpdVisitCreateData,
  OpdVisitUpdateData,
  CompleteVisitData,
  OpdVisitStatistics,
  QueueItem,
  PaginatedResponse
} from '@/types/opdVisit.types';
import { useAuth } from './useAuth';

export const useOpdVisit = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== OPD VISITS HOOKS ====================

  /**
   * Fetch list of OPD visits with filters & pagination.
   * Keeps previous page data while loading the next set.
   *
   * @example
   * const { data, error, isLoading, mutate } = useOpdVisits({
   *   doctor_id: 1,
   *   status: 'waiting',
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useOpdVisits = (params?: OpdVisitListParams) => {
    const key = ['opd-visits', params];

    return useSWR<PaginatedResponse<OpdVisit>>(
      key,
      () => opdVisitService.getOpdVisits(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch OPD visits:', err);
          setError(err.message || 'Failed to fetch OPD visits');
        }
      }
    );
  };

  /**
   * Fetch single OPD visit by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useOpdVisitById(12);
   */
  const useOpdVisitById = (id: number | null) => {
    const key = id ? ['opd-visit', id] : null;

    return useSWR<OpdVisit>(
      key,
      () => opdVisitService.getOpdVisit(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch OPD visit:', err);
          setError(err.message || 'Failed to fetch OPD visit');
        }
      }
    );
  };

  /**
   * Fetch today's OPD visits.
   *
   * @example
   * const { data, error, isLoading, mutate } = useTodayVisits();
   */
  const useTodayVisits = (params?: OpdVisitListParams) => {
    const key = ['opd-visits-today', params];

    return useSWR<PaginatedResponse<OpdVisit>>(
      key,
      () => opdVisitService.getTodayVisits(params),
      {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        refreshInterval: 30000, // Refresh every 30 seconds
        onError: (err) => {
          console.error('Failed to fetch today\'s visits:', err);
          setError(err.message || 'Failed to fetch today\'s visits');
        }
      }
    );
  };

  /**
   * Fetch OPD queue.
   *
   * @example
   * const { data, error, isLoading, mutate } = useOpdQueue();
   */
  const useOpdQueue = () => {
    const key = ['opd-queue'];

    return useSWR<QueueItem[]>(
      key,
      () => opdVisitService.getQueue(),
      {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        refreshInterval: 10000, // Refresh every 10 seconds
        onError: (err) => {
          console.error('Failed to fetch OPD queue:', err);
          setError(err.message || 'Failed to fetch OPD queue');
        }
      }
    );
  };

  /**
   * Fetch OPD visit statistics.
   *
   * @example
   * const { data, error, isLoading, mutate } = useOpdVisitStatistics();
   */
  const useOpdVisitStatistics = () => {
    const key = ['opd-visit-statistics'];

    return useSWR<OpdVisitStatistics>(
      key,
      () => opdVisitService.getOpdVisitStatistics(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch OPD visit statistics:', err);
          setError(err.message || 'Failed to fetch OPD visit statistics');
        }
      }
    );
  };

  /**
   * Create a new OPD visit (POST).
   *
   * @example
   * const { createOpdVisit, isLoading } = useOpdVisit();
   * await createOpdVisit({
   *   patient_id: 1,
   *   doctor_id: 2,
   *   visit_date: '2024-01-15',
   *   visit_time: '10:00',
   *   ...
   * });
   */
  const createOpdVisit = useCallback(async (visitData: OpdVisitCreateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newVisit = await opdVisitService.createOpdVisit(visitData);
      return newVisit;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create OPD visit';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Update an existing OPD visit (PUT - full update).
   *
   * @example
   * const { updateOpdVisit, isLoading } = useOpdVisit();
   * await updateOpdVisit(12, { status: 'in_progress', notes: 'Updated' });
   */
  const updateOpdVisit = useCallback(async (id: number, visitData: OpdVisitUpdateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedVisit = await opdVisitService.updateOpdVisit(id, visitData);
      return updatedVisit;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update OPD visit';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Partially update an existing OPD visit (PATCH).
   *
   * @example
   * const { patchOpdVisit, isLoading } = useOpdVisit();
   * await patchOpdVisit(12, { status: 'in_progress' });
   */
  const patchOpdVisit = useCallback(async (id: number, visitData: Partial<OpdVisitUpdateData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedVisit = await opdVisitService.patchOpdVisit(id, visitData);
      return updatedVisit;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update OPD visit';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Complete an OPD visit.
   *
   * @example
   * const { completeOpdVisit, isLoading } = useOpdVisit();
   * await completeOpdVisit(12, {
   *   diagnosis: 'Hypertension',
   *   treatment_plan: 'Medication',
   *   prescription: 'Lisinopril 10mg'
   * });
   */
  const completeOpdVisit = useCallback(async (id: number, data: CompleteVisitData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const completedVisit = await opdVisitService.completeOpdVisit(id, data);
      return completedVisit;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete OPD visit';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Call next patient in queue.
   *
   * @example
   * const { callNextPatient, isLoading } = useOpdVisit();
   * await callNextPatient();
   */
  const callNextPatient = useCallback(async () => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextPatient = await opdVisitService.callNextPatient();
      return nextPatient;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to call next patient';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete an OPD visit (DELETE).
   *
   * @example
   * const { deleteOpdVisit, isLoading } = useOpdVisit();
   * await deleteOpdVisit(12);
   */
  const deleteOpdVisit = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await opdVisitService.deleteOpdVisit(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete OPD visit';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  return {
    hasHMSAccess,
    isLoading,
    error,

    // OPD Visit CRUD
    useOpdVisits,
    useOpdVisitById,
    useTodayVisits,
    useOpdQueue,
    useOpdVisitStatistics,
    createOpdVisit,
    updateOpdVisit,
    patchOpdVisit,
    completeOpdVisit,
    callNextPatient,
    deleteOpdVisit,
  };
};
