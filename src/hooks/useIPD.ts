// src/hooks/useIPD.ts
// ==================== IPD HOOKS ====================
// Comprehensive hooks for IPD module (Wards, Beds, Admissions, Transfers, Billing)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { ipdService } from '@/services/ipd.service';
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
import { useAuth } from './useAuth';

export const useIPD = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== WARD HOOKS ====================

  /**
   * Fetch list of wards with filters.
   */
  const useWards = (params?: WardFilters) => {
    const key = ['wards', params];

    return useSWR<PaginatedResponse<Ward>>(
      key,
      () => ipdService.getWards(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch wards:', err);
          setError(err.message || 'Failed to fetch wards');
        }
      }
    );
  };

  /**
   * Fetch single ward by ID.
   */
  const useWardById = (id: number | null) => {
    const key = id ? ['ward', id] : null;

    return useSWR<Ward>(
      key,
      () => ipdService.getWard(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch ward:', err);
          setError(err.message || 'Failed to fetch ward');
        }
      }
    );
  };

  /**
   * Create a new ward.
   */
  const createWard = useCallback(async (wardData: WardFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newWard = await ipdService.createWard(wardData);
      return newWard;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create ward';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Update a ward.
   */
  const updateWard = useCallback(async (id: number, wardData: WardFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedWard = await ipdService.updateWard(id, wardData);
      return updatedWard;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update ward';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Partially update a ward.
   */
  const patchWard = useCallback(async (id: number, wardData: Partial<WardFormData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedWard = await ipdService.patchWard(id, wardData);
      return updatedWard;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update ward';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete a ward.
   */
  const deleteWard = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await ipdService.deleteWard(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete ward';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // ==================== BED HOOKS ====================

  /**
   * Fetch list of beds with filters.
   */
  const useBeds = (params?: BedFilters) => {
    const key = ['beds', params];

    return useSWR<PaginatedResponse<Bed | BedListItem>>(
      key,
      () => ipdService.getBeds(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch beds:', err);
          setError(err.message || 'Failed to fetch beds');
        }
      }
    );
  };

  /**
   * Fetch available beds.
   */
  const useAvailableBeds = () => {
    const key = ['beds', 'available'];

    return useSWR<BedListItem[]>(
      key,
      () => ipdService.getAvailableBeds(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch available beds:', err);
          setError(err.message || 'Failed to fetch available beds');
        }
      }
    );
  };

  /**
   * Fetch single bed by ID.
   */
  const useBedById = (id: number | null) => {
    const key = id ? ['bed', id] : null;

    return useSWR<Bed>(
      key,
      () => ipdService.getBed(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch bed:', err);
          setError(err.message || 'Failed to fetch bed');
        }
      }
    );
  };

  /**
   * Create a new bed.
   */
  const createBed = useCallback(async (bedData: BedFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newBed = await ipdService.createBed(bedData);
      return newBed;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create bed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Update a bed.
   */
  const updateBed = useCallback(async (id: number, bedData: BedFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedBed = await ipdService.updateBed(id, bedData);
      return updatedBed;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update bed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Partially update a bed.
   */
  const patchBed = useCallback(async (id: number, bedData: Partial<BedFormData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedBed = await ipdService.patchBed(id, bedData);
      return updatedBed;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update bed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete a bed.
   */
  const deleteBed = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await ipdService.deleteBed(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete bed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // ==================== ADMISSION HOOKS ====================

  /**
   * Fetch list of admissions with filters.
   */
  const useAdmissions = (params?: AdmissionFilters) => {
    const key = ['admissions', params];

    return useSWR<PaginatedResponse<Admission | AdmissionListItem>>(
      key,
      () => ipdService.getAdmissions(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch admissions:', err);
          setError(err.message || 'Failed to fetch admissions');
        }
      }
    );
  };

  /**
   * Fetch active admissions.
   */
  const useActiveAdmissions = () => {
    const key = ['admissions', 'active'];

    return useSWR<AdmissionListItem[]>(
      key,
      () => ipdService.getActiveAdmissions(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch active admissions:', err);
          setError(err.message || 'Failed to fetch active admissions');
        }
      }
    );
  };

  /**
   * Fetch single admission by ID.
   */
  const useAdmissionById = (id: number | null) => {
    const key = id ? ['admission', id] : null;

    return useSWR<Admission>(
      key,
      () => ipdService.getAdmission(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch admission:', err);
          setError(err.message || 'Failed to fetch admission');
        }
      }
    );
  };

  /**
   * Create a new admission.
   */
  const createAdmission = useCallback(async (admissionData: AdmissionFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newAdmission = await ipdService.createAdmission(admissionData);
      return newAdmission;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create admission';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Update an admission.
   */
  const updateAdmission = useCallback(async (id: number, admissionData: AdmissionFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedAdmission = await ipdService.updateAdmission(id, admissionData);
      return updatedAdmission;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update admission';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Partially update an admission.
   */
  const patchAdmission = useCallback(async (id: number, admissionData: Partial<AdmissionFormData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedAdmission = await ipdService.patchAdmission(id, admissionData);
      return updatedAdmission;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update admission';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Discharge a patient.
   */
  const dischargePatient = useCallback(async (id: number, dischargeData: DischargeData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const dischargedAdmission = await ipdService.dischargePatient(id, dischargeData);
      return dischargedAdmission;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to discharge patient';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete an admission.
   */
  const deleteAdmission = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await ipdService.deleteAdmission(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete admission';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // ==================== BED TRANSFER HOOKS ====================

  /**
   * Fetch list of bed transfers.
   */
  const useBedTransfers = (params?: { admission?: number }) => {
    const key = ['bed-transfers', params];

    return useSWR<PaginatedResponse<BedTransfer>>(
      key,
      () => ipdService.getBedTransfers(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch bed transfers:', err);
          setError(err.message || 'Failed to fetch bed transfers');
        }
      }
    );
  };

  /**
   * Fetch single bed transfer by ID.
   */
  const useBedTransferById = (id: number | null) => {
    const key = id ? ['bed-transfer', id] : null;

    return useSWR<BedTransfer>(
      key,
      () => ipdService.getBedTransfer(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch bed transfer:', err);
          setError(err.message || 'Failed to fetch bed transfer');
        }
      }
    );
  };

  /**
   * Create a new bed transfer.
   */
  const createBedTransfer = useCallback(async (transferData: BedTransferFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newTransfer = await ipdService.createBedTransfer(transferData);
      return newTransfer;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create bed transfer';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete a bed transfer.
   */
  const deleteBedTransfer = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await ipdService.deleteBedTransfer(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete bed transfer';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // ==================== BILLING HOOKS ====================

  /**
   * Fetch list of billings with filters.
   */
  const useBillings = (params?: BillingFilters) => {
    const key = ['ipd-billings', params];

    return useSWR<PaginatedResponse<IPDBilling | IPDBillingListItem>>(
      key,
      () => ipdService.getBillings(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch billings:', err);
          setError(err.message || 'Failed to fetch billings');
        }
      }
    );
  };

  /**
   * Fetch single billing by ID.
   */
  const useBillingById = (id: number | null) => {
    const key = id ? ['ipd-billing', id] : null;

    return useSWR<IPDBilling>(
      key,
      () => ipdService.getBilling(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch billing:', err);
          setError(err.message || 'Failed to fetch billing');
        }
      }
    );
  };

  /**
   * Create a new billing.
   */
  const createBilling = useCallback(async (billingData: IPDBillingFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newBilling = await ipdService.createBilling(billingData);
      return newBilling;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create billing';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Update a billing.
   */
  const updateBilling = useCallback(async (id: number, billingData: IPDBillingFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedBilling = await ipdService.updateBilling(id, billingData);
      return updatedBilling;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update billing';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Partially update a billing.
   */
  const patchBilling = useCallback(async (id: number, billingData: Partial<IPDBillingFormData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedBilling = await ipdService.patchBilling(id, billingData);
      return updatedBilling;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update billing';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Add bed charges to billing.
   */
  const addBedCharges = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedBilling = await ipdService.addBedCharges(id);
      return updatedBilling;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add bed charges';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Add payment to billing.
   */
  const addPayment = useCallback(async (id: number, paymentData: PaymentData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedBilling = await ipdService.addPayment(id, paymentData);
      return updatedBilling;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add payment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete a billing.
   */
  const deleteBilling = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await ipdService.deleteBilling(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete billing';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // ==================== BILL ITEM HOOKS ====================

  /**
   * Fetch list of bill items.
   */
  const useBillItems = (params?: { billing?: number }) => {
    const key = ['ipd-bill-items', params];

    return useSWR<PaginatedResponse<IPDBillItem>>(
      key,
      () => ipdService.getBillItems(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch bill items:', err);
          setError(err.message || 'Failed to fetch bill items');
        }
      }
    );
  };

  /**
   * Fetch single bill item by ID.
   */
  const useBillItemById = (id: number | null) => {
    const key = id ? ['ipd-bill-item', id] : null;

    return useSWR<IPDBillItem>(
      key,
      () => ipdService.getBillItem(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch bill item:', err);
          setError(err.message || 'Failed to fetch bill item');
        }
      }
    );
  };

  /**
   * Create a new bill item.
   */
  const createBillItem = useCallback(async (itemData: IPDBillItemFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newItem = await ipdService.createBillItem(itemData);
      return newItem;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create bill item';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Update a bill item.
   */
  const updateBillItem = useCallback(async (id: number, itemData: IPDBillItemFormData) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedItem = await ipdService.updateBillItem(id, itemData);
      return updatedItem;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update bill item';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Partially update a bill item.
   */
  const patchBillItem = useCallback(async (id: number, itemData: Partial<IPDBillItemFormData>) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedItem = await ipdService.patchBillItem(id, itemData);
      return updatedItem;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update bill item';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  /**
   * Delete a bill item.
   */
  const deleteBillItem = useCallback(async (id: number) => {
    if (!hasHMSAccess) {
      throw new Error('HMS module not enabled for this user');
    }

    setIsLoading(true);
    setError(null);

    try {
      await ipdService.deleteBillItem(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete bill item';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasHMSAccess]);

  // ==================== RETURN ALL HOOKS AND METHODS ====================

  return {
    // State
    isLoading,
    error,

    // Ward hooks
    useWards,
    useWardById,
    createWard,
    updateWard,
    patchWard,
    deleteWard,

    // Bed hooks
    useBeds,
    useAvailableBeds,
    useBedById,
    createBed,
    updateBed,
    patchBed,
    deleteBed,

    // Admission hooks
    useAdmissions,
    useActiveAdmissions,
    useAdmissionById,
    createAdmission,
    updateAdmission,
    patchAdmission,
    dischargePatient,
    deleteAdmission,

    // Bed transfer hooks
    useBedTransfers,
    useBedTransferById,
    createBedTransfer,
    deleteBedTransfer,

    // Billing hooks
    useBillings,
    useBillingById,
    createBilling,
    updateBilling,
    patchBilling,
    addBedCharges,
    addPayment,
    deleteBilling,

    // Bill item hooks
    useBillItems,
    useBillItemById,
    createBillItem,
    updateBillItem,
    patchBillItem,
    deleteBillItem,
  };
};
