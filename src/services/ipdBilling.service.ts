// src/services/ipdBilling.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  IPDBilling,
  IPDBillingCreateData,
  IPDBillingUpdateData,
  IPDBillingListParams,
  IPDBillItem,
  IPDBillItemCreateData,
  IPDBillItemUpdateData,
  IPDPaymentRecordData,
  SyncClinicalChargesResponse,
  UnbilledRequisitionsResponse,
  PaginatedResponse,
} from '@/types/ipdBilling.types';

interface ApiResponse<T> {
  data?: T;
  [key: string]: any;
}

class IPDBillingService {
  // ==================== IPD BILLINGS ====================

  // Get IPD bills with optional query parameters
  async getIPDBillings(params?: IPDBillingListParams): Promise<PaginatedResponse<IPDBilling>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<IPDBilling>>(
        `${API_CONFIG.HMS.IPD.BILLINGS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch IPD bills';
      throw new Error(message);
    }
  }

  // Get single IPD bill by ID
  async getIPDBillingById(id: number): Promise<IPDBilling> {
    try {
      const response = await hmsClient.get<IPDBilling>(
        API_CONFIG.HMS.IPD.BILLINGS.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch IPD bill';
      throw new Error(message);
    }
  }

  // Create new IPD bill
  async createIPDBilling(billData: IPDBillingCreateData): Promise<IPDBilling> {
    try {
      const response = await hmsClient.post<ApiResponse<IPDBilling>>(
        API_CONFIG.HMS.IPD.BILLINGS.CREATE,
        billData
      );
      // Handle both wrapped and direct responses
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create IPD bill';
      throw new Error(message);
    }
  }

  // Update IPD bill (PATCH)
  async updateIPDBilling(id: number, billData: IPDBillingUpdateData): Promise<IPDBilling> {
    try {
      const response = await hmsClient.patch<ApiResponse<IPDBilling>>(
        API_CONFIG.HMS.IPD.BILLINGS.UPDATE.replace(':id', id.toString()),
        billData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update IPD bill';
      throw new Error(message);
    }
  }

  // Delete IPD bill
  async deleteIPDBilling(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.IPD.BILLINGS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete IPD bill';
      throw new Error(message);
    }
  }

  // ==================== IPD BILL ACTIONS ====================

  // Add bed charges to bill
  async addBedCharges(billId: number): Promise<IPDBilling> {
    try {
      const response = await hmsClient.post<ApiResponse<IPDBilling>>(
        API_CONFIG.HMS.IPD.BILLINGS.ADD_BED_CHARGES.replace(':id', billId.toString()),
        {}
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to add bed charges';
      throw new Error(message);
    }
  }

  // Record payment for an IPD bill
  async addPayment(billId: number, paymentData: IPDPaymentRecordData): Promise<IPDBilling> {
    try {
      const response = await hmsClient.post<ApiResponse<IPDBilling>>(
        API_CONFIG.HMS.IPD.BILLINGS.ADD_PAYMENT.replace(':id', billId.toString()),
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

  // ==================== CLINICAL CHARGES SYNC ====================

  // Get unbilled requisitions for an admission
  async getUnbilledRequisitions(admissionId: number): Promise<UnbilledRequisitionsResponse> {
    try {
      const response = await hmsClient.get<UnbilledRequisitionsResponse>(
        API_CONFIG.HMS.IPD.ADMISSIONS.UNBILLED_REQUISITIONS.replace(':id', admissionId.toString())
      );
      const payload = response.data;

      // Normalize the response
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
            const price = parseFloat(order?.price || '0');
            return orderSum + (Number.isFinite(price) ? price : 0);
          }, 0);
          return sum + orderTotal;
        }, 0);

      return {
        success: payload?.success ?? true,
        admission_id: payload?.admission_id ?? admissionId,
        admission_number: payload?.admission_number ?? '',
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

  // Sync clinical charges from requisitions to bill
  async syncClinicalCharges(admissionId: number): Promise<SyncClinicalChargesResponse> {
    try {
      const response = await hmsClient.post<ApiResponse<SyncClinicalChargesResponse>>(
        API_CONFIG.HMS.IPD.ADMISSIONS.SYNC_CLINICAL_CHARGES.replace(':id', admissionId.toString()),
        {}
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

  // ==================== IPD BILL ITEMS ====================

  // Get bill items for a specific bill
  async getBillItems(billId: number): Promise<PaginatedResponse<IPDBillItem>> {
    try {
      const response = await hmsClient.get<PaginatedResponse<IPDBillItem>>(
        API_CONFIG.HMS.IPD.BILL_ITEMS.LIST,
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
  async getBillItemById(id: number): Promise<IPDBillItem> {
    try {
      const response = await hmsClient.get<IPDBillItem>(
        API_CONFIG.HMS.IPD.BILL_ITEMS.DETAIL.replace(':id', id.toString())
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
  async createBillItem(itemData: IPDBillItemCreateData): Promise<IPDBillItem> {
    try {
      // Set system_calculated_price if not provided
      if (!itemData.system_calculated_price) {
        itemData.system_calculated_price = itemData.unit_price;
      }

      const response = await hmsClient.post<ApiResponse<IPDBillItem>>(
        API_CONFIG.HMS.IPD.BILL_ITEMS.CREATE,
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
  async updateBillItem(id: number, itemData: IPDBillItemUpdateData): Promise<IPDBillItem> {
    try {
      const response = await hmsClient.patch<ApiResponse<IPDBillItem>>(
        API_CONFIG.HMS.IPD.BILL_ITEMS.UPDATE.replace(':id', id.toString()),
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
        API_CONFIG.HMS.IPD.BILL_ITEMS.DELETE.replace(':id', id.toString())
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
export const ipdBillingService = new IPDBillingService();
export default ipdBillingService;
