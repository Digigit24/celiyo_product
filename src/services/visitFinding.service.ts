// src/services/visitFinding.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  VisitFinding,
  VisitFindingCreateData,
  VisitFindingUpdateData,
  VisitFindingListParams,
  PaginatedResponse,
} from '@/types/visitFinding.types';

interface ApiResponse<T> {
  data?: T;
  [key: string]: any;
}

class VisitFindingService {
  // ==================== VISIT FINDINGS ====================

  // Get visit findings with optional query parameters
  async getVisitFindings(params?: VisitFindingListParams): Promise<PaginatedResponse<VisitFinding>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<VisitFinding>>(
        `${API_CONFIG.HMS.OPD.VISIT_FINDINGS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch visit findings';
      throw new Error(message);
    }
  }

  // Get single visit finding by ID
  async getVisitFindingById(id: number): Promise<VisitFinding> {
    try {
      const response = await hmsClient.get<VisitFinding>(
        API_CONFIG.HMS.OPD.VISIT_FINDINGS.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch visit finding';
      throw new Error(message);
    }
  }

  // Create new visit finding
  async createVisitFinding(data: VisitFindingCreateData): Promise<VisitFinding> {
    try {
      const response = await hmsClient.post<ApiResponse<VisitFinding>>(
        API_CONFIG.HMS.OPD.VISIT_FINDINGS.CREATE,
        data
      );
      // Handle both wrapped and direct responses
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create visit finding';
      throw new Error(message);
    }
  }

  // Update visit finding
  async updateVisitFinding(id: number, data: VisitFindingUpdateData): Promise<VisitFinding> {
    try {
      const response = await hmsClient.patch<ApiResponse<VisitFinding>>(
        API_CONFIG.HMS.OPD.VISIT_FINDINGS.UPDATE.replace(':id', id.toString()),
        data
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update visit finding';
      throw new Error(message);
    }
  }

  // Delete visit finding
  async deleteVisitFinding(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.OPD.VISIT_FINDINGS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete visit finding';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const visitFindingService = new VisitFindingService();
export default visitFindingService;
