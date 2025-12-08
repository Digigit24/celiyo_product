// src/hooks/useProcedurePackage.ts
// ==================== PROCEDURE PACKAGE HOOKS ====================
// Mirrors the OPD Bill/Visit hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { procedurePackageService } from '@/services/procedurePackage.service';
import {
  ProcedurePackage,
  ProcedurePackageListParams,
  ProcedurePackageCreateData,
  ProcedurePackageUpdateData,
  PaginatedResponse,
} from '@/types/procedurePackage.types';
import { useAuth } from './useAuth';

export const useProcedurePackage = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== PROCEDURE PACKAGES HOOKS ====================

  /**
   * Fetch list of procedure packages with filters & pagination.
   *
   * @example
   * const { data, error, isLoading, mutate } = useProcedurePackages({
   *   is_active: true,
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useProcedurePackages = (params?: ProcedurePackageListParams) => {
    const key = ['procedure-packages', params];

    return useSWR<PaginatedResponse<ProcedurePackage>>(
      key,
      () => procedurePackageService.getProcedurePackages(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch procedure packages:', err);
          setError(err.message || 'Failed to fetch procedure packages');
        },
      }
    );
  };

  /**
   * Fetch single procedure package by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useProcedurePackageById(12);
   */
  const useProcedurePackageById = (id: number | null) => {
    const key = id ? ['procedure-package', id] : null;

    return useSWR<ProcedurePackage>(
      key,
      () => procedurePackageService.getProcedurePackageById(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch procedure package:', err);
          setError(err.message || 'Failed to fetch procedure package');
        },
      }
    );
  };

  /**
   * Fetch active procedure packages.
   *
   * @example
   * const { data, error, isLoading } = useActiveProcedurePackages();
   */
  const useActiveProcedurePackages = () => {
    const params: ProcedurePackageListParams = { is_active: true };
    const key = ['procedure-packages', 'active'];

    return useSWR<PaginatedResponse<ProcedurePackage>>(
      key,
      () => procedurePackageService.getProcedurePackages(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch active procedure packages:', err);
          setError(err.message || 'Failed to fetch active procedure packages');
        },
      }
    );
  };

  /**
   * Fetch active procedure packages with full procedure details.
   *
   * @example
   * const { data, error, isLoading } = useActiveProcedurePackagesExpanded();
   */
  const useActiveProcedurePackagesExpanded = () => {
    const params: ProcedurePackageListParams = { is_active: true };
    const key = ['procedure-packages', 'active', 'expanded'];

    return useSWR<PaginatedResponse<ProcedurePackage>>(
      key,
      () => procedurePackageService.getProcedurePackagesExpanded(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch active procedure packages with details:', err);
          setError(err.message || 'Failed to fetch active procedure packages with details');
        },
      }
    );
  };

  // ==================== MUTATION CALLBACKS ====================

  /**
   * Create a new procedure package.
   *
   * @example
   * const { createPackage } = useProcedurePackage();
   * await createPackage({
   *   name: 'Basic Health Checkup',
   *   code: 'PKG001',
   *   procedures: [1, 2, 3],
   *   total_charge: '5000.00',
   *   discounted_charge: '3999.00',
   * });
   */
  const createPackage = useCallback(
    async (packageData: ProcedurePackageCreateData): Promise<ProcedurePackage | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newPackage = await procedurePackageService.createProcedurePackage(packageData);
        return newPackage;
      } catch (err: any) {
        setError(err.message || 'Failed to create procedure package');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update an existing procedure package.
   *
   * @example
   * const { updatePackage } = useProcedurePackage();
   * await updatePackage(123, { discounted_charge: '3499.00' });
   */
  const updatePackage = useCallback(
    async (id: number, packageData: ProcedurePackageUpdateData): Promise<ProcedurePackage | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedPackage = await procedurePackageService.updateProcedurePackage(id, packageData);
        return updatedPackage;
      } catch (err: any) {
        setError(err.message || 'Failed to update procedure package');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a procedure package.
   *
   * @example
   * const { deletePackage } = useProcedurePackage();
   * await deletePackage(123);
   */
  const deletePackage = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await procedurePackageService.deleteProcedurePackage(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete procedure package');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Query hooks
    useProcedurePackages,
    useProcedurePackageById,
    useActiveProcedurePackages,
    useActiveProcedurePackagesExpanded,

    // Mutation callbacks
    createPackage,
    updatePackage,
    deletePackage,

    // State
    isLoading,
    error,
    hasHMSAccess,
  };
};
