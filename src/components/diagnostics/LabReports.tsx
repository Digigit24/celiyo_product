
// src/components/diagnostics/LabReports.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { Requisition } from '@/types/diagnostics.types';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SideDrawer, DrawerActionButton } from '@/components/SideDrawer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { patientService } from '@/services/patient.service';

export const LabReports: React.FC = () => {
    const { useRequisitions, createLabReport } = useDiagnostics();
    const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [kvPairs, setKvPairs] = useState<Array<{ key: string; value: string }>>([
        { key: '', value: '' },
    ]);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [technicianId, setTechnicianId] = useState('');
    const [verifiedBy, setVerifiedBy] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patientNames, setPatientNames] = useState<Record<number, string>>({});

    const { data: requisitionsData, isLoading, mutate } = useRequisitions({
        status: 'sample_collected',
        ordering: 'priority,-created_at'
    });

    const columns: DataTableColumn<Requisition>[] = useMemo(
        () => [
            {
                key: 'requisition_number',
                header: 'Requisition #',
                accessor: (row) => row.requisition_number,
                cell: (row) => (
                    <span className="font-mono font-semibold text-sm">{row.requisition_number}</span>
                ),
                sortable: true,
            },
            {
                key: 'patient_name',
                header: 'Patient',
                accessor: (row) => row.patient_name,
                cell: (row) => (
                    <div className="space-y-0.5">
                        <div className="font-medium">
                            {row.patient_name || patientNames[row.patient] || `Patient #${row.patient}`}
                        </div>
                        <div className="text-xs text-muted-foreground">#{row.patient}</div>
                    </div>
                ),
                sortable: true,
                filterable: true,
            },
            {
                key: 'investigation_orders',
                header: 'Tests',
                accessor: (row) => row.investigation_orders?.length || 0,
                cell: (row) => (
                    <div className="flex flex-wrap gap-1">
                        {row.investigation_orders.map((o) => (
                            <Badge key={o.id} variant="secondary">
                                {o.investigation_name}
                            </Badge>
                        ))}
                    </div>
                ),
                sortable: true,
            },
            {
                key: 'collected_at',
                header: 'Sample Collected',
                accessor: (row) => row.updated_at,
                cell: (row) =>
                    row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A',
            },
            {
                key: 'actions',
                header: 'Actions',
                cell: (row) => (
                    <Button variant="outline" size="sm" onClick={() => openDrawer(row)}>
                        Enter Results
                    </Button>
                ),
            },
        ],
        [patientNames]
    );

    // Prefetch patient names when list loads
    useEffect(() => {
        const loadPatients = async () => {
            const ids = Array.from(
                new Set((requisitionsData?.results || []).map((r) => r.patient).filter(Boolean))
            ) as number[];
            const missing = ids.filter((id) => !patientNames[id]);
            if (!missing.length) return;

            const entries = await Promise.all(
                missing.map(async (id) => {
                    try {
                        const p = await patientService.getPatient(id);
                        const name =
                            (p as any).full_name ||
                            (p as any).user?.full_name ||
                            `${(p as any).user?.first_name || ''} ${(p as any).user?.last_name || ''}`.trim();
                        return [id, name || `Patient #${id}`] as const;
                    } catch {
                        return [id, `Patient #${id}`] as const;
                    }
                })
            );
            if (entries.length) {
                setPatientNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
            }
        };

        loadPatients();
    }, [requisitionsData, patientNames]);

    const openDrawer = (requisition: Requisition) => {
        setSelectedRequisition(requisition);
        const firstOrder = requisition.investigation_orders?.[0];
        setSelectedOrderId(firstOrder ? firstOrder.id : null);
        setKvPairs([{ key: '', value: '' }]);
        setAttachment(null);
        setTechnicianId('');
        setVerifiedBy('');
        setDrawerOpen(true);
    };

    const resetDrawer = () => {
        setSelectedRequisition(null);
        setSelectedOrderId(null);
        setKvPairs([{ key: '', value: '' }]);
        setAttachment(null);
        setTechnicianId('');
        setVerifiedBy('');
    };

    const handleAddPair = () => setKvPairs((prev) => [...prev, { key: '', value: '' }]);

    const handlePairChange = (index: number, field: 'key' | 'value', value: string) => {
        setKvPairs((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const handleRemovePair = (index: number) => {
        setKvPairs((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedOrderId) {
            toast.error('Please select a diagnostic order');
            return;
        }

        const result_data = kvPairs.reduce<Record<string, string>>((acc, pair) => {
            if (pair.key.trim()) {
                acc[pair.key.trim()] = pair.value;
            }
            return acc;
        }, {});

        if (Object.keys(result_data).length === 0) {
            toast.error('Add at least one result field');
            return;
        }

        setIsSubmitting(true);
        try {
            await createLabReport({
                diagnostic_order: selectedOrderId,
                result_data,
                attachment: attachment || undefined,
                technician_id: technicianId || undefined,
                verified_by: verifiedBy || undefined,
            });
            toast.success('Lab report submitted');
            setDrawerOpen(false);
            resetDrawer();
            mutate();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to submit report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const footerButtons: DrawerActionButton[] = [
        {
            label: 'Cancel',
            variant: 'outline',
            onClick: () => {
                setDrawerOpen(false);
                resetDrawer();
            },
        },
        {
            label: 'Submit Results',
            onClick: handleSubmit,
            loading: isSubmitting,
            disabled: isSubmitting,
        },
    ];

    const getPatientDisplay = (req?: Requisition | null) =>
        req
            ? req.patient_name || patientNames[req.patient] || `Patient #${req.patient}`
            : '';

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Lab Reports Queue</CardTitle>
                    <CardDescription>Enter results for collected samples.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        rows={requisitionsData?.results || []}
                        isLoading={isLoading}
                        getRowId={(row) => row.id}
                        getRowLabel={(row) => row.requisition_number}
                        onRowClick={openDrawer}
                        renderMobileCard={(row) => (
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold">{getPatientDisplay(row)}</span>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {row.requisition_number}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {row.investigation_orders.map(o => <Badge key={o.id} variant="secondary">{o.investigation_name}</Badge>)}
                                </div>
                                <Button
                                    className="w-full mt-2"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDrawer(row)}
                                >
                                    Enter Results
                                </Button>
                            </div>
                        )}
                    />
                </CardContent>
            </Card>

            <SideDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onClose={resetDrawer}
                title="Enter Lab Results"
                mode="edit"
                footerButtons={footerButtons}
                size="xl"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Requisition</Label>
                            <Input value={selectedRequisition?.requisition_number || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Patient</Label>
                            <Input value={getPatientDisplay(selectedRequisition)} disabled />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order">Diagnostic Order</Label>
                        <Select
                            value={selectedOrderId ? String(selectedOrderId) : undefined}
                            onValueChange={(val) => setSelectedOrderId(Number(val))}
                        >
                            <SelectTrigger id="order">
                                <SelectValue placeholder="Select test" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedRequisition?.investigation_orders?.map((o) => (
                                    <SelectItem key={o.id} value={String(o.id)}>
                                        {o.investigation_name} (Order #{o.id})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Result Data (key / value)</Label>
                            <Button variant="outline" size="sm" onClick={handleAddPair}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Field
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {kvPairs.map((pair, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center"
                                >
                                    <Input
                                        placeholder="Parameter (e.g., Hemoglobin)"
                                        value={pair.key}
                                        onChange={(e) => handlePairChange(idx, 'key', e.target.value)}
                                        className="md:col-span-2"
                                    />
                                    <Input
                                        placeholder="Value (e.g., 13.5 g/dL)"
                                        value={pair.value}
                                        onChange={(e) => handlePairChange(idx, 'value', e.target.value)}
                                        className="md:col-span-3"
                                    />
                                    {kvPairs.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemovePair(idx)}
                                            className="md:col-span-1"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="attachment">Attachment (PDF / Image)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="attachment"
                                    type="file"
                                    accept="application/pdf,image/*"
                                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                />
                                {attachment && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" />
                                        {attachment.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="technician">Technician User ID</Label>
                                <Input
                                    id="technician"
                                    placeholder="Technician UUID"
                                    value={technicianId}
                                    onChange={(e) => setTechnicianId(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="verified_by">Verified By (Doctor UUID)</Label>
                                <Input
                                    id="verified_by"
                                    placeholder="Doctor UUID"
                                    value={verifiedBy}
                                    onChange={(e) => setVerifiedBy(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </SideDrawer>
        </>
    );
};
