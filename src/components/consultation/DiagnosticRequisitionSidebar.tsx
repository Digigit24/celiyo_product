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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { usePharmacy } from '@/hooks/usePharmacy';
import { useProcedureMaster } from '@/hooks/useProcedureMaster';
import { useProcedurePackage } from '@/hooks/useProcedurePackage';
import {
  Investigation,
  CreateRequisitionPayload,
  EncounterType,
  RequisitionType,
  AddMedicineToRequisitionPayload,
  AddProcedureToRequisitionPayload,
  AddPackageToRequisitionPayload,
} from '@/types/diagnostics.types';
import { PharmacyProduct } from '@/types/pharmacy.types';
import { ProcedureMaster } from '@/types/procedureMaster.types';
import { ProcedurePackage } from '@/types/procedurePackage.types';
import { Loader2, Trash2, Microscope, Pill, Stethoscope, Package } from 'lucide-react';
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

type DraftItem = {
  id: string;
  item_id: number;
  item_name: string;
  item_code?: string;
  quantity: number;
  unit_price?: string;
  notes: string;
};

const ENCOUNTER_TYPE_MAP: Record<'visit' | 'admission', EncounterType> = {
  visit: 'opd.visit',
  admission: 'ipd.admission',
};

const REQUISITION_TYPE_LABELS: Record<RequisitionType, string> = {
  investigation: 'Investigations',
  medicine: 'Medicines',
  procedure: 'Procedures',
  package: 'Packages',
};

const REQUISITION_TYPE_ICONS: Record<RequisitionType, React.ReactNode> = {
  investigation: <Microscope className="h-4 w-4" />,
  medicine: <Pill className="h-4 w-4" />,
  procedure: <Stethoscope className="h-4 w-4" />,
  package: <Package className="h-4 w-4" />,
};

export function DiagnosticRequisitionSidebar({
  open,
  onOpenChange,
  patientId,
  encounterType,
  objectId,
}: DiagnosticRequisitionSidebarProps) {
  const [requisitionType, setRequisitionType] = useState<RequisitionType>('investigation');
  const [search, setSearch] = useState('');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [isSaving, setIsSaving] = useState(false);
  const [practitionerNotes, setPractitionerNotes] = useState('');

  const { useInvestigations, createRequisition, addMedicineToRequisition, addProcedureToRequisition, addPackageToRequisition } = useDiagnostics();
  const { usePharmacyProducts } = usePharmacy();
  const { useProcedureMasters } = useProcedureMaster();
  const { useProcedurePackages } = useProcedurePackage();

  // Fetch data based on requisition type
  const { data: investigations, isLoading: isLoadingInvestigations } = useInvestigations(
    requisitionType === 'investigation' ? { search, limit: 10 } : undefined
  );

  const { data: medicinesData, isLoading: isLoadingMedicines } = usePharmacyProducts(
    requisitionType === 'medicine' ? { search, is_active: true, limit: 10 } : undefined
  );

  const { data: proceduresData, isLoading: isLoadingProcedures } = useProcedureMasters(
    requisitionType === 'procedure' ? { search, is_active: true, limit: 10 } : undefined
  );

  const { data: packagesData, isLoading: isLoadingPackages } = useProcedurePackages(
    requisitionType === 'package' ? { search, is_active: true, limit: 10 } : undefined
  );

  const handleSelectItem = (item: Investigation | PharmacyProduct | ProcedureMaster | ProcedurePackage) => {
    let itemId: number;
    let itemName: string;
    let itemCode: string | undefined;
    let unitPrice: string | undefined;

    if (requisitionType === 'investigation') {
      const inv = item as Investigation;
      itemId = inv.id;
      itemName = inv.name;
      itemCode = inv.code;
      unitPrice = inv.base_charge;
    } else if (requisitionType === 'medicine') {
      const med = item as PharmacyProduct;
      itemId = med.id;
      itemName = med.product_name;
      unitPrice = med.selling_price;
    } else if (requisitionType === 'procedure') {
      const proc = item as ProcedureMaster;
      itemId = proc.id;
      itemName = proc.name;
      itemCode = proc.code;
      unitPrice = proc.default_charge;
    } else {
      const pkg = item as ProcedurePackage;
      itemId = pkg.id;
      itemName = pkg.name;
      itemCode = pkg.code;
      unitPrice = pkg.discounted_charge || pkg.total_charge;
    }

    if (!draftItems.some((draftItem) => draftItem.item_id === itemId)) {
      setDraftItems([
        ...draftItems,
        {
          id: `${requisitionType}-${itemId}-${Date.now()}`,
          item_id: itemId,
          item_name: itemName,
          item_code: itemCode,
          quantity: requisitionType === 'investigation' ? 1 : 1,
          unit_price: unitPrice,
          notes: '',
        },
      ]);
    }
    setSearch('');
  };

  const handleRemoveDraftItem = (id: string) => {
    setDraftItems(draftItems.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setDraftItems(
      draftItems.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  };

  const handleSaveRequisition = async () => {
    if (draftItems.length === 0) {
      toast.error(`No ${REQUISITION_TYPE_LABELS[requisitionType].toLowerCase()} selected.`);
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
      const basePayload: CreateRequisitionPayload = {
        patient: patientId,
        requesting_doctor_id: currentUser.id,
        requisition_type: requisitionType,
        encounter_type: encounterModel,
        encounter_id: objectId,
        priority,
        clinical_notes: practitionerNotes,
        status: 'ordered',
      };

      // For investigations, we can add them directly in the create payload
      if (requisitionType === 'investigation') {
        basePayload.investigation_ids = draftItems.map((d) => d.item_id);
        await createRequisition(basePayload);
      } else {
        // For other types, create requisition first, then add items
        const requisition = await createRequisition(basePayload);

        // Add items based on type
        for (const item of draftItems) {
          if (requisitionType === 'medicine') {
            const payload: AddMedicineToRequisitionPayload = {
              product_id: item.item_id,
              quantity: item.quantity,
              price: item.unit_price,
            };
            await addMedicineToRequisition(requisition.id, payload);
          } else if (requisitionType === 'procedure') {
            const payload: AddProcedureToRequisitionPayload = {
              procedure_id: item.item_id,
              quantity: item.quantity,
              price: item.unit_price,
            };
            await addProcedureToRequisition(requisition.id, payload);
          } else if (requisitionType === 'package') {
            const payload: AddPackageToRequisitionPayload = {
              package_id: item.item_id,
              quantity: item.quantity,
              price: item.unit_price,
            };
            await addPackageToRequisition(requisition.id, payload);
          }
        }
      }

      toast.success('Requisition created successfully.');

      // Mutate the key for the summary card to update
      mutate('requisitions');
      mutate(['requisitions', { encounter_type: encounterModel, encounter_id: objectId }]);
      mutate(['requisitions', { requisition_type: requisitionType }]);

      onOpenChange(false);
      // Reset state for next time
      setDraftItems([]);
      setPriority('routine');
      setPractitionerNotes('');
      setRequisitionType('investigation');
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
      setDraftItems([]);
      setPriority('routine');
      setSearch('');
      setPractitionerNotes('');
      setRequisitionType('investigation');
    }
  }, [open]);

  // When requisition type changes, clear draft items and search
  useEffect(() => {
    setDraftItems([]);
    setSearch('');
  }, [requisitionType]);

  const footerButtons: DrawerActionButton[] = [
    {
      label: 'Save Requisition',
      onClick: handleSaveRequisition,
      loading: isSaving,
      disabled: draftItems.length === 0,
      className: 'w-full sm:w-auto',
    },
  ];

  const isLoading =
    (requisitionType === 'investigation' && isLoadingInvestigations) ||
    (requisitionType === 'medicine' && isLoadingMedicines) ||
    (requisitionType === 'procedure' && isLoadingProcedures) ||
    (requisitionType === 'package' && isLoadingPackages);

  const searchResults =
    requisitionType === 'investigation'
      ? investigations?.results || []
      : requisitionType === 'medicine'
      ? medicinesData?.results || []
      : requisitionType === 'procedure'
      ? proceduresData?.results || []
      : packagesData?.results || [];

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Create Requisition"
      description="Select requisition type and add items to the draft requisition."
      footerButtons={footerButtons}
      className="w-full md:w-1/3"
    >
      <div className="flex flex-col h-full -mx-4 -my-6">
        <div className="p-4 space-y-4">
          {/* Requisition Type Selector */}
          <div>
            <Label className="mb-2 block">Requisition Type</Label>
            <Select value={requisitionType} onValueChange={(value) => setRequisitionType(value as RequisitionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['investigation', 'medicine', 'procedure', 'package'] as RequisitionType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {REQUISITION_TYPE_ICONS[type]}
                      <span>{REQUISITION_TYPE_LABELS[type]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Item Search */}
          <Command shouldFilter={false} className="border rounded-lg">
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={`Search ${REQUISITION_TYPE_LABELS[requisitionType].toLowerCase()}...`}
            />
            <CommandList>
              {isLoading && <div className="p-4 text-center">Loading...</div>}
              <CommandEmpty>{!isLoading && `No ${REQUISITION_TYPE_LABELS[requisitionType].toLowerCase()} found.`}</CommandEmpty>
              {searchResults.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {searchResults.map((item: any) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelectItem(item)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">
                            {requisitionType === 'investigation'
                              ? item.name
                              : requisitionType === 'medicine'
                              ? item.product_name
                              : item.name}
                          </div>
                          {item.code && <div className="text-xs text-muted-foreground">{item.code}</div>}
                          {requisitionType === 'medicine' && item.company && (
                            <div className="text-xs text-muted-foreground">{item.company}</div>
                          )}
                        </div>
                        {(item.base_charge || item.selling_price || item.default_charge || item.total_charge) && (
                          <Badge variant="secondary">
                            ₹
                            {item.base_charge ||
                              item.selling_price ||
                              item.default_charge ||
                              item.discounted_charge ||
                              item.total_charge}
                          </Badge>
                        )}
                      </div>
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
            <Label htmlFor="practitioner-notes">Clinical Notes (Optional)</Label>
            <Textarea
              id="practitioner-notes"
              value={practitionerNotes}
              onChange={(e) => setPractitionerNotes(e.target.value)}
              placeholder="Add any clinical notes for this requisition..."
            />
          </div>
        </div>

        {/* Draft List */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
          <h3 className="font-semibold mb-2">
            Draft Requisition ({draftItems.length} {draftItems.length === 1 ? 'item' : 'items'})
          </h3>
          {draftItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {REQUISITION_TYPE_ICONS[requisitionType] &&
                React.cloneElement(REQUISITION_TYPE_ICONS[requisitionType] as React.ReactElement, {
                  className: 'mx-auto h-8 w-8 mb-2',
                })}
              <p className="text-sm">Items you add will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {draftItems.map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{item.item_name}</p>
                        {item.item_code && <p className="text-xs text-muted-foreground">{item.item_code}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveDraftItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Quantity controls for non-investigation items */}
                    {requisitionType !== 'investigation' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Label className="text-xs">Quantity:</Label>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="h-6 w-16 text-center text-sm"
                            min={1}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        {item.unit_price && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            ₹{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
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
