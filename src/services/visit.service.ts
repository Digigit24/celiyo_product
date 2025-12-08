// src/services/visit.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  Visit,
  VisitCreateData,
  VisitUpdateData,
  VisitListParams,
  VisitStatistics,
  PaginatedResponse,
  ApiResponse,
} from '@/types/visit.types';

class VisitService {
  // ==================== VISITS ====================

  // Get visits with optional query parameters
  async getVisits(params?: VisitListParams): Promise<PaginatedResponse<Visit>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Visit>>(
        `${API_CONFIG.HMS.OPD.VISITS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch visits';
      throw new Error(message);
    }
  }

  // Get single visit by ID
  async getVisit(id: number): Promise<Visit> {
    try {
      const response = await hmsClient.get<Visit>(
        API_CONFIG.HMS.OPD.VISITS.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch visit';
      throw new Error(message);
    }
  }

  // Create new visit
  async createVisit(visitData: VisitCreateData): Promise<Visit> {
    try {
      const response = await hmsClient.post<ApiResponse<Visit>>(
        API_CONFIG.HMS.OPD.VISITS.CREATE,
        visitData
      );
      // Handle both wrapped and direct responses
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create visit';
      throw new Error(message);
    }
  }

  // Update visit (full update)
  async updateVisit(id: number, visitData: VisitUpdateData): Promise<Visit> {
    try {
      const response = await hmsClient.put<ApiResponse<Visit>>(
        API_CONFIG.HMS.OPD.VISITS.UPDATE.replace(':id', id.toString()),
        visitData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update visit';
      throw new Error(message);
    }
  }

  // Partially update visit (patch)
  async patchVisit(
    id: number,
    visitData: Partial<VisitUpdateData>
  ): Promise<Visit> {
    try {
      const response = await hmsClient.patch<ApiResponse<Visit>>(
        API_CONFIG.HMS.OPD.VISITS.UPDATE.replace(':id', id.toString()),
        visitData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update visit';
      throw new Error(message);
    }
  }

  // Delete visit
  async deleteVisit(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.OPD.VISITS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete visit';
      throw new Error(message);
    }
  }

  // ==================== VISIT ACTIONS ====================

  // Get today's visits
  async getTodayVisits(): Promise<Visit[]> {
    try {
      const response = await hmsClient.get<{
        success: boolean;
        count: number;
        data: Visit[];
      }>(API_CONFIG.HMS.OPD.VISITS.TODAY);
      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to fetch today's visits";
      throw new Error(message);
    }
  }

  // Get queue status
  async getQueue(): Promise<{
    waiting: Visit[];
    called: Visit[];
    in_consultation: Visit[];
  }> {
    try {
      const response = await hmsClient.get<{
        success: boolean;
        data: Visit[];
      }>(API_CONFIG.HMS.OPD.VISITS.QUEUE);

      // Split by status on frontend
      const allVisits = response.data.data || [];
      return {
        waiting: allVisits.filter((v) => v.status === 'waiting'),
        called: allVisits.filter((v) => v.status === 'called'),
        in_consultation: allVisits.filter((v) => v.status === 'in_consultation'),
      };
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch queue';
      throw new Error(message);
    }
  }

  // Call next patient
  async callNextPatient(): Promise<{
    success: boolean;
    message: string;
    data: Visit | null;
  }> {
    try {
      const response = await hmsClient.post(
        API_CONFIG.HMS.OPD.VISITS.CALL_NEXT
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to call next patient';
      throw new Error(message);
    }
  }

  // Complete visit
  async completeVisit(id: number): Promise<Visit> {
    try {
      const response = await hmsClient.post<ApiResponse<Visit>>(
        API_CONFIG.HMS.OPD.VISITS.COMPLETE.replace(':id', id.toString())
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to complete visit';
      throw new Error(message);
    }
  }

  // Get visit statistics
  async getVisitStatistics(period: 'day' | 'week' | 'month' = 'day'): Promise<VisitStatistics> {
    try {
      const response = await hmsClient.get<ApiResponse<VisitStatistics>>(
        API_CONFIG.HMS.OPD.VISITS.STATISTICS,
        { params: { period } }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch visit statistics';
      throw new Error(message);
    }
  }
}

export const visitService = new VisitService();
