// src/hooks/usePatient.ts
// ==================== PATIENT HOOKS ====================
// Mirrors the Doctor hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { patientService } from '@/services/patient.service';
import {
  Patient,
  PatientListParams,
  PatientCreateData,
  PatientUpdateData,
  PaginatedResponse
} from '@/types/patient.types';
import { useAuth } from './useAuth';

export const usePatient = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== PATIENTS HOOKS ====================

  /**
   * Fetch list of patients with filters & pagination.
   * Keeps previous page data while loading the next set.
   *
   * @example
   * const { data, error, isLoading, mutate } = usePatients({
   *   search: 'john',
   *   gender: 'male',
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const usePatients = (params?: PatientListParams) => {
    const key = ['patients', params];

    return useSWR<PaginatedResponse<Patient>>(
      key,
      () => patientService.getPatients(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch patients:', err);
          setError(err.message || 'Failed to fetch patients');
        }
      }
    );
  };

  /**
   * Fetch single patient by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = usePatientById(12);
   */
  const usePatientById = (id: number | null) => {
    const key = id ? ['patient', id] : null;

    return useSWR<Patient>(
      key,
      () => patientService.getPatient(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch patient:', err);
          setError(err.message || 'Failed to fetch patient');
        }
      }
    );
  };

  /**
   * Fetch patient statistics.
   *
   * @example
   * const { data, error, isLoading, mutate } = usePatientStatistics();
   */
  const usePatientStatistics = () => {
    const key = ['patient-statistics'];

    return useSWR(
      key,
      () => patientService.getPatientStatistics(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch patient statistics:', err);
          setError(err.message || 'Failed to fetch patient statistics');
        }
      }
    );
  };

  /**
   * Create a new patient (POST).
   *
   * @example
   * const { createPatient, isLoading } = usePatient();
   * await createPatient({
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   email: 'john@example.com',
   *   ...
   * });
   */
  const createPatient = useCallback(async (patientData: PatientCreateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPatient = await patientService.createPatient(patientData);
      return newPatient;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create patient';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Register a new patient (alternative endpoint).
   *
   * @example
   * const { registerPatient, isLoading } = usePatient();
   * await registerPatient({
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   email: 'john@example.com',
   *   ...
   * });
   */
  const registerPatient = useCallback(async (patientData: PatientCreateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPatient = await patientService.registerPatient(patientData);
      return newPatient;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to register patient';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Update an existing patient (PUT - full update).
   *
   * @example
   * const { updatePatient, isLoading } = usePatient();
   * await updatePatient(12, { phone: '1234567890', address: 'New Address' });
   */
  const updatePatient = useCallback(async (id: number, patientData: PatientUpdateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedPatient = await patientService.updatePatient(id, patientData);
      return updatedPatient;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update patient';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Partially update an existing patient (PATCH).
   *
   * @example
   * const { patchPatient, isLoading } = usePatient();
   * await patchPatient(12, { is_active: false });
   */
  const patchPatient = useCallback(async (id: number, patientData: Partial<PatientUpdateData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedPatient = await patientService.patchPatient(id, patientData);
      return updatedPatient;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update patient';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete a patient (DELETE).
   *
   * @example
   * const { deletePatient, isLoading } = usePatient();
   * await deletePatient(12);
   */
  const deletePatient = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await patientService.deletePatient(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete patient';
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

    // Patient CRUD
    usePatients,
    usePatientById,
    usePatientStatistics,
    createPatient,
    registerPatient,
    updatePatient,
    patchPatient,
    deletePatient,
  };
};
