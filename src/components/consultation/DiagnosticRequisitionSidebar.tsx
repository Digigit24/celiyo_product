// src/components/consultation/DiagnosticRequisitionSidebar.tsx
import React, { useState, useEffect } from 'react';
import { SideDrawer, DrawerActionButton } from '@/components/SideDrawer';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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
      title="Order Requisition"
      description="Choose requisition type and add items to create your order."
      footerButtons={footerButtons}
      className="w-full sm:w-[500px] md:w-[600px] lg:w-[700px]"
    >
      <div className="flex flex-col h-full -mx-4 -my-6">
        {/* Icon Button Tabs */}
        <div className="px-4 pt-4 pb-2 border-b bg-gradient-to-b from-background to-muted/20">
          <div className="grid grid-cols-4 gap-2">
            {(['investigation', 'medicine', 'procedure', 'package'] as RequisitionType[]).map((type) => (
              <button
                key={type}
                onClick={() => setRequisitionType(type)}
                className={`
                  group relative flex flex-col items-center gap-2 p-3 rounded-xl
                  transition-all duration-300 ease-out
                  ${
                    requisitionType === type
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                      : 'bg-muted/50 hover:bg-muted hover:scale-102 text-muted-foreground'
                  }
                `}
              >
                {/* Icon */}
                <div className={`
                  transition-transform duration-300
                  ${requisitionType === type ? 'scale-110' : 'group-hover:scale-110'}
                `}>
                  {requisitionType === 'investigation' && type === 'investigation' && <Microscope className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {requisitionType === 'medicine' && type === 'medicine' && <Pill className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {requisitionType === 'procedure' && type === 'procedure' && <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {requisitionType === 'package' && type === 'package' && <Package className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {requisitionType !== type && (
                    <>
                      {type === 'investigation' && <Microscope className="h-5 w-5 sm:h-6 sm:w-6" />}
                      {type === 'medicine' && <Pill className="h-5 w-5 sm:h-6 sm:w-6" />}
                      {type === 'procedure' && <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />}
                      {type === 'package' && <Package className="h-5 w-5 sm:h-6 sm:w-6" />}
                    </>
                  )}
                </div>

                {/* Label */}
                <span className={`
                  text-xs font-medium text-center leading-tight
                  ${requisitionType === type ? 'font-semibold' : ''}
                `}>
                  {REQUISITION_TYPE_LABELS[type]}
                </span>

                {/* Active Indicator */}
                {requisitionType === type && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-in slide-in-from-bottom-2 duration-300" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* Dynamic Item Search */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              {REQUISITION_TYPE_ICONS[requisitionType]}
              Search {REQUISITION_TYPE_LABELS[requisitionType]}
            </Label>
            <Command shouldFilter={false} className="border-2 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <CommandInput
                value={search}
                onValueChange={setSearch}
                placeholder={`Type to search ${REQUISITION_TYPE_LABELS[requisitionType].toLowerCase()}...`}
                className="border-none focus:ring-0"
              />
              <CommandList className="max-h-[200px]">
                {isLoading && (
                  <div className="p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                )}
                <CommandEmpty>
                  {!isLoading && (
                    <div className="p-6 text-center">
                      <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                        {REQUISITION_TYPE_ICONS[requisitionType] &&
                          React.cloneElement(REQUISITION_TYPE_ICONS[requisitionType] as React.ReactElement, {
                            className: 'h-5 w-5 text-muted-foreground',
                          })}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No {REQUISITION_TYPE_LABELS[requisitionType].toLowerCase()} found
                      </p>
                    </div>
                  )}
                </CommandEmpty>
                {searchResults.length > 0 && (
                  <CommandGroup heading="Available Items" className="p-2">
                    {searchResults.map((item: any) => (
                      <CommandItem
                        key={item.id}
                        onSelect={() => handleSelectItem(item)}
                        className="cursor-pointer rounded-lg mb-1 hover:bg-primary/5 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between w-full gap-3 py-1">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {requisitionType === 'investigation'
                                ? item.name
                                : requisitionType === 'medicine'
                                ? item.product_name
                                : item.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.code && (
                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {item.code}
                                </span>
                              )}
                              {requisitionType === 'medicine' && item.company && (
                                <span className="text-xs text-muted-foreground truncate">{item.company}</span>
                              )}
                            </div>
                          </div>
                          {(item.base_charge || item.selling_price || item.default_charge || item.total_charge) && (
                            <Badge variant="secondary" className="shrink-0 font-semibold">
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
          </div>

          {/* Priority Toggles */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Priority Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['routine', 'urgent', 'stat'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`
                    relative px-4 py-2.5 rounded-lg font-medium text-sm
                    transition-all duration-200 ease-out capitalize
                    ${
                      priority === p
                        ? p === 'routine'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                          : p === 'urgent'
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50 scale-105'
                          : 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-105'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:scale-102'
                    }
                  `}
                >
                  {p}
                  {priority === p && (
                    <div className="absolute inset-0 rounded-lg bg-white/20 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Practitioner Notes */}
          <div className="space-y-2">
            <Label htmlFor="practitioner-notes" className="text-sm font-semibold">
              Clinical Notes <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="practitioner-notes"
              value={practitionerNotes}
              onChange={(e) => setPractitionerNotes(e.target.value)}
              placeholder="Add clinical context, symptoms, or special instructions..."
              className="resize-none min-h-[80px] rounded-xl border-2 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Draft List */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-muted/10 to-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">{draftItems.length}</span>
              </div>
              Draft Order
            </h3>
            {draftItems.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {draftItems.length} {draftItems.length === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </div>

          {draftItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                {REQUISITION_TYPE_ICONS[requisitionType] &&
                  React.cloneElement(REQUISITION_TYPE_ICONS[requisitionType] as React.ReactElement, {
                    className: 'h-7 w-7 text-primary',
                  })}
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No items added yet</p>
              <p className="text-xs text-muted-foreground">
                Search and select items to build your requisition
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {draftItems.map((item, index) => (
                <Card
                  key={item.id}
                  className="bg-white border-2 hover:border-primary/30 transition-all duration-200 hover:shadow-md group"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="mt-0.5 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.item_name}</p>
                          {item.item_code && (
                            <p className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded inline-block mt-1">
                              {item.item_code}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDraftItem(item.id)}
                        className="shrink-0 h-7 w-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors group/btn"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground group-hover/btn:text-red-500 transition-colors" />
                      </button>
                    </div>

                    {/* Quantity controls for non-investigation items */}
                    {requisitionType !== 'investigation' && (
                      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Qty:</span>
                          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="h-7 w-7 rounded-md hover:bg-background flex items-center justify-center transition-colors font-semibold"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="h-7 w-12 text-center text-sm font-semibold bg-transparent border-none focus:outline-none"
                              min={1}
                            />
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="h-7 w-7 rounded-md hover:bg-background flex items-center justify-center transition-colors font-semibold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {item.unit_price && (
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="text-sm font-bold text-primary">
                              ₹{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Total Summary */}
              {draftItems.some(item => item.unit_price) && (
                <div className="sticky bottom-0 mt-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Estimated Total</span>
                    <span className="text-lg font-bold text-primary">
                      ₹
                      {draftItems
                        .reduce((sum, item) => {
                          const price = item.unit_price ? parseFloat(item.unit_price) : 0;
                          return sum + price * item.quantity;
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SideDrawer>
  );
}
