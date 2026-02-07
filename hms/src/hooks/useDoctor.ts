// src/hooks/useDoctor.ts
import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { doctorService } from '@/services/doctorService';
import {
  Doctor,
  Specialty,
  DoctorListParams,
  DoctorCreateData,
  DoctorUpdateData,
  SetAvailabilityData,
  PaginatedResponse
} from '@/types/doctor.types';
import { useAuth } from './useAuth';

export const useDoctor = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== DOCTORS HOOKS ====================
  
  // Get doctors with SWR caching
  const useDoctors = (params?: DoctorListParams) => {
    const key = ['doctors', params];
    
    return useSWR<PaginatedResponse<Doctor>>(
      key,
      () => doctorService.getDoctors(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch doctors:', err);
          setError(err.message || 'Failed to fetch doctors');
        }
      }
    );
  };

  // Get single doctor with SWR caching
  const useDoctor = (id: number | null) => {
    const key = id ? ['doctor', id] : null;
    
    return useSWR<Doctor>(
      key,
      () => doctorService.getDoctor(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch doctor:', err);
          setError(err.message || 'Failed to fetch doctor');
        }
      }
    );
  };

  // Create doctor
  const createDoctor = useCallback(async (doctorData: DoctorCreateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newDoctor = await doctorService.createDoctor(doctorData);
      return newDoctor;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create doctor';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // Register doctor (alternative endpoint)
  const registerDoctor = useCallback(async (doctorData: DoctorCreateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newDoctor = await doctorService.registerDoctor(doctorData);
      return newDoctor;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to register doctor';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // Update doctor
  const updateDoctor = useCallback(async (id: number, doctorData: DoctorUpdateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedDoctor = await doctorService.updateDoctor(id, doctorData);
      return updatedDoctor;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update doctor';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // Patch doctor
  const patchDoctor = useCallback(async (id: number, doctorData: Partial<DoctorUpdateData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedDoctor = await doctorService.patchDoctor(id, doctorData);
      return updatedDoctor;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update doctor';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // Delete doctor
  const deleteDoctor = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await doctorService.deleteDoctor(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete doctor';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // ==================== DOCTOR AVAILABILITY HOOKS ====================
  
  // Get doctor availability with SWR caching
  const useDoctorAvailability = (doctorId: number | null) => {
    const key = doctorId ? ['doctor-availability', doctorId] : null;
    
    return useSWR(
      key,
      () => doctorService.getDoctorAvailability(doctorId!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch doctor availability:', err);
          setError(err.message || 'Failed to fetch doctor availability');
        }
      }
    );
  };

  // Set doctor availability
  const setDoctorAvailability = useCallback(async (doctorId: number, availabilityData: SetAvailabilityData[]) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await doctorService.setDoctorAvailability(doctorId, availabilityData);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to set doctor availability';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // ==================== DOCTOR STATISTICS HOOKS ====================
  
  // Get doctor statistics with SWR caching
  const useDoctorStatistics = () => {
    const key = ['doctor-statistics'];
    
    return useSWR(
      key,
      () => doctorService.getDoctorStatistics(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch doctor statistics:', err);
          setError(err.message || 'Failed to fetch doctor statistics');
        }
      }
    );
  };

  // ==================== SPECIALTIES HOOKS ====================
  
  // Get specialties with SWR caching
  const useSpecialties = (params?: Record<string, any>) => {
    const key = ['specialties', params];
    
    return useSWR<PaginatedResponse<Specialty>>(
      key,
      () => doctorService.getSpecialties(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch specialties:', err);
          setError(err.message || 'Failed to fetch specialties');
        }
      }
    );
  };

  // Get single specialty with SWR caching
  const useSpecialty = (id: number | null) => {
    const key = id ? ['specialty', id] : null;
    
    return useSWR<Specialty>(
      key,
      () => doctorService.getSpecialty(id!),
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

  // Create specialty
  const createSpecialty = useCallback(async (specialtyData: Partial<Specialty>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newSpecialty = await doctorService.createSpecialty(specialtyData);
      return newSpecialty;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create specialty';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // Update specialty
  const updateSpecialty = useCallback(async (id: number, specialtyData: Partial<Specialty>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedSpecialty = await doctorService.updateSpecialty(id, specialtyData);
      return updatedSpecialty;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update specialty';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // Delete specialty
  const deleteSpecialty = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await doctorService.deleteSpecialty(id);
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
    
    // Doctors
    useDoctors,
    useDoctor,
    createDoctor,
    registerDoctor,
    updateDoctor,
    patchDoctor,
    deleteDoctor,
    
    // Doctor Availability
    useDoctorAvailability,
    setDoctorAvailability,
    
    // Doctor Statistics
    useDoctorStatistics,
    
    // Specialties
    useSpecialties,
    useSpecialty,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
  };
};