// src/services/appointment.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import {
  Appointment,
  AppointmentListParams,
  AppointmentCreateData,
  AppointmentUpdateData,
  AppointmentCancelData,
  AppointmentRescheduleData,
  PaginatedResponse,
  ApiResponse
} from '@/types/appointment.types';

class AppointmentService {
  // ==================== APPOINTMENTS ====================

  // Get appointments with optional query parameters
  async getAppointments(params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Appointment>>(
        `${API_CONFIG.HMS.APPOINTMENTS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch appointments';
      throw new Error(message);
    }
  }

  // Get single appointment by ID
  async getAppointment(id: number): Promise<Appointment> {
    try {
      const response = await hmsClient.get<Appointment>(
        API_CONFIG.HMS.APPOINTMENTS.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch appointment';
      throw new Error(message);
    }
  }

  // Get appointments by doctor ID
  async getAppointmentsByDoctor(doctorId: number, params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Appointment>>(
        `${API_CONFIG.HMS.APPOINTMENTS.BY_DOCTOR.replace(':doctor_id', doctorId.toString())}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch appointments by doctor';
      throw new Error(message);
    }
  }

  // Get appointments by patient ID
  async getAppointmentsByPatient(patientId: number, params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
    try {
      // Use the generic appointments list endpoint with patient_id as query parameter
      const queryParams = { ...params, patient_id: patientId };
      const queryString = buildQueryString(queryParams);
      const response = await hmsClient.get<PaginatedResponse<Appointment>>(
        `${API_CONFIG.HMS.APPOINTMENTS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch appointments by patient';
      throw new Error(message);
    }
  }

  // Get upcoming appointments
  async getUpcomingAppointments(params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Appointment>>(
        `${API_CONFIG.HMS.APPOINTMENTS.UPCOMING}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch upcoming appointments';
      throw new Error(message);
    }
  }

  // Create new appointment
  async createAppointment(appointmentData: AppointmentCreateData): Promise<Appointment> {
    try {
      const response = await hmsClient.post<Appointment>(
        API_CONFIG.HMS.APPOINTMENTS.CREATE,
        appointmentData
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to create appointment';
      throw new Error(message);
    }
  }

  // Update appointment (full update)
  async updateAppointment(id: number, appointmentData: AppointmentUpdateData): Promise<Appointment> {
    try {
      const response = await hmsClient.put<Appointment>(
        API_CONFIG.HMS.APPOINTMENTS.UPDATE.replace(':id', id.toString()),
        appointmentData
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to update appointment';
      throw new Error(message);
    }
  }

  // Partially update appointment (patch)
  async patchAppointment(id: number, appointmentData: Partial<AppointmentUpdateData>): Promise<Appointment> {
    try {
      const response = await hmsClient.patch<Appointment>(
        API_CONFIG.HMS.APPOINTMENTS.UPDATE.replace(':id', id.toString()),
        appointmentData
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to update appointment';
      throw new Error(message);
    }
  }

  // Cancel appointment
  async cancelAppointment(id: number, data: AppointmentCancelData): Promise<Appointment> {
    try {
      const response = await hmsClient.post<Appointment>(
        API_CONFIG.HMS.APPOINTMENTS.CANCEL.replace(':id', id.toString()),
        data
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to cancel appointment';
      throw new Error(message);
    }
  }

  // Complete appointment
  async completeAppointment(id: number, data?: Partial<AppointmentUpdateData>): Promise<Appointment> {
    try {
      const response = await hmsClient.post<Appointment>(
        API_CONFIG.HMS.APPOINTMENTS.COMPLETE.replace(':id', id.toString()),
        data || {}
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to complete appointment';
      throw new Error(message);
    }
  }

  // Reschedule appointment
  async rescheduleAppointment(id: number, data: AppointmentRescheduleData): Promise<Appointment> {
    try {
      const response = await hmsClient.post<Appointment>(
        API_CONFIG.HMS.APPOINTMENTS.RESCHEDULE.replace(':id', id.toString()),
        data
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to reschedule appointment';
      throw new Error(message);
    }
  }

  // Delete appointment
  async deleteAppointment(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.APPOINTMENTS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to delete appointment';
      throw new Error(message);
    }
  }

  // ==================== APPOINTMENT STATISTICS ====================

  // Get appointment statistics
  async getAppointmentStatistics(): Promise<any> {
    try {
      const response = await hmsClient.get(
        API_CONFIG.HMS.APPOINTMENTS.STATISTICS
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch appointment statistics';
      throw new Error(message);
    }
  }
}

export const appointmentService = new AppointmentService();
