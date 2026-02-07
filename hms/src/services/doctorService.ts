// src/services/doctorService.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import {
  Doctor,
  Specialty,
  DoctorListParams,
  DoctorCreateData,
  DoctorUpdateData,
  SetAvailabilityData,
  PaginatedResponse,
  ApiResponse
} from '@/types/doctor.types';

class DoctorService {
  // ==================== DOCTORS ====================
  
  // Get doctors with optional query parameters
  async getDoctors(params?: DoctorListParams): Promise<PaginatedResponse<Doctor>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Doctor>>(
        `${API_CONFIG.HMS.DOCTORS.PROFILES_LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to fetch doctors';
      throw new Error(message);
    }
  }

  // Get single doctor by ID
  async getDoctor(id: number): Promise<Doctor> {
    try {
      const response = await hmsClient.get<any>(
        API_CONFIG.HMS.DOCTORS.PROFILE_DETAIL.replace(':id', id.toString())
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch doctor';
      throw new Error(message);
    }
  }

  // Create new doctor
  async createDoctor(doctorData: DoctorCreateData): Promise<Doctor> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.DOCTORS.PROFILE_CREATE,
        doctorData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to create doctor';
      throw new Error(message);
    }
  }

  // Register new doctor (alternative endpoint)
  async registerDoctor(doctorData: DoctorCreateData): Promise<Doctor> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.DOCTORS.REGISTER,
        doctorData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to register doctor';
      throw new Error(message);
    }
  }

  // Update doctor (full update)
  async updateDoctor(id: number, doctorData: DoctorUpdateData): Promise<Doctor> {
    try {
      const response = await hmsClient.put<any>(
        API_CONFIG.HMS.DOCTORS.PROFILE_UPDATE.replace(':id', id.toString()),
        doctorData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to update doctor';
      throw new Error(message);
    }
  }

  // Partially update doctor
  async patchDoctor(id: number, doctorData: Partial<DoctorUpdateData>): Promise<Doctor> {
    try {
      const response = await hmsClient.patch<any>(
        API_CONFIG.HMS.DOCTORS.PROFILE_UPDATE.replace(':id', id.toString()),
        doctorData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to update doctor';
      throw new Error(message);
    }
  }

  // Delete doctor
  async deleteDoctor(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.DOCTORS.PROFILE_DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to delete doctor';
      throw new Error(message);
    }
  }

  // ==================== DOCTOR AVAILABILITY ====================
  
  // Get doctor availability
  async getDoctorAvailability(doctorId: number): Promise<any> {
    try {
      const response = await hmsClient.get(
        API_CONFIG.HMS.DOCTORS.AVAILABILITY_LIST.replace(':id', doctorId.toString())
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to fetch doctor availability';
      throw new Error(message);
    }
  }

  // Set doctor availability
  async setDoctorAvailability(doctorId: number, availabilityData: SetAvailabilityData[]): Promise<any> {
    try {
      const response = await hmsClient.post(
        API_CONFIG.HMS.DOCTORS.AVAILABILITY_CREATE.replace(':id', doctorId.toString()),
        { availability: availabilityData }
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to set doctor availability';
      throw new Error(message);
    }
  }

  // ==================== DOCTOR STATISTICS ====================
  
  // Get doctor statistics
  async getDoctorStatistics(): Promise<any> {
    try {
      const response = await hmsClient.get(
        API_CONFIG.HMS.DOCTORS.STATISTICS
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to fetch doctor statistics';
      throw new Error(message);
    }
  }

  // ==================== SPECIALTIES ====================
  
  // Get specialties with optional query parameters
  async getSpecialties(params?: Record<string, any>): Promise<PaginatedResponse<Specialty>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Specialty>>(
        `${API_CONFIG.HMS.DOCTORS.SPECIALTIES_LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to fetch specialties';
      throw new Error(message);
    }
  }

  // Get single specialty by ID
  async getSpecialty(id: number): Promise<Specialty> {
    try {
      const response = await hmsClient.get<Specialty>(
        API_CONFIG.HMS.DOCTORS.SPECIALTY_DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to fetch specialty';
      throw new Error(message);
    }
  }

  // Create new specialty
  async createSpecialty(specialtyData: Partial<Specialty>): Promise<Specialty> {
    try {
      const response = await hmsClient.post<Specialty>(
        API_CONFIG.HMS.DOCTORS.SPECIALTY_CREATE,
        specialtyData
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to create specialty';
      throw new Error(message);
    }
  }

  // Update specialty
  async updateSpecialty(id: number, specialtyData: Partial<Specialty>): Promise<Specialty> {
    try {
      const response = await hmsClient.put<Specialty>(
        API_CONFIG.HMS.DOCTORS.SPECIALTY_UPDATE.replace(':id', id.toString()),
        specialtyData
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to update specialty';
      throw new Error(message);
    }
  }

  // Delete specialty
  async deleteSpecialty(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.DOCTORS.SPECIALTY_DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Failed to delete specialty';
      throw new Error(message);
    }
  }
}

export const doctorService = new DoctorService();