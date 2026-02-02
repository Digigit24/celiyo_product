// src/components/opd/OPDBillingContent.tsx
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOPDBill } from '@/hooks/useOPDBill';
import { useProcedureMaster } from '@/hooks/useProcedureMaster';
import { useProcedurePackage } from '@/hooks/useProcedurePackage';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { opdBillService } from '@/services/opdBill.service';
import { procedurePackageService } from '@/services/procedurePackage.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Receipt,
  CreditCard,
  IndianRupee,
  Package,
  FileText,
  Plus,
  FlaskConical,
  Download,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

// Import child components
import { OPDBillingTab } from './OPDBillingTab';
import { ProcedureBillingTab, type ProcedureItem } from './ProcedureBillingTab';
import { InvestigationsBillingTab } from './InvestigationsBillingTab';
import { BillPreviewTab } from './BillPreviewTab';
import { BillItemsTable } from './BillItemsTable';

import type {
  OPDBill,
  OPDBillItem,
  OPDBillItemCreateData,
  OPDType,
  ChargeType,
} from '@/types/opdBill.types';
import type { OpdVisit } from '@/types/opdVisit.types';
import type { Investigation } from '@/types/diagnostics.types';
import type { ProcedureMaster } from '@/types/procedureMaster.types';

/* --------------------------------- Types --------------------------------- */

type BillingData = {
  opdTotal: string;
  procedureTotal: string;
  subtotal: string;
  discount: string;
  discountPercent: string;
  totalAmount: string;
  paymentMode: 'cash' | 'card' | 'upi' | 'bank';
  receivedAmount: string;
  balanceAmount: string;
};

/* --------------------------- Reusable Right Panel -------------------------- */

type BillingDetailsPanelProps = {
  data: BillingData;
  billItems: OPDBillItem[];
  onChange: (field: string, value: string) => void;
  onFormatReceived: () => void;
  onSave: () => void;
  isEditMode?: boolean;
};

const BillingDetailsPanel = memo(function BillingDetailsPanel({
  data,
  billItems,
  onChange,
  onFormatReceived,
  onSave,
  isEditMode = false,
}: BillingDetailsPanelProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Billing Summary</CardTitle>
        <CardDescription>{billItems.length} item(s) in bill</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bill Items List */}
        {billItems.length > 0 && (
          <div className="space-y-2 pb-3 border-b max-h-[300px] overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Items</p>
            {billItems.map((item, index) => (
              <div key={item.id || index} className="flex justify-between text-sm py-1">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-medium truncate">{item.item_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.source} • Qty: {item.quantity}
                  </div>
                </div>
                <div className="font-semibold whitespace-nowrap">
                  ₹{parseFloat(item.total_price || '0').toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 pb-4">
          <div className="flex justify-between text-base font-semibold pt-2 border-t">
            <span>Subtotal:</span>
            <span>₹{data.subtotal}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount">Discount</Label>
          <div className="flex gap-2">
            <Input
              id="discount"
              type="number"
              value={data.discount}
              onChange={(e) => onChange('discount', e.target.value)}
              className="flex-1"
              placeholder="0.00"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={data.discountPercent}
                onChange={(e) => onChange('discountPercent', e.target.value)}
                className="w-16"
                placeholder="0"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalAmount">Total Amount</Label>
          <div className="relative">
            <Input
              id="totalAmount"
              type="number"
              value={data.totalAmount}
              className="pr-12 font-bold text-lg"
              readOnly
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              INR
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Payment Mode</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={data.paymentMode === 'cash' ? 'default' : 'outline'}
              className="w-full"
              size="sm"
              onClick={() => onChange('paymentMode', 'cash')}
            >
              <IndianRupee className="h-4 w-4 mr-1" />
              Cash
            </Button>
            <Button
              variant={data.paymentMode === 'card' ? 'default' : 'outline'}
              className="w-full"
              size="sm"
              onClick={() => onChange('paymentMode', 'card')}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Card
            </Button>
            <Button
              variant={data.paymentMode === 'upi' ? 'default' : 'outline'}
              className="w-full"
              size="sm"
              onClick={() => onChange('paymentMode', 'upi')}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              UPI
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="receivedAmount">Received Amount</Label>
          <div className="relative">
            <Input
              id="receivedAmount"
              type="number"
              value={data.receivedAmount}
              onChange={(e) => onChange('receivedAmount', e.target.value)}
              onBlur={onFormatReceived}
              className="pr-12 text-green-600 font-semibold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              INR
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="balanceAmount">Balance Amount</Label>
          <div className="relative">
            <Input
              id="balanceAmount"
              type="number"
              value={data.balanceAmount}
              className="pr-12 text-orange-600 font-semibold"
              readOnly
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              INR
            </span>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Button variant="default" className="w-full" size="lg" onClick={onSave}>
            <Receipt className="mr-2 h-4 w-4" />
            {isEditMode ? 'Update Bill' : 'Save Bill'}
          </Button>
          <Button variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

/* --------------------------------- Component --------------------------------- */

interface OPDBillingContentProps {
  visit: OpdVisit;
}

export const OPDBillingContent: React.FC<OPDBillingContentProps> = ({ visit }) => {
  const navigate = useNavigate();
  const { user, getTenant } = useAuth();
  const { useTenantDetail } = useTenant();

  // Get tenant from current session
  const tenant = getTenant();
  const tenantId = tenant?.id || null;

  // Fetch tenant settings for branding
  const { data: tenantData, isLoading: tenantLoading } = useTenantDetail(tenantId);
  const tenantSettings = tenantData?.settings || {};

  const {
    useOPDBills,
    createBill,
    updateBill,
    deleteBill,
    useUnbilledRequisitions,
    importRequisition,
    syncClinicalCharges,
  } = useOPDBill();
  const { useActiveProcedureMasters } = useProcedureMaster();
  const { useActiveProcedurePackages } = useProcedurePackage();
  const { useInvestigations } = useDiagnostics();

  // Fetch all bills for the patient (ordered by date, most recent first)
  const { data: patientBillsData, isLoading: patientBillsLoading, mutate: mutatePatientBills } = useOPDBills(
    visit?.patient ? {
      patient: visit.patient,
      ordering: '-bill_date',
    } : undefined
  );

  // State to track selected bill
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  // Fetch bills for current visit (to check if bill exists)
  const { data: visitBillsData, isLoading: visitBillsLoading, mutate: mutateVisitBills } = useOPDBills({
    visit: visit.id
  });

  const { data: proceduresData, isLoading: proceduresLoading } = useActiveProcedureMasters();
  const { data: packagesData, isLoading: packagesLoading } = useActiveProcedurePackages();
  const { data: investigationsData, isLoading: investigationsLoading } = useInvestigations({ is_active: true });

  // Fetch unbilled requisitions for current visit
  const {
    data: unbilledData,
    isLoading: requisitionsLoading,
    mutate: mutateRequisitions
  } = useUnbilledRequisitions(visit?.id || null);
  const unbilledRequisitions = unbilledData?.requisitions || [];
  const totalUnbilledItems = unbilledData?.total_unbilled_items
    ?? unbilledRequisitions.reduce((sum, req) => sum + (req.unbilled_orders?.length || 0), 0);
  const estimatedUnbilledAmount = unbilledData?.estimated_amount ?? 0;

  // Get all bills for patient history
  const patientBills = patientBillsData?.results || [];
  const visitBills = visitBillsData?.results || [];
  const billsLoading = visitBillsLoading || patientBillsLoading;

  // Get existing bill - use selected bill if set, otherwise use first bill from current visit
  const existingBill = useMemo(() => {
    if (selectedBillId) {
      return patientBills.find(b => b.id === selectedBillId) || null;
    }
    return visitBills[0] || null;
  }, [selectedBillId, patientBills, visitBills]);

  const isEditMode = !!existingBill;

  // State to control showing create bill button vs form
  const [showBillingForm, setShowBillingForm] = useState(false);

  // Track which requisitions have been notified to avoid duplicate toasts
  const [notifiedRequisitions, setNotifiedRequisitions] = useState<Set<number>>(new Set());
  const [isSyncingClinicalCharges, setIsSyncingClinicalCharges] = useState(false);

  // Auto-show form if bill exists or if bills are available for this visit
  useEffect(() => {
    if (!visitBillsLoading) {
      if (existingBill || visitBills.length > 0) {
        setShowBillingForm(true);
        // Auto-select first bill if no bill is selected
        if (!selectedBillId && visitBills.length > 0) {
          setSelectedBillId(visitBills[0].id);
        }
      } else {
        setShowBillingForm(false);
      }
    }
  }, [existingBill, visitBillsLoading, visitBills, selectedBillId]);

  // Show toast notifications for new unbilled requisitions
  useEffect(() => {
    if (unbilledRequisitions && unbilledRequisitions.length > 0 && !requisitionsLoading) {
      unbilledRequisitions.forEach((requisition) => {
        const requisitionId = (requisition as any).id ?? requisition.requisition_id;
        if (!notifiedRequisitions.has(requisitionId)) {
          toast.info(
            `New ${requisition.requisition_type} requisition`,
            {
              description: `Requisition ${requisition.requisition_number} is ready to be synced to bill`,
              action: {
                label: 'Sync All',
                onClick: () => handleSyncClinicalCharges(),
              },
              duration: 10000,
            }
          );
          setNotifiedRequisitions(prev => new Set(prev).add(requisitionId));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unbilledRequisitions, requisitionsLoading]);

  // Function to refresh all bills
  const mutateBills = () => {
    mutateVisitBills();
    mutatePatientBills();
  };

  // Print/Export ref (ONLY this area prints/exports)
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Unified Bill Items State - All items (consultation, procedures, investigations, etc.)
  const [billItems, setBillItems] = useState<OPDBillItem[]>([]);

  // OPD Form Data (simplified - just essential fields)
  const [opdFormData, setOpdFormData] = useState({
    receiptNo: '',
    billDate: new Date().toISOString().split('T')[0],
    billTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    doctor: '',
    opdType: 'consultation',
    chargeType: '',
    diagnosis: '',
    remarks: '',
    opdAmount: '0.00',
  });

  // Procedure state (for backward compatibility)
  const [procedureFormData, setProcedureFormData] = useState({
    doctor: '',
    procedures: [] as ProcedureItem[],
  });

  // Common Billing State (Right Panel)
  const [billingData, setBillingData] = useState<BillingData>({
    opdTotal: '0.00',
    procedureTotal: '0.00',
    subtotal: '0.00',
    discount: '0.00',
    discountPercent: '0',
    totalAmount: '0.00',
    paymentMode: 'cash',
    receivedAmount: '0.00',
    balanceAmount: '0.00',
  });

  const [activeTab, setActiveTab] = useState<'billing' | 'preview'>('billing');
  const [isInvestigationsModalOpen, setIsInvestigationsModalOpen] = useState(false);
  const [isProceduresModalOpen, setIsProceduresModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<number | null>(null);

  // Calculate current payment status based on bill or billing data
  const currentPaymentStatus = useMemo((): 'paid' | 'partial' | 'unpaid' => {
    if (existingBill) {
      return existingBill.payment_status;
    }
    // For new bills, calculate from billingData
    const balance = parseFloat(billingData.balanceAmount) || 0;
    const received = parseFloat(billingData.receivedAmount) || 0;
    const total = parseFloat(billingData.totalAmount) || 0;

    if (total === 0) return 'unpaid';
    if (balance === 0 && received > 0) return 'paid';
    if (received > 0 && balance > 0) return 'partial';
    return 'unpaid';
  }, [existingBill, billingData.balanceAmount, billingData.receivedAmount, billingData.totalAmount]);

  // Auto-populate OPD form data from visit
  useEffect(() => {
    if (visit && !visitBillsLoading && !existingBill) {
      const receiptNo = visit.visit_number
        ? `BILL/${visit.visit_number.split('/').slice(1).join('/')}`
        : `BILL/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(
          new Date().getDate(),
        ).padStart(2, '0')}/001`;

      // Use visit's consultation fee if set, otherwise fall back to doctor's default fee
      const isFollowUp = visit.visit_type === 'follow_up';
      const opdAmount = visit.consultation_fee ||
        (visit.doctor_details
          ? isFollowUp
            ? visit.doctor_details.follow_up_fee
            : visit.doctor_details.consultation_fee
          : '0.00');

      let chargeType = '';
      if (isFollowUp) chargeType = 'follow_up';
      else if (visit.visit_type === 'new') chargeType = 'first_visit';
      else chargeType = 'revisit';

      setOpdFormData((prev) => ({
        ...prev,
        receiptNo,
        billDate: visit.visit_date || new Date().toISOString().split('T')[0],
        doctor: visit.doctor?.toString() || '',
        opdType: 'consultation',
        chargeType,
        opdAmount,
      }));

      setProcedureFormData((prev) => ({
        ...prev,
        doctor: visit.doctor?.toString() || '',
      }));

      // Initialize bill items with consultation fee
      setBillItems([{
        item_name: 'Consultation Fee',
        source: 'Consultation',
        quantity: 1,
        system_calculated_price: opdAmount || '0',
        unit_price: opdAmount || '0',
        total_price: opdAmount || '0',
        notes: '',
      }]);
    }
  }, [visit, visitBillsLoading, existingBill]);

  // Load bill items from existing bill
  useEffect(() => {
    if (existingBill && !billsLoading && visit) {
      // ALWAYS use visit's consultation fee as source of truth (from API)
      const isFollowUp = visit.visit_type === 'follow_up';
      const opdAmount = visit.consultation_fee ||
        (visit.doctor_details
          ? isFollowUp
            ? visit.doctor_details.follow_up_fee
            : visit.doctor_details.consultation_fee
          : '0.00');

      // Update bill items with visit's consultation fee
      const billItemsFromApi = existingBill.items || [];
      const consultationIndex = billItemsFromApi.findIndex(
        item => item.source === 'Consultation' || item.item_name === 'Consultation Fee'
      );

      let updatedBillItems = [...billItemsFromApi];
      if (consultationIndex >= 0) {
        // Update existing consultation item with visit's fee
        updatedBillItems[consultationIndex] = {
          ...updatedBillItems[consultationIndex],
          unit_price: opdAmount || '0',
          total_price: opdAmount || '0',
        };
      } else {
        // Add consultation item if it doesn't exist
        updatedBillItems = [{
          item_name: 'Consultation Fee',
          source: 'Consultation',
          quantity: 1,
          system_calculated_price: opdAmount || '0',
          unit_price: opdAmount || '0',
          total_price: opdAmount || '0',
          notes: '',
        }, ...updatedBillItems];
      }

      setBillItems(updatedBillItems);

      // Load form data
      setOpdFormData((prev) => ({
        ...prev,
        receiptNo: existingBill.bill_number || prev.receiptNo,
        billDate: existingBill.bill_date?.split('T')[0] || prev.billDate,
        doctor: existingBill.doctor?.toString() || prev.doctor,
        opdType: existingBill.opd_type || 'consultation',
        chargeType: existingBill.charge_type || prev.chargeType,
        diagnosis: existingBill.diagnosis || '',
        remarks: existingBill.remarks || '',
        opdAmount: opdAmount || '0',
      }));

      // Load billing data from API response (these are calculated server-side)
      setBillingData((prev) => ({
        ...prev,
        subtotal: existingBill.total_amount || '0',
        discountPercent: existingBill.discount_percent || '0',
        discount: existingBill.discount_amount || '0',
        totalAmount: existingBill.payable_amount || existingBill.total_amount || '0',
        paymentMode: (existingBill.payment_mode as any) || 'cash',
        receivedAmount: existingBill.received_amount || '0',
        balanceAmount: existingBill.balance_amount || '0',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingBill, billsLoading, visit]);

  // Sync consultation fee from opdAmount to bill items
  useEffect(() => {
    const consultationAmount = parseFloat(opdFormData.opdAmount) || 0;

    setBillItems((prev) => {
      // Find existing consultation item
      const consultationIndex = prev.findIndex(
        item => item.source === 'Consultation' || item.item_name === 'Consultation Fee'
      );

      if (consultationIndex >= 0) {
        // Update existing consultation item
        const updated = [...prev];
        updated[consultationIndex] = {
          ...updated[consultationIndex],
          unit_price: consultationAmount.toFixed(2),
          total_price: consultationAmount.toFixed(2),
        };
        return updated;
      } else if (consultationAmount > 0) {
        // Add consultation item if it doesn't exist and amount > 0
        return [{
          item_name: 'Consultation Fee',
          source: 'Consultation',
          quantity: 1,
          system_calculated_price: consultationAmount.toFixed(2),
          unit_price: consultationAmount.toFixed(2),
          total_price: consultationAmount.toFixed(2),
          notes: '',
        }, ...prev];
      }
      return prev;
    });
  }, [opdFormData.opdAmount]);

  // Recalculate billing totals from bill items
  // This provides immediate (optimistic) updates to the UI
  // Backend-calculated values will overwrite these when the bill is reloaded from API
  useEffect(() => {
    const subtotal = billItems.reduce((sum, item) => sum + parseFloat(item.total_price || '0'), 0);
    const disc = parseFloat(billingData.discount) || 0;
    const recv = parseFloat(billingData.receivedAmount) || 0;
    const total = Math.max(0, subtotal - disc);
    const balance = total - recv;

    setBillingData((prev) => ({
      ...prev,
      opdTotal: '0', // Not used anymore
      procedureTotal: '0', // Not used anymore
      subtotal: subtotal.toFixed(2),
      totalAmount: total.toFixed(2),
      balanceAmount: balance.toFixed(2),
    }));
  }, [billItems, billingData.discount, billingData.receivedAmount]);

  const handleOpdInputChange = async (field: string, value: string) => {
    setOpdFormData((prev) => ({ ...prev, [field]: value }));

    // If changing opdAmount for existing bill, update consultation item in backend
    if (field === 'opdAmount' && existingBill) {
      const consultationItemIndex = billItems.findIndex(
        item => item.source === 'Consultation' || item.item_name === 'Consultation Fee'
      );

      if (consultationItemIndex >= 0) {
        const consultationItem = billItems[consultationItemIndex];
        const newAmount = parseFloat(value) || 0;

        if (consultationItem.id) {
          // Debounce the API call - only update after user stops typing
          const timeoutId = setTimeout(async () => {
            try {
              const updatedItem = await opdBillService.updateBillItem(consultationItem.id!, {
                quantity: 1,
                unit_price: newAmount.toFixed(2),
                is_price_overridden: newAmount.toFixed(2) !== consultationItem.system_calculated_price,
              });

              // Update item in state with response from API
              setBillItems((prev) => {
                const updated = [...prev];
                updated[consultationItemIndex] = updatedItem;
                return updated;
              });
            } catch (error) {
              console.error('Failed to update consultation fee:', error);
              toast.error('Failed to update consultation fee');
            }
          }, 1000);

          // Store timeout ID for cleanup
          return () => clearTimeout(timeoutId);
        }
      }
    }
  };

  const handleProcedureInputChange = (field: string, value: string) => {
    setProcedureFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Centralized billing change handler
  const handleBillingChange = (field: string, value: string) => {
    if (field === 'paymentMode') {
      setBillingData((prev) => ({ ...prev, paymentMode: value as BillingData['paymentMode'] }));
      return;
    }

    if (field === 'receivedAmount') {
      const raw = value;
      setBillingData((prev) => {
        const total = parseFloat(prev.totalAmount) || 0;
        const recv = parseFloat(raw) || 0;
        const balance = (total - recv).toFixed(2);
        return { ...prev, receivedAmount: raw, balanceAmount: balance };
      });
      return;
    }

    if (field === 'discountPercent') {
      setBillingData((prev) => {
        const subtotal = parseFloat(prev.subtotal) || 0;
        const percent = parseFloat(value) || 0;
        const discNum = (subtotal * percent) / 100;
        const totalNum = Math.max(0, subtotal - discNum);
        const recv = parseFloat(prev.receivedAmount) || 0;

        return {
          ...prev,
          discountPercent: percent.toFixed(2),
          discount: discNum.toFixed(2),
          totalAmount: totalNum.toFixed(2),
          balanceAmount: (totalNum - recv).toFixed(2),
        };
      });
      return;
    }

    if (field === 'discount') {
      setBillingData((prev) => {
        const subtotal = parseFloat(prev.subtotal) || 0;
        const discNum = parseFloat(value) || 0;
        const totalNum = Math.max(0, subtotal - discNum);
        const recv = parseFloat(prev.receivedAmount) || 0;
        const percent = subtotal > 0 ? ((discNum / subtotal) * 100).toFixed(2) : '0.00';

        return {
          ...prev,
          discount: discNum.toFixed(2),
          discountPercent: percent,
          totalAmount: totalNum.toFixed(2),
          balanceAmount: (totalNum - recv).toFixed(2),
        };
      });
      return;
    }

    setBillingData((prev) => ({ ...prev, [field]: value } as BillingData));
  };

  // Add investigation to bill items
  const handleAddInvestigation = async (investigation: Investigation) => {
    const newItem: OPDBillItem = {
      item_name: investigation.name,
      source: 'Lab',
      quantity: 1,
      system_calculated_price: investigation.base_charge || '0',
      unit_price: investigation.base_charge || '0',
      total_price: investigation.base_charge || '0',
      notes: investigation.category || '',
    };

    // If bill exists, create item with optimistic update
    if (existingBill) {
      // OPTIMISTIC: Add to UI immediately with temporary ID
      const tempItem = { ...newItem, id: Date.now() }; // Temporary ID
      setBillItems((prev) => [...prev, tempItem]);
      toast.success('Investigation added to bill');

      // API call in background
      try {
        const itemData: OPDBillItemCreateData = {
          bill: existingBill.id,
          item_name: newItem.item_name,
          source: newItem.source,
          quantity: newItem.quantity,
          unit_price: newItem.unit_price,
          system_calculated_price: newItem.system_calculated_price || newItem.unit_price,
          notes: newItem.notes || '',
        };

        const createdItem = await opdBillService.createBillItem(itemData);

        // Replace temp item with real item from API
        setBillItems((prev) => prev.map(item =>
          item.id === tempItem.id ? createdItem : item
        ));
      } catch (error) {
        console.error('Failed to add investigation:', error);
        // ROLLBACK: Remove the temp item
        setBillItems((prev) => prev.filter(item => item.id !== tempItem.id));
        toast.error('Failed to add investigation to bill');
      }
    } else {
      // If no bill exists yet, just add to local state
      setBillItems((prev) => [...prev, newItem]);
      toast.success('Investigation added (will be saved when bill is created)');
    }
  };

  // Add procedure to bill items
  const handleAddProcedure = async (procedure: ProcedureMaster) => {
    const newItem: OPDBillItem = {
      item_name: procedure.name,
      source: 'Procedure',
      quantity: 1,
      system_calculated_price: procedure.default_charge || '0',
      unit_price: procedure.default_charge || '0',
      total_price: procedure.default_charge || '0',
      notes: procedure.category || '',
    };

    // If bill exists, create item with optimistic update
    if (existingBill) {
      // OPTIMISTIC: Add to UI immediately with temporary ID
      const tempItem = { ...newItem, id: Date.now() }; // Temporary ID
      setBillItems((prev) => [...prev, tempItem]);
      toast.success('Procedure added to bill');

      // API call in background
      try {
        const itemData: OPDBillItemCreateData = {
          bill: existingBill.id,
          item_name: newItem.item_name,
          source: newItem.source,
          quantity: newItem.quantity,
          unit_price: newItem.unit_price,
          system_calculated_price: newItem.system_calculated_price || newItem.unit_price,
          notes: newItem.notes || '',
        };

        const createdItem = await opdBillService.createBillItem(itemData);

        // Replace temp item with real item from API
        setBillItems((prev) => prev.map(item =>
          item.id === tempItem.id ? createdItem : item
        ));
      } catch (error) {
        console.error('Failed to add procedure:', error);
        // ROLLBACK: Remove the temp item
        setBillItems((prev) => prev.filter(item => item.id !== tempItem.id));
        toast.error('Failed to add procedure to bill');
      }
    } else {
      // If no bill exists yet, just add to local state
      setBillItems((prev) => [...prev, newItem]);
      toast.success('Procedure added (will be saved when bill is created)');
    }
  };

  // Handle package addition
  const handleAddPackage = async (packageId: number, packageName: string) => {
    console.log('[Package Addition] Starting - ID:', packageId, 'Name:', packageName);

    try {
      const packageData = await procedurePackageService.getProcedurePackageById(packageId);
      console.log('[Package Addition] Package data received:', packageData);

      if (!packageData.procedures || packageData.procedures.length === 0) {
        toast.error('This package has no procedures associated with it.');
        return;
      }

      // Create a single package item with discounted price
      const packageItem: OPDBillItem = {
        item_name: packageName,
        source: 'Package',
        quantity: 1,
        system_calculated_price: packageData.discounted_charge || packageData.total_charge || '0',
        unit_price: packageData.discounted_charge || packageData.total_charge || '0',
        total_price: packageData.discounted_charge || packageData.total_charge || '0',
        notes: `Package includes ${packageData.procedures.length} procedure(s)`,
        origin_object_id: packageId,
      };

      console.log('[Package Addition] Package item to add:', packageItem);

      // If bill exists, create item with optimistic update
      if (existingBill) {
        // OPTIMISTIC: Add to UI immediately with temporary ID
        const tempItem = { ...packageItem, id: Date.now() };
        setBillItems((prev) => [...prev, tempItem]);
        toast.success('Package added to bill');

        // API call in background
        try {
          const itemData: OPDBillItemCreateData = {
            bill: existingBill.id,
            item_name: packageItem.item_name,
            source: packageItem.source,
            quantity: packageItem.quantity,
            unit_price: packageItem.unit_price,
            system_calculated_price: packageItem.system_calculated_price || packageItem.unit_price,
            notes: packageItem.notes || '',
            origin_object_id: packageId,
          };

          const createdItem = await opdBillService.createBillItem(itemData);
          console.log('[Package Addition] Created item from API:', createdItem);

          // Replace temp item with real item from API (don't refresh from backend to avoid expansion)
          setBillItems((prev) => prev.map(item =>
            item.id === tempItem.id ? createdItem : item
          ));

          console.log('[Package Addition] Package added successfully');
        } catch (error) {
          console.error('Failed to add package:', error);
          // ROLLBACK: Remove the temp item
          setBillItems((prev) => prev.filter(item => item.id !== tempItem.id));
          toast.error('Failed to add package to bill');
          throw error; // Re-throw to be caught by the outer catch
        }
      } else {
        // If no bill exists yet, just add to local state
        setBillItems((prev) => [...prev, packageItem]);
        toast.success('Package added (will be saved when bill is created)');
      }
    } catch (error) {
      console.error('Error loading package:', error);
      toast.error('Failed to load package details. Please try again.');
      throw error; // Re-throw so the dialog handler can manage loading state properly
    }
  };


  // Update bill item (for existing bills, update in backend with optimistic updates)
  const handleUpdateBillItem = async (index: number, field: 'quantity' | 'unit_price', value: string) => {
    const item = billItems[index];

    // Calculate new values
    const updatedItem = { ...item };
    if (field === 'quantity') {
      updatedItem.quantity = parseInt(value) || 1;
    } else if (field === 'unit_price') {
      updatedItem.unit_price = value;
      updatedItem.is_price_overridden = updatedItem.unit_price !== updatedItem.system_calculated_price;
    }
    updatedItem.total_price = (updatedItem.quantity * parseFloat(updatedItem.unit_price || '0')).toFixed(2);

    // OPTIMISTIC UPDATE: Update UI immediately
    setBillItems((prev) => {
      const updated = [...prev];
      updated[index] = updatedItem;
      return updated;
    });

    // If bill exists and item has ID, update in backend
    if (existingBill && item.id) {
      try {
        const updatedFromApi = await opdBillService.updateBillItem(item.id, {
          quantity: updatedItem.quantity,
          unit_price: updatedItem.unit_price,
          is_price_overridden: updatedItem.is_price_overridden,
        });

        // Update with response from API to ensure consistency
        setBillItems((prev) => {
          const updated = [...prev];
          updated[index] = updatedFromApi;
          return updated;
        });
      } catch (error) {
        console.error('Failed to update bill item:', error);
        toast.error('Failed to update item');

        // ROLLBACK: Revert to original item on error
        setBillItems((prev) => {
          const reverted = [...prev];
          reverted[index] = item;
          return reverted;
        });
      }
    }
  };

  // Remove bill item (for existing bills, delete from backend)
  const handleRemoveBillItem = async (index: number) => {
    const item = billItems[index];

    // OPTIMISTIC: Remove from UI immediately
    const removedItem = billItems[index];
    setBillItems((prev) => prev.filter((_, i) => i !== index));
    toast.success('Item removed from bill');

    // If bill exists and item has ID, delete from backend
    if (existingBill && item.id) {
      try {
        await opdBillService.deleteBillItem(item.id);
      } catch (error) {
        console.error('Failed to remove bill item:', error);
        // ROLLBACK: Restore the item
        setBillItems((prev) => {
          const newItems = [...prev];
          newItems.splice(index, 0, removedItem);
          return newItems;
        });
        toast.error('Failed to remove item - Item restored');
      }
    }
  };

  const handleSyncClinicalCharges = async () => {
    if (!visit?.id) return;

    setIsSyncingClinicalCharges(true);

    // Show immediate feedback
    toast.info('Syncing clinical charges...');

    try {
      // First, ensure a bill exists. If not, create one
      if (!existingBill) {
        await handleCreateInitialBill();
        // Wait a moment for the bill to be created and loaded
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Now sync all clinical charges
      const response = await syncClinicalCharges(visit.id);

      toast.success('Clinical charges synced', {
        description: `Successfully synced ${response?.created_items || 0} clinical charges to the bill`,
      });

      setShowBillingForm(true);

      // Refresh in background
      mutateBills();
      mutateRequisitions();
    } catch (error: any) {
      console.error('Failed to sync clinical charges:', error);
      toast.error('Failed to sync clinical charges', {
        description: error?.message || 'Please try again',
      });
    } finally {
      setIsSyncingClinicalCharges(false);
    }
  };

  const handleCreateInitialBill = async () => {
    if (!visit) return;

    // Validate doctor is set
    const doctorId = parseInt(opdFormData.doctor || visit.doctor?.toString() || '0');
    if (!doctorId || doctorId === 0) {
      toast.error('Doctor is required to create a bill');
      return;
    }

    // OPTIMISTIC: Show form immediately
    setShowBillingForm(true);

    // Calculate total amount from bill items
    const subtotal = billItems.reduce((sum, item) => sum + parseFloat(item.total_price || '0'), 0);
    const totalAmount = subtotal.toFixed(2);

    // Create initial bill data
    const initialBillData = {
      visit: visit.id,
      doctor: doctorId,
      opd_type: 'consultation' as OPDType,
      charge_type: (opdFormData.chargeType as ChargeType) || 'first_visit',
      diagnosis: '',
      remarks: '',
      total_amount: totalAmount,
      discount_percent: '0',
      discount_amount: '0',
      payment_mode: 'cash' as const,
      received_amount: '0',
      bill_date: new Date().toISOString(),
    };

    // Create temporary bill for optimistic UI update
    const tempBillId = Date.now();
    const tempBill: OPDBill = {
      id: tempBillId,
      bill_number: `BILL/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/NEW`,
      visit: visit.id,
      patient: visit.patient,
      doctor: initialBillData.doctor,
      bill_date: initialBillData.bill_date,
      opd_type: initialBillData.opd_type,
      charge_type: initialBillData.charge_type,
      diagnosis: initialBillData.diagnosis || '',
      remarks: initialBillData.remarks || '',
      total_amount: totalAmount,
      discount_percent: '0',
      discount_amount: '0.00',
      payable_amount: totalAmount,
      payment_mode: initialBillData.payment_mode,
      payment_status: 'unpaid',
      received_amount: '0.00',
      balance_amount: totalAmount,
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // OPTIMISTIC: Add temp bill to UI immediately
    mutateVisitBills(
      (currentData) => {
        if (!currentData) return { results: [tempBill], count: 1, next: null, previous: null };
        return {
          ...currentData,
          results: [tempBill, ...currentData.results],
          count: currentData.count + 1,
        };
      },
      { revalidate: false }
    );

    mutatePatientBills(
      (currentData) => {
        if (!currentData) return { results: [tempBill], count: 1, next: null, previous: null };
        return {
          ...currentData,
          results: [tempBill, ...currentData.results],
          count: currentData.count + 1,
        };
      },
      { revalidate: false }
    );

    // Select the temp bill immediately
    setSelectedBillId(tempBillId);
    toast.success('Bill created', {
      description: 'Bill has been created. You can now add more items and update payment details.',
    });

    // API call in background
    try {
      console.log('[Bill Creation] Creating bill with data:', initialBillData);
      const newBill = await createBill(initialBillData);
      console.log('[Bill Creation] Bill created successfully:', newBill);

      // Replace temp bill with real bill
      mutateVisitBills(
        (currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            results: currentData.results.map(bill =>
              bill.id === tempBillId ? newBill : bill
            ),
          };
        },
        { revalidate: false }
      );

      mutatePatientBills(
        (currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            results: currentData.results.map(bill =>
              bill.id === tempBillId ? newBill : bill
            ),
          };
        },
        { revalidate: false }
      );

      // Update selected bill ID to real ID
      if (newBill) {
        setSelectedBillId(newBill.id);
      }

      // Revalidate to ensure consistency
      mutateVisitBills();
      mutatePatientBills();
    } catch (error: any) {
      console.error('[Bill Creation] Failed to create initial bill:', error);
      console.error('[Bill Creation] Error details:', error?.response?.data || error?.message);

      // ROLLBACK: Remove temp bill
      mutateVisitBills(
        (currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            results: currentData.results.filter(bill => bill.id !== tempBillId),
            count: currentData.count - 1,
          };
        },
        { revalidate: false }
      );

      mutatePatientBills(
        (currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            results: currentData.results.filter(bill => bill.id !== tempBillId),
            count: currentData.count - 1,
          };
        },
        { revalidate: false }
      );

      // Clear selection and hide form
      setSelectedBillId(null);
      setShowBillingForm(false);

      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Unknown error';
      toast.error('Failed to create bill', {
        description: errorMessage,
      });
    }
  };

  const handleSaveBill = async () => {
    if (!visit) return;

    if (billItems.length === 0) {
      toast.error('Add at least one item to the bill');
      return;
    }

    // OPTIMISTIC: Show success immediately
    toast.success(isEditMode ? 'Updating bill...' : 'Creating bill...');

    try {
      const billData = {
        visit: visit.id,
        doctor: parseInt(opdFormData.doctor) || visit.doctor || 0,
        opd_type: (opdFormData.opdType as OPDType) || 'consultation',
        charge_type: (opdFormData.chargeType as ChargeType) || 'first_visit',
        diagnosis: opdFormData.diagnosis || '',
        remarks: opdFormData.remarks || '',
        total_amount: billingData.subtotal || '0',
        discount_percent: billingData.discountPercent || '0',
        discount_amount: billingData.discount || '0',
        payment_mode: billingData.paymentMode || 'cash',
        received_amount: billingData.receivedAmount || '0',
        bill_date: opdFormData.billDate,
      };

      let savedBill: OPDBill;

      if (isEditMode && existingBill) {
        // Update existing bill
        savedBill = await updateBill(existingBill.id, billData);

        // Delete all existing items
        for (const item of existingBill.items || []) {
          if (item.id) {
            await opdBillService.deleteBillItem(item.id);
          }
        }

        toast.success('Bill updated successfully');
      } else {
        // Create new bill
        savedBill = await createBill(billData);
        toast.success('Bill created successfully');
      }

      // Create all bill items
      for (const item of billItems) {
        const itemData: OPDBillItemCreateData = {
          bill: savedBill.id,
          item_name: item.item_name,
          source: item.source,
          quantity: item.quantity,
          unit_price: item.unit_price,
          system_calculated_price: item.system_calculated_price || item.unit_price,
          notes: item.notes || '',
        };

        await opdBillService.createBillItem(itemData);
      }

      // Refresh in background
      mutateBills();
      mutateVisitBills();
    } catch (error: any) {
      console.error('Failed to save bill:', error);
      toast.error('Failed to save bill', {
        description: error?.message || 'Please try again.',
      });
    }
  };

  const isLoading = visitBillsLoading || tenantLoading;

  // Print functionality - simple browser print
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.info('PDF download feature coming soon');
  };

  const handleDeleteBillClick = (billId: number) => {
    setBillToDelete(billId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!billToDelete) return;

    // Close dialog immediately (optimistic)
    setIsDeleteDialogOpen(false);
    const deletedBillId = billToDelete;
    setBillToDelete(null);

    // Clear selection if deleted bill was selected
    const wasSelected = selectedBillId === deletedBillId;
    if (wasSelected) {
      setSelectedBillId(null);
      setShowBillingForm(false);
    }

    // Store original data for rollback
    const originalVisitBills = visitBillsData;
    const originalPatientBills = patientBillsData;

    // OPTIMISTIC UPDATE: Remove bill from UI immediately
    mutateVisitBills(
      (currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          results: currentData.results.filter(bill => bill.id !== deletedBillId),
          count: currentData.count - 1,
        };
      },
      { revalidate: false }
    );

    mutatePatientBills(
      (currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          results: currentData.results.filter(bill => bill.id !== deletedBillId),
          count: currentData.count - 1,
        };
      },
      { revalidate: false }
    );

    // Show optimistic success message
    toast.success('Bill deleted successfully');

    // Call API in background
    try {
      await deleteBill(deletedBillId);
      // Revalidate to ensure consistency
      mutateVisitBills();
      mutatePatientBills();
    } catch (error: any) {
      console.error('Failed to delete bill:', error);

      // ROLLBACK: Restore original data
      mutateVisitBills(originalVisitBills, { revalidate: false });
      mutatePatientBills(originalPatientBills, { revalidate: false });

      // Restore selection if it was selected
      if (wasSelected) {
        setSelectedBillId(deletedBillId);
        setShowBillingForm(true);
      }

      toast.error('Failed to delete bill', {
        description: error?.message || 'The bill has been restored',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          /* Hide browser default headers and footers */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #bill-preview-area,
          #bill-preview-area * {
            visibility: visible;
          }
          #bill-preview-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 15mm 15mm 15mm 15mm;
          }
          /* Ensure colors print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Remove shadows and borders that don't print well */
          .shadow, .shadow-sm, .shadow-md, .shadow-lg {
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Bills Selector - Show if multiple bills exist for this visit */}
      {visitBills.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Bills for This Visit</CardTitle>
                <CardDescription>
                  {visitBills.length} bill(s) • Select a bill to view/edit
                </CardDescription>
              </div>
              <Button onClick={handleCreateInitialBill} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create New Bill
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {visitBills.map((bill) => (
                <div
                  key={bill.id}
                  className={`p-4 border rounded-lg transition-all hover:border-primary ${
                    existingBill?.id === bill.id ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 space-y-1 cursor-pointer"
                      onClick={() => {
                        setSelectedBillId(bill.id);
                        setShowBillingForm(true);
                        setActiveTab('billing');
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{bill.bill_number}</span>
                        <Badge
                          variant={
                            bill.payment_status === 'paid'
                              ? 'default'
                              : bill.payment_status === 'partial'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="capitalize"
                        >
                          {bill.payment_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {bill.bill_date && new Date(bill.bill_date).toString() !== 'Invalid Date'
                          ? format(new Date(bill.bill_date), 'dd MMM yyyy, hh:mm a')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">₹{parseFloat(bill.total_amount || '0').toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {bill.items?.length || 0} item(s)
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBillClick(bill.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show "Create New Bill" button if no bill exists and form not shown yet */}
      {visitBills.length === 0 && !showBillingForm && !visitBillsLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <Receipt className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Bill Created Yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              This visit doesn't have a bill yet. Click the button below to create a new bill for this patient.
            </p>
            <Button
              size="lg"
              onClick={handleCreateInitialBill}
              className="px-8"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Bill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Billing Form Tabs - Only show when form is visible */}
      {showBillingForm && (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'billing' | 'preview')}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-lg grid-cols-2">
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Preview & Print
            </TabsTrigger>
          </TabsList>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <OPDBillingTab
                  formData={opdFormData}
                  visit={visit}
                  onInputChange={handleOpdInputChange}
                />

                {/* Bill Items Cart */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>Bill Items</CardTitle>
                        <CardDescription>
                          {billItems.length} item(s) • Total: ₹{billingData.subtotal}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsInvestigationsModalOpen(true)}
                        >
                          <FlaskConical className="h-4 w-4 mr-1" />
                          Investigations
                          {unbilledRequisitions && unbilledRequisitions.length > 0 && (
                            <Badge variant="destructive" className="ml-1 px-1.5 py-0 h-5 text-xs">
                              {unbilledRequisitions.length}
                            </Badge>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsProceduresModalOpen(true)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Procedures
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSyncClinicalCharges}
                          disabled={isSyncingClinicalCharges}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {isSyncingClinicalCharges ? 'Syncing...' : 'Sync Requisitions'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BillItemsTable
                      items={billItems}
                      onUpdateItem={handleUpdateBillItem}
                      onRemoveItem={handleRemoveBillItem}
                      readOnly={false}
                    />
                  </CardContent>
                </Card>

                <Dialog open={isInvestigationsModalOpen} onOpenChange={setIsInvestigationsModalOpen}>
                  <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Investigations & Clinical Charges</DialogTitle>
                    </DialogHeader>
                    <InvestigationsBillingTab
                      visit={visit}
                      unbilledRequisitions={unbilledRequisitions}
                      totalUnbilledItems={totalUnbilledItems}
                      estimatedUnbilledAmount={estimatedUnbilledAmount}
                      requisitionsLoading={requisitionsLoading}
                      isSyncingClinicalCharges={isSyncingClinicalCharges}
                      existingBill={existingBill}
                      investigationsData={investigationsData}
                      investigationsLoading={investigationsLoading}
                      onSyncClinicalCharges={handleSyncClinicalCharges}
                      onRefreshRequisitions={mutateRequisitions}
                      onAddInvestigation={handleAddInvestigation}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={isProceduresModalOpen} onOpenChange={setIsProceduresModalOpen}>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Procedures & Packages</DialogTitle>
                    </DialogHeader>
                    <ProcedureBillingTab
                      billItems={billItems}
                      proceduresData={proceduresData}
                      packagesData={packagesData}
                      proceduresLoading={proceduresLoading}
                      packagesLoading={packagesLoading}
                      onAddProcedure={handleAddProcedure}
                      onAddPackage={handleAddPackage}
                      onUpdateBillItem={handleUpdateBillItem}
                      onRemoveBillItem={handleRemoveBillItem}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <BillingDetailsPanel
                data={billingData}
                billItems={billItems}
                onChange={handleBillingChange}
                onFormatReceived={() => {
                  const num = parseFloat(billingData.receivedAmount);
                  if (!isNaN(num)) setBillingData((prev) => ({ ...prev, receivedAmount: num.toFixed(2) }));
                }}
                onSave={handleSaveBill}
                isEditMode={isEditMode}
              />
            </div>
          </TabsContent>

          {/* Bill Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BillPreviewTab
                  ref={printAreaRef}
                  visit={visit}
                  opdFormData={opdFormData}
                  billItems={billItems}
                  billingData={billingData}
                  tenantData={tenantData}
                  tenantSettings={tenantSettings}
                  patientBills={patientBills}
                  billsLoading={billsLoading}
                  onPrint={handlePrint}
                  onDownloadPDF={handleDownloadPDF}
                />
              </div>

              <BillingDetailsPanel
                data={billingData}
                billItems={billItems}
                onChange={handleBillingChange}
                onFormatReceived={() => {
                  const num = parseFloat(billingData.receivedAmount);
                  if (!isNaN(num)) setBillingData((prev) => ({ ...prev, receivedAmount: num.toFixed(2) }));
                }}
                onSave={handleSaveBill}
                isEditMode={isEditMode}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this bill? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Bill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
