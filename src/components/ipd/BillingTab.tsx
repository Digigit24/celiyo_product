// src/components/ipd/BillingTab.tsx
import { useState, useEffect } from 'react';
import { useIPD } from '@/hooks/useIPD';
import { IPDBillItemFormData, BILL_ITEM_SOURCE_LABELS, BILLING_STATUS_LABELS } from '@/types/ipd.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Plus, IndianRupee, Trash2 } from 'lucide-react';

interface BillingTabProps {
  admissionId: number;
}

export default function BillingTab({ admissionId }: BillingTabProps) {
  const [isCreateBillItemDialogOpen, setIsCreateBillItemDialogOpen] = useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [billItemFormData, setBillItemFormData] = useState<IPDBillItemFormData>({
    billing: 0,
    item_name: '',
    source: 'Other',
    quantity: 1,
    unit_price: '0',
    notes: '',
  });

  const {
    useBillings,
    useBillItems,
    createBilling,
    createBillItem,
    deleteBillItem,
    addBedCharges,
    addPayment,
  } = useIPD();

  const { data: billingsData, error: billingError, mutate: mutateBillings } = useBillings({ admission: admissionId });
  const billings = billingsData?.results || [];
  const billing = billings[0];

  const { data: billItemsData, mutate: mutateBillItems } = useBillItems(
    billing ? { billing: billing.id } : undefined
  );
  const billItems = billItemsData?.results || [];

  // Show error state if billing fetch fails
  if (billingError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-lg font-medium text-destructive">Failed to load billing information</p>
              <p className="text-sm text-muted-foreground mt-2">{billingError.message || 'An error occurred'}</p>
              <Button className="mt-4" onClick={() => mutateBillings()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (billing && !billItemFormData.billing) {
      setBillItemFormData({ ...billItemFormData, billing: billing.id });
    }
  }, [billing]);

  const handleCreateBilling = async () => {
    try {
      await createBilling({ admission: admissionId });
      toast({
        title: 'Success',
        description: 'Billing created successfully',
      });
      mutateBillings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create billing',
        variant: 'destructive',
      });
    }
  };

  const handleAddBedCharges = async () => {
    if (!billing) return;

    try {
      await addBedCharges(billing.id);
      toast({
        title: 'Success',
        description: 'Bed charges added successfully',
      });
      mutateBillings();
      mutateBillItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add bed charges',
        variant: 'destructive',
      });
    }
  };

  const handleCreateBillItem = async () => {
    try {
      await createBillItem(billItemFormData);
      toast({
        title: 'Success',
        description: 'Bill item added successfully',
      });
      setIsCreateBillItemDialogOpen(false);
      resetBillItemForm();
      mutateBillItems();
      mutateBillings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add bill item',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBillItem = async (itemId: number) => {
    try {
      await deleteBillItem(itemId);
      toast({
        title: 'Success',
        description: 'Bill item deleted successfully',
      });
      mutateBillItems();
      mutateBillings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bill item',
        variant: 'destructive',
      });
    }
  };

  const handleAddPayment = async () => {
    if (!billing) return;

    try {
      await addPayment(billing.id, { amount: paymentAmount });
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });
      setIsAddPaymentDialogOpen(false);
      setPaymentAmount('');
      mutateBillings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const resetBillItemForm = () => {
    setBillItemFormData({
      billing: billing?.id || 0,
      item_name: '',
      source: 'Other',
      quantity: 1,
      unit_price: '0',
      notes: '',
    });
  };

  if (!billing) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">No billing record found for this admission</p>
              <Button onClick={handleCreateBilling}>Create Billing</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Billing Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Billing Summary</CardTitle>
              <CardDescription>Bill Number: {billing.bill_number}</CardDescription>
            </div>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                billing.status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : billing.status === 'partial'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {BILLING_STATUS_LABELS[billing.status]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Total Amount</label>
              <p className="text-lg font-bold mt-1">₹{parseFloat(billing.total_amount).toFixed(2)}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Discount</label>
              <p className="text-lg font-bold text-green-600 mt-1">
                -₹{parseFloat(billing.discount).toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Tax</label>
              <p className="text-lg font-bold mt-1">₹{parseFloat(billing.tax).toFixed(2)}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Net Amount</label>
              <p className="text-lg font-bold text-primary mt-1">
                ₹
                {(
                  parseFloat(billing.total_amount) -
                  parseFloat(billing.discount) +
                  parseFloat(billing.tax)
                ).toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Paid Amount</label>
              <p className="text-lg font-bold text-blue-600 mt-1">
                ₹{parseFloat(billing.paid_amount).toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Balance Due</label>
              <p className="text-lg font-bold text-red-600 mt-1">
                ₹{parseFloat(billing.balance_amount).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleAddBedCharges}>
              Add Bed Charges
            </Button>
            <Button variant="outline" onClick={() => setIsAddPaymentDialogOpen(true)}>
              <IndianRupee className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bill Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bill Items</CardTitle>
              <CardDescription>Detailed breakdown of charges</CardDescription>
            </div>
            <Button onClick={() => setIsCreateBillItemDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {billItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No items added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {billItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.item_name}</span>
                      <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                        {BILL_ITEM_SOURCE_LABELS[item.source]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold">₹{parseFloat(item.total_price).toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteBillItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Bill Item Dialog */}
      <Dialog open={isCreateBillItemDialogOpen} onOpenChange={setIsCreateBillItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Bill Item</DialogTitle>
            <DialogDescription>Add a new charge to the bill</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                value={billItemFormData.item_name}
                onChange={(e) => setBillItemFormData({ ...billItemFormData, item_name: e.target.value })}
                placeholder="e.g., X-Ray Chest, Blood Test"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source">Category *</Label>
              <Select
                value={billItemFormData.source}
                onValueChange={(value: any) => setBillItemFormData({ ...billItemFormData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BILL_ITEM_SOURCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={billItemFormData.quantity}
                onChange={(e) => setBillItemFormData({ ...billItemFormData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit_price">Unit Price (₹) *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={billItemFormData.unit_price}
                onChange={(e) => setBillItemFormData({ ...billItemFormData, unit_price: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={billItemFormData.notes}
                onChange={(e) => setBillItemFormData({ ...billItemFormData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>

            <div className="p-3 bg-secondary rounded">
              <div className="flex justify-between text-sm">
                <span>Total:</span>
                <span className="font-bold">
                  ₹
                  {(
                    billItemFormData.quantity * parseFloat(billItemFormData.unit_price || '0')
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateBillItemDialogOpen(false); resetBillItemForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateBillItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Balance Due: ₹{parseFloat(billing.balance_amount).toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="payment_amount">Payment Amount (₹) *</Label>
              <Input
                id="payment_amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddPaymentDialogOpen(false); setPaymentAmount(''); }}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
