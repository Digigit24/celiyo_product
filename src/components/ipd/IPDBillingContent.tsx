// src/components/ipd/IPDBillingContent.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIPDBilling } from '@/hooks/useIPDBilling';
import { useProcedureMaster } from '@/hooks/useProcedureMaster';
import { useProcedurePackage } from '@/hooks/useProcedurePackage';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { ipdBillingService } from '@/services/ipdBilling.service';
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
import { IPDBillingTab } from './IPDBillingTab';
import { BillItemsTable } from '@/components/opd/BillItemsTable';
import { InvestigationsBillingTab } from '@/components/opd/InvestigationsBillingTab';
import { ProcedureBillingTab } from '@/components/opd/ProcedureBillingTab';
import { IPDBillPreviewTab } from './IPDBillPreviewTab';

import type {
  IPDBilling,
  IPDBillItem,
  IPDBillItemCreateData,
  Admission,
  IPDPaymentMode,
} from '@/types/ipdBilling.types';
import type { Investigation } from '@/types/diagnostics.types';
import type { ProcedureMaster } from '@/types/procedureMaster.types';

/* --------------------------------- Types --------------------------------- */

type BillingData = {
  subtotal: string;
  discount: string;
  discountPercent: string;
  totalAmount: string;
  paymentMode: IPDPaymentMode;
  receivedAmount: string;
  balanceAmount: string;
};

/* --------------------------- Billing Details Panel -------------------------- */

type BillingDetailsPanelProps = {
  data: BillingData;
  billItems: IPDBillItem[];
  onChange: (field: string, value: string) => void;
  onFormatReceived: () => void;
  onSave: () => void;
  isEditMode?: boolean;
};

const BillingDetailsPanel: React.FC<BillingDetailsPanelProps> = ({
  data,
  billItems,
  onChange,
  onFormatReceived,
  onSave,
  isEditMode = false,
}) => {
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
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={data.paymentMode === 'insurance' ? 'default' : 'outline'}
              className="w-full"
              size="sm"
              onClick={() => onChange('paymentMode', 'insurance')}
            >
              Insurance
            </Button>
            <Button
              variant={data.paymentMode === 'other' ? 'default' : 'outline'}
              className="w-full"
              size="sm"
              onClick={() => onChange('paymentMode', 'other')}
            >
              Other
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
};

/* --------------------------------- Component --------------------------------- */

interface IPDBillingContentProps {
  admission: Admission;
  billId?: number;
}

export const IPDBillingContent: React.FC<IPDBillingContentProps> = ({ admission, billId }) => {
  const navigate = useNavigate();
  const { user, getTenant } = useAuth();
  const { useTenantDetail } = useTenant();

  // Get tenant from current session
  const tenant = getTenant();
  const tenantId = tenant?.id || null;

  // Fetch tenant settings for branding
  const { data: tenantData } = useTenantDetail(tenantId);
  const tenantSettings = tenantData?.settings || {};

  // Print/Export ref
  const printAreaRef = React.useRef<HTMLDivElement>(null);

  const {
    useIPDBillings,
    useIPDBillingById,
    createBilling,
    updateBilling,
    deleteBilling,
    useUnbilledRequisitions,
    syncClinicalCharges,
  } = useIPDBilling();

  const { useActiveProcedureMasters } = useProcedureMaster();
  const { useActiveProcedurePackages } = useProcedurePackage();
  const { useInvestigations } = useDiagnostics();

  // Fetch bills for current admission
  const { data: admissionBillsData, isLoading: admissionBillsLoading, mutate: mutateAdmissionBills } = useIPDBillings({
    admission: admission.id,
    ordering: '-bill_date',
  });

  // Fetch single bill if billId is provided
  const { data: selectedBill, mutate: mutateBill } = useIPDBillingById(billId || null);

  const { data: proceduresData } = useActiveProcedureMasters();
  const { data: packagesData } = useActiveProcedurePackages();
  const { data: investigationsData } = useInvestigations({ is_active: true });

  // Fetch unbilled requisitions for current admission
  const {
    data: unbilledData,
    mutate: mutateRequisitions
  } = useUnbilledRequisitions(admission?.id || null);

  const unbilledRequisitions = unbilledData?.requisitions || [];
  const totalUnbilledItems = unbilledData?.total_unbilled_items || 0;
  const estimatedUnbilledAmount = unbilledData?.estimated_amount || 0;

  const admissionBills = admissionBillsData?.results || [];
  const existingBill = selectedBill || admissionBills[0] || null;
  const isEditMode = !!existingBill;

  // State to control showing create bill button vs form
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [isSyncingClinicalCharges, setIsSyncingClinicalCharges] = useState(false);

  // Unified Bill Items State
  const [billItems, setBillItems] = useState<IPDBillItem[]>([]);

  // IPD Form Data
  const [billingFormData, setBillingFormData] = useState({
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    remarks: '',
  });

  // Common Billing State (Right Panel)
  const [billingData, setBillingData] = useState<BillingData>({
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

  // Auto-show form if bill exists
  useEffect(() => {
    if (!admissionBillsLoading) {
      if (existingBill || admissionBills.length > 0) {
        setShowBillingForm(true);
      }
    }
  }, [existingBill, admissionBillsLoading, admissionBills]);

  // Load bill items from existing bill
  useEffect(() => {
    if (existingBill) {
      setBillItems(existingBill.items || []);

      setBillingFormData({
        billNumber: existingBill.bill_number || '',
        billDate: existingBill.bill_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        diagnosis: existingBill.diagnosis || '',
        remarks: existingBill.remarks || '',
      });

      setBillingData({
        subtotal: existingBill.total_amount || '0',
        discountPercent: existingBill.discount_percent || '0',
        discount: existingBill.discount_amount || '0',
        totalAmount: existingBill.payable_amount || existingBill.total_amount || '0',
        paymentMode: existingBill.payment_mode || 'cash',
        receivedAmount: existingBill.received_amount || '0',
        balanceAmount: existingBill.balance_amount || '0',
      });
    }
  }, [existingBill]);

  // Recalculate billing totals from bill items
  useEffect(() => {
    if (existingBill) return;

    const subtotal = billItems.reduce((sum, item) => sum + parseFloat(item.total_price || '0'), 0);
    const disc = parseFloat(billingData.discount) || 0;
    const recv = parseFloat(billingData.receivedAmount) || 0;
    const total = Math.max(0, subtotal - disc);
    const balance = total - recv;

    setBillingData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      totalAmount: total.toFixed(2),
      balanceAmount: balance.toFixed(2),
    }));
  }, [billItems, billingData.discount, billingData.receivedAmount, existingBill]);

  const handleInputChange = (field: string, value: string) => {
    setBillingFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBillingChange = (field: string, value: string) => {
    if (field === 'paymentMode') {
      setBillingData((prev) => ({ ...prev, paymentMode: value as IPDPaymentMode }));
      return;
    }

    if (field === 'receivedAmount') {
      setBillingData((prev) => {
        const total = parseFloat(prev.totalAmount) || 0;
        const recv = parseFloat(value) || 0;
        const balance = (total - recv).toFixed(2);
        return { ...prev, receivedAmount: value, balanceAmount: balance };
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

    setBillingData((prev) => ({ ...prev, [field]: value }));
  };

  // Add investigation to bill items
  const handleAddInvestigation = async (investigation: Investigation) => {
    const newItem: IPDBillItem = {
      item_name: investigation.name,
      source: 'Lab',
      quantity: 1,
      system_calculated_price: investigation.price || '0',
      unit_price: investigation.price || '0',
      total_price: investigation.price || '0',
      notes: investigation.category || '',
    };

    if (existingBill) {
      const tempItem = { ...newItem, id: Date.now() };
      setBillItems((prev) => [...prev, tempItem]);
      toast.success('Investigation added to bill');

      try {
        const itemData: IPDBillItemCreateData = {
          bill: existingBill.id,
          item_name: newItem.item_name,
          source: newItem.source,
          quantity: newItem.quantity,
          unit_price: newItem.unit_price,
          system_calculated_price: newItem.system_calculated_price || newItem.unit_price,
          notes: newItem.notes || '',
        };

        await ipdBillingService.createBillItem(itemData);
        mutateBill();
        mutateAdmissionBills();
      } catch (error) {
        console.error('Failed to add investigation:', error);
        setBillItems((prev) => prev.filter(item => item.id !== tempItem.id));
        toast.error('Failed to add investigation to bill');
      }
    } else {
      setBillItems((prev) => [...prev, newItem]);
      toast.success('Investigation added (will be saved when bill is created)');
    }
  };

  // Add procedure to bill items
  const handleAddProcedure = async (procedure: ProcedureMaster) => {
    const newItem: IPDBillItem = {
      item_name: procedure.name,
      source: 'Procedure',
      quantity: 1,
      system_calculated_price: procedure.default_charge || '0',
      unit_price: procedure.default_charge || '0',
      total_price: procedure.default_charge || '0',
      notes: procedure.category || '',
    };

    if (existingBill) {
      const tempItem = { ...newItem, id: Date.now() };
      setBillItems((prev) => [...prev, tempItem]);
      toast.success('Procedure added to bill');

      try {
        const itemData: IPDBillItemCreateData = {
          bill: existingBill.id,
          item_name: newItem.item_name,
          source: newItem.source,
          quantity: newItem.quantity,
          unit_price: newItem.unit_price,
          system_calculated_price: newItem.system_calculated_price || newItem.unit_price,
          notes: newItem.notes || '',
        };

        await ipdBillingService.createBillItem(itemData);
        mutateBill();
        mutateAdmissionBills();
      } catch (error) {
        console.error('Failed to add procedure:', error);
        setBillItems((prev) => prev.filter(item => item.id !== tempItem.id));
        toast.error('Failed to add procedure to bill');
      }
    } else {
      setBillItems((prev) => [...prev, newItem]);
      toast.success('Procedure added (will be saved when bill is created)');
    }
  };

  // Handle package addition
  const handleAddPackage = async (packageId: number, packageName: string) => {
    try {
      const packageData = await procedurePackageService.getProcedurePackageById(packageId);

      if (!packageData.procedures || packageData.procedures.length === 0) {
        toast.error('This package has no procedures associated with it.');
        return;
      }

      const newItems: IPDBillItem[] = packageData.procedures.map((proc) => ({
        item_name: proc.name,
        source: 'Procedure',
        quantity: 1,
        system_calculated_price: proc.default_charge || '0',
        unit_price: proc.default_charge || '0',
        total_price: proc.default_charge || '0',
        notes: `Package: ${packageName}`,
      }));

      if (existingBill) {
        const tempItems = newItems.map((item, idx) => ({ ...item, id: Date.now() + idx }));
        setBillItems((prev) => [...prev, ...tempItems]);
        toast.success(`Added ${newItems.length} procedures from package to bill`);

        try {
          for (const item of newItems) {
            const itemData: IPDBillItemCreateData = {
              bill: existingBill.id,
              item_name: item.item_name,
              source: item.source,
              quantity: item.quantity,
              unit_price: item.unit_price,
              system_calculated_price: item.system_calculated_price || item.unit_price,
              notes: item.notes || '',
            };

            await ipdBillingService.createBillItem(itemData);
          }

          mutateBill();
          mutateAdmissionBills();
        } catch (error) {
          console.error('Failed to add package items:', error);
          const tempIds = tempItems.map(i => i.id);
          setBillItems((prev) => prev.filter(item => !tempIds.includes(item.id)));
          toast.error('Failed to add package items to bill');
        }
      } else {
        setBillItems((prev) => [...prev, ...newItems]);
        toast.success(`Added ${newItems.length} procedures from package (will be saved when bill is created)`);
      }
    } catch (error) {
      console.error('Error loading package:', error);
      toast.error('Failed to load package details. Please try again.');
    }
  };

  // Update bill item
  const handleUpdateBillItem = async (index: number, field: 'quantity' | 'unit_price', value: string) => {
    const item = billItems[index];

    const updatedItem = { ...item };
    if (field === 'quantity') {
      updatedItem.quantity = parseInt(value) || 1;
    } else if (field === 'unit_price') {
      updatedItem.unit_price = value;
      updatedItem.is_price_overridden = updatedItem.unit_price !== updatedItem.system_calculated_price;
    }
    updatedItem.total_price = (updatedItem.quantity * parseFloat(updatedItem.unit_price || '0')).toFixed(2);

    setBillItems((prev) => {
      const updated = [...prev];
      updated[index] = updatedItem;
      return updated;
    });

    if (existingBill && item.id) {
      try {
        await ipdBillingService.updateBillItem(item.id, {
          quantity: updatedItem.quantity,
          unit_price: updatedItem.unit_price,
          is_price_overridden: updatedItem.is_price_overridden,
        });

        mutateBill();
        mutateAdmissionBills();
      } catch (error) {
        console.error('Failed to update bill item:', error);
        toast.error('Failed to update item');

        setBillItems((prev) => {
          const reverted = [...prev];
          reverted[index] = item;
          return reverted;
        });

        mutateBill();
        mutateAdmissionBills();
      }
    }
  };

  // Remove bill item
  const handleRemoveBillItem = async (index: number) => {
    const item = billItems[index];

    const removedItem = billItems[index];
    setBillItems((prev) => prev.filter((_, i) => i !== index));
    toast.success('Item removed from bill');

    if (existingBill && item.id) {
      try {
        await ipdBillingService.deleteBillItem(item.id);

        mutateBill();
        mutateAdmissionBills();
      } catch (error) {
        console.error('Failed to remove bill item:', error);
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
    if (!admission?.id) return;

    setIsSyncingClinicalCharges(true);
    toast.info('Syncing clinical charges...');

    try {
      if (!existingBill) {
        await handleCreateInitialBill();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const response = await syncClinicalCharges(admission.id);

      toast.success('Clinical charges synced', {
        description: `Successfully synced ${response?.created_items || 0} clinical charges to the bill`,
      });

      setShowBillingForm(true);
      mutateBill();
      mutateAdmissionBills();
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
    if (!admission) return;

    setShowBillingForm(true);

    const initialBillData = {
      admission: admission.id,
      doctor_id: admission.doctor_id || user?.id,
      diagnosis: admission.provisional_diagnosis || '',
      remarks: '',
      discount_percent: '0',
      payment_mode: 'cash' as const,
      received_amount: '0',
      bill_date: new Date().toISOString(),
    };

    try {
      const newBill = await createBilling(initialBillData);

      toast.success('Bill created', {
        description: 'Bill has been created. You can now add more items and update payment details.',
      });

      mutateBill();
      mutateAdmissionBills();
    } catch (error) {
      console.error('Failed to create initial bill:', error);
      setShowBillingForm(false);

      toast.error('Failed to create bill', {
        description: 'Please try again.',
      });
    }
  };

  const handleSaveBill = async () => {
    if (!admission) return;

    if (billItems.length === 0) {
      toast.error('Add at least one item to the bill');
      return;
    }

    toast.success(isEditMode ? 'Updating bill...' : 'Creating bill...');

    try {
      const billData = {
        admission: admission.id,
        doctor_id: admission.doctor_id || user?.id,
        diagnosis: billingFormData.diagnosis || '',
        remarks: billingFormData.remarks || '',
        discount_percent: billingData.discountPercent || '0',
        discount_amount: billingData.discount || '0',
        payment_mode: billingData.paymentMode || 'cash',
        received_amount: billingData.receivedAmount || '0',
        bill_date: billingFormData.billDate,
      };

      if (isEditMode && existingBill) {
        await updateBilling(existingBill.id, billData);

        for (const item of existingBill.items || []) {
          if (item.id) {
            await ipdBillingService.deleteBillItem(item.id);
          }
        }

        toast.success('Bill updated successfully');
      } else {
        const savedBill = await createBilling(billData);

        for (const item of billItems) {
          const itemData: IPDBillItemCreateData = {
            bill: savedBill!.id,
            item_name: item.item_name,
            source: item.source,
            quantity: item.quantity,
            unit_price: item.unit_price,
            system_calculated_price: item.system_calculated_price || item.unit_price,
            notes: item.notes || '',
          };

          await ipdBillingService.createBillItem(itemData);
        }

        toast.success('Bill created successfully');
      }

      mutateBill();
      mutateAdmissionBills();
    } catch (error: any) {
      console.error('Failed to save bill:', error);
      toast.error('Failed to save bill', {
        description: error?.message || 'Please try again.',
      });
    }
  };

  // Print functionality - simple browser print
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.info('PDF download feature coming soon');
  };

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
      {/* Show "Create New Bill" button if no bill exists */}
      {admissionBills.length === 0 && !showBillingForm && !admissionBillsLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <Receipt className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Bill Created Yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              This admission doesn't have a bill yet. Click the button below to create a new bill.
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

      {/* Billing Form */}
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

          <TabsContent value="billing" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <IPDBillingTab
                  formData={billingFormData}
                  admission={admission}
                  onInputChange={handleInputChange}
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
                      visit={admission as any}
                      unbilledRequisitions={unbilledRequisitions}
                      totalUnbilledItems={totalUnbilledItems}
                      estimatedUnbilledAmount={estimatedUnbilledAmount}
                      requisitionsLoading={false}
                      isSyncingClinicalCharges={isSyncingClinicalCharges}
                      existingBill={existingBill as any}
                      investigationsData={investigationsData}
                      investigationsLoading={false}
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
                      procedures={[]}
                      proceduresData={proceduresData}
                      packagesData={packagesData}
                      proceduresLoading={false}
                      packagesLoading={false}
                      onAddProcedure={handleAddProcedure}
                      onAddPackage={handleAddPackage}
                      onUpdateProcedure={() => {}}
                      onRemoveProcedure={() => {}}
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

          <TabsContent value="preview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <IPDBillPreviewTab
                  ref={printAreaRef}
                  admission={admission}
                  billingFormData={billingFormData}
                  billItems={billItems}
                  billingData={billingData}
                  tenantData={tenantData}
                  tenantSettings={tenantSettings}
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
    </div>
  );
};
