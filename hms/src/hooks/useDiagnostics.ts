// src/hooks/useDiagnostics.ts
import useSWR from 'swr';
import { diagnosticsService } from '@/services/diagnosticsService';
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
  AddMedicineToRequisitionPayload,
  AddProcedureToRequisitionPayload,
  AddPackageToRequisitionPayload,
  MedicineOrder,
  ProcedureOrder,
  PackageOrder,
} from '@/types/diagnostics.types';

export const useDiagnostics = () => {
  // ==================== INVESTIGATIONS ====================
  const useInvestigations = (params?: Record<string, any>) => {
    const key = params ? ['investigations', params] : 'investigations';
    return useSWR(key, () => diagnosticsService.getInvestigations(params));
  };

  const useInvestigation = (id: number | null) => {
    return useSWR(id ? `investigations/${id}` : null, () =>
      id ? diagnosticsService.getInvestigation(id) : null
    );
  };

  const createInvestigation = async (data: CreateInvestigationPayload): Promise<Investigation> => {
    return await diagnosticsService.createInvestigation(data);
  };

  const updateInvestigation = async (id: number, data: UpdateInvestigationPayload): Promise<Investigation> => {
    return await diagnosticsService.updateInvestigation(id, data);
  };

  const deleteInvestigation = async (id: number): Promise<void> => {
    return await diagnosticsService.deleteInvestigation(id);
  };

  // ==================== REQUISITIONS ====================
  const useRequisitions = (params?: Record<string, any>) => {
    const key = params ? ['requisitions', params] : 'requisitions';
    return useSWR(key, () => diagnosticsService.getRequisitions(params));
  };

  const useRequisition = (id: number | null) => {
    return useSWR(id ? `requisitions/${id}` : null, () =>
      id ? diagnosticsService.getRequisition(id) : null
    );
  };

  const createRequisition = async (data: CreateRequisitionPayload): Promise<Requisition> => {
    return await diagnosticsService.createRequisition(data);
  };

  const updateRequisition = async (id: number, data: UpdateRequisitionPayload): Promise<Requisition> => {
    return await diagnosticsService.updateRequisition(id, data);
  };

  const deleteRequisition = async (id: number): Promise<void> => {
    return await diagnosticsService.deleteRequisition(id);
  };

  const addMedicineToRequisition = async (requisitionId: number, data: AddMedicineToRequisitionPayload): Promise<MedicineOrder> => {
    return await diagnosticsService.addMedicineToRequisition(requisitionId, data);
  };

  const addProcedureToRequisition = async (requisitionId: number, data: AddProcedureToRequisitionPayload): Promise<ProcedureOrder> => {
    return await diagnosticsService.addProcedureToRequisition(requisitionId, data);
  };

  const addPackageToRequisition = async (requisitionId: number, data: AddPackageToRequisitionPayload): Promise<PackageOrder> => {
    return await diagnosticsService.addPackageToRequisition(requisitionId, data);
  };

  // ==================== DIAGNOSTIC ORDERS ====================
  const useDiagnosticOrders = (params?: Record<string, any>) => {
    const key = params ? ['diagnostic-orders', params] : 'diagnostic-orders';
    return useSWR(key, () => diagnosticsService.getDiagnosticOrders(params));
  };

  const useDiagnosticOrder = (id: number | null) => {
    return useSWR(id ? `diagnostic-orders/${id}` : null, () =>
      id ? diagnosticsService.getDiagnosticOrder(id) : null
    );
  };

  const createDiagnosticOrder = async (data: CreateDiagnosticOrderPayload): Promise<DiagnosticOrder> => {
    return await diagnosticsService.createDiagnosticOrder(data);
  };

  const updateDiagnosticOrder = async (id: number, data: UpdateDiagnosticOrderPayload): Promise<DiagnosticOrder> => {
    return await diagnosticsService.updateDiagnosticOrder(id, data);
  };

  const deleteDiagnosticOrder = async (id: number): Promise<void> => {
    return await diagnosticsService.deleteDiagnosticOrder(id);
  };

  // ==================== LAB REPORTS ====================
  const useLabReports = (params?: Record<string, any>) => {
    const key = params ? ['lab-reports', params] : 'lab-reports';
    return useSWR(key, () => diagnosticsService.getLabReports(params));
  };

  const useLabReport = (id: number | null) => {
    return useSWR(id ? `lab-reports/${id}` : null, () =>
      id ? diagnosticsService.getLabReport(id) : null
    );
  };

  const createLabReport = async (data: CreateLabReportPayload): Promise<LabReport> => {
    return await diagnosticsService.createLabReport(data);
  };

  const updateLabReport = async (id: number, data: UpdateLabReportPayload): Promise<LabReport> => {
    return await diagnosticsService.updateLabReport(id, data);
  };

  const deleteLabReport = async (id: number): Promise<void> => {
    return await diagnosticsService.deleteLabReport(id);
  };

  // ==================== INVESTIGATION RANGES ====================
  const useInvestigationRanges = (params?: Record<string, any>) => {
    const key = params ? ['investigation-ranges', params] : 'investigation-ranges';
    return useSWR(key, () => diagnosticsService.getInvestigationRanges(params));
  };

  const useInvestigationRange = (id: number | null) => {
    return useSWR(id ? `investigation-ranges/${id}` : null, () =>
      id ? diagnosticsService.getInvestigationRange(id) : null
    );
  };

  const createInvestigationRange = async (data: CreateInvestigationRangePayload): Promise<InvestigationRange> => {
    return await diagnosticsService.createInvestigationRange(data);
  };

  const updateInvestigationRange = async (id: number, data: UpdateInvestigationRangePayload): Promise<InvestigationRange> => {
    return await diagnosticsService.updateInvestigationRange(id, data);
  };

  const deleteInvestigationRange = async (id: number): Promise<void> => {
    return await diagnosticsService.deleteInvestigationRange(id);
  };

  return {
    // Investigations
    useInvestigations,
    useInvestigation,
    createInvestigation,
    updateInvestigation,
    deleteInvestigation,

    // Requisitions
    useRequisitions,
    useRequisition,
    createRequisition,
    updateRequisition,
    deleteRequisition,
    addMedicineToRequisition,
    addProcedureToRequisition,
    addPackageToRequisition,

    // Diagnostic Orders
    useDiagnosticOrders,
    useDiagnosticOrder,
    createDiagnosticOrder,
    updateDiagnosticOrder,
    deleteDiagnosticOrder,

    // Lab Reports
    useLabReports,
    useLabReport,
    createLabReport,
    updateLabReport,
    deleteLabReport,

    // Investigation Ranges
    useInvestigationRanges,
    useInvestigationRange,
    createInvestigationRange,
    updateInvestigationRange,
    deleteInvestigationRange,
  };
};
