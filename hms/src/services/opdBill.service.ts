// src/services/opdBill.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  OPDBill,
  OPDBillCreateData,
  OPDBillUpdateData,
  OPDBillListParams,
  OPDBillItem,
  OPDBillItemCreateData,
  OPDBillItemUpdateData,
  PaymentRecordData,
  OPDBillPrintResponse,
  OPDBillStatistics,
  PaginatedResponse,
  SyncClinicalChargesResponse,
} from '@/types/opdBill.types';
import type { UnbilledRequisitionsResponse } from '@/types/diagnostics.types';

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
      const response = await hmsClient.get<ApiResponse<OPDBillStatistics>>(
        `${API_CONFIG.HMS.OPD.BILLS.STATISTICS}${queryString}`
      );
      // Handle wrapped response (API returns {success: true, data: {...}})
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch bill statistics';
      throw new Error(message);
    }
  }

  // ==================== REQUISITION IMPORT ====================

  // Get unbilled requisitions for a visit
  async getUnbilledRequisitions(visitId: number): Promise<UnbilledRequisitionsResponse> {
    try {
      const response = await hmsClient.get<UnbilledRequisitionsResponse>(
        API_CONFIG.HMS.OPD.BILLS.UNBILLED_REQUISITIONS.replace(':visit_id', visitId.toString())
      );
      const payload = response.data;
      const requisitions = payload?.requisitions?.map((req: any) => ({
        ...req,
        requisition_id: req.requisition_id ?? req.id,
        unbilled_orders: req.unbilled_orders || [],
      })) || [];

      const totalUnbilledItems =
        payload?.total_unbilled_items ??
        requisitions.reduce((sum: number, req: any) => sum + (req.unbilled_orders?.length || 0), 0);

      const estimatedAmount =
        payload?.estimated_amount ??
        requisitions.reduce((sum: number, req: any) => {
          const orderTotal = (req.unbilled_orders || []).reduce((orderSum: number, order: any) => {
            const total = order?.total ?? (parseFloat(order?.price || '0') * (order?.quantity || 1));
            return orderSum + (Number.isFinite(total) ? total : 0);
          }, 0);
          return sum + orderTotal;
        }, 0);

      return {
        success: payload?.success,
        visit_id: payload?.visit_id ?? visitId,
        visit_number: payload?.visit_number ?? '',
        total_unbilled_items: totalUnbilledItems,
        estimated_amount: Number(estimatedAmount) || 0,
        requisitions,
      };
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch unbilled requisitions';
      throw new Error(message);
    }
  }

  async syncClinicalCharges(visitId: number): Promise<SyncClinicalChargesResponse> {
    try {
      const response = await hmsClient.post<ApiResponse<SyncClinicalChargesResponse>>(
        API_CONFIG.HMS.OPD.VISITS.SYNC_CLINICAL_CHARGES.replace(':id', visitId.toString())
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to sync clinical charges';
      throw new Error(message);
    }
  }

  // Import requisition orders as bill items
  async importRequisition(billId: number, requisitionId: number): Promise<OPDBill> {
    try {
      const response = await hmsClient.post<ApiResponse<OPDBill>>(
        API_CONFIG.HMS.OPD.BILLS.IMPORT_REQUISITION.replace(':id', billId.toString()),
        { requisition_id: requisitionId }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to import requisition';
      throw new Error(message);
    }
  }

  // ==================== OPD BILL ITEMS ====================

  // Get bill items for a specific bill
  async getBillItems(billId: number): Promise<PaginatedResponse<OPDBillItem>> {
    try {
      const response = await hmsClient.get<PaginatedResponse<OPDBillItem>>(
        API_CONFIG.HMS.OPD.BILL_ITEMS.LIST,
        { params: { bill: billId } }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch bill items';
      throw new Error(message);
    }
  }

  // Get single bill item by ID
  async getBillItemById(id: number): Promise<OPDBillItem> {
    try {
      const response = await hmsClient.get<OPDBillItem>(
        API_CONFIG.HMS.OPD.BILL_ITEMS.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch bill item';
      throw new Error(message);
    }
  }

  // Create new bill item
  async createBillItem(itemData: OPDBillItemCreateData): Promise<OPDBillItem> {
    try {
      // Set system_calculated_price if not provided
      if (!itemData.system_calculated_price) {
        itemData.system_calculated_price = itemData.unit_price;
      }

      const response = await hmsClient.post<ApiResponse<OPDBillItem>>(
        API_CONFIG.HMS.OPD.BILL_ITEMS.CREATE,
        itemData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create bill item';
      throw new Error(message);
    }
  }

  // Update bill item
  async updateBillItem(id: number, itemData: OPDBillItemUpdateData): Promise<OPDBillItem> {
    try {
      const response = await hmsClient.patch<ApiResponse<OPDBillItem>>(
        API_CONFIG.HMS.OPD.BILL_ITEMS.UPDATE.replace(':id', id.toString()),
        itemData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update bill item';
      throw new Error(message);
    }
  }

  // Delete bill item
  async deleteBillItem(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.OPD.BILL_ITEMS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete bill item';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const opdBillService = new OPDBillService();
export default opdBillService;
