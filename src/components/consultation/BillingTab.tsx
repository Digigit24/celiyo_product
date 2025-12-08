// src/components/consultation/BillingTab.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, CreditCard, FileText } from 'lucide-react';
import { OpdVisit } from '@/types/opdVisit.types';
import { toast } from 'sonner';

interface BillingTabProps {
  visit: OpdVisit;
}

export const BillingTab: React.FC<BillingTabProps> = ({ visit }) => {
  const handleProcessPayment = () => {
    toast.info('Payment processing feature coming soon');
  };

  const handleGenerateInvoice = () => {
    toast.info('Invoice generation feature coming soon');
  };

  return (
    <div className="space-y-6">
      {/* Billing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Consultation Fee */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Consultation Fee</p>
              <p className="text-sm text-muted-foreground">
                {visit.visit_type === 'follow_up' ? 'Follow-up' : 'First Visit'}
              </p>
            </div>
            <p className="text-lg font-semibold">₹{visit.consultation_fee || '0'}</p>
          </div>

          <Separator />

          {/* Additional Charges */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Additional Charges</p>
              <p className="text-sm text-muted-foreground">
                Procedures, tests, etc.
              </p>
            </div>
            <p className="text-lg font-semibold">₹{visit.additional_charges || '0'}</p>
          </div>

          <Separator />

          {/* Total Amount */}
          <div className="flex justify-between items-center pt-2">
            <div>
              <p className="text-lg font-bold">Total Amount</p>
              <p className="text-sm text-muted-foreground">
                Amount due
              </p>
            </div>
            <p className="text-2xl font-bold text-primary">₹{visit.total_amount || '0'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Current Status</p>
            <Badge
              variant={visit.payment_status === 'paid' ? 'default' : 'secondary'}
              className={`${visit.payment_status === 'paid' ? 'bg-green-600' : 'bg-orange-600'}`}
            >
              {visit.payment_status?.replace('_', ' ').toUpperCase() || 'PENDING'}
            </Badge>
          </div>

          {visit.payment_status === 'paid' && (
            <>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">Cash</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-medium">TXN{visit.id}2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid On</span>
                  <span className="font-medium">{visit.visit_date}</span>
                </div>
              </div>
            </>
          )}

          {visit.payment_status !== 'paid' && (
            <div className="pt-4">
              <Button onClick={handleProcessPayment} className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice & Receipt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleGenerateInvoice}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
          {visit.payment_status === 'paid' && (
            <Button variant="outline" className="w-full" onClick={handleGenerateInvoice}>
              <FileText className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment History Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Payment history will appear here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
