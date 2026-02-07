// src/components/opd/BillsList.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Receipt,
  FileText,
  Eye,
  Download,
  IndianRupee,
  Calendar,
  User,
  Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { OPDBill } from '@/types/opdBill.types';

interface BillsListProps {
  bills: OPDBill[];
  isLoading?: boolean;
  onViewBill: (bill: OPDBill) => void;
  onPrintBill?: (bill: OPDBill) => void;
  onDownloadPDF?: (bill: OPDBill) => void;
}

export const BillsList: React.FC<BillsListProps> = ({
  bills,
  isLoading,
  onViewBill,
  onPrintBill,
  onDownloadPDF,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bills...</p>
        </div>
      </div>
    );
  }

  if (!bills || bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Receipt className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Bills Found</h3>
        <p className="text-muted-foreground max-w-md">
          No bills have been created yet for this visit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bills.map((bill) => (
        <Card key={bill.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold font-mono">{bill.bill_number}</h3>
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
                  {bill.visit_number && (
                    <Badge variant="outline" className="font-mono text-xs">
                      Visit: {bill.visit_number}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {bill.bill_date && new Date(bill.bill_date).toString() !== 'Invalid Date'
                        ? format(new Date(bill.bill_date), 'dd MMM yyyy, hh:mm a')
                        : 'N/A'}
                    </span>
                  </div>

                  {bill.doctor_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Stethoscope className="h-4 w-4" />
                      <span>{bill.doctor_name}</span>
                    </div>
                  )}

                  {bill.patient_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{bill.patient_name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Receipt className="h-4 w-4" />
                    <span className="capitalize">{bill.bill_type}</span>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">₹{parseFloat(bill.total_amount).toFixed(2)}</p>
                </div>

                {parseFloat(bill.balance_amount) > 0 && (
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground">Balance Due</p>
                    <p className="text-lg font-semibold text-orange-600">
                      ₹{parseFloat(bill.balance_amount).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bill Items Summary */}
            <div className="mb-4 p-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground mb-2">Bill Items</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Items</p>
                  <p className="font-semibold">{bill.items?.length || 0} item(s)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="font-semibold">₹{parseFloat(bill.subtotal_amount).toFixed(2)}</p>
                </div>
                {parseFloat(bill.discount_amount) > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <p className="font-semibold text-green-600">
                      ₹{parseFloat(bill.discount_amount).toFixed(2)} ({bill.discount_percent}%)
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Received</p>
                  <p className="font-semibold text-green-600">
                    ₹{parseFloat(bill.received_amount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => onViewBill(bill)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View/Edit Bill
              </Button>

              {onPrintBill && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPrintBill(bill)}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}

              {onDownloadPDF && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadPDF(bill)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
            </div>

            {bill.notes && (
              <div className="mt-3 pt-3 border-t text-sm">
                <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                <p className="text-muted-foreground">{bill.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
