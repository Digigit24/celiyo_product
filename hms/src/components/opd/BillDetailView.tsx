// src/components/opd/BillDetailView.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Receipt,
  ArrowLeft,
  Save,
  IndianRupee,
  CreditCard,
  Plus,
  Download,
  Eye,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { OPDBill, OPDBillItem, PaymentMode } from '@/types/opdBill.types';
import { BillItemRow } from './BillItemRow';

interface BillDetailViewProps {
  bill: OPDBill | null;
  isLoading?: boolean;
  onBack: () => void;
  onUpdate: (billId: number, updates: Partial<OPDBill>) => Promise<void>;
  onPrint?: (bill: OPDBill) => void;
  onDownloadPDF?: (bill: OPDBill) => void;
}

export const BillDetailView: React.FC<BillDetailViewProps> = ({
  bill,
  isLoading,
  onBack,
  onUpdate,
  onPrint,
  onDownloadPDF,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [billItems, setBillItems] = useState<OPDBillItem[]>([]);
  const [discount, setDiscount] = useState('0.00');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [receivedAmount, setReceivedAmount] = useState('0.00');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [notes, setNotes] = useState('');

  // Load bill data when bill changes
  useEffect(() => {
    if (bill) {
      setBillItems(bill.items || []);
      setDiscount(bill.discount_amount || '0.00');
      setDiscountPercent(bill.discount_percent || '0');
      setReceivedAmount(bill.received_amount || '0.00');
      setPaymentMode(bill.payment_mode || 'cash');
      setNotes(bill.notes || '');
    }
  }, [bill]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bill details...</p>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h3 className="text-lg font-semibold mb-2">No Bill Selected</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          Please select a bill to view its details.
        </p>
        <Button onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  // Calculate totals
  const subtotal = billItems.reduce((sum, item) => {
    return sum + parseFloat(item.total_amount || '0');
  }, 0);

  const discountAmount = parseFloat(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const received = parseFloat(receivedAmount) || 0;
  const balanceAmount = totalAmount - received;

  const handleItemUpdate = (index: number, field: keyof OPDBillItem, value: string | number) => {
    const updatedItems = [...billItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setBillItems(updatedItems);
  };

  const handleItemRemove = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleDiscountChange = (value: string) => {
    const disc = parseFloat(value) || 0;
    setDiscount(disc.toFixed(2));

    if (subtotal > 0) {
      const percent = ((disc / subtotal) * 100).toFixed(2);
      setDiscountPercent(percent);
    }
  };

  const handleDiscountPercentChange = (value: string) => {
    const percent = parseFloat(value) || 0;
    setDiscountPercent(percent.toFixed(2));

    const disc = (subtotal * percent) / 100;
    setDiscount(disc.toFixed(2));
  };

  const handleSave = async () => {
    try {
      await onUpdate(bill.id, {
        items: billItems.map((item, idx) => ({
          ...item,
          item_order: idx + 1,
        })),
        discount_amount: discount,
        discount_percent: discountPercent,
        received_amount: receivedAmount,
        payment_mode: paymentMode,
        notes: notes,
        subtotal_amount: subtotal.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        balance_amount: balanceAmount.toFixed(2),
        payment_status:
          balanceAmount === 0 ? 'paid' : received > 0 ? 'partial' : 'unpaid',
      });

      toast.success('Bill updated successfully');
      setIsEditMode(false);
    } catch (error) {
      toast.error('Failed to update bill');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Bills
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <CardTitle className="font-mono">{bill.bill_number}</CardTitle>
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
              <CardDescription>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {bill.bill_date && new Date(bill.bill_date).toString() !== 'Invalid Date'
                      ? format(new Date(bill.bill_date), 'dd MMM yyyy, hh:mm a')
                      : 'N/A'}
                  </span>
                  {bill.visit_number && (
                    <Badge variant="outline" className="font-mono">
                      Visit: {bill.visit_number}
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {onPrint && (
                <Button variant="outline" size="sm" onClick={() => onPrint(bill)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
              {onDownloadPDF && (
                <Button variant="outline" size="sm" onClick={() => onDownloadPDF(bill)}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
              {!isEditMode ? (
                <Button onClick={() => setIsEditMode(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Edit Bill
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Patient & Doctor Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bill Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Patient</p>
              <p className="font-semibold">{bill.patient_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Doctor</p>
              <p className="font-semibold">{bill.doctor_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bill Type</p>
              <p className="font-semibold capitalize">{bill.bill_type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Payment Mode</p>
              <p className="font-semibold uppercase">{paymentMode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bill Items */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Items</CardTitle>
          <CardDescription>{billItems.length} item(s) in this bill</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Item</TableHead>
                  <TableHead className="w-[100px] text-center">Qty</TableHead>
                  <TableHead className="w-[120px] text-right">Rate</TableHead>
                  <TableHead className="w-[120px] text-right">Discount</TableHead>
                  <TableHead className="w-[120px] text-right">Amount</TableHead>
                  {isEditMode && <TableHead className="w-[80px] text-center">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {billItems.length > 0 ? (
                  billItems.map((item, index) => (
                    <BillItemRow
                      key={item.id || index}
                      item={item}
                      isEditable={isEditMode}
                      onUpdate={(field, value) => handleItemUpdate(index, field, value)}
                      onRemove={() => handleItemRemove(index)}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isEditMode ? 6 : 5} className="text-center text-muted-foreground py-8">
                      No items in this bill
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Billing Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['cash', 'card', 'upi', 'bank'] as PaymentMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={paymentMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMode(mode)}
                    disabled={!isEditMode}
                    className="uppercase"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receivedAmount">Received Amount</Label>
              <div className="relative">
                <Input
                  id="receivedAmount"
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  disabled={!isEditMode}
                  className="pr-12 text-green-600 font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  INR
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isEditMode}
                placeholder="Add notes..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Billing Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <div className="flex gap-2">
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  disabled={!isEditMode}
                  className="flex-1"
                  placeholder="0.00"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => handleDiscountPercentChange(e.target.value)}
                    disabled={!isEditMode}
                    className="w-16"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-base font-bold">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm text-green-600">
              <span>Amount Received:</span>
              <span className="font-semibold">₹{received.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-bold text-orange-600">
              <span>Balance Due:</span>
              <span>₹{balanceAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
