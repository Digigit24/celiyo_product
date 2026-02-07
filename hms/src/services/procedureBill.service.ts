// src/services/procedureBill.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  ProcedureBill,
  ProcedureBillCreateData,
  ProcedureBillUpdateData,
  ProcedureBillListParams,
  PaymentRecordData,
  ProcedureBillItem,
  PaginatedResponse,
} from '@/types/procedureBill.types';

interface ApiResponse<T> {
  data?: T;
  [key: string]: any;
}

class ProcedureBillService {
  // ==================== PROCEDURE BILLS ====================

  // Get procedure bills with optional query parameters
  async getProcedureBills(params?: ProcedureBillListParams): Promise<PaginatedResponse<ProcedureBill>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<ProcedureBill>>(
        `${API_CONFIG.HMS.OPD.PROCEDURE_BILLS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch procedure bills';
      throw new Error(message);
    }
  }

  // Get single procedure bill by ID
  async getProcedureBillById(id: number): Promise<ProcedureBill> {
    try {
      const response = await hmsClient.get<ProcedureBill>(
        API_CONFIG.HMS.OPD.PROCEDURE_BILLS.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch procedure bill';
      throw new Error(message);
    }
  }

  // Create new procedure bill
  async createProcedureBill(data: ProcedureBillCreateData): Promise<ProcedureBill> {
    try {
      const response = await hmsClient.post<ApiResponse<ProcedureBill>>(
        API_CONFIG.HMS.OPD.PROCEDURE_BILLS.CREATE,
        data
      );
      // Handle both wrapped and direct responses
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create procedure bill';
      throw new Error(message);
    }
  }

  // Update procedure bill
  async updateProcedureBill(id: number, data: ProcedureBillUpdateData): Promise<ProcedureBill> {
    try {
      const response = await hmsClient.patch<ApiResponse<ProcedureBill>>(
        API_CONFIG.HMS.OPD.PROCEDURE_BILLS.UPDATE.replace(':id', id.toString()),
        data
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update procedure bill';
      throw new Error(message);
    }
  }

  // Delete procedure bill
  async deleteProcedureBill(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.OPD.PROCEDURE_BILLS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete procedure bill';
      throw new Error(message);
    }
  }

  // ==================== PROCEDURE BILL ACTIONS ====================

  // Record payment for a procedure bill
  async recordProcedureBillPayment(id: number, data: PaymentRecordData): Promise<ProcedureBill> {
    try {
      const response = await hmsClient.post<ApiResponse<ProcedureBill>>(
        API_CONFIG.HMS.OPD.PROCEDURE_BILLS.RECORD_PAYMENT.replace(':id', id.toString()),
        data
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

  // Print/generate PDF for procedure bill
  async printProcedureBill(id: number): Promise<{ success: boolean; pdf_url: string }> {
    try {
      const response = await hmsClient.get<{ success: boolean; pdf_url: string }>(
        API_CONFIG.HMS.OPD.PROCEDURE_BILLS.PRINT.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to print procedure bill';
      throw new Error(message);
    }
  }

  // ==================== PROCEDURE BILL ITEMS ====================

  // Get all procedure bill items
  async getProcedureBillItems(): Promise<PaginatedResponse<ProcedureBillItem>> {
    try {
      const response = await hmsClient.get<PaginatedResponse<ProcedureBillItem>>(
        API_CONFIG.HMS.OPD.PROCEDURE_BILLS.ITEMS_LIST
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch procedure bill items';
      throw new Error(message);
    }
  }

  // Get single procedure bill item by ID
  async getProcedureBillItemById(id: number): Promise<ProcedureBillItem> {
    try {
      const response = await hmsClient.get<ProcedureBillItem>(
        API_CONFIG.HMS.OPD.PROCEDURE_BILLS.ITEM_DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch procedure bill item';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const procedureBillService = new ProcedureBillService();
export default procedureBillService;
