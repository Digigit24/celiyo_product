// src/components/ipd/BedTransfersTab.tsx
import { useState, useEffect } from 'react';
import { useIPD } from '@/hooks/useIPD';
import { BedTransferFormData } from '@/types/ipd.types';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface BedTransfersTabProps {
  admissionId: number;
}

export default function BedTransfersTab({ admissionId }: BedTransfersTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [formData, setFormData] = useState<BedTransferFormData>({
    admission: admissionId,
    from_bed: 0,
    to_bed: 0,
    reason: '',
  });

  const { useBedTransfers, useAvailableBeds, useBeds, createBedTransfer, useAdmissionById } = useIPD();
  const { data: transfersData, error: transfersError, mutate } = useBedTransfers({ admission: admissionId });
  const { data: availableBedsData } = useAvailableBeds();
  const { data: allBedsData } = useBeds();
  const { data: admission } = useAdmissionById(admissionId);

  const transfers = transfersData?.results || [];
  const beds = availableBedsData?.results || availableBedsData || [];
  const allBeds = allBedsData?.results || [];

  // Auto-populate from_bed when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen && admission?.bed) {
      setFormData(prev => ({
        ...prev,
        from_bed: admission.bed
      }));
    }
  }, [isCreateDialogOpen, admission]);

  // Show error state if transfers fetch fails
  if (transfersError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-lg font-medium text-destructive">Failed to load bed transfers</p>
              <p className="text-sm text-muted-foreground mt-2">{transfersError.message || 'An error occurred'}</p>
              <Button className="mt-4" onClick={() => mutate()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreate = async () => {
    try {
      await createBedTransfer(formData);
      toast({
        title: 'Success',
        description: 'Bed transfer recorded successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record bed transfer',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      admission: admissionId,
      from_bed: admission?.bed || 0,
      to_bed: 0,
      reason: '',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Bed Transfer History</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track all bed movements for this admission
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Transfer
        </Button>
      </div>

      {transfers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No bed transfers recorded</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <Card key={transfer.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {(() => {
                      try {
                        return format(new Date(transfer.transfer_date), 'dd MMM yyyy, HH:mm');
                      } catch {
                        return 'Invalid date';
                      }
                    })()}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground">From</label>
                    <p className="text-sm font-medium mt-1">{transfer.from_bed_info}</p>
                  </div>

                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground">To</label>
                    <p className="text-sm font-medium mt-1">{transfer.to_bed_info}</p>
                  </div>
                </div>

                {transfer.reason && (
                  <div className="mt-4">
                    <label className="text-xs font-medium text-muted-foreground">Reason</label>
                    <p className="text-sm mt-1">{transfer.reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Transfer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Bed Transfer</DialogTitle>
            <DialogDescription>
              Transfer patient to a different bed
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="from_bed">From Bed *</Label>
              <Select
                value={formData.from_bed ? formData.from_bed.toString() : ''}
                onValueChange={(value) => setFormData({ ...formData, from_bed: parseInt(value) })}
                disabled
              >
                <SelectTrigger>
                  <SelectValue placeholder="Current bed (auto-filled)" />
                </SelectTrigger>
                <SelectContent>
                  {allBeds.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id.toString()}>
                      {bed.ward_name} - {bed.bed_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="to_bed">To Bed *</Label>
              <Select
                value={formData.to_bed ? formData.to_bed.toString() : ''}
                onValueChange={(value) => setFormData({ ...formData, to_bed: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new bed" />
                </SelectTrigger>
                <SelectContent>
                  {beds.length > 0 ? (
                    beds.map((bed) => (
                      <SelectItem key={bed.id} value={bed.id.toString()}>
                        {bed.ward_name} - {bed.bed_number}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No available beds found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Transfer *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for bed transfer"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Record Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
