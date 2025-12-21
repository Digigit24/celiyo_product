// src/pages/ipd/Billing.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, IndianRupee, FileText, Beaker, Package, Bed } from 'lucide-react';
import { useIPD } from '@/hooks/useIPD';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { useProcedureMaster } from '@/hooks/useProcedureMaster';
import { useProcedurePackage } from '@/hooks/useProcedurePackage';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { SideDrawer, DrawerActionButton } from '@/components/SideDrawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import type {
  IPDBilling,
  IPDBillingListItem,
  IPDBillItem,
  BillingStatus,
  BillItemSource,
} from '@/types/ipd.types';
import { toast } from 'sonner';

type BillingRow = IPDBilling | IPDBillingListItem;

const BILL_STATUS_COLORS: Record<BillingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

type DrawerMode = 'create' | 'view';

const DEFAULT_ITEM = {
  item_name: '',
  source: 'Other' as BillItemSource,
  quantity: 1,
  unit_price: '',
  notes: '',
};

export default function IPDBillingPage() {
  const {
    useBillings,
    useBillingById,
    createBilling,
    addBedCharges,
    addPayment,
    createBillItem,
    useActiveAdmissions,
  } = useIPD();
  const { useInvestigations } = useDiagnostics();
  const { useActiveProcedureMasters } = useProcedureMaster();
  const { useActiveProcedurePackages } = useProcedurePackage();

  const { data: billingsData, isLoading, mutate } = useBillings({ ordering: '-bill_date' });
  const rows = (billingsData?.results || []) as BillingRow[];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [itemForm, setItemForm] = useState(DEFAULT_ITEM);
  const [investigationId, setInvestigationId] = useState<number | null>(null);
  const [procedureId, setProcedureId] = useState<number | null>(null);
  const [packageId, setPackageId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Lookups
  const { data: activeAdmissionsData } = useActiveAdmissions();
  const admissions = activeAdmissionsData || [];
  const { data: investigationsData } = useInvestigations({ is_active: true });
  const investigations = investigationsData?.results || [];
  const { data: proceduresData } = useActiveProcedureMasters();
  const procedures = proceduresData?.results || [];
  const { data: packagesData } = useActiveProcedurePackages();
  const packages = packagesData?.results || [];

  // Billing detail
  const { data: billingDetail, mutate: mutateBillingDetail } = useBillingById(
    drawerMode === 'view' && selectedBillingId ? selectedBillingId : null
  );

  const columns: DataTableColumn<BillingRow>[] = useMemo(
    () => [
      {
        key: 'bill_number',
        header: 'Bill #',
        accessor: (row) => (row as IPDBillingListItem).bill_number,
        cell: (row) => (
          <span className="font-mono font-semibold text-sm">
            {(row as IPDBillingListItem).bill_number}
          </span>
        ),
        sortable: true,
      },
      {
        key: 'admission_id',
        header: 'Admission',
        accessor: (row) => (row as IPDBillingListItem).admission_id || '',
        cell: (row) => (row as IPDBillingListItem).admission_id || '',
        sortable: true,
        filterable: true,
      },
      {
        key: 'patient_name',
        header: 'Patient',
        accessor: (row) => (row as IPDBillingListItem).patient_name || '',
        cell: (row) => <span className="font-medium">{(row as IPDBillingListItem).patient_name}</span>,
        sortable: true,
        filterable: true,
      },
      {
        key: 'bill_date',
        header: 'Bill Date',
        accessor: (row) => (row as IPDBillingListItem).bill_date,
        cell: (row) => {
          const dateVal = (row as IPDBillingListItem).bill_date;
          return dateVal ? format(new Date(dateVal), 'dd MMM yyyy') : '-';
        },
        sortable: true,
      },
      {
        key: 'total_amount',
        header: 'Total',
        accessor: (row) => parseFloat((row as IPDBillingListItem).total_amount || '0'),
        cell: (row) => (
          <span className="font-semibold">
            ₹{Number.parseFloat((row as IPDBillingListItem).total_amount || '0').toFixed(2)}
          </span>
        ),
        sortable: true,
      },
      {
        key: 'status',
        header: 'Status',
        accessor: (row) => (row as IPDBillingListItem).status,
        cell: (row) => {
          const status = (row as IPDBillingListItem).status as BillingStatus;
          return <Badge className={BILL_STATUS_COLORS[status]}>{status}</Badge>;
        },
        sortable: true,
        filterable: true,
      },
    ],
    []
  );

  const openCreate = () => {
    setDrawerMode('create');
    setSelectedBillingId(null);
    setSelectedAdmission(null);
    setPaymentAmount('');
    setItemForm(DEFAULT_ITEM);
    setInvestigationId(null);
    setProcedureId(null);
    setPackageId(null);
    setDrawerOpen(true);
  };

  const openView = (row: BillingRow) => {
    const id = (row as any).id;
    setSelectedBillingId(id);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerMode('create');
    setSelectedBillingId(null);
    setSelectedAdmission(null);
    setPaymentAmount('');
    setItemForm(DEFAULT_ITEM);
    setInvestigationId(null);
    setProcedureId(null);
    setPackageId(null);
  };

  // Auto-fill item from investigation/procedure/package selection
  useEffect(() => {
    if (investigationId) {
      const inv = investigations.find((i: any) => i.id === investigationId);
      if (inv) {
        setItemForm({
          ...itemForm,
          item_name: inv.name,
          source: 'Lab',
          unit_price: inv.base_charge,
          quantity: 1,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investigationId]);

  useEffect(() => {
    if (procedureId) {
      const proc = procedures.find((p: any) => p.id === procedureId);
      if (proc) {
        setItemForm({
          ...itemForm,
          item_name: proc.name || proc.procedure_name || 'Procedure',
          source: 'Procedure',
          unit_price: proc.price || proc.base_price || '0.00',
          quantity: 1,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procedureId]);

  useEffect(() => {
    if (packageId) {
      const pack = packages.find((p: any) => p.id === packageId);
      if (pack) {
        setItemForm({
          ...itemForm,
          item_name: pack.name || 'Package',
          source: 'Procedure',
          unit_price: pack.price || pack.base_price || '0.00',
          quantity: 1,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId]);

  const handleCreateBilling = async () => {
    if (!selectedAdmission) {
      toast.error('Select an admission');
      return;
    }
    setIsSaving(true);
    try {
      await createBilling({ admission: selectedAdmission });
      toast.success('Billing created with bed charges added');
      mutate();
      closeDrawer();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create billing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBedCharges = async () => {
    if (!selectedBillingId) return;
    setIsSaving(true);
    try {
      await addBedCharges(selectedBillingId);
      toast.success('Bed charges added');
      mutate();
      mutateBillingDetail();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add bed charges');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedBillingId) return;
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Enter payment amount');
      return;
    }
    setIsSaving(true);
    try {
      await addPayment(selectedBillingId, { amount: paymentAmount });
      toast.success('Payment added');
      setPaymentAmount('');
      mutate();
      mutateBillingDetail();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add payment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedBillingId) return;
    if (!itemForm.item_name || !itemForm.unit_price) {
      toast.error('Item name and price are required');
      return;
    }
    setIsSaving(true);
    try {
      await createBillItem({
        billing: selectedBillingId,
        item_name: itemForm.item_name,
        source: itemForm.source,
        quantity: itemForm.quantity,
        unit_price: itemForm.unit_price,
        notes: itemForm.notes,
      });
      toast.success('Item added');
      setItemForm(DEFAULT_ITEM);
      setInvestigationId(null);
      setProcedureId(null);
      setPackageId(null);
      mutate();
      mutateBillingDetail();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add item');
    } finally {
      setIsSaving(false);
    }
  };

  const footerButtons: DrawerActionButton[] =
    drawerMode === 'create'
      ? [
          {
            label: 'Cancel',
            variant: 'outline',
            onClick: closeDrawer,
          },
          {
            label: 'Create Billing',
            onClick: handleCreateBilling,
            loading: isSaving,
            disabled: isSaving,
          },
        ]
      : [
          {
            label: 'Close',
            variant: 'outline',
            onClick: closeDrawer,
          },
        ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">IPD Billing</h1>
          <p className="text-sm text-muted-foreground">Manage inpatient bills and payments</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Billing
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <DataTable
          rows={rows}
          isLoading={isLoading}
          columns={columns}
          getRowId={(row) => (row as any).id || (row as IPDBillingListItem).bill_number}
          getRowLabel={(row) => (row as IPDBillingListItem).bill_number}
          onRowClick={(row) => openView(row)}
          emptyTitle="No IPD bills"
          emptySubtitle="Create a billing record to get started"
        />
      </div>

      <SideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onClose={closeDrawer}
        title={drawerMode === 'create' ? 'Create IPD Billing' : 'Billing Details'}
        mode={drawerMode}
        footerButtons={footerButtons}
        size="2xl"
      >
        {drawerMode === 'create' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admission">Admission</Label>
              <Select
                value={selectedAdmission ? String(selectedAdmission) : undefined}
                onValueChange={(val) => setSelectedAdmission(Number(val))}
              >
                <SelectTrigger id="admission">
                  <SelectValue placeholder="Select admission" />
                </SelectTrigger>
                <SelectContent>
                  {admissions.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.admission_id} — {a.patient_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Creating a billing record will automatically add bed charges for the admission.
            </p>
          </div>
        )}

        {drawerMode === 'view' && billingDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Bill Number</Label>
                <div className="font-semibold">{billingDetail.bill_number}</div>
              </div>
              <div>
                <Label>Admission</Label>
                <div>{billingDetail.admission_id}</div>
              </div>
              <div>
                <Label>Patient</Label>
                <div className="font-medium">{billingDetail.patient_name}</div>
              </div>
              <div>
                <Label>Status</Label>
                <Badge className={BILL_STATUS_COLORS[billingDetail.status]}>
                  {billingDetail.status}
                </Badge>
              </div>
              <div>
                <Label>Total</Label>
                <div className="font-semibold">
                  ₹{Number.parseFloat(billingDetail.total_amount || '0').toFixed(2)}
                </div>
              </div>
              <div>
                <Label>Balance</Label>
                <div className="font-semibold text-orange-700">
                  ₹{Number.parseFloat(billingDetail.balance_amount || '0').toFixed(2)}
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleAddBedCharges} disabled={isSaving}>
                <Bed className="h-4 w-4 mr-2" />
                Add Bed Charges
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Bill Items</h3>
                <span className="text-sm text-muted-foreground">
                  {billingDetail.items?.length || 0} items
                </span>
              </div>
              <div className="space-y-2">
                {billingDetail.items?.length ? (
                  billingDetail.items.map((item: IPDBillItem) => (
                    <Card key={item.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.item_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.source} • Qty {item.quantity}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ₹{Number.parseFloat(item.total_price || '0').toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ₹{Number.parseFloat(item.unit_price || '0').toFixed(2)} each
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No items yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <h4 className="font-semibold">Add Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={itemForm.source}
                    onValueChange={(val) => setItemForm({ ...itemForm, source: val as BillItemSource })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bed">Bed</SelectItem>
                      <SelectItem value="Procedure">Procedure</SelectItem>
                      <SelectItem value="Lab">Investigation</SelectItem>
                      <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    placeholder="Item name"
                    value={itemForm.item_name}
                    onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={itemForm.quantity}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, quantity: Number(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={itemForm.unit_price}
                    onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={itemForm.notes}
                    onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Investigations</Label>
                  <Select
                    value={investigationId ? String(investigationId) : undefined}
                    onValueChange={(val) => setInvestigationId(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select investigation" />
                    </SelectTrigger>
                    <SelectContent>
                      {investigations.map((inv: any) => (
                        <SelectItem key={inv.id} value={String(inv.id)}>
                          <div className="flex items-center gap-2">
                            <Beaker className="h-4 w-4" />
                            <span>{inv.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ₹{inv.base_charge}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Procedures</Label>
                  <Select
                    value={procedureId ? String(procedureId) : undefined}
                    onValueChange={(val) => setProcedureId(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select procedure" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.map((proc: any) => (
                        <SelectItem key={proc.id} value={String(proc.id)}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{proc.name || proc.procedure_name}</span>
                            <span className="text-xs text-muted-foreground">
                              ₹{proc.price || proc.base_price || '0'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Packages</Label>
                  <Select
                    value={packageId ? String(packageId) : undefined}
                    onValueChange={(val) => setPackageId(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pack: any) => (
                        <SelectItem key={pack.id} value={String(pack.id)}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{pack.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ₹{pack.price || pack.base_price || '0'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleAddItem} disabled={isSaving}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 rounded-md border p-4">
              <h4 className="font-semibold">Add Payment</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <Button variant="default" onClick={handleAddPayment} disabled={isSaving}>
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
}
