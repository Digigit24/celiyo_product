// src/hooks/useVisitFinding.ts
// ==================== VISIT FINDING HOOKS ====================
// Mirrors the OPD Bill/Visit hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { visitFindingService } from '@/services/visitFinding.service';
import {
  VisitFinding,
  VisitFindingListParams,
  VisitFindingCreateData,
  VisitFindingUpdateData,
  PaginatedResponse,
} from '@/types/visitFinding.types';
import { useAuth } from './useAuth';

export const useVisitFinding = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== VISIT FINDINGS HOOKS ====================

  /**
   * Fetch list of visit findings with filters & pagination.
   *
   * @example
   * const { data, error, isLoading, mutate } = useVisitFindings({
   *   visit: 123,
   *   finding_type: 'examination',
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useVisitFindings = (params?: VisitFindingListParams) => {
    const key = ['visit-findings', params];

    return useSWR<PaginatedResponse<VisitFinding>>(
      key,
      () => visitFindingService.getVisitFindings(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch visit findings:', err);
          setError(err.message || 'Failed to fetch visit findings');
        },
      }
    );
  };

  /**
   * Fetch single visit finding by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useVisitFindingById(12);
   */
  const useVisitFindingById = (id: number | null) => {
    const key = id ? ['visit-finding', id] : null;

    return useSWR<VisitFinding>(
      key,
      () => visitFindingService.getVisitFindingById(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch visit finding:', err);
          setError(err.message || 'Failed to fetch visit finding');
        },
      }
    );
  };

  /**
   * Fetch findings for a specific visit.
   *
   * @example
   * const { data, error, isLoading } = useFindingsByVisit(123);
   */
  const useFindingsByVisit = (visitId: number | null) => {
    const params = visitId ? { visit: visitId } : undefined;
    const key = visitId ? ['visit-findings', 'by-visit', visitId] : null;

    return useSWR<PaginatedResponse<VisitFinding>>(
      key,
      () => visitFindingService.getVisitFindings(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch visit findings:', err);
          setError(err.message || 'Failed to fetch visit findings');
        },
      }
    );
  };

  /**
   * Fetch latest vital signs for a visit.
   *
   * @example
   * const { data, error, isLoading } = useLatestVitals(123);
   */
  const useLatestVitals = (visitId: number | null) => {
    const params = visitId
      ? {
          visit: visitId,
          finding_type: 'examination' as const,
          ordering: '-finding_date',
        }
      : undefined;
    const key = visitId ? ['visit-findings', 'vitals', visitId] : null;

    return useSWR<VisitFinding | null>(
      key,
      async () => {
        if (!visitId) return null;
        const response = await visitFindingService.getVisitFindings(params);
        // Get the most recent vital signs
        return response.results?.[0] || null;
      },
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch latest vitals:', err);
          setError(err.message || 'Failed to fetch latest vitals');
        },
      }
    );
  };

  // ==================== MUTATION CALLBACKS ====================

  /**
   * Create a new visit finding.
   *
   * @example
   * const { createFinding } = useVisitFinding();
   * await createFinding({
   *   visit: 123,
   *   finding_type: 'examination',
   *   temperature: '98.6',
   *   pulse: 72,
   * });
   */
  const createFinding = useCallback(
    async (findingData: VisitFindingCreateData): Promise<VisitFinding | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newFinding = await visitFindingService.createVisitFinding(findingData);
        return newFinding;
      } catch (err: any) {
        setError(err.message || 'Failed to create visit finding');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update an existing visit finding.
   *
   * @example
   * const { updateFinding } = useVisitFinding();
   * await updateFinding(123, { temperature: '99.2' });
   */
  const updateFinding = useCallback(
    async (id: number, findingData: VisitFindingUpdateData): Promise<VisitFinding | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedFinding = await visitFindingService.updateVisitFinding(id, findingData);
        return updatedFinding;
      } catch (err: any) {
        setError(err.message || 'Failed to update visit finding');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a visit finding.
   *
   * @example
   * const { deleteFinding } = useVisitFinding();
   * await deleteFinding(123);
   */
  const deleteFinding = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await visitFindingService.deleteVisitFinding(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete visit finding');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Query hooks
    useVisitFindings,
    useVisitFindingById,
    useFindingsByVisit,
    useLatestVitals,

    // Mutation callbacks
    createFinding,
    updateFinding,
    deleteFinding,

    // State
    isLoading,
    error,
    hasHMSAccess,
  };
};
