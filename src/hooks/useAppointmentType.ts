// src/hooks/useAppointmentType.ts
import useSWR from 'swr';
import { toast } from 'sonner';
import { appointmentTypeService } from '@/services/appointmentType.service';
import type {
  AppointmentType,
  AppointmentTypeListParams,
  AppointmentTypeCreateData,
  AppointmentTypeUpdateData,
  PaginatedResponse,
} from '@/types/appointmentType.types';

export const useAppointmentType = () => {
  // ==================== SWR Hooks ====================

  /**
   * Hook to fetch appointment types list with optional query params
   */
  const useAppointmentTypes = (params?: AppointmentTypeListParams) => {
    const queryKey = params ? `/appointment-types?${JSON.stringify(params)}` : '/appointment-types';

    return useSWR<PaginatedResponse<AppointmentType>>(
      queryKey,
      () => appointmentTypeService.getAppointmentTypes(params),
      {
        revalidateOnFocus: false,
        dedupingInterval: 5000,
      }
    );
  };

  /**
   * Hook to fetch a single appointment type by ID
   */
  const useAppointmentTypeById = (id: number | null) => {
    return useSWR<AppointmentType>(
      id ? `/appointment-types/${id}` : null,
      () => (id ? appointmentTypeService.getAppointmentType(id) : Promise.reject('No ID')),
      {
        revalidateOnFocus: false,
      }
    );
  };

  // ==================== Mutation Functions ====================

  /**
   * Create a new appointment type
   */
  const createAppointmentType = async (data: AppointmentTypeCreateData): Promise<AppointmentType> => {
    try {
      const newAppointmentType = await appointmentTypeService.createAppointmentType(data);
      return newAppointmentType;
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Update an existing appointment type
   */
  const updateAppointmentType = async (
    id: number,
    data: AppointmentTypeUpdateData
  ): Promise<AppointmentType> => {
    try {
      const updatedAppointmentType = await appointmentTypeService.updateAppointmentType(id, data);
      return updatedAppointmentType;
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Delete an appointment type
   */
  const deleteAppointmentType = async (id: number): Promise<void> => {
    try {
      await appointmentTypeService.deleteAppointmentType(id);
    } catch (error: any) {
      throw error;
    }
  };

  return {
    // SWR Hooks
    useAppointmentTypes,
    useAppointmentTypeById,

    // Mutation Functions
    createAppointmentType,
    updateAppointmentType,
    deleteAppointmentType,
  };
};

export default useAppointmentType;
