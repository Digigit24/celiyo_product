// src/components/ipd/IPDAdmissionHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  Phone,
  FileText,
} from 'lucide-react';
import { ADMISSION_STATUS_LABELS } from '@/types/ipd.types';

interface IPDAdmissionHeaderProps {
  admission: any;
  isSaving: boolean;
  showDischargeDialog: boolean;
  dischargeData: {
    discharge_type: string;
    discharge_summary: string;
  };
  onBack: () => void;
  onDischarge: () => void;
  setShowDischargeDialog: (show: boolean) => void;
  setDischargeData: (data: any) => void;
}

export const IPDAdmissionHeader: React.FC<IPDAdmissionHeaderProps> = ({
  admission,
  isSaving,
  showDischargeDialog,
  dischargeData,
  onBack,
  onDischarge,
  setShowDischargeDialog,
  setDischargeData,
}) => {
  const navigate = useNavigate();
  const patientName = admission.patient_name?.replace(/ None$/, '') || 'Unknown Patient';

  return (
    <>
      <div className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {patientName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-bold leading-none truncate">
                  {patientName}
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="font-mono bg-muted px-1 rounded whitespace-nowrap">
                    {admission.admission_id}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline whitespace-nowrap">
                    Ward: {admission.ward_name} | Bed: {admission.bed_number || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <Badge
              variant={admission.status === 'admitted' ? 'default' : 'secondary'}
              className={`px-2 sm:px-3 py-1 text-xs uppercase tracking-wide shrink-0 ${
                admission.status === 'admitted' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                admission.status === 'discharged' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                'bg-orange-100 text-orange-700 hover:bg-orange-100'
              }`}
            >
              {ADMISSION_STATUS_LABELS[admission.status]}
            </Badge>

            {admission.status === 'admitted' && (
              <Button
                onClick={() => setShowDischargeDialog(true)}
                disabled={isSaving}
                className="gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm shrink-0"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                <span className="hidden sm:inline">Discharge Patient</span>
                <span className="sm:hidden">Discharge</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDischargeDialog} onOpenChange={setShowDischargeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discharge Patient</DialogTitle>
            <DialogDescription>
              Discharge {patientName} from {admission.ward_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discharge_type">Discharge Type *</Label>
              <Input
                id="discharge_type"
                value={dischargeData.discharge_type}
                onChange={(e) => setDischargeData({ ...dischargeData, discharge_type: e.target.value })}
                placeholder="e.g., Normal, Against Medical Advice"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discharge_summary">Discharge Summary</Label>
              <Textarea
                id="discharge_summary"
                value={dischargeData.discharge_summary}
                onChange={(e) => setDischargeData({ ...dischargeData, discharge_summary: e.target.value })}
                placeholder="Enter discharge summary and instructions"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDischargeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onDischarge} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Discharge Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
