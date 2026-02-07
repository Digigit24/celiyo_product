// src/components/ipd/AdmissionInfo.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Admission } from '@/types/ipd.types';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface AdmissionInfoProps {
  admission: Admission;
  onUpdate: () => void;
}

export default function AdmissionInfo({ admission }: AdmissionInfoProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>General admission details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Admission ID</label>
              <p className="text-sm font-mono mt-1">{admission.admission_id}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Patient</label>
              <p className="text-sm mt-1">{admission.patient_name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Ward</label>
              <p className="text-sm mt-1">{admission.ward_name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Bed</label>
              <p className="text-sm mt-1">{admission.bed_number || 'Not assigned'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Admission Date</label>
              <p className="text-sm mt-1">
                {(() => {
                  try {
                    return format(new Date(admission.admission_date), 'dd MMM yyyy, HH:mm');
                  } catch {
                    return 'Invalid date';
                  }
                })()}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Length of Stay</label>
              <p className="text-sm mt-1">
                {admission.length_of_stay} {admission.length_of_stay === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical Information</CardTitle>
          <CardDescription>Medical details and diagnosis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Reason for Admission</label>
            <p className="text-sm mt-1 whitespace-pre-wrap">{admission.reason}</p>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground">Provisional Diagnosis</label>
            <p className="text-sm mt-1 whitespace-pre-wrap">
              {admission.provisional_diagnosis || 'Not provided'}
            </p>
          </div>

          {admission.final_diagnosis && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Final Diagnosis</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{admission.final_diagnosis}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Discharge Information */}
      {admission.status === 'discharged' && admission.discharge_date && (
        <Card>
          <CardHeader>
            <CardTitle>Discharge Information</CardTitle>
            <CardDescription>Discharge details and summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Discharge Date</label>
                <p className="text-sm mt-1">
                  {(() => {
                    try {
                      return format(new Date(admission.discharge_date), 'dd MMM yyyy, HH:mm');
                    } catch {
                      return 'Invalid date';
                    }
                  })()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Discharge Type</label>
                <p className="text-sm mt-1">{admission.discharge_type || '-'}</p>
              </div>
            </div>

            {admission.discharge_summary && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Discharge Summary</label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{admission.discharge_summary}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
