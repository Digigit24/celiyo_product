// src/services/opdVisit.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import {
  OpdVisit,
  OpdVisitListParams,
  OpdVisitCreateData,
  OpdVisitUpdateData,
  CompleteVisitData,
  OpdVisitStatistics,
  QueueItem,
  PaginatedResponse,
  ApiResponse
} from '@/types/opdVisit.types';

class OpdVisitService {
  // ==================== OPD VISITS ====================

  // Get OPD visits with optional query parameters
  async getOpdVisits(params?: OpdVisitListParams): Promise<PaginatedResponse<OpdVisit>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<OpdVisit>>(
        `${API_CONFIG.HMS.OPD.VISITS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch OPD visits';
      throw new Error(message);
    }
  }

  // Get single OPD visit by ID
  async getOpdVisit(id: number): Promise<OpdVisit> {
    try {
      const response = await hmsClient.get<any>(
        API_CONFIG.HMS.OPD.VISITS.DETAIL.replace(':id', id.toString())
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch OPD visit';
      throw new Error(message);
    }
  }

  // Get today's OPD visits
  async getTodayVisits(params?: OpdVisitListParams): Promise<PaginatedResponse<OpdVisit>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<OpdVisit>>(
        `${API_CONFIG.HMS.OPD.VISITS.TODAY}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch today\'s visits';
      throw new Error(message);
    }
  }

  // Get queue
  async getQueue(): Promise<QueueItem[]> {
    try {
      const response = await hmsClient.get<QueueItem[]>(
        API_CONFIG.HMS.OPD.VISITS.QUEUE
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch queue';
      throw new Error(message);
    }
  }

  // Create new OPD visit
  async createOpdVisit(visitData: OpdVisitCreateData): Promise<OpdVisit> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.OPD.VISITS.CREATE,
        visitData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to create OPD visit';
      throw new Error(message);
    }
  }

  // Update OPD visit (full update)
  async updateOpdVisit(id: number, visitData: OpdVisitUpdateData): Promise<OpdVisit> {
    try {
      const response = await hmsClient.put<any>(
        API_CONFIG.HMS.OPD.VISITS.UPDATE.replace(':id', id.toString()),
        visitData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to update OPD visit';
      throw new Error(message);
    }
  }

  // Partially update OPD visit (patch)
  async patchOpdVisit(id: number, visitData: Partial<OpdVisitUpdateData>): Promise<OpdVisit> {
    try {
      const response = await hmsClient.patch<any>(
        API_CONFIG.HMS.OPD.VISITS.UPDATE.replace(':id', id.toString()),
        visitData
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to update OPD visit';
      throw new Error(message);
    }
  }

  // Complete OPD visit
  async completeOpdVisit(id: number, data: CompleteVisitData): Promise<OpdVisit> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.OPD.VISITS.COMPLETE.replace(':id', id.toString()),
        data
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to complete OPD visit';
      throw new Error(message);
    }
  }

  // Call next patient
  async callNextPatient(): Promise<OpdVisit> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.OPD.VISITS.CALL_NEXT
      );
      // API returns {success: true, data: {...}}, so we need to unwrap it
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to call next patient';
      throw new Error(message);
    }
  }

  // Delete OPD visit
  async deleteOpdVisit(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.OPD.VISITS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to delete OPD visit';
      throw new Error(message);
    }
  }

  // ==================== OPD VISIT STATISTICS ====================

  // Get OPD visit statistics
  async getOpdVisitStatistics(): Promise<OpdVisitStatistics> {
    try {
      const response = await hmsClient.get<OpdVisitStatistics>(
        API_CONFIG.HMS.OPD.VISITS.STATISTICS
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
                     error.response?.data?.message ||
                     'Failed to fetch OPD visit statistics';
      throw new Error(message);
    }
  }
}

export const opdVisitService = new OpdVisitService();
