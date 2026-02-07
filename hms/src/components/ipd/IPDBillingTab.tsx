// src/components/ipd/IPDBillingTab.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Admission } from '@/types/ipdBilling.types';
import { format } from 'date-fns';

interface IPDBillingFormData {
  billNumber: string;
  billDate: string;
  diagnosis: string;
  remarks: string;
}

interface IPDBillingTabProps {
  formData: IPDBillingFormData;
  admission: Admission;
  onInputChange: (field: string, value: string) => void;
}

export const IPDBillingTab: React.FC<IPDBillingTabProps> = ({
  formData,
  admission,
  onInputChange,
}) => {
  // Calculate length of stay
  const calculateLengthOfStay = () => {
    const admissionDate = new Date(admission.admission_date);
    const dischargeDate = admission.discharge_date ? new Date(admission.discharge_date) : new Date();
    const diffTime = Math.abs(dischargeDate.getTime() - admissionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const lengthOfStay = calculateLengthOfStay();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admission Details</CardTitle>
        <CardDescription>Patient admission and billing information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admission Information */}
        <div className="bg-muted/50 p-4 rounded-md space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Admission ID</p>
              <p className="font-mono font-semibold">{admission.admission_id}</p>
            </div>
            <Badge variant={admission.status === 'admitted' ? 'default' : 'secondary'} className="capitalize">
              {admission.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="text-sm font-medium">{admission.patient_name || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Doctor</p>
              <p className="text-sm font-medium">{admission.doctor_name || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Admission Date</p>
              <p className="text-sm">
                {format(new Date(admission.admission_date), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>

            {admission.discharge_date && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Discharge Date</p>
                <p className="text-sm">
                  {format(new Date(admission.discharge_date), 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Length of Stay</p>
              <p className="text-sm font-semibold">{lengthOfStay} day(s)</p>
            </div>

            {admission.ward && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ward/Bed</p>
                <p className="text-sm">Ward {admission.ward} {admission.bed && `- Bed ${admission.bed}`}</p>
              </div>
            )}
          </div>

          {admission.reason && (
            <div className="space-y-1 pt-2 border-t">
              <p className="text-xs text-muted-foreground">Admission Reason</p>
              <p className="text-sm">{admission.reason}</p>
            </div>
          )}
        </div>

        {/* Bill Number - Read Only */}
        <div className="space-y-2">
          <Label htmlFor="billNumber">Bill Number</Label>
          <Input
            id="billNumber"
            value={formData.billNumber}
            readOnly
            className="font-mono bg-muted"
          />
        </div>

        {/* Bill Date */}
        <div className="space-y-2">
          <Label htmlFor="billDate">Bill Date</Label>
          <Input
            id="billDate"
            type="date"
            value={formData.billDate}
            onChange={(e) => onInputChange('billDate', e.target.value)}
          />
        </div>

        {/* Diagnosis */}
        <div className="space-y-2">
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <Textarea
            id="diagnosis"
            value={formData.diagnosis}
            onChange={(e) => onInputChange('diagnosis', e.target.value)}
            placeholder="Enter diagnosis details..."
            rows={3}
          />
          {admission.provisional_diagnosis && (
            <p className="text-xs text-muted-foreground">
              Provisional: {admission.provisional_diagnosis}
            </p>
          )}
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
            value={formData.remarks}
            onChange={(e) => onInputChange('remarks', e.target.value)}
            placeholder="Additional notes or remarks..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};
