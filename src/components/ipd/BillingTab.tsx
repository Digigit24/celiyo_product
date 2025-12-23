// src/components/ipd/BillingTab.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIPD } from '@/hooks/useIPD';
import { useIPDBilling } from '@/hooks/useIPDBilling';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { IndianRupee, Receipt, Plus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface BillingTabProps {
  admissionId: number;
}

export default function BillingTab({ admissionId }: BillingTabProps) {
  const navigate = useNavigate();
  const { useBillings } = useIPD();
  const { createBilling } = useIPDBilling();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch billings for this admission
  const { data: billingsData, isLoading, error: billingError, mutate } = useBillings({ admission: admissionId });
  const billings = billingsData?.results || [];
  const billing = billings[0];

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading billing information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (billingError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-lg font-medium text-destructive">Failed to load billing information</p>
              <p className="text-sm text-muted-foreground mt-2">{billingError.message || 'An error occurred'}</p>
              <Button className="mt-4" onClick={() => navigate('/ipd/billing')}>
                Go to Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle creating a new bill
  const handleCreateBill = async () => {
    setIsCreating(true);
    toast.info('Creating bill...');

    try {
      // Create empty bill with minimal payload
      const newBill = await createBilling({
        admission: admissionId,
        discount_percent: '0',
        discount_amount: '0',
        payment_mode: 'cash',
        received_amount: '0',
        bill_date: new Date().toISOString(),
      });

      if (newBill) {
        toast.success('Bill created successfully');

        // Refresh the billings list
        mutate();

        // Navigate to the newly created bill details page
        navigate(`/ipd/billing/${newBill.id}`);
      }
    } catch (error: any) {
      console.error('Failed to create bill:', error);
      toast.error('Failed to create bill', {
        description: error?.message || 'Please try again',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // No billing exists - show create button
  if (!billing) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="rounded-full bg-primary/10 p-6 inline-block mb-4">
                <Receipt className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Bill Created Yet</h3>
              <p className="text-muted-foreground mb-6">
                This admission doesn't have a bill yet. Create a new bill to track charges and payments.
              </p>
              <Button
                size="lg"
                onClick={handleCreateBill}
                disabled={isCreating}
                className="px-8"
              >
                <Plus className="h-5 w-5 mr-2" />
                {isCreating ? 'Creating...' : 'Create Bill'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Billing exists - show summary with link to full billing page
  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'unpaid':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Billing Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Billing Summary</CardTitle>
              <CardDescription>Bill Number: {billing.bill_number}</CardDescription>
            </div>
            <Badge variant={getPaymentStatusVariant(billing.payment_status)} className="capitalize">
              {billing.payment_status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Total Amount</label>
              <p className="text-lg font-bold mt-1">₹{parseFloat(billing.total_amount || '0').toFixed(2)}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Discount</label>
              <p className="text-lg font-bold text-green-600 mt-1">
                -₹{parseFloat(billing.discount_amount || '0').toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Received</label>
              <p className="text-lg font-bold text-blue-600 mt-1">
                ₹{parseFloat(billing.received_amount || '0').toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Balance Due</label>
              <p className="text-lg font-bold text-orange-600 mt-1">
                ₹{parseFloat(billing.balance_amount || '0').toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Bill Items Summary */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bill Items</label>
            <p className="text-lg font-semibold mt-1">{billing.items?.length || 0} item(s)</p>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => navigate(`/ipd/billing/${billing.id}`)}
            >
              <Receipt className="h-4 w-4 mr-2" />
              View Full Bill
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/ipd/billing')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              All Bills
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCreateBill}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'New Bill'}
            </Button>
          </div>

          {/* Quick Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              To add items, record payments, or manage this bill in detail, click "View Full Bill" above.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* All Bills for This Admission */}
      {billings.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>All Bills for This Admission</CardTitle>
            <CardDescription>{billings.length} bill(s) created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {billings.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/ipd/billing/${bill.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">{bill.bill_number}</span>
                      <Badge variant={getPaymentStatusVariant(bill.payment_status)} className="capitalize text-xs">
                        {bill.payment_status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {bill.items?.length || 0} items • Total: ₹{parseFloat(bill.total_amount || '0').toFixed(2)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
