// src/components/consultation/DiagnosticRequisitionSidebar.tsx
import React, { useState, useEffect } from 'react';
import { SideDrawer, DrawerActionButton } from '@/components/SideDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { Investigation, CreateRequisitionPayload, EncounterType } from '@/types/diagnostics.types';
import { Loader2, Trash2, Microscope } from 'lucide-react';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { mutate } from 'swr';

interface DiagnosticRequisitionSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  encounterType: 'visit' | 'admission';
  objectId: number;
}

type DraftOrder = {
  investigation_id: number;
  investigation_name: string;
  notes: string;
};

const ENCOUNTER_TYPE_MAP: Record<'visit' | 'admission', EncounterType> = {
  visit: 'opd.visit',
  admission: 'ipd.admission',
};

export function DiagnosticRequisitionSidebar({
  open,
  onOpenChange,
  patientId,
  encounterType,
  objectId,
}: DiagnosticRequisitionSidebarProps) {
  const [search, setSearch] = useState('');
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [isSaving, setIsSaving] = useState(false);
  const [practitionerNotes, setPractitionerNotes] = useState('');

  const { useInvestigations, createRequisition } = useDiagnostics();

  const { data: investigations, isLoading: isLoadingInvestigations } = useInvestigations({
    search,
    limit: 10,
  });

  const handleSelectInvestigation = (investigation: Investigation) => {
    if (!draftOrders.some((order) => order.investigation_id === investigation.id)) {
      setDraftOrders([
        ...draftOrders,
        {
          investigation_id: investigation.id,
          investigation_name: investigation.name,
          notes: '',
        },
      ]);
    }
    setSearch('');
  };

  const handleRemoveDraftOrder = (investigationId: number) => {
    setDraftOrders(draftOrders.filter((order) => order.investigation_id !== investigationId));
  };

  const handleSaveRequisition = async () => {
    if (draftOrders.length === 0) {
      toast.error('No tests selected.');
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser?.id) {
      toast.error('Unable to identify requesting doctor user.');
      return;
    }

    const encounterModel = ENCOUNTER_TYPE_MAP[encounterType];
    if (!encounterModel) {
      toast.error('Encounter type is missing.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreateRequisitionPayload = {
        patient: patientId,
        requesting_doctor_id: currentUser.id,
        encounter_type: encounterModel,
        encounter_id: objectId,
        priority,
        clinical_notes: practitionerNotes,
        investigation_ids: draftOrders.map((d) => d.investigation_id),
        status: 'ordered',
      };

      await createRequisition(payload);
      toast.success('Requisition created successfully.');
      
      // Mutate the key for the summary card to update
      mutate('requisitions');
      mutate(['requisitions', { encounter_type: encounterModel, encounter_id: objectId }]);
      
      onOpenChange(false);
      // Reset state for next time
      setDraftOrders([]);
      setPriority('routine');
      setPractitionerNotes('');
    } catch (error) {
      console.error('Failed to create requisition', error);
      toast.error('Failed to create requisition. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  useEffect(() => {
    if (!open) {
      // Reset state when drawer is closed
      setDraftOrders([]);
      setPriority('routine');
      setSearch('');
      setPractitionerNotes('');
    }
  }, [open]);


  const footerButtons: DrawerActionButton[] = [
    {
      label: 'Save Requisition',
      onClick: handleSaveRequisition,
      loading: isSaving,
      disabled: draftOrders.length === 0,
      className: 'w-full sm:w-auto',
    },
  ];

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Order Diagnostic Tests"
      description="Search for tests and add them to the draft requisition."
      footerButtons={footerButtons}
      className="w-full md:w-1/3"
    >
      <div className="flex flex-col h-full -mx-4 -my-6">
        <div className="p-4 space-y-4">
          {/* Global Test Search */}
          <Command shouldFilter={false} className="border rounded-lg">
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search for tests (e.g., CBC, X-Ray)..."
            />
            <CommandList>
              {isLoadingInvestigations && <div className="p-4 text-center">Loading...</div>}
              <CommandEmpty>{!isLoadingInvestigations && 'No tests found.'}</CommandEmpty>
              {investigations && investigations.results.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {investigations.results.map((investigation) => (
                    <CommandItem
                      key={investigation.id}
                      onSelect={() => handleSelectInvestigation(investigation)}
                      className="cursor-pointer"
                    >
                      {investigation.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
          
          {/* Priority Toggles */}
          <div>
            <Label className="mb-2 block">Priority</Label>
            <div className="flex gap-2">
              {(['routine', 'urgent', 'stat'] as const).map((p) => (
                <Button
                  key={p}
                  variant={priority === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriority(p)}
                  className="capitalize"
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
          
           {/* Practitioner Notes */}
          <div>
            <Label htmlFor="practitioner-notes">Overall Notes (Optional)</Label>
            <Textarea
              id="practitioner-notes"
              value={practitionerNotes}
              onChange={(e) => setPractitionerNotes(e.target.value)}
              placeholder="Add any overall notes for the lab staff..."
            />
          </div>
        </div>

        {/* Draft List */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
          <h3 className="font-semibold mb-2">Draft Requisition ({draftOrders.length})</h3>
          {draftOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
                <Microscope className="mx-auto h-8 w-8 mb-2" />
                Tests you add will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {draftOrders.map((order) => (
                <Card key={order.investigation_id} className="bg-white">
                  <CardContent className="p-3 flex items-start justify-between">
                    <div>
                        <p className="font-semibold">{order.investigation_name}</p>
                        {/* Optional: Add notes per test later if needed */}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveDraftOrder(order.investigation_id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </SideDrawer>
  );
}
