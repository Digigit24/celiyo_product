// src/components/opd/ProcedureBillingTab.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Package, Search, Trash2 } from 'lucide-react';
import type { ProcedureMaster } from '@/types/procedureMaster.types';
import type { OPDBillItem } from '@/types/opdBill.types';

export interface ProcedureItem {
  id: string;
  procedure_id: number;
  procedure_name: string;
  procedure_code?: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  notes: string;
}

interface ProcedureBillingTabProps {
  billItems: OPDBillItem[];
  proceduresData: any;
  packagesData: any;
  proceduresLoading: boolean;
  packagesLoading: boolean;
  onAddProcedure: (procedure: ProcedureMaster) => void;
  onAddPackage: (packageId: number, packageName: string) => Promise<void>;
  onUpdateBillItem: (index: number, field: 'quantity' | 'unit_price', value: string) => void;
  onRemoveBillItem: (index: number) => void;
}

export const ProcedureBillingTab: React.FC<ProcedureBillingTabProps> = ({
  billItems,
  proceduresData,
  packagesData,
  proceduresLoading,
  packagesLoading,
  onAddProcedure,
  onAddPackage,
  onUpdateBillItem,
  onRemoveBillItem,
}) => {
  const [isProcedureDialogOpen, setIsProcedureDialogOpen] = useState(false);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [procedureSearch, setProcedureSearch] = useState('');
  const [loadingPackageId, setLoadingPackageId] = useState<number | null>(null);

  // Filter bill items to show only procedures and packages
  const procedureAndPackageItems = useMemo(() =>
    billItems.filter(item => item.source === 'Procedure' || item.source === 'Package'),
    [billItems]
  );

  const handleAddProcedure = (procedure: ProcedureMaster) => {
    onAddProcedure(procedure);
    setIsProcedureDialogOpen(false);
    setProcedureSearch('');
  };

  const handleAddPackage = async (packageId: number, packageName: string) => {
    setLoadingPackageId(packageId);
    try {
      await onAddPackage(packageId, packageName);
      // Close dialog and clear loading only on success
      setIsPackageDialogOpen(false);
      setLoadingPackageId(null);
    } catch (error) {
      // On error, clear loading but keep dialog open so user can try again
      setLoadingPackageId(null);
      console.error('Error adding package:', error);
      // Error toast is already shown by onAddPackage
    }
  };

  const procedureTotal = procedureAndPackageItems.reduce((sum, item) => sum + parseFloat(item.total_price || '0'), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Procedure Billing</CardTitle>
          <CardDescription className="mt-1">Add procedures & tests</CardDescription>
        </div>
        <div className="flex gap-2">
          <Dialog open={isProcedureDialogOpen} onOpenChange={setIsProcedureDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Procedure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select Procedure</DialogTitle>
                <DialogDescription>Choose a procedure to add to the bill</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search procedures..."
                    value={procedureSearch}
                    onChange={(e) => setProcedureSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="space-y-2">
                  {proceduresLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading procedures...</div>
                  ) : proceduresData?.results && proceduresData.results.length > 0 ? (
                    proceduresData.results
                      .filter((proc: ProcedureMaster) =>
                        procedureSearch
                          ? proc.name.toLowerCase().includes(procedureSearch.toLowerCase()) ||
                            proc.code.toLowerCase().includes(procedureSearch.toLowerCase())
                          : true
                      )
                      .map((procedure: ProcedureMaster) => (
                        <div
                          key={procedure.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleAddProcedure(procedure)}
                        >
                          <div>
                            <div className="font-medium">{procedure.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {procedure.code} • {procedure.category}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              ₹{parseFloat(procedure.default_charge).toFixed(2)}
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 mt-1">
                              Add
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No procedures found</div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Package className="h-4 w-4 mr-1" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select Package</DialogTitle>
                <DialogDescription>Choose a package to add to the bill</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  {packagesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading packages...</div>
                  ) : packagesData?.results && packagesData.results.length > 0 ? (
                    packagesData.results.map((pkg: any) => {
                      const procedureCount = pkg.procedures?.length ?? pkg.procedure_count ?? 0;
                      const isLoading = loadingPackageId === pkg.id;

                      return (
                        <div
                          key={pkg.id}
                          className={`flex flex-col p-4 border rounded-lg ${
                            isLoading ? 'opacity-50' : 'hover:bg-muted/50 cursor-pointer'
                          }`}
                          onClick={() => !isLoading && handleAddPackage(pkg.id, pkg.name)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-lg">{pkg.name}</div>
                              <div className="text-xs text-muted-foreground">{pkg.code}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground line-through">
                                ₹{parseFloat(pkg.total_charge).toFixed(2)}
                              </div>
                              <div className="font-semibold text-lg text-green-600">
                                ₹{parseFloat(pkg.discounted_charge).toFixed(2)}
                              </div>
                              {pkg.discount_percent && (
                                <div className="text-xs text-green-600">{pkg.discount_percent}% off</div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Includes {procedureCount} procedure{procedureCount !== 1 ? 's' : ''}
                          </div>
                          <Button size="sm" className="mt-3 w-full" disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Add Package'}
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No packages found</div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Procedure</TableHead>
                <TableHead className="w-[100px] text-center">Qty</TableHead>
                <TableHead className="w-[120px] text-right">Rate</TableHead>
                <TableHead className="w-[120px] text-right">Amount</TableHead>
                <TableHead className="w-[80px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedureAndPackageItems.length > 0 ? (
                procedureAndPackageItems.map((item) => {
                  // Find the index in the original billItems array
                  const billItemIndex = billItems.findIndex(bi => bi.id === item.id || (bi.item_name === item.item_name && bi.source === item.source));

                  return (
                    <TableRow key={item.id || `${item.item_name}-${item.source}`}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{item.item_name}</div>
                          {item.notes && (
                            <div className="text-xs text-muted-foreground">{item.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => billItemIndex >= 0 && onUpdateBillItem(billItemIndex, 'quantity', e.target.value)}
                          className="w-16 mx-auto text-center"
                          min="1"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => billItemIndex >= 0 && onUpdateBillItem(billItemIndex, 'unit_price', e.target.value)}
                          className="w-24 ml-auto text-right"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{parseFloat(item.total_price || '0').toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => billItemIndex >= 0 && onRemoveBillItem(billItemIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No procedures added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {procedureAndPackageItems.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Procedure Total</span>
              <span className="text-2xl font-bold">₹{procedureTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
