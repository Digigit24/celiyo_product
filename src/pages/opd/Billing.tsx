// src/pages/opd/Billing.tsx
// deps: npm i react-to-print@^3 jspdf html2canvas
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { useOPDBill } from '@/hooks/useOPDBill';
import { useProcedureMaster } from '@/hooks/useProcedureMaster';
import { useProcedurePackage } from '@/hooks/useProcedurePackage';
import { procedurePackageService } from '@/services/procedurePackage.service';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  User,
  Receipt,
  CreditCard,
  IndianRupee,
  Trash2,
  Package,
  FileText,
  Search,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { DataTable } from '@/components/DataTable';
import type { OPDBill } from '@/types/opdBill.types';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface ProcedureItem {
  id: string;
  procedure_id: number;
  procedure_name: string;
  procedure_code?: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  notes: string;
}

/* --------------------------- Reusable Right Panel -------------------------- */

type BillingDetailsPanelProps = {
  data: BillingData;
  onChange: (field: string, value: string) => void;
  onFormatReceived: () => void;
  onSave: () => void;
  isEditMode?: boolean;
};

const BillingDetailsPanel = memo(function BillingDetailsPanel({
  data,
  onChange,
  onFormatReceived,
  onSave,
  isEditMode = false,
}: BillingDetailsPanelProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Billing Summary</CardTitle>
        <CardDescription>Combined OPD & Procedure charges</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 pb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">OPD Charges:</span>
            <span className="font-semibold">₹{data.opdTotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Procedure Charges:</span>
            <span className="font-semibold">₹{data.procedureTotal}</span>
          </div>
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

/* --------------------------------- Page --------------------------------- */

export default function OPDBilling() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { user, getTenant } = useAuth();
  const { useTenantDetail } = useTenant();

  // Get tenant from current session
  const tenant = getTenant();
  const tenantId = tenant?.id || null;

  // Fetch tenant settings for branding
  const { data: tenantData, isLoading: tenantLoading } = useTenantDetail(tenantId);
  const tenantSettings = tenantData?.settings || {};

  // Debug: Log tenant data
  useEffect(() => {
    console.log('Billing - Tenant data:', {
      hasTenantData: !!tenantData,
      tenantName: tenantData?.name,
      hasSettings: !!tenantSettings,
      address: tenantSettings?.address,
      contactEmail: tenantSettings?.contact_email,
      contactPhone: tenantSettings?.contact_phone,
    });
  }, [tenantData, tenantSettings]);

  const { useOpdVisitById } = useOpdVisit();
  const { useOPDBills, createBill, updateBill } = useOPDBill();
  const { useActiveProcedureMasters } = useProcedureMaster();
  const { useActiveProcedurePackages, useProcedurePackageById } = useProcedurePackage();

  const { data: visit, isLoading: visitLoading, error: visitError } = useOpdVisitById(visitId ? parseInt(visitId) : null);

  // Fetch bills for current visit (to check if bill exists)
  const { data: visitBillsData, isLoading: visitBillsLoading, mutate: mutateVisitBills } = useOPDBills({ visit: visitId ? parseInt(visitId) : undefined });

  // Fetch all bills for the patient (for bill history)
  const { data: patientBillsData, isLoading: patientBillsLoading } = useOPDBills({
    patient: visit?.patient,
    ordering: '-bill_date',  // Order by latest first
  });

  const { data: proceduresData, isLoading: proceduresLoading } = useActiveProcedureMasters();
  const { data: packagesData, isLoading: packagesLoading } = useActiveProcedurePackages();

  // Get existing bill for current visit if any
  const existingBill = visitBillsData?.results?.[0] || null;
  const isEditMode = !!existingBill;

  // Get all bills for patient history
  const patientBills = patientBillsData?.results || [];
  const billsLoading = visitBillsLoading || patientBillsLoading;

  // Function to refresh all bills
  const mutateBills = () => {
    mutateVisitBills();
  };

  // Print/Export ref (ONLY this area prints/exports)
  const printAreaRef = useRef<HTMLDivElement>(null);

  // OPD Billing State
  const [opdFormData, setOpdFormData] = useState({
    receiptNo: '',
    billDate: new Date().toISOString().split('T')[0],
    billTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    doctor: '',
    opdType: 'consultation',
    opdSubType: 'na',
    chargeType: '',
    diagnosis: '',
    remarks: '',
    opdAmount: '0.00',
  });

  // Procedure Billing State
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

  // Procedure Search
  const [procedureSearch, setProcedureSearch] = useState('');

  // Dialog states
  const [isProcedureDialogOpen, setIsProcedureDialogOpen] = useState(false);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [loadingPackageId, setLoadingPackageId] = useState<number | null>(null);

  // Map visit data to form when visit loads
  useEffect(() => {
    if (visit) {
      const receiptNo = visit.visit_number
        ? `BILL/${visit.visit_number.split('/').slice(1).join('/')}`
        : `BILL/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(
          new Date().getDate(),
        ).padStart(2, '0')}/001`;

      const isFollowUp = visit.visit_type === 'follow_up';

      const opdAmount = visit.doctor_details
        ? isFollowUp
          ? visit.doctor_details.follow_up_fee
          : visit.doctor_details.consultation_fee
        : '0.00';

      let chargeType = '';
      if (isFollowUp) chargeType = 'follow_up';
      else if (visit.visit_type === 'new') chargeType = 'first_visit';
      else chargeType = 'revisit';

      const billDate = visit.visit_date ? visit.visit_date : new Date().toISOString().split('T')[0];

      setOpdFormData((prev) => ({
        ...prev,
        receiptNo,
        billDate,
        doctor: visit.doctor?.toString() || '',
        opdType: 'consultation',
        opdSubType: 'na',
        chargeType,
        opdAmount,
      }));

      setProcedureFormData((prev) => ({
        ...prev,
        doctor: visit.doctor?.toString() || '',
      }));

      recalculateBilling(opdAmount, '0.00');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit]);

  // Load existing bill data if available
  useEffect(() => {
    if (existingBill && !billsLoading) {
      // Load OPD form data from existing bill
      const consultationItem = existingBill.items?.find(item => item.particular === 'consultation');
      if (consultationItem) {
        setOpdFormData((prev) => ({
          ...prev,
          receiptNo: existingBill.bill_number || prev.receiptNo,
          billDate: existingBill.bill_date || prev.billDate,
          doctor: existingBill.doctor?.toString() || prev.doctor,
          opdAmount: consultationItem.unit_charge || '0.00',
          remarks: existingBill.notes || '',
        }));
      }

      // Load procedure items from existing bill
      const procedureItems = existingBill.items
        ?.filter(item => item.particular === 'procedure')
        .map((item, idx) => ({
          id: `existing-${item.id || idx}`,
          procedure_id: 0, // We don't have the procedure ID in the bill items
          procedure_name: item.particular_name || '',
          procedure_code: '',
          quantity: item.quantity || 1,
          unit_price: item.unit_charge || '0.00',
          total_price: item.total_amount || '0.00',
          notes: item.note || '',
        })) || [];

      setProcedureFormData((prev) => ({
        ...prev,
        procedures: procedureItems,
      }));

      // Load billing data
      setBillingData({
        opdTotal: consultationItem?.total_amount || '0.00',
        procedureTotal: existingBill.items
          ?.filter(item => item.particular === 'procedure')
          .reduce((sum, item) => sum + parseFloat(item.total_amount || '0'), 0)
          .toFixed(2) || '0.00',
        subtotal: existingBill.subtotal_amount || '0.00',
        discount: existingBill.discount_amount || '0.00',
        discountPercent: existingBill.discount_percent || '0',
        totalAmount: existingBill.total_amount || '0.00',
        paymentMode: (existingBill.payment_mode as any) || 'cash',
        receivedAmount: existingBill.received_amount || '0.00',
        balanceAmount: existingBill.balance_amount || '0.00',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingBill, billsLoading]);

  // Recalculate billing totals
  const recalculateBilling = (
    opdTotal: string = billingData.opdTotal,
    procedureTotal: string = billingData.procedureTotal,
    discount: string = billingData.discount,
    received: string = billingData.receivedAmount,
  ) => {
    const opd = parseFloat(opdTotal) || 0;
    const procedure = parseFloat(procedureTotal) || 0;
    const disc = parseFloat(discount) || 0;
    const recv = parseFloat(received) || 0;

    const subtotal = opd + procedure;
    const total = Math.max(0, subtotal - disc);
    const balance = total - recv;
    const discountPercent = subtotal > 0 ? ((disc / subtotal) * 100).toFixed(2) : '0';

    setBillingData((prev) => ({
      ...prev,
      opdTotal,
      procedureTotal,
      subtotal: subtotal.toFixed(2),
      discount: disc.toFixed(2),
      discountPercent,
      totalAmount: total.toFixed(2),
      balanceAmount: balance.toFixed(2),
    }));
  };

  // Update OPD amount
  useEffect(() => {
    recalculateBilling(opdFormData.opdAmount, billingData.procedureTotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opdFormData.opdAmount]);

  // Calculate procedure total
  useEffect(() => {
    const total = procedureFormData.procedures.reduce((sum, proc) => sum + (parseFloat(proc.total_price) || 0), 0);
    recalculateBilling(billingData.opdTotal, total.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procedureFormData.procedures]);

  const handleOpdInputChange = (field: string, value: string) => {
    setOpdFormData((prev) => ({ ...prev, [field]: value }));
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

  const removeProcedure = (id: string) => {
    setProcedureFormData((prev) => ({ ...prev, procedures: prev.procedures.filter((p) => p.id !== id) }));
  };

  const updateProcedure = (id: string, field: keyof ProcedureItem, value: any) => {
    setProcedureFormData((prev) => ({
      ...prev,
      procedures: prev.procedures.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          const qty = field === 'quantity' ? parseInt(value) : updated.quantity;
          const price = field === 'unit_price' ? parseFloat(value) : parseFloat(updated.unit_price);
          updated.total_price = ((qty || 0) * (price || 0)).toFixed(2);
        }
        return updated;
      }),
    }));
  };

  const addProcedureToList = (procedureId: number, procedureName: string, procedureCode: string, defaultCharge: string) => {
    const newProcedure: ProcedureItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      procedure_id: procedureId,
      procedure_name: procedureName,
      procedure_code: procedureCode,
      quantity: 1,
      unit_price: defaultCharge,
      total_price: defaultCharge,
      notes: '',
    };
    setProcedureFormData((prev) => ({
      ...prev,
      procedures: [...prev.procedures, newProcedure],
    }));
    setIsProcedureDialogOpen(false);
  };

  const addPackageToList = async (packageId: number, packageName: string) => {
    try {
      setLoadingPackageId(packageId);

      // Fetch full package details with procedures using the service
      const packageData = await procedurePackageService.getProcedurePackageById(packageId);

      if (!packageData.procedures || packageData.procedures.length === 0) {
        alert('This package has no procedures associated with it.');
        return;
      }

      const newProcedures: ProcedureItem[] = packageData.procedures.map((proc) => ({
        id: `temp-${Date.now()}-${Math.random()}-${proc.id}`,
        procedure_id: proc.id,
        procedure_name: proc.name,
        procedure_code: proc.code,
        quantity: 1,
        unit_price: proc.default_charge,
        total_price: proc.default_charge,
        notes: `Package: ${packageName}`,
      }));

      setProcedureFormData((prev) => ({
        ...prev,
        procedures: [...prev.procedures, ...newProcedures],
      }));

      setIsPackageDialogOpen(false);
    } catch (error) {
      console.error('Error loading package:', error);
      alert('Failed to load package details. Please try again.');
    } finally {
      setLoadingPackageId(null);
    }
  };

  const handleSaveBill = async () => {
    if (!visit) return;

    try {
      const billData = {
        bill_date: opdFormData.billDate,
        patient: visit.patient,
        visit: visit.id,
        doctor: parseInt(opdFormData.doctor),
        bill_type: 'consultation' as const,
        items: [
          {
            particular: 'consultation',
            particular_name: 'Consultation Fee',
            quantity: 1,
            unit_charge: opdFormData.opdAmount,
            discount_amount: '0',
            total_amount: opdFormData.opdAmount,
          },
          ...procedureFormData.procedures.map((proc, idx) => ({
            particular: 'procedure',
            particular_name: proc.procedure_name,
            quantity: proc.quantity,
            unit_charge: proc.unit_price,
            discount_amount: '0',
            total_amount: proc.total_price,
            item_order: idx + 1,
            note: proc.notes,
          })),
        ],
        subtotal_amount: billingData.subtotal,
        discount_amount: billingData.discount,
        discount_percent: billingData.discountPercent,
        tax_amount: '0',
        total_amount: billingData.totalAmount,
        received_amount: billingData.receivedAmount,
        balance_amount: billingData.balanceAmount,
        payment_status: parseFloat(billingData.balanceAmount) === 0 ? 'paid' : parseFloat(billingData.receivedAmount) > 0 ? 'partial' : 'unpaid',
        payment_mode: billingData.paymentMode,
        notes: opdFormData.remarks,
      };

      if (isEditMode && existingBill) {
        // Update existing bill
        await updateBill(existingBill.id, billData as any);
        mutateBills();
        alert('Bill updated successfully!');
      } else {
        // Create new bill
        await createBill(billData as any);
        mutateBills();
        alert('Bill created successfully!');
      }
    } catch (error) {
      console.error('Failed to save bill:', error);
      alert('Failed to save bill. Please try again.');
    }
  };

  const isLoading = visitLoading || visitBillsLoading || tenantLoading;

  /* ------------------------------- Printing ------------------------------- */

  const handlePrint = useReactToPrint({
    documentTitle: opdFormData.receiptNo || 'OPD-Bill',
    contentRef: printAreaRef, // react-to-print v3
    pageStyle: `
      @page { size: A4; margin: 0 }
      @media print {
        html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  const handleDownloadPDF = useCallback(async () => {
    const el = printAreaRef.current;
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${opdFormData.receiptNo || 'OPD-Bill'}.pdf`);
  }, [opdFormData.receiptNo]);

  /* --------------------------------- Guards -------------------------------- */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (visitError || !visit) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Billing</CardTitle>
            <CardDescription>{visitError?.message || 'Visit not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/opd/visits')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Visits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/opd/visits`)}
            className="no-print"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Billing</h1>
              {isEditMode && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  Editing Existing Bill
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground">Visit #{visit.visit_number}</p>
              <Badge variant="outline" className="capitalize">
                {visit.visit_type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Payment Status</p>
            <Badge variant={visit.payment_status === 'paid' ? 'default' : 'destructive'} className="mt-1">
              {visit.payment_status}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Patient Summary */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Patient Name</p>
                <p className="font-semibold text-lg">{visit.patient_details?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Patient ID</p>
                <p className="font-mono text-sm text-primary">
                  {visit.patient_details?.patient_id || visit.patient || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Age & Gender</p>
                <p className="font-semibold">
                  {visit.patient_details?.age || 'N/A'} Yrs{' '}
                  {visit.patient_details?.gender
                    ? visit.patient_details.gender.charAt(0).toUpperCase() + visit.patient_details.gender.slice(1)
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Doctor</p>
                <p className="font-semibold">{visit.doctor_details?.full_name || 'Not assigned'}</p>
                {visit.doctor_details?.specialties && (
                  <p className="text-xs text-muted-foreground">{visit.doctor_details.specialties.map(s => s.name).join(', ')}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registration</p>
                <Badge variant="outline" className="font-mono">
                  {visit.created_at ? format(new Date(visit.created_at), 'dd/MM/yyyy') : 'N/A'}
                </Badge>
                {visit.patient_details?.mobile_primary && (
                  <p className="text-xs text-muted-foreground mt-1">📞 {visit.patient_details.mobile_primary}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="opd" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="opd" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            OPD Billing
          </TabsTrigger>
          <TabsTrigger value="procedure" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Procedure Billing
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Bill Preview
          </TabsTrigger>
        </TabsList>

        {/* OPD Billing */}
        <TabsContent value="opd" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>OPD Details</CardTitle>
                <CardDescription>Consultation charges & details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptNo">Receipt No.</Label>
                    <Input id="receiptNo" value={opdFormData.receiptNo} className="bg-muted" readOnly />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="billDate">Bill Date</Label>
                      <Input
                        id="billDate"
                        type="date"
                        value={opdFormData.billDate}
                        onChange={(e) => handleOpdInputChange('billDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billTime">Time</Label>
                      <Input
                        id="billTime"
                        type="time"
                        value={opdFormData.billTime}
                        onChange={(e) => handleOpdInputChange('billTime', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor">
                    Doctor <span className="text-destructive">*</span>
                  </Label>
                  <Select value={opdFormData.doctor} onValueChange={(v) => handleOpdInputChange('doctor', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Doctor">{visit.doctor_details?.full_name || 'Select Doctor'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {visit.doctor && visit.doctor_details?.full_name && (
                        <SelectItem value={visit.doctor.toString()}>
                          {visit.doctor_details.full_name}
                          {visit.doctor_details.specialties && ` - ${visit.doctor_details.specialties.map(s => s.name).join(', ')}`}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="opdType">
                      OPD Type <span className="text-destructive">*</span>
                    </Label>
                    <Select value={opdFormData.opdType} onValueChange={(v) => handleOpdInputChange('opdType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select OPD Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">CONSULTATION</SelectItem>
                        <SelectItem value="follow_up">FOLLOW-UP</SelectItem>
                        <SelectItem value="emergency">EMERGENCY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chargeType">
                      Charge Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={opdFormData.chargeType}
                      onValueChange={(v) => handleOpdInputChange('chargeType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Charge Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_visit">FIRST VISIT</SelectItem>
                        <SelectItem value="revisit">REVISIT</SelectItem>
                        <SelectItem value="emergency">EMERGENCY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opdAmount">OPD Charges</Label>
                  <div className="relative">
                    <Input
                      id="opdAmount"
                      type="number"
                      value={opdFormData.opdAmount}
                      onChange={(e) => handleOpdInputChange('opdAmount', e.target.value)}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">INR</span>
                  </div>
                  {visit.doctor_details && (
                    <p className="text-xs text-muted-foreground">
                      {visit.visit_type === 'follow_up' ? 'Follow-up' : 'Consultation'} fee: ₹
                      {visit.visit_type === 'follow_up' ? visit.doctor_details.follow_up_fee : visit.doctor_details.consultation_fee}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Textarea
                    id="diagnosis"
                    placeholder="Enter diagnosis"
                    value={opdFormData.diagnosis}
                    onChange={(e) => handleOpdInputChange('diagnosis', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Enter remarks"
                    value={opdFormData.remarks}
                    onChange={(e) => handleOpdInputChange('remarks', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right Side - Common Billing Details */}
            <BillingDetailsPanel
              data={billingData}
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

        {/* Procedure Billing */}
        <TabsContent value="procedure" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Procedure Billing</CardTitle>
                  <CardDescription className="mt-1">Add procedures & tests</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isProcedureDialogOpen} onOpenChange={setIsProcedureDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Procedure
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Select Procedure</DialogTitle>
                        <DialogDescription>Choose a procedure to add to the bill</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search procedures..."
                            value={procedureSearch}
                            onChange={(e) => setProcedureSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <div className="space-y-2">
                          {proceduresLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading procedures...</div>
                          ) : proceduresData?.results && proceduresData.results.length > 0 ? (
                            proceduresData.results
                              .filter((proc) =>
                                procedureSearch
                                  ? proc.name.toLowerCase().includes(procedureSearch.toLowerCase()) ||
                                    proc.code.toLowerCase().includes(procedureSearch.toLowerCase())
                                  : true
                              )
                              .map((procedure) => (
                                <div
                                  key={procedure.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                  onClick={() => addProcedureToList(procedure.id, procedure.name, procedure.code, procedure.default_charge)}
                                >
                                  <div>
                                    <div className="font-medium">{procedure.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {procedure.code} • {procedure.category}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">₹{parseFloat(procedure.default_charge).toFixed(2)}</div>
                                    <Button size="sm" variant="ghost" className="h-6 mt-1">
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">No procedures found</div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Package className="h-4 w-4 mr-1" />
                        Add Package
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Select Package</DialogTitle>
                        <DialogDescription>Choose a package to add to the bill</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {packagesLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading packages...</div>
                          ) : packagesData?.results && packagesData.results.length > 0 ? (
                            packagesData.results.map((pkg) => {
                              const procedureCount = pkg.procedures?.length ?? pkg.procedure_count ?? 0;
                              const isLoading = loadingPackageId === pkg.id;

                              return (
                                <div
                                  key={pkg.id}
                                  className={`flex flex-col p-4 border rounded-lg ${isLoading ? 'opacity-50' : 'hover:bg-muted/50 cursor-pointer'}`}
                                  onClick={() => !isLoading && addPackageToList(pkg.id, pkg.name)}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <div className="font-medium text-lg">{pkg.name}</div>
                                      <div className="text-xs text-muted-foreground">{pkg.code}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-muted-foreground line-through">
                                        ₹{parseFloat(pkg.total_charge).toFixed(2)}
                                      </div>
                                      <div className="font-semibold text-lg text-green-600">
                                        ₹{parseFloat(pkg.discounted_charge).toFixed(2)}
                                      </div>
                                      {pkg.discount_percent && (
                                        <div className="text-xs text-green-600">{pkg.discount_percent}% off</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Includes {procedureCount} procedure{procedureCount !== 1 ? 's' : ''}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="mt-3 w-full"
                                    disabled={isLoading}
                                  >
                                    {isLoading ? 'Loading...' : 'Add Package'}
                                  </Button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">No packages found</div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Procedures Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[250px]">Procedure</TableHead>
                        <TableHead className="w-[100px] text-center">Qty</TableHead>
                        <TableHead className="w-[120px] text-right">Rate</TableHead>
                        <TableHead className="w-[120px] text-right">Amount</TableHead>
                        <TableHead className="w-[80px] text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {procedureFormData.procedures.length > 0 ? (
                        procedureFormData.procedures.map((procedure) => (
                          <TableRow key={procedure.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{procedure.procedure_name}</div>
                                {procedure.procedure_code && (
                                  <div className="text-xs text-muted-foreground">{procedure.procedure_code}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                value={procedure.quantity}
                                onChange={(e) => updateProcedure(procedure.id, 'quantity', e.target.value)}
                                className="w-16 mx-auto text-center"
                                min="1"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={procedure.unit_price}
                                onChange={(e) => updateProcedure(procedure.id, 'unit_price', e.target.value)}
                                className="w-24 ml-auto text-right"
                                min="0"
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹{parseFloat(procedure.total_price).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => removeProcedure(procedure.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No procedures added yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Procedure Total */}
                {procedureFormData.procedures.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Procedure Total</span>
                      <span className="text-2xl font-bold">₹{billingData.procedureTotal}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Side - Common Billing Details */}
            <BillingDetailsPanel
              data={billingData}
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

        {/* Bill Preview */}
        <TabsContent value="preview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <div
                ref={printAreaRef}
                className="p-8 space-y-6"
                style={{
                  maxWidth: '210mm',
                  margin: '0 auto',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                }}
              >
                {/* Hospital Header */}
                <div className="text-center border-b-2 pb-4" style={{ borderColor: '#374151' }}>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>
                    {tenantData?.name || 'HOSPITAL'}
                  </h1>

                  {/* Address and Contact Info */}
                  <div className="text-sm mt-2 space-y-1">
                    {/* Address - single line, no label */}
                    <p style={{ color: '#6b7280' }}>
                      {tenantSettings?.address || 'Address not available'}
                    </p>

                    {/* Email and Contact - single line */}
                    <p style={{ color: '#6b7280' }}>
                      mail id : {tenantSettings?.contact_email || 'N/A'} , Contact: {tenantSettings?.contact_phone || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Bill Title */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold" style={{ color: '#374151' }}>INVOICE</h2>
                </div>

                {/* Top meta */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                    <span className="font-semibold" style={{ color: '#374151' }}>Patient Name</span>
                    <span style={{ color: '#000000' }}>{visit.patient_details?.full_name}</span>
                  </div>
                  <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                    <span className="font-semibold" style={{ color: '#374151' }}>Patient ID</span>
                    <span style={{ color: '#000000' }}>{visit.patient_details?.patient_id}</span>
                  </div>
                  <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                    <span className="font-semibold" style={{ color: '#374151' }}>Age / Gender</span>
                    <span style={{ color: '#000000' }}>
                      {visit.patient_details?.age} Yrs / {visit.patient_details?.gender}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                    <span className="font-semibold" style={{ color: '#374151' }}>Mobile</span>
                    <span style={{ color: '#000000' }}>{visit.patient_details?.mobile_primary}</span>
                  </div>
                  <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                    <span className="font-semibold" style={{ color: '#374151' }}>Visit No</span>
                    <span style={{ color: '#000000' }}>{visit.visit_number}</span>
                  </div>
                  <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                    <span className="font-semibold" style={{ color: '#374151' }}>Visit Date</span>
                    <span style={{ color: '#000000' }}>{format(new Date(visit.visit_date), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                    <span className="font-semibold" style={{ color: '#374151' }}>Doctor</span>
                    <span style={{ color: '#000000' }}>{visit.doctor_details?.full_name}</span>
                  </div>
                  <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                    <span className="font-semibold" style={{ color: '#374151' }}>Bill No / Date</span>
                    <span style={{ color: '#000000' }}>
                      {opdFormData.receiptNo} • {format(new Date(opdFormData.billDate), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </div>

                {/* Charges table */}
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderTop: '2px solid #9ca3af', borderBottom: '2px solid #9ca3af', backgroundColor: '#f9fafb' }}>
                      <th className="text-left py-3 px-2 font-semibold" style={{ color: '#374151' }}>Description</th>
                      <th className="text-center py-3 px-2 font-semibold w-16" style={{ color: '#374151' }}>Qty</th>
                      <th className="text-right py-3 px-2 font-semibold w-24" style={{ color: '#374151' }}>Rate</th>
                      <th className="text-right py-3 px-2 font-semibold w-28" style={{ color: '#374151' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseFloat(opdFormData.opdAmount) > 0 && (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td className="py-3 px-2" style={{ color: '#000000' }}>
                          <div>Consultation Fee</div>
                          <div className="text-xs capitalize" style={{ color: '#6b7280' }}>
                            {opdFormData.chargeType.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center" style={{ color: '#000000' }}>1</td>
                        <td className="py-3 px-2 text-right" style={{ color: '#000000' }}>{Number(opdFormData.opdAmount).toFixed(2)}</td>
                        <td className="py-3 px-2 text-right font-semibold" style={{ color: '#000000' }}>
                          {Number(opdFormData.opdAmount).toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {procedureFormData.procedures.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td className="py-3 px-2" style={{ color: '#000000' }}>
                          <div>{p.procedure_name}</div>
                          {p.procedure_code && (
                            <div className="text-xs" style={{ color: '#6b7280' }}>Code: {p.procedure_code}</div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center" style={{ color: '#000000' }}>{p.quantity}</td>
                        <td className="py-3 px-2 text-right" style={{ color: '#000000' }}>{Number(p.unit_price).toFixed(2)}</td>
                        <td className="py-3 px-2 text-right font-semibold" style={{ color: '#000000' }}>{Number(p.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                    {opdFormData.diagnosis && (
                      <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        <td className="py-2 px-2 text-xs" colSpan={4} style={{ color: '#374151' }}>
                          <span className="font-semibold">Diagnosis:</span> {opdFormData.diagnosis}
                        </td>
                      </tr>
                    )}
                    {opdFormData.remarks && (
                      <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        <td className="py-2 px-2 text-xs" colSpan={4} style={{ color: '#374151' }}>
                          <span className="font-semibold">Remarks:</span> {opdFormData.remarks}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Amounts */}
                <div className="mt-6 space-y-3 text-sm p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                  <div className="flex justify-between">
                    <span style={{ color: '#4b5563' }}>Subtotal</span>
                    <span className="font-semibold" style={{ color: '#000000' }}>₹ {billingData.subtotal}</span>
                  </div>
                  {parseFloat(billingData.discount) > 0 && (
                    <div className="flex justify-between" style={{ color: '#15803d' }}>
                      <span>Discount ({billingData.discountPercent}%)</span>
                      <span className="font-semibold">- ₹ {billingData.discount}</span>
                    </div>
                  )}
                  <div className="pt-3 flex justify-between text-base font-bold" style={{ borderTop: '2px solid #9ca3af', color: '#000000' }}>
                    <span>Total Amount</span>
                    <span>₹ {billingData.totalAmount}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: '#15803d' }}>
                    <span>Amount Received ({billingData.paymentMode.toUpperCase()})</span>
                    <span className="font-semibold">₹ {billingData.receivedAmount}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold" style={{ color: '#c2410c' }}>
                    <span>Balance Due</span>
                    <span>₹ {billingData.balanceAmount}</span>
                  </div>
                </div>

                {/* Signatures & Terms */}
                <div className="mt-8 grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs mb-2" style={{ color: '#4b5563' }}>Patient Signature</p>
                    <div className="h-12" style={{ borderBottom: '2px solid #9ca3af' }} />
                  </div>
                  <div>
                    <p className="text-xs mb-2" style={{ color: '#4b5563' }}>Authorized Signatory</p>
                    <div className="h-12" style={{ borderBottom: '2px solid #9ca3af' }} />
                  </div>
                </div>

                <div className="mt-6 text-xs" style={{ color: '#4b5563' }}>
                  <p className="font-semibold mb-2">Terms & Conditions</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>This is a computer generated bill; signature not required.</li>
                    <li>Please retain this copy for future reference.</li>
                    <li>Bills are non-transferable.</li>
                  </ul>
                </div>

                <div className="mt-4 text-center text-xs pt-4" style={{ borderTop: '1px solid #d1d5db', color: '#6b7280' }}>
                  Generated on: {format(new Date(), 'dd/MM/yyyy hh:mm a')}
                </div>
              </div>
            </Card>

            {/* Right Side - Common Billing Details */}
            <BillingDetailsPanel
              data={billingData}
              onChange={handleBillingChange}
              onFormatReceived={() => {
                const num = parseFloat(billingData.receivedAmount);
                if (!isNaN(num)) setBillingData((prev) => ({ ...prev, receivedAmount: num.toFixed(2) }));
              }}
              onSave={handleSaveBill}
              isEditMode={isEditMode}
            />
          </div>

          {/* Print / Download Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3 justify-center no-print">
                <Button variant="outline" size="lg" onClick={handleDownloadPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="default" size="lg" onClick={handlePrint}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Print Bill
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bill History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bill History</CardTitle>
                  <CardDescription className="mt-1">View all bills for this patient across all visits</CardDescription>
                </div>
                {patientBills && patientBills.length > 0 && (
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {patientBills.length} {patientBills.length === 1 ? 'Bill' : 'Bills'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={patientBills || []}
                isLoading={billsLoading}
                columns={[
                  {
                    header: 'Bill Number',
                    key: 'bill_number',
                    cell: (bill: OPDBill) => <div className="font-mono text-sm font-medium">{bill.bill_number}</div>,
                  },
                  {
                    header: 'Visit',
                    key: 'visit',
                    cell: (bill: OPDBill) => (
                      <div className="text-sm">
                        <div className="font-mono font-medium">{bill.visit_number || `#${bill.visit}`}</div>
                        {bill.visit === visit?.id && (
                          <Badge variant="secondary" className="text-xs mt-1">Current</Badge>
                        )}
                      </div>
                    ),
                  },
                  {
                    header: 'Bill Date',
                    key: 'bill_date',
                    cell: (bill: OPDBill) => (
                      <div className="text-sm">
                        {format(new Date(bill.bill_date), 'dd MMM yyyy')}
                      </div>
                    ),
                  },
                  {
                    header: 'Doctor',
                    key: 'doctor',
                    cell: (bill: OPDBill) => (
                      <div className="text-sm">
                        <div className="font-medium">{bill.doctor_name || 'N/A'}</div>
                      </div>
                    ),
                  },
                  {
                    header: 'Total',
                    key: 'total',
                    className: 'text-right',
                    cell: (bill: OPDBill) => (
                      <div className="text-sm font-semibold text-right">₹{parseFloat(bill.total_amount).toFixed(2)}</div>
                    ),
                  },
                  {
                    header: 'Received',
                    key: 'received',
                    className: 'text-right',
                    cell: (bill: OPDBill) => (
                      <div className="text-sm text-green-600 font-semibold text-right">
                        ₹{parseFloat(bill.received_amount).toFixed(2)}
                      </div>
                    ),
                  },
                  {
                    header: 'Balance',
                    key: 'balance',
                    className: 'text-right',
                    cell: (bill: OPDBill) => (
                      <div className="text-sm text-orange-600 font-semibold text-right">
                        ₹{parseFloat(bill.balance_amount).toFixed(2)}
                      </div>
                    ),
                  },
                  {
                    header: 'Status',
                    key: 'status',
                    cell: (bill: OPDBill) => (
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
                    ),
                  },
                ]}
                renderMobileCard={(bill: OPDBill) => (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-mono text-sm font-medium">{bill.bill_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(bill.bill_date), 'dd MMM yyyy')}
                        </div>
                      </div>
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
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{bill.doctor_name || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="text-sm font-semibold">₹{parseFloat(bill.total_amount).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Received</div>
                        <div className="text-sm font-semibold text-green-600">
                          ₹{parseFloat(bill.received_amount).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Balance</div>
                        <div className="text-sm font-semibold text-orange-600">
                          ₹{parseFloat(bill.balance_amount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 no-print">
                      <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadPDF}>
                        <FileText className="h-4 w-4 mr-1" /> PDF
                      </Button>
                      <Button variant="default" size="sm" className="flex-1" onClick={handlePrint}>
                        <Receipt className="h-4 w-4 mr-1" /> Print
                      </Button>
                    </div>
                  </>
                )}
                getRowId={(bill: OPDBill) => bill.id.toString()}
                getRowLabel={(bill: OPDBill) => bill.bill_number}
                onView={(bill: OPDBill) => console.log('View bill:', bill.id)}
                extraActions={(bill: OPDBill) => (
                  <>
                    <DropdownMenuItem onClick={handlePrint}>
                      <Receipt className="h-4 w-4 mr-2" />
                      Print Bill
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                  </>
                )}
                emptyTitle="No bills found"
                emptySubtitle="Bills created for this visit will appear here"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
