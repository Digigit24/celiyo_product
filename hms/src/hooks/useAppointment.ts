// src/hooks/useAppointment.ts
// ==================== APPOINTMENT HOOKS ====================
// Mirrors the Doctor/Patient hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { appointmentService } from '@/services/appointment.service';
import {
  Appointment,
  AppointmentListParams,
  AppointmentCreateData,
  AppointmentUpdateData,
  AppointmentCancelData,
  AppointmentRescheduleData,
  PaginatedResponse
} from '@/types/appointment.types';
import { useAuth } from './useAuth';

export const useAppointment = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== APPOINTMENTS HOOKS ====================

  /**
   * Fetch list of appointments with filters & pagination.
   * Keeps previous page data while loading the next set.
   *
   * @example
   * const { data, error, isLoading, mutate } = useAppointments({
   *   doctor_id: 1,
   *   status: 'scheduled',
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useAppointments = (params?: AppointmentListParams) => {
    const key = ['appointments', params];

    return useSWR<PaginatedResponse<Appointment>>(
      key,
      () => appointmentService.getAppointments(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch appointments:', err);
          setError(err.message || 'Failed to fetch appointments');
        }
      }
    );
  };

  /**
   * Fetch single appointment by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useAppointmentById(12);
   */
  const useAppointmentById = (id: number | null) => {
    const key = id ? ['appointment', id] : null;

    return useSWR<Appointment>(
      key,
      () => appointmentService.getAppointment(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch appointment:', err);
          setError(err.message || 'Failed to fetch appointment');
        }
      }
    );
  };

  /**
   * Fetch appointments by doctor ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useAppointmentsByDoctor(1);
   */
  const useAppointmentsByDoctor = (doctorId: number | null, params?: AppointmentListParams) => {
    const key = doctorId ? ['appointments-by-doctor', doctorId, params] : null;

    return useSWR<PaginatedResponse<Appointment>>(
      key,
      () => appointmentService.getAppointmentsByDoctor(doctorId!, params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch appointments by doctor:', err);
          setError(err.message || 'Failed to fetch appointments by doctor');
        }
      }
    );
  };

  /**
   * Fetch appointments by patient ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useAppointmentsByPatient(1);
   */
  const useAppointmentsByPatient = (patientId: number | null, params?: AppointmentListParams) => {
    const key = patientId ? ['appointments-by-patient', patientId, params] : null;

    return useSWR<PaginatedResponse<Appointment>>(
      key,
      () => appointmentService.getAppointmentsByPatient(patientId!, params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch appointments by patient:', err);
          setError(err.message || 'Failed to fetch appointments by patient');
        }
      }
    );
  };

  /**
   * Fetch upcoming appointments.
   *
   * @example
   * const { data, error, isLoading, mutate } = useUpcomingAppointments();
   */
  const useUpcomingAppointments = (params?: AppointmentListParams) => {
    const key = ['appointments-upcoming', params];

    return useSWR<PaginatedResponse<Appointment>>(
      key,
      () => appointmentService.getUpcomingAppointments(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch upcoming appointments:', err);
          setError(err.message || 'Failed to fetch upcoming appointments');
        }
      }
    );
  };

  /**
   * Fetch appointment statistics.
   *
   * @example
   * const { data, error, isLoading, mutate } = useAppointmentStatistics();
   */
  const useAppointmentStatistics = () => {
    const key = ['appointment-statistics'];

    return useSWR(
      key,
      () => appointmentService.getAppointmentStatistics(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch appointment statistics:', err);
          setError(err.message || 'Failed to fetch appointment statistics');
        }
      }
    );
  };

  /**
   * Create a new appointment (POST).
   *
   * @example
   * const { createAppointment, isLoading } = useAppointment();
   * await createAppointment({
   *   doctor_id: 1,
   *   patient_id: 2,
   *   appointment_date: '2024-01-15',
   *   appointment_time: '10:00',
   *   ...
   * });
   */
  const createAppointment = useCallback(async (appointmentData: AppointmentCreateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newAppointment = await appointmentService.createAppointment(appointmentData);
      return newAppointment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create appointment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Update an existing appointment (PUT - full update).
   *
   * @example
   * const { updateAppointment, isLoading } = useAppointment();
   * await updateAppointment(12, { status: 'confirmed', notes: 'Updated' });
   */
  const updateAppointment = useCallback(async (id: number, appointmentData: AppointmentUpdateData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedAppointment = await appointmentService.updateAppointment(id, appointmentData);
      return updatedAppointment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update appointment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Partially update an existing appointment (PATCH).
   *
   * @example
   * const { patchAppointment, isLoading } = useAppointment();
   * await patchAppointment(12, { status: 'confirmed' });
   */
  const patchAppointment = useCallback(async (id: number, appointmentData: Partial<AppointmentUpdateData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedAppointment = await appointmentService.patchAppointment(id, appointmentData);
      return updatedAppointment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update appointment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Cancel an appointment.
   *
   * @example
   * const { cancelAppointment, isLoading } = useAppointment();
   * await cancelAppointment(12, { cancellation_reason: 'Patient unavailable' });
   */
  const cancelAppointment = useCallback(async (id: number, data: AppointmentCancelData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const cancelledAppointment = await appointmentService.cancelAppointment(id, data);
      return cancelledAppointment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to cancel appointment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Complete an appointment.
   *
   * @example
   * const { completeAppointment, isLoading } = useAppointment();
   * await completeAppointment(12, { diagnosis: '...', prescription: '...' });
   */
  const completeAppointment = useCallback(async (id: number, data?: Partial<AppointmentUpdateData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const completedAppointment = await appointmentService.completeAppointment(id, data);
      return completedAppointment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete appointment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Reschedule an appointment.
   *
   * @example
   * const { rescheduleAppointment, isLoading } = useAppointment();
   * await rescheduleAppointment(12, {
   *   new_appointment_date: '2024-01-20',
   *   new_appointment_time: '14:00',
   *   reason: 'Doctor unavailable'
   * });
   */
  const rescheduleAppointment = useCallback(async (id: number, data: AppointmentRescheduleData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const rescheduledAppointment = await appointmentService.rescheduleAppointment(id, data);
      return rescheduledAppointment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reschedule appointment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete an appointment (DELETE).
   *
   * @example
   * const { deleteAppointment, isLoading } = useAppointment();
   * await deleteAppointment(12);
   */
  const deleteAppointment = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await appointmentService.deleteAppointment(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete appointment';
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

    // Appointment CRUD
    useAppointments,
    useAppointmentById,
    useAppointmentsByDoctor,
    useAppointmentsByPatient,
    useUpcomingAppointments,
    useAppointmentStatistics,
    createAppointment,
    updateAppointment,
    patchAppointment,
    cancelAppointment,
    completeAppointment,
    rescheduleAppointment,
    deleteAppointment,
  };
};
