// src/services/diagnosticsService.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG } from '@/lib/apiConfig';
import {
  Investigation,
  Requisition,
  DiagnosticOrder,
  LabReport,
  InvestigationRange,
  CreateInvestigationPayload,
  UpdateInvestigationPayload,
  CreateRequisitionPayload,
  UpdateRequisitionPayload,
  CreateDiagnosticOrderPayload,
  UpdateDiagnosticOrderPayload,
  CreateLabReportPayload,
  UpdateLabReportPayload,
  CreateInvestigationRangePayload,
  UpdateInvestigationRangePayload,
  PaginatedInvestigationsResponse,
  PaginatedRequisitionsResponse,
  PaginatedDiagnosticOrdersResponse,
  PaginatedLabReportsResponse,
  PaginatedInvestigationRangesResponse,
  AddMedicineToRequisitionPayload,
  AddProcedureToRequisitionPayload,
  AddPackageToRequisitionPayload,
  MedicineOrder,
  ProcedureOrder,
  PackageOrder,
} from '@/types/diagnostics.types';

export const diagnosticsService = {
  // ==================== INVESTIGATIONS ====================
  async getInvestigations(params?: Record<string, any>): Promise<PaginatedInvestigationsResponse> {
    const response = await hmsClient.get(API_CONFIG.HMS.DIAGNOSTICS.INVESTIGATIONS.LIST, { params });
    return response.data;
  },

  async getInvestigation(id: number): Promise<Investigation> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.INVESTIGATIONS.DETAIL.replace(':id', String(id));
    const response = await hmsClient.get(url);
    return response.data;
  },

  async createInvestigation(data: CreateInvestigationPayload): Promise<Investigation> {
    const response = await hmsClient.post(API_CONFIG.HMS.DIAGNOSTICS.INVESTIGATIONS.CREATE, data);
    return response.data;
  },

  async updateInvestigation(id: number, data: UpdateInvestigationPayload): Promise<Investigation> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.INVESTIGATIONS.UPDATE.replace(':id', String(id));
    const response = await hmsClient.patch(url, data);
    return response.data;
  },

  async deleteInvestigation(id: number): Promise<void> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.INVESTIGATIONS.DELETE.replace(':id', String(id));
    await hmsClient.delete(url);
  },

  // ==================== REQUISITIONS ====================
  async getRequisitions(params?: Record<string, any>): Promise<PaginatedRequisitionsResponse> {
    const response = await hmsClient.get(API_CONFIG.HMS.DIAGNOSTICS.REQUISITIONS.LIST, { params });
    return response.data;
  },

  async getRequisition(id: number): Promise<Requisition> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.REQUISITIONS.DETAIL.replace(':id', String(id));
    const response = await hmsClient.get(url);
    return response.data;
  },

  async createRequisition(data: CreateRequisitionPayload): Promise<Requisition> {
    const response = await hmsClient.post(API_CONFIG.HMS.DIAGNOSTICS.REQUISITIONS.CREATE, data);
    return response.data;
  },

  async updateRequisition(id: number, data: UpdateRequisitionPayload): Promise<Requisition> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.REQUISITIONS.UPDATE.replace(':id', String(id));
    const response = await hmsClient.patch(url, data);
    return response.data;
  },

  async deleteRequisition(id: number): Promise<void> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.REQUISITIONS.DELETE.replace(':id', String(id));
    await hmsClient.delete(url);
  },

  async addMedicineToRequisition(requisitionId: number, data: AddMedicineToRequisitionPayload): Promise<MedicineOrder> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.REQUISITIONS.ADD_MEDICINE.replace(':id', String(requisitionId));
    const response = await hmsClient.post(url, data);
    return response.data;
  },

  async addProcedureToRequisition(requisitionId: number, data: AddProcedureToRequisitionPayload): Promise<ProcedureOrder> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.REQUISITIONS.ADD_PROCEDURE.replace(':id', String(requisitionId));
    const response = await hmsClient.post(url, data);
    return response.data;
  },

  async addPackageToRequisition(requisitionId: number, data: AddPackageToRequisitionPayload): Promise<PackageOrder> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.REQUISITIONS.ADD_PACKAGE.replace(':id', String(requisitionId));
    const response = await hmsClient.post(url, data);
    return response.data;
  },

  // ==================== DIAGNOSTIC ORDERS ====================
  async getDiagnosticOrders(params?: Record<string, any>): Promise<PaginatedDiagnosticOrdersResponse> {
    const response = await hmsClient.get(API_CONFIG.HMS.DIAGNOSTICS.ORDERS.LIST, { params });
    return response.data;
  },

  async getDiagnosticOrder(id: number): Promise<DiagnosticOrder> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.ORDERS.DETAIL.replace(':id', String(id));
    const response = await hmsClient.get(url);
    return response.data;
  },

  async createDiagnosticOrder(data: CreateDiagnosticOrderPayload): Promise<DiagnosticOrder> {
    const response = await hmsClient.post(API_CONFIG.HMS.DIAGNOSTICS.ORDERS.CREATE, data);
    return response.data;
  },

  async updateDiagnosticOrder(id: number, data: UpdateDiagnosticOrderPayload): Promise<DiagnosticOrder> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.ORDERS.UPDATE.replace(':id', String(id));
    const response = await hmsClient.patch(url, data);
    return response.data;
  },

  async deleteDiagnosticOrder(id: number): Promise<void> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.ORDERS.DELETE.replace(':id', String(id));
    await hmsClient.delete(url);
  },

  // ==================== LAB REPORTS ====================
  async getLabReports(params?: Record<string, any>): Promise<PaginatedLabReportsResponse> {
    const response = await hmsClient.get(API_CONFIG.HMS.DIAGNOSTICS.REPORTS.LIST, { params });
    return response.data;
  },

  async getLabReport(id: number): Promise<LabReport> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.REPORTS.DETAIL.replace(':id', String(id));
    const response = await hmsClient.get(url);
    return response.data;
  },

  async createLabReport(data: CreateLabReportPayload): Promise<LabReport> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'result_data') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'attachment' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await hmsClient.post(API_CONFIG.HMS.DIAGNOSTICS.REPORTS.CREATE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateLabReport(id: number, data: UpdateLabReportPayload): Promise<LabReport> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.REPORTS.UPDATE.replace(':id', String(id));

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'result_data') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'attachment' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await hmsClient.patch(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteLabReport(id: number): Promise<void> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.REPORTS.DELETE.replace(':id', String(id));
    await hmsClient.delete(url);
  },

  // ==================== INVESTIGATION RANGES ====================
  async getInvestigationRanges(params?: Record<string, any>): Promise<PaginatedInvestigationRangesResponse> {
    const response = await hmsClient.get(API_CONFIG.HMS.DIAGNOSTICS.RANGES.LIST, { params });
    return response.data;
  },

  async getInvestigationRange(id: number): Promise<InvestigationRange> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.RANGES.DETAIL.replace(':id', String(id));
    const response = await hmsClient.get(url);
    return response.data;
  },

  async createInvestigationRange(data: CreateInvestigationRangePayload): Promise<InvestigationRange> {
    const response = await hmsClient.post(API_CONFIG.HMS.DIAGNOSTICS.RANGES.CREATE, data);
    return response.data;
  },

  async updateInvestigationRange(id: number, data: UpdateInvestigationRangePayload): Promise<InvestigationRange> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.RANGES.UPDATE.replace(':id', String(id));
    const response = await hmsClient.patch(url, data);
    return response.data;
  },

  async deleteInvestigationRange(id: number): Promise<void> {
    const url = API_CONFIG.HMS.DIAGNOSTICS.RANGES.DELETE.replace(':id', String(id));
    await hmsClient.delete(url);
  },
};
