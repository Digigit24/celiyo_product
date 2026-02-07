// src/services/procedurePackage.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  ProcedurePackage,
  ProcedurePackageCreateData,
  ProcedurePackageUpdateData,
  ProcedurePackageListParams,
  PaginatedResponse,
} from '@/types/procedurePackage.types';

interface ApiResponse<T> {
  data?: T;
  [key: string]: any;
}

class ProcedurePackageService {
  // ==================== PROCEDURE PACKAGES ====================

  // Get procedure packages with optional query parameters
  async getProcedurePackages(params?: ProcedurePackageListParams): Promise<PaginatedResponse<ProcedurePackage>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<ProcedurePackage>>(
        `${API_CONFIG.HMS.OPD.PROCEDURE_PACKAGES.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch procedure packages';
      throw new Error(message);
    }
  }

  // Get procedure packages with full procedure details (expand parameter)
  async getProcedurePackagesExpanded(params?: ProcedurePackageListParams): Promise<PaginatedResponse<ProcedurePackage>> {
    try {
      const expandedParams = { ...params, expand: 'procedures' };
      const queryString = buildQueryString(expandedParams);
      const response = await hmsClient.get<PaginatedResponse<ProcedurePackage>>(
        `${API_CONFIG.HMS.OPD.PROCEDURE_PACKAGES.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch procedure packages with details';
      throw new Error(message);
    }
  }

  // Get single procedure package by ID
  async getProcedurePackageById(id: number): Promise<ProcedurePackage> {
    try {
      const response = await hmsClient.get<ProcedurePackage>(
        API_CONFIG.HMS.OPD.PROCEDURE_PACKAGES.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch procedure package';
      throw new Error(message);
    }
  }

  // Create new procedure package
  async createProcedurePackage(data: ProcedurePackageCreateData): Promise<ProcedurePackage> {
    try {
      const response = await hmsClient.post<ApiResponse<ProcedurePackage>>(
        API_CONFIG.HMS.OPD.PROCEDURE_PACKAGES.CREATE,
        data
      );
      // Handle both wrapped and direct responses
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create procedure package';
      throw new Error(message);
    }
  }

  // Update procedure package
  async updateProcedurePackage(id: number, data: ProcedurePackageUpdateData): Promise<ProcedurePackage> {
    try {
      const response = await hmsClient.patch<ApiResponse<ProcedurePackage>>(
        API_CONFIG.HMS.OPD.PROCEDURE_PACKAGES.UPDATE.replace(':id', id.toString()),
        data
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update procedure package';
      throw new Error(message);
    }
  }

  // Delete procedure package
  async deleteProcedurePackage(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.OPD.PROCEDURE_PACKAGES.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete procedure package';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const procedurePackageService = new ProcedurePackageService();
export default procedurePackageService;
