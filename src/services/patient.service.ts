// src/services/patient.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import {
  Patient,
  PatientListParams,
  PatientCreateData,
  PatientUpdateData,
  PaginatedResponse,
  ApiResponse
} from '@/types/patient.types';

class PatientService {
  // ==================== PATIENTS ====================

  // Get patients with optional query parameters
  async getPatients(params?: PatientListParams): Promise<PaginatedResponse<Patient>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Patient>>(
        `${API_CONFIG.HMS.PATIENTS.PROFILES_LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch patients';
      throw new Error(message);
    }
  }

  // Get single patient by ID
  async getPatient(id: number): Promise<Patient> {
    try {
      const response = await hmsClient.get<any>(
        API_CONFIG.HMS.PATIENTS.PROFILE_DETAIL.replace(':id', id.toString())
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch patient';
      throw new Error(message);
    }
  }

  // Create new patient
  async createPatient(patientData: PatientCreateData): Promise<Patient> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.PATIENTS.PROFILE_CREATE,
        patientData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to create patient';
      throw new Error(message);
    }
  }

  // Register new patient (alternative endpoint)
  async registerPatient(patientData: PatientCreateData): Promise<Patient> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.PATIENTS.REGISTER,
        patientData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to register patient';
      throw new Error(message);
    }
  }

  // Update patient (full update)
  async updatePatient(id: number, patientData: PatientUpdateData): Promise<Patient> {
    try {
      const response = await hmsClient.put<any>(
        API_CONFIG.HMS.PATIENTS.PROFILE_UPDATE.replace(':id', id.toString()),
        patientData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to update patient';
      throw new Error(message);
    }
  }

  // Partially update patient (patch)
  async patchPatient(id: number, patientData: Partial<PatientUpdateData>): Promise<Patient> {
    try {
      const response = await hmsClient.patch<any>(
        API_CONFIG.HMS.PATIENTS.PROFILE_UPDATE.replace(':id', id.toString()),
        patientData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to update patient';
      throw new Error(message);
    }
  }

  // Delete patient
  async deletePatient(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.PATIENTS.PROFILE_DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to delete patient';
      throw new Error(message);
    }
  }

  // ==================== PATIENT STATISTICS ====================

  // Get patient statistics
  async getPatientStatistics(): Promise<any> {
    try {
      const response = await hmsClient.get(
        API_CONFIG.HMS.PATIENTS.STATISTICS
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch patient statistics';
      throw new Error(message);
    }
  }
}

export const patientService = new PatientService();
