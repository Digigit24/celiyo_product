# OPD Billing Refactoring Guide

## Overview
This guide outlines how to refactor `OPDBillingContent.tsx` to use a unified bill items approach with simplified tabs.

## Key Changes

### 1. Unified State Management

```tsx
// OLD - Separate states
const [opdFormData, setOpdFormData] = useState({...});
const [procedureFormData, setProcedureFormData] = useState({
  procedures: [] as ProcedureItem[]
});

// NEW - Unified billItems array
const [billItems, setBillItems] = useState<UnifiedBillItem[]>([]);
const [opdAmount, setOpdAmount] = useState('0.00'); // Auto-populated
const [notes, setNotes] = useState('');
```

### 2. UnifiedBillItem Type

```tsx
interface UnifiedBillItem {
  id: string; // temp ID for UI
  particular: 'consultation' | 'procedure' | 'investigation' | 'medicine' | 'package';
  particular_name: string;
  particular_id?: number;
  particular_code?: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  discount_amount: string;
  notes: string;
}
```

### 3. Billing Calculation (Unified)

```tsx
// Calculate subtotal from ALL billItems + opdAmount
const recalculateBilling = useCallback(() => {
  // OPD charge
  const opdCharge = parseFloat(opdAmount) || 0;

  // All other items
  const itemsTotal = billItems.reduce((sum, item) => {
    return sum + (parseFloat(item.total_price) || 0);
  }, 0);

  const subtotal = opdCharge + itemsTotal;
  const disc = parseFloat(billingData.discount) || 0;
  const total = Math.max(0, subtotal - disc);
  const recv = parseFloat(billingData.receivedAmount) || 0;
  const balance = total - recv;

  setBillingData((prev) => ({
    ...prev,
    subtotal: subtotal.toFixed(2),
    totalAmount: total.toFixed(2),
    balanceAmount: balance.toFixed(2),
  }));
}, [billItems, opdAmount, billingData.discount, billingData.receivedAmount]);

// Trigger recalculation when billItems or opdAmount changes
useEffect(() => {
  recalculateBilling();
}, [billItems, opdAmount, recalculateBilling]);
```

### 4. Adding Items to Bill

#### Add Procedure
```tsx
const addProcedureToBill = (procedure: any) => {
  const newItem: UnifiedBillItem = {
    id: `temp-${Date.now()}-${Math.random()}`,
    particular: 'procedure',
    particular_name: procedure.name,
    particular_id: procedure.id,
    particular_code: procedure.code,
    quantity: 1,
    unit_price: procedure.default_charge,
    total_price: procedure.default_charge,
    discount_amount: '0.00',
    notes: '',
  };

  setBillItems((prev) => [...prev, newItem]);
  setIsProcedureDialogOpen(false);
};
```

#### Add Investigation
```tsx
const addInvestigationToBill = (investigation: any) => {
  const newItem: UnifiedBillItem = {
    id: `temp-${Date.now()}-${Math.random()}`,
    particular: 'investigation',
    particular_name: investigation.name,
    particular_id: investigation.id,
    particular_code: investigation.code,
    quantity: 1,
    unit_price: investigation.price || '0.00',
    total_price: investigation.price || '0.00',
    discount_amount: '0.00',
    notes: '',
  };

  setBillItems((prev) => [...prev, newItem]);
  setIsInvestigationDialogOpen(false);
};
```

### 5. Updating Bill Items

```tsx
const updateBillItem = (id: string, field: keyof UnifiedBillItem, value: any) => {
  setBillItems((prev) =>
    prev.map((item) => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      // Recalculate total if quantity or price changes
      if (field === 'quantity' || field === 'unit_price' || field === 'discount_amount') {
        const qty = parseFloat(updated.quantity.toString()) || 1;
        const price = parseFloat(updated.unit_price) || 0;
        const discount = parseFloat(updated.discount_amount) || 0;
        updated.total_price = ((qty * price) - discount).toFixed(2);
      }

      return updated;
    })
  );
};

const removeBillItem = (id: string) => {
  setBillItems((prev) => prev.filter((item) => item.id !== id));
};
```

### 6. Simplified OPD Billing Tab

```tsx
<TabsContent value="opd">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>OPD Consultation Charge</CardTitle>
        <CardDescription>Automatically populated from doctor's fee</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Consultation Fee</Label>
          <div className="relative">
            <Input
              type="number"
              value={opdAmount}
              onChange={(e) => setOpdAmount(e.target.value)}
              className="pr-12 text-lg font-semibold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              INR
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Doctor: {visit.doctor_details?.full_name}
          </p>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">OPD Charge</span>
            <span className="text-2xl font-bold">₹{parseFloat(opdAmount).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <BillingDetailsPanel {...billingProps} />
  </div>
</TabsContent>
```

### 7. Investigations Tab with Billing

```tsx
<TabsContent value="investigations">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Investigation Billing</CardTitle>
            <CardDescription>Add investigations to the bill</CardDescription>
          </div>
          <Dialog open={isInvestigationDialogOpen} onOpenChange={setIsInvestigationDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Investigation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select Investigation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Search investigations..."
                  value={investigationSearch}
                  onChange={(e) => setInvestigationSearch(e.target.value)}
                />
                <div className="space-y-2">
                  {investigationsLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    investigationsData?.results
                      ?.filter((inv) =>
                        inv.name.toLowerCase().includes(investigationSearch.toLowerCase())
                      )
                      .map((investigation) => (
                        <div
                          key={investigation.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => addInvestigationToBill(investigation)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{investigation.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {investigation.code} • {investigation.category}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                ₹{parseFloat(investigation.price || '0').toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Show investigation items from billItems */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investigation</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billItems
              .filter((item) => item.particular === 'investigation')
              .map((item) => (
                <BillItemRow
                  key={item.id}
                  item={item}
                  isEditable={true}
                  onUpdate={updateBillItem}
                  onRemove={() => removeBillItem(item.id)}
                />
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <BillingDetailsPanel {...billingProps} />
  </div>
</TabsContent>
```

### 8. Saving Bill with Unified Items

```tsx
const handleSaveBill = async () => {
  if (!visit) return;

  try {
    // Prepare all items
    const allItems = [
      // OPD consultation item
      {
        particular: 'consultation',
        particular_name: 'Consultation Fee',
        quantity: 1,
        unit_charge: opdAmount,
        discount_amount: '0',
        total_amount: opdAmount,
      },
      // All other items
      ...billItems.map((item, idx) => ({
        particular: item.particular,
        particular_name: item.particular_name,
        quantity: item.quantity,
        unit_charge: item.unit_price,
        discount_amount: item.discount_amount,
        total_amount: item.total_price,
        item_order: idx + 1,
        note: item.notes,
      })),
    ];

    const billData = {
      bill_date: new Date().toISOString(),
      patient: visit.patient,
      visit: visit.id,
      doctor: visit.doctor,
      bill_type: 'consultation' as const,
      items: allItems,
      subtotal_amount: billingData.subtotal,
      discount_amount: billingData.discount,
      discount_percent: billingData.discountPercent,
      tax_amount: '0',
      total_amount: billingData.totalAmount,
      received_amount: billingData.receivedAmount,
      balance_amount: billingData.balanceAmount,
      payment_status: parseFloat(billingData.balanceAmount) === 0
        ? 'paid'
        : parseFloat(billingData.receivedAmount) > 0
          ? 'partial'
          : 'unpaid',
      payment_mode: billingData.paymentMode,
      notes: notes,
    };

    if (isEditMode && existingBill) {
      await updateBill(existingBill.id, billData as any);
      mutateBills();
      toast.success('Bill updated successfully!');
    } else {
      await createBill(billData as any);
      mutateBills();
      toast.success('Bill created successfully!');
    }
  } catch (error) {
    console.error('Failed to save bill:', error);
    toast.error('Failed to save bill');
  }
};
```

### 9. Loading Existing Bill

```tsx
useEffect(() => {
  if (existingBill && !billsLoading) {
    setIsLoadingBillData(true);

    // Load OPD amount
    const consultationItem = existingBill.items?.find(
      (item) => item.particular === 'consultation'
    );
    if (consultationItem) {
      setOpdAmount(consultationItem.unit_charge || '0.00');
    }

    // Load all other items into billItems
    const otherItems: UnifiedBillItem[] = existingBill.items
      ?.filter((item) => item.particular !== 'consultation')
      .map((item, idx) => ({
        id: `existing-${item.id || idx}`,
        particular: item.particular as any,
        particular_name: item.particular_name || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_charge || '0.00',
        total_price: item.total_amount || '0.00',
        discount_amount: item.discount_amount || '0.00',
        notes: item.note || '',
      })) || [];

    setBillItems(otherItems);

    // Load billing data
    setBillingData({
      subtotal: existingBill.subtotal_amount || '0.00',
      discount: existingBill.discount_amount || '0.00',
      discountPercent: existingBill.discount_percent || '0',
      totalAmount: existingBill.total_amount || '0.00',
      paymentMode: existingBill.payment_mode as any,
      receivedAmount: existingBill.received_amount || '0.00',
      balanceAmount: existingBill.balance_amount || '0.00',
    });

    setNotes(existingBill.notes || '');

    setTimeout(() => setIsLoadingBillData(false), 100);
  }
}, [existingBill, billsLoading]);
```

## Implementation Steps

1. **Update Types** - Replace ProcedureItem with UnifiedBillItem
2. **Update State** - Replace separate states with unified billItems
3. **Update Calculation** - Single recalculateBilling function
4. **Simplify OPD Tab** - Only show OPD amount input
5. **Update Procedure Tab** - Use billItems.filter(item => item.particular === 'procedure')
6. **Add Investigation Billing** - Search/add investigations like procedures
7. **Update Save Logic** - Build items array from opdAmount + billItems
8. **Update Load Logic** - Split existing bill items into opdAmount + billItems
9. **Update Billing Summary** - Remove separate opdTotal/procedureTotal

## Benefits

✅ Unified state management
✅ Simpler calculations
✅ Easier to add new item types
✅ Consistent UI patterns
✅ Better code organization
✅ Reactive billing summary across all tabs
