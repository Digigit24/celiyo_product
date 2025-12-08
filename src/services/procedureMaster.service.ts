// src/services/procedureMaster.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  ProcedureMaster,
  ProcedureMasterCreateData,
  ProcedureMasterUpdateData,
  ProcedureMasterListParams,
  PaginatedResponse,
} from '@/types/procedureMaster.types';

interface ApiResponse<T> {
  data?: T;
  [key: string]: any;
}

class ProcedureMasterService {
  // ==================== PROCEDURE MASTERS ====================

  // Get procedure masters with optional query parameters
  async getProcedureMasters(params?: ProcedureMasterListParams): Promise<PaginatedResponse<ProcedureMaster>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<ProcedureMaster>>(
        `${API_CONFIG.HMS.OPD.PROCEDURE_MASTERS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch procedure masters';
      throw new Error(message);
    }
  }

  // Get single procedure master by ID
  async getProcedureMasterById(id: number): Promise<ProcedureMaster> {
    try {
      const response = await hmsClient.get<ProcedureMaster>(
        API_CONFIG.HMS.OPD.PROCEDURE_MASTERS.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch procedure master';
      throw new Error(message);
    }
  }

  // Create new procedure master
  async createProcedureMaster(data: ProcedureMasterCreateData): Promise<ProcedureMaster> {
    try {
      const response = await hmsClient.post<ApiResponse<ProcedureMaster>>(
        API_CONFIG.HMS.OPD.PROCEDURE_MASTERS.CREATE,
        data
      );
      // Handle both wrapped and direct responses
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create procedure master';
      throw new Error(message);
    }
  }

  // Update procedure master
  async updateProcedureMaster(id: number, data: ProcedureMasterUpdateData): Promise<ProcedureMaster> {
    try {
      const response = await hmsClient.patch<ApiResponse<ProcedureMaster>>(
        API_CONFIG.HMS.OPD.PROCEDURE_MASTERS.UPDATE.replace(':id', id.toString()),
        data
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update procedure master';
      throw new Error(message);
    }
  }

  // Delete procedure master
  async deleteProcedureMaster(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.OPD.PROCEDURE_MASTERS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete procedure master';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const procedureMasterService = new ProcedureMasterService();
export default procedureMasterService;
