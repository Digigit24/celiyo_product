// src/services/opdBill.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  OPDBill,
  OPDBillCreateData,
  OPDBillUpdateData,
  OPDBillListParams,
  PaymentRecordData,
  OPDBillPrintResponse,
  OPDBillStatistics,
  PaginatedResponse,
} from '@/types/opdBill.types';

interface ApiResponse<T> {
  data?: T;
  [key: string]: any;
}

class OPDBillService {
  // ==================== OPD BILLS ====================

  // Get OPD bills with optional query parameters
  async getOPDBills(params?: OPDBillListParams): Promise<PaginatedResponse<OPDBill>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<OPDBill>>(
        `${API_CONFIG.HMS.OPD.BILLS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch OPD bills';
      throw new Error(message);
    }
  }

  // Get single OPD bill by ID
  async getOPDBillById(id: number): Promise<OPDBill> {
    try {
      const response = await hmsClient.get<OPDBill>(
        API_CONFIG.HMS.OPD.BILLS.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch OPD bill';
      throw new Error(message);
    }
  }

  // Create new OPD bill
  async createOPDBill(billData: OPDBillCreateData): Promise<OPDBill> {
    try {
      const response = await hmsClient.post<ApiResponse<OPDBill>>(
        API_CONFIG.HMS.OPD.BILLS.CREATE,
        billData
      );
      // Handle both wrapped and direct responses
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create OPD bill';
      throw new Error(message);
    }
  }

  // Update OPD bill
  async updateOPDBill(id: number, billData: OPDBillUpdateData): Promise<OPDBill> {
    try {
      const response = await hmsClient.patch<ApiResponse<OPDBill>>(
        API_CONFIG.HMS.OPD.BILLS.UPDATE.replace(':id', id.toString()),
        billData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update OPD bill';
      throw new Error(message);
    }
  }

  // Delete OPD bill
  async deleteOPDBill(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.OPD.BILLS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete OPD bill';
      throw new Error(message);
    }
  }

  // ==================== OPD BILL ACTIONS ====================

  // Record payment for an OPD bill
  async recordPayment(id: number, paymentData: PaymentRecordData): Promise<OPDBill> {
    try {
      const response = await hmsClient.post<ApiResponse<OPDBill>>(
        API_CONFIG.HMS.OPD.BILLS.RECORD_PAYMENT.replace(':id', id.toString()),
        paymentData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to record payment';
      throw new Error(message);
    }
  }

  // Print/generate PDF for OPD bill
  async printOPDBill(id: number): Promise<OPDBillPrintResponse> {
    try {
      const response = await hmsClient.get<OPDBillPrintResponse>(
        API_CONFIG.HMS.OPD.BILLS.PRINT.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to print OPD bill';
      throw new Error(message);
    }
  }

  // Get OPD bill statistics
  async getOPDBillStatistics(params?: Record<string, any>): Promise<OPDBillStatistics> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<OPDBillStatistics>(
        `${API_CONFIG.HMS.OPD.BILLS.STATISTICS}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch bill statistics';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const opdBillService = new OPDBillService();
export default opdBillService;
