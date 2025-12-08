// src/hooks/useSpecialty.ts
// ==================== SPECIALTY HOOKS ====================
// Mirrors the Doctor hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { specialtyService } from '@/services/specialty.service';
import {
  Specialty,
  SpecialtyListParams,
  SpecialtyCreateData,
  SpecialtyUpdateData,
  PaginatedResponse
} from '@/types/specialty.types';
import { useAuth } from './useAuth';

export const useSpecialty = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== SPECIALTIES HOOKS ====================

  /**
   * Fetch list of specialties with filters & pagination.
   * Keeps previous page data while loading the next set.
   *
   * @example
   * const { data, error, isLoading, mutate } = useSpecialties({
   *   search: 'cardio',
   *   is_active: true,
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useSpecialties = (params?: SpecialtyListParams) => {
    const key = ['specialties', params];

    return useSWR<PaginatedResponse<Specialty>>(
      key,
      () => specialtyService.getSpecialties(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch specialties:', err);
          setError(err.message || 'Failed to fetch specialties');
        }
      }
    );
  };

  /**
   * Fetch single specialty by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useSpecialtyById(12);
   */
  const useSpecialtyById = (id: number | null) => {
    const key = id ? ['specialty', id] : null;

    return useSWR<Specialty>(
      key,
      () => specialtyService.getSpecialty(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch specialty:', err);
          setError(err.message || 'Failed to fetch specialty');
        }
      }
    );
  };

  /**
   * Create a new specialty (POST).
   *
   * @example
   * const { createSpecialty, isLoading } = useSpecialty();
   * await createSpecialty({ name: 'Cardiology', code: 'CARD', is_active: true });
   */
  const createSpecialty = useCallback(async (specialtyData: SpecialtyCreateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newSpecialty = await specialtyService.createSpecialty(specialtyData);
      return newSpecialty;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create specialty';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Update an existing specialty (PUT - full update).
   *
   * @example
   * const { updateSpecialty, isLoading } = useSpecialty();
   * await updateSpecialty(12, { name: 'Interventional Cardiology', code: 'ICARD' });
   */
  const updateSpecialty = useCallback(async (id: number, specialtyData: SpecialtyUpdateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedSpecialty = await specialtyService.updateSpecialty(id, specialtyData);
      return updatedSpecialty;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update specialty';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Partially update an existing specialty (PATCH).
   *
   * @example
   * const { patchSpecialty, isLoading } = useSpecialty();
   * await patchSpecialty(12, { is_active: false });
   */
  const patchSpecialty = useCallback(async (id: number, specialtyData: Partial<SpecialtyUpdateData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedSpecialty = await specialtyService.patchSpecialty(id, specialtyData);
      return updatedSpecialty;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update specialty';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete a specialty (DELETE).
   *
   * @example
   * const { deleteSpecialty, isLoading } = useSpecialty();
   * await deleteSpecialty(12);
   */
  const deleteSpecialty = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await specialtyService.deleteSpecialty(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete specialty';
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

    // Specialty CRUD
    useSpecialties,
    useSpecialtyById,
    createSpecialty,
    updateSpecialty,
    patchSpecialty,
    deleteSpecialty,
  };
};
