// src/services/appointmentType.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import {
  AppointmentType,
  AppointmentTypeListParams,
  AppointmentTypeCreateData,
  AppointmentTypeUpdateData,
  PaginatedResponse,
} from '@/types/appointmentType.types';

class AppointmentTypeService {
  // ==================== APPOINTMENT TYPES ====================

  // Get appointment types with optional query parameters
  async getAppointmentTypes(params?: AppointmentTypeListParams): Promise<PaginatedResponse<AppointmentType>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<AppointmentType>>(
        `${API_CONFIG.HMS.APPOINTMENT_TYPES.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch appointment types';
      throw new Error(message);
    }
  }

  // Get single appointment type by ID
  async getAppointmentType(id: number): Promise<AppointmentType> {
    try {
      const response = await hmsClient.get<AppointmentType>(
        API_CONFIG.HMS.APPOINTMENT_TYPES.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch appointment type';
      throw new Error(message);
    }
  }

  // Create new appointment type
  async createAppointmentType(data: AppointmentTypeCreateData): Promise<AppointmentType> {
    try {
      const response = await hmsClient.post<AppointmentType>(
        API_CONFIG.HMS.APPOINTMENT_TYPES.CREATE,
        data
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to create appointment type';
      throw new Error(message);
    }
  }

  // Update appointment type
  async updateAppointmentType(id: number, data: AppointmentTypeUpdateData): Promise<AppointmentType> {
    try {
      const response = await hmsClient.patch<AppointmentType>(
        API_CONFIG.HMS.APPOINTMENT_TYPES.UPDATE.replace(':id', id.toString()),
        data
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to update appointment type';
      throw new Error(message);
    }
  }

  // Delete appointment type
  async deleteAppointmentType(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.APPOINTMENT_TYPES.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to delete appointment type';
      throw new Error(message);
    }
  }
}

export const appointmentTypeService = new AppointmentTypeService();
export default appointmentTypeService;
