// src/components/opd/OPDBillingTab.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OpdVisit } from '@/types/opdVisit.types';

interface OPDFormData {
  receiptNo: string;
  billDate: string;
  billTime: string;
  doctor: string;
  opdType: string;
  chargeType: string;
  diagnosis: string;
  remarks: string;
  opdAmount: string;
}

interface OPDBillingTabProps {
  formData: OPDFormData;
  visit: OpdVisit;
  onInputChange: (field: string, value: string) => void;
}

export const OPDBillingTab: React.FC<OPDBillingTabProps> = ({
  formData,
  visit,
  onInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Fees</CardTitle>
        <CardDescription>Doctor consultation charges for this visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="opdAmount">Consultation Fee Amount</Label>
          <div className="relative">
            <Input
              id="opdAmount"
              type="number"
              value={formData.opdAmount}
              onChange={(e) => onInputChange('opdAmount', e.target.value)}
              className="pr-12 text-lg font-semibold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              INR
            </span>
          </div>
          {visit.doctor_details && (
            <div className="bg-muted/50 p-3 rounded-md space-y-1">
              <p className="text-xs text-muted-foreground">Doctor Information:</p>
              <p className="text-sm font-medium">{visit.doctor_details.full_name}</p>
              {visit.doctor_details.specialties && visit.doctor_details.specialties.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {visit.doctor_details.specialties.map(s => s.name).join(', ')}
                </p>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Standard {visit.visit_type === 'follow_up' ? 'Follow-up' : 'Consultation'} fee: ₹
                {visit.visit_type === 'follow_up'
                  ? visit.doctor_details.follow_up_fee
                  : visit.doctor_details.consultation_fee}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
