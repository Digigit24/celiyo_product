// src/components/opd/InvestigationsBillingTab.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FlaskConical, Download, Bell, Search, Plus } from 'lucide-react';
import type { UnbilledRequisitionSummary, UnbilledOrderSummary, Investigation } from '@/types/diagnostics.types';
import type { OpdVisit } from '@/types/opdVisit.types';

interface InvestigationsBillingTabProps {
  visit: OpdVisit;
  unbilledRequisitions: UnbilledRequisitionSummary[];
  totalUnbilledItems: number;
  estimatedUnbilledAmount: number;
  requisitionsLoading: boolean;
  isSyncingClinicalCharges: boolean;
  existingBill: any;
  investigationsData: any;
  investigationsLoading: boolean;
  onSyncClinicalCharges: () => Promise<void>;
  onRefreshRequisitions: () => void;
  onAddInvestigation: (investigation: Investigation) => void;
}

export const InvestigationsBillingTab: React.FC<InvestigationsBillingTabProps> = ({
  visit,
  unbilledRequisitions,
  totalUnbilledItems,
  estimatedUnbilledAmount,
  requisitionsLoading,
  isSyncingClinicalCharges,
  existingBill,
  investigationsData,
  investigationsLoading,
  onSyncClinicalCharges,
  onRefreshRequisitions,
  onAddInvestigation,
}) => {
  const [isRequisitionDialogOpen, setIsRequisitionDialogOpen] = useState(false);
  const [isInvestigationDialogOpen, setIsInvestigationDialogOpen] = useState(false);
  const [investigationSearch, setInvestigationSearch] = useState('');

  const hasUnbilledRequisitions = unbilledRequisitions.length > 0;

  const formatCurrency = (value: string | number | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (!Number.isFinite(num)) return '0.00';
    return Number(num).toFixed(2);
  };

  const getOrderTotal = (order: UnbilledOrderSummary) => {
    const total = order.total ?? (parseFloat(order.price || '0') * (order.quantity || 1));
    return Number(total) || 0;
  };

  const renderOrderGroups = (requisition: UnbilledRequisitionSummary) => {
    const investigationOrders = (requisition.unbilled_orders || []).filter(
      (order) => order.type === 'diagnostic' || order.type === 'investigation'
    );
    const medicineOrders = (requisition.unbilled_orders || []).filter((order) => order.type === 'medicine');
    const procedureOrders = (requisition.unbilled_orders || []).filter((order) => order.type === 'procedure');
    const packageOrders = (requisition.unbilled_orders || []).filter((order) => order.type === 'package');

    return (
      <div className="space-y-2">
        {investigationOrders.length > 0 && (
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Investigations:</p>
            <ul className="text-sm space-y-1">
              {investigationOrders.map((order, idx) => (
                <li key={`${requisition.requisition_id}-investigation-${idx}`} className="flex justify-between">
                  <span>{order.name}{order.category ? ` (${order.category})` : ''}</span>
                  <span className="font-semibold">₹{formatCurrency(order.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {medicineOrders.length > 0 && (
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Medicines:</p>
            <ul className="text-sm space-y-1">
              {medicineOrders.map((order, idx) => (
                <li key={`${requisition.requisition_id}-medicine-${idx}`} className="flex justify-between">
                  <span>{order.name} × {order.quantity ?? 1}</span>
                  <span className="font-semibold">₹{formatCurrency(order.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {procedureOrders.length > 0 && (
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Procedures:</p>
            <ul className="text-sm space-y-1">
              {procedureOrders.map((order, idx) => (
                <li key={`${requisition.requisition_id}-procedure-${idx}`} className="flex justify-between">
                  <span>{order.name} × {order.quantity ?? 1}</span>
                  <span className="font-semibold">₹{formatCurrency(order.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {packageOrders.length > 0 && (
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Packages:</p>
            <ul className="text-sm space-y-1">
              {packageOrders.map((order, idx) => (
                <li key={`${requisition.requisition_id}-package-${idx}`} className="flex justify-between">
                  <span>{order.name} × {order.quantity ?? 1}</span>
                  <span className="font-semibold">₹{formatCurrency(order.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const handleSyncClick = async () => {
    await onSyncClinicalCharges();
    setIsRequisitionDialogOpen(false);
  };

  const handleAddInvestigation = (investigation: Investigation) => {
    onAddInvestigation(investigation);
    setIsInvestigationDialogOpen(false);
    setInvestigationSearch('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Investigations & Clinical Charges
            </CardTitle>
            <CardDescription>
              Sync clinical charges from requisitions or manually add investigations
            </CardDescription>
            {hasUnbilledRequisitions && (
              <div className="flex flex-wrap gap-2 mt-2 text-xs sm:text-sm">
                <Badge variant="secondary">{totalUnbilledItems} items pending</Badge>
                <Badge variant="outline">Est. ₹{formatCurrency(estimatedUnbilledAmount)}</Badge>
                {visit?.visit_number && <Badge variant="outline">Visit {visit.visit_number}</Badge>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshRequisitions}
              disabled={requisitionsLoading}
            >
              Refresh
            </Button>
            <Dialog open={isInvestigationDialogOpen} onOpenChange={setIsInvestigationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Investigation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Select Investigation</DialogTitle>
                  <DialogDescription>Choose an investigation to add to the bill</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search investigations..."
                      value={investigationSearch}
                      onChange={(e) => setInvestigationSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {investigationsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading investigations...</div>
                    ) : investigationsData?.results && investigationsData.results.length > 0 ? (
                      investigationsData.results
                        .filter((inv: Investigation) =>
                          investigationSearch
                            ? inv.name.toLowerCase().includes(investigationSearch.toLowerCase()) ||
                              inv.code?.toLowerCase().includes(investigationSearch.toLowerCase()) ||
                              inv.category?.toLowerCase().includes(investigationSearch.toLowerCase())
                            : true
                        )
                        .map((investigation: Investigation) => (
                          <div
                            key={investigation.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleAddInvestigation(investigation)}
                          >
                            <div>
                              <div className="font-medium">{investigation.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {investigation.code && `${investigation.code} • `}
                                {investigation.category}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                ₹{parseFloat(investigation.base_charge || '0').toFixed(2)}
                              </div>
                              <Button size="sm" variant="ghost" className="h-6 mt-1">
                                Add
                              </Button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No investigations found</div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isRequisitionDialogOpen} onOpenChange={setIsRequisitionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!hasUnbilledRequisitions || requisitionsLoading}>
                  Review & Sync
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Sync clinical charges to bill</DialogTitle>
                  <DialogDescription>
                    ₹{formatCurrency(estimatedUnbilledAmount)} estimated • {totalUnbilledItems} item(s)
                  </DialogDescription>
                </DialogHeader>

                {hasUnbilledRequisitions ? (
                  <div className="space-y-3">
                    {unbilledRequisitions.map((requisition) => {
                      const orderCount = requisition.unbilled_orders?.length || 0;
                      const requisitionId = (requisition as any).id ?? requisition.requisition_id;
                      const orderTotal = (requisition.unbilled_orders || []).reduce(
                        (sum, order) => sum + getOrderTotal(order),
                        0
                      );

                      return (
                        <div key={requisitionId} className="border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {requisition.requisition_type}
                                </Badge>
                                <Badge
                                  variant={
                                    requisition.priority === 'stat'
                                      ? 'destructive'
                                      : requisition.priority === 'urgent'
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                  className="capitalize"
                                >
                                  {requisition.priority || 'routine'}
                                </Badge>
                                <Badge variant="secondary">
                                  {orderCount} item{orderCount === 1 ? '' : 's'}
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-base">
                                {requisition.requisition_number}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Ordered: {format(new Date(requisition.order_date), 'PPp')}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">Est. total</p>
                              <p className="font-semibold">₹{formatCurrency(orderTotal)}</p>
                            </div>
                          </div>
                          <div className="mt-2">{renderOrderGroups(requisition)}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No unbilled requisitions found.</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsRequisitionDialogOpen(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={handleSyncClick}
                    disabled={!hasUnbilledRequisitions || isSyncingClinicalCharges}
                  >
                    {isSyncingClinicalCharges ? 'Syncing...' : existingBill ? 'Sync to bill' : 'Create bill & sync'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {requisitionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Loading requisitions...</p>
            </div>
          </div>
        ) : hasUnbilledRequisitions ? (
          <div className="space-y-3">
            {unbilledRequisitions.map((requisition) => {
              const orderCount = requisition.unbilled_orders?.length || 0;
              const requisitionId = (requisition as any).id ?? requisition.requisition_id;
              const orderTotal = (requisition.unbilled_orders || []).reduce(
                (sum, order) => sum + getOrderTotal(order),
                0
              );

              return (
                <Card key={requisitionId} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {requisition.requisition_type}
                          </Badge>
                          <Badge
                            variant={
                              requisition.priority === 'stat'
                                ? 'destructive'
                                : requisition.priority === 'urgent'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="capitalize"
                          >
                            {requisition.priority || 'routine'}
                          </Badge>
                          <Badge variant="secondary">
                            {orderCount} item{orderCount === 1 ? '' : 's'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">
                          {requisition.requisition_number}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Ordered: {format(new Date(requisition.order_date), 'PPp')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-xs text-muted-foreground">Est. Total</p>
                        <p className="font-semibold text-lg">₹{formatCurrency(orderTotal)}</p>
                        <Button
                          onClick={onSyncClinicalCharges}
                          disabled={isSyncingClinicalCharges}
                          className="gap-2 w-full"
                        >
                          <Download className="h-4 w-4" />
                          Sync to Bill
                        </Button>
                      </div>
                    </div>

                    {renderOrderGroups(requisition)}

                    {requisition.clinical_notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">Notes:</span> {requisition.clinical_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <FlaskConical className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Unbilled Requisitions</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              All requisitions for this visit have been billed or there are no requisitions yet.
            </p>
            <p className="text-sm text-muted-foreground">
              You can manually add investigations using the "Add Investigation" button above.
            </p>
          </div>
        )}

        {!existingBill && hasUnbilledRequisitions && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900 mt-4">
            <div className="flex items-start gap-2">
              <Bell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Auto-create bill on sync
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                  When you sync clinical charges, a bill will be automatically created if one doesn't exist yet.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
