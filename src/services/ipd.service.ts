// src/services/ipd.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import {
  Ward,
  WardFormData,
  WardFilters,
  Bed,
  BedFormData,
  BedFilters,
  BedListItem,
  Admission,
  AdmissionFormData,
  AdmissionFilters,
  AdmissionListItem,
  DischargeData,
  BedTransfer,
  BedTransferFormData,
  IPDBilling,
  IPDBillingFormData,
  IPDBillingListItem,
  BillingFilters,
  IPDBillItem,
  IPDBillItemFormData,
  PaymentData,
} from '@/types/ipd.types';
import { PaginatedResponse } from '@/types/patient.types';

class IPDService {
  // ==================== WARDS ====================

  async getWards(params?: WardFilters): Promise<PaginatedResponse<Ward>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Ward>>(
        `${API_CONFIG.HMS.IPD.WARDS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch wards';
      throw new Error(message);
    }
  }

  async getWard(id: number): Promise<Ward> {
    try {
      const response = await hmsClient.get<any>(
        API_CONFIG.HMS.IPD.WARDS.DETAIL.replace(':id', id.toString())
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch ward';
      throw new Error(message);
    }
  }

  async createWard(wardData: WardFormData): Promise<Ward> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.IPD.WARDS.CREATE,
        wardData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create ward';
      throw new Error(message);
    }
  }

  async updateWard(id: number, wardData: WardFormData): Promise<Ward> {
    try {
      const response = await hmsClient.put<any>(
        API_CONFIG.HMS.IPD.WARDS.UPDATE.replace(':id', id.toString()),
        wardData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update ward';
      throw new Error(message);
    }
  }

  async patchWard(id: number, wardData: Partial<WardFormData>): Promise<Ward> {
    try {
      const response = await hmsClient.patch<any>(
        API_CONFIG.HMS.IPD.WARDS.UPDATE.replace(':id', id.toString()),
        wardData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update ward';
      throw new Error(message);
    }
  }

  async deleteWard(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.IPD.WARDS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete ward';
      throw new Error(message);
    }
  }

  // ==================== BEDS ====================

  async getBeds(params?: BedFilters): Promise<PaginatedResponse<Bed | BedListItem>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Bed | BedListItem>>(
        `${API_CONFIG.HMS.IPD.BEDS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch beds';
      throw new Error(message);
    }
  }

  async getAvailableBeds(): Promise<BedListItem[]> {
    try {
      const response = await hmsClient.get<BedListItem[]>(
        API_CONFIG.HMS.IPD.BEDS.AVAILABLE
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch available beds';
      throw new Error(message);
    }
  }

  async getBed(id: number): Promise<Bed> {
    try {
      const response = await hmsClient.get<any>(
        API_CONFIG.HMS.IPD.BEDS.DETAIL.replace(':id', id.toString())
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch bed';
      throw new Error(message);
    }
  }

  async createBed(bedData: BedFormData): Promise<Bed> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.IPD.BEDS.CREATE,
        bedData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create bed';
      throw new Error(message);
    }
  }

  async updateBed(id: number, bedData: BedFormData): Promise<Bed> {
    try {
      const response = await hmsClient.put<any>(
        API_CONFIG.HMS.IPD.BEDS.UPDATE.replace(':id', id.toString()),
        bedData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update bed';
      throw new Error(message);
    }
  }

  async patchBed(id: number, bedData: Partial<BedFormData>): Promise<Bed> {
    try {
      const response = await hmsClient.patch<any>(
        API_CONFIG.HMS.IPD.BEDS.UPDATE.replace(':id', id.toString()),
        bedData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update bed';
      throw new Error(message);
    }
  }

  async deleteBed(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.IPD.BEDS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete bed';
      throw new Error(message);
    }
  }

  // ==================== ADMISSIONS ====================

  async getAdmissions(params?: AdmissionFilters): Promise<PaginatedResponse<Admission | AdmissionListItem>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<Admission | AdmissionListItem>>(
        `${API_CONFIG.HMS.IPD.ADMISSIONS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch admissions';
      throw new Error(message);
    }
  }

  async getActiveAdmissions(): Promise<AdmissionListItem[]> {
    try {
      const response = await hmsClient.get<AdmissionListItem[]>(
        API_CONFIG.HMS.IPD.ADMISSIONS.ACTIVE
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch active admissions';
      throw new Error(message);
    }
  }

  async getAdmission(id: number): Promise<Admission> {
    try {
      const response = await hmsClient.get<any>(
        API_CONFIG.HMS.IPD.ADMISSIONS.DETAIL.replace(':id', id.toString())
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch admission';
      throw new Error(message);
    }
  }

  async createAdmission(admissionData: AdmissionFormData): Promise<Admission> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.IPD.ADMISSIONS.CREATE,
        admissionData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create admission';
      throw new Error(message);
    }
  }

  async updateAdmission(id: number, admissionData: AdmissionFormData): Promise<Admission> {
    try {
      const response = await hmsClient.put<any>(
        API_CONFIG.HMS.IPD.ADMISSIONS.UPDATE.replace(':id', id.toString()),
        admissionData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update admission';
      throw new Error(message);
    }
  }

  async patchAdmission(id: number, admissionData: Partial<AdmissionFormData>): Promise<Admission> {
    try {
      const response = await hmsClient.patch<any>(
        API_CONFIG.HMS.IPD.ADMISSIONS.UPDATE.replace(':id', id.toString()),
        admissionData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update admission';
      throw new Error(message);
    }
  }

  async dischargePatient(id: number, dischargeData: DischargeData): Promise<Admission> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.IPD.ADMISSIONS.DISCHARGE.replace(':id', id.toString()),
        dischargeData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to discharge patient';
      throw new Error(message);
    }
  }

  async deleteAdmission(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.IPD.ADMISSIONS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete admission';
      throw new Error(message);
    }
  }

  // ==================== BED TRANSFERS ====================

  async getBedTransfers(params?: { admission?: number }): Promise<PaginatedResponse<BedTransfer>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<BedTransfer>>(
        `${API_CONFIG.HMS.IPD.BED_TRANSFERS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch bed transfers';
      throw new Error(message);
    }
  }

  async getBedTransfer(id: number): Promise<BedTransfer> {
    try {
      const response = await hmsClient.get<any>(
        API_CONFIG.HMS.IPD.BED_TRANSFERS.DETAIL.replace(':id', id.toString())
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch bed transfer';
      throw new Error(message);
    }
  }

  async createBedTransfer(transferData: BedTransferFormData): Promise<BedTransfer> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.IPD.BED_TRANSFERS.CREATE,
        transferData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create bed transfer';
      throw new Error(message);
    }
  }

  async deleteBedTransfer(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.IPD.BED_TRANSFERS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete bed transfer';
      throw new Error(message);
    }
  }

  // ==================== BILLING ====================

  async getBillings(params?: BillingFilters): Promise<PaginatedResponse<IPDBilling | IPDBillingListItem>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<IPDBilling | IPDBillingListItem>>(
        `${API_CONFIG.HMS.IPD.BILLINGS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch billings';
      throw new Error(message);
    }
  }

  async getBilling(id: number): Promise<IPDBilling> {
    try {
      const response = await hmsClient.get<any>(
        API_CONFIG.HMS.IPD.BILLINGS.DETAIL.replace(':id', id.toString())
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch billing';
      throw new Error(message);
    }
  }

  async createBilling(billingData: IPDBillingFormData): Promise<IPDBilling> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.IPD.BILLINGS.CREATE,
        billingData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create billing';
      throw new Error(message);
    }
  }

  async updateBilling(id: number, billingData: IPDBillingFormData): Promise<IPDBilling> {
    try {
      const response = await hmsClient.put<any>(
        API_CONFIG.HMS.IPD.BILLINGS.UPDATE.replace(':id', id.toString()),
        billingData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update billing';
      throw new Error(message);
    }
  }

  async patchBilling(id: number, billingData: Partial<IPDBillingFormData>): Promise<IPDBilling> {
    try {
      const response = await hmsClient.patch<any>(
        API_CONFIG.HMS.IPD.BILLINGS.UPDATE.replace(':id', id.toString()),
        billingData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update billing';
      throw new Error(message);
    }
  }

  async addBedCharges(id: number): Promise<IPDBilling> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.IPD.BILLINGS.ADD_BED_CHARGES.replace(':id', id.toString())
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to add bed charges';
      throw new Error(message);
    }
  }

  async addPayment(id: number, paymentData: PaymentData): Promise<IPDBilling> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.IPD.BILLINGS.ADD_PAYMENT.replace(':id', id.toString()),
        paymentData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to add payment';
      throw new Error(message);
    }
  }

  async deleteBilling(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.IPD.BILLINGS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete billing';
      throw new Error(message);
    }
  }

  // ==================== BILL ITEMS ====================

  async getBillItems(params?: { billing?: number }): Promise<PaginatedResponse<IPDBillItem>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<IPDBillItem>>(
        `${API_CONFIG.HMS.IPD.BILL_ITEMS.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch bill items';
      throw new Error(message);
    }
  }

  async getBillItem(id: number): Promise<IPDBillItem> {
    try {
      const response = await hmsClient.get<any>(
        API_CONFIG.HMS.IPD.BILL_ITEMS.DETAIL.replace(':id', id.toString())
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch bill item';
      throw new Error(message);
    }
  }

  async createBillItem(itemData: IPDBillItemFormData): Promise<IPDBillItem> {
    try {
      const response = await hmsClient.post<any>(
        API_CONFIG.HMS.IPD.BILL_ITEMS.CREATE,
        itemData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create bill item';
      throw new Error(message);
    }
  }

  async updateBillItem(id: number, itemData: IPDBillItemFormData): Promise<IPDBillItem> {
    try {
      const response = await hmsClient.put<any>(
        API_CONFIG.HMS.IPD.BILL_ITEMS.UPDATE.replace(':id', id.toString()),
        itemData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update bill item';
      throw new Error(message);
    }
  }

  async patchBillItem(id: number, itemData: Partial<IPDBillItemFormData>): Promise<IPDBillItem> {
    try {
      const response = await hmsClient.patch<any>(
        API_CONFIG.HMS.IPD.BILL_ITEMS.UPDATE.replace(':id', id.toString()),
        itemData
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update bill item';
      throw new Error(message);
    }
  }

  async deleteBillItem(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.IPD.BILL_ITEMS.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete bill item';
      throw new Error(message);
    }
  }
}

export const ipdService = new IPDService();
