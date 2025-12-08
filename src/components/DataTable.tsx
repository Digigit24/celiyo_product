// src/components/DataTable.tsx

import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Eye, Edit, Trash2, Stethoscope, DollarSign } from 'lucide-react';

// --------------------------------------
// Types
// --------------------------------------

export interface DataTableColumn<T> {
  /** column label in <th> */
  header: string;
  /** unique key for this column */
  key: string;
  /** render cell content for desktop table */
  cell: (row: T) => React.ReactNode;
  /** optional className for <TableHead> & <TableCell> */
  className?: string;
}

export interface DataTableProps<T> {
  /** array of row objects (patients, notes, etc.) */
  rows: T[];
  /** is API loading? */
  isLoading: boolean;
  /** columns configuration for desktop table */
  columns: DataTableColumn<T>[];
  /** render function for mobile card layout (1 row -> card) */
  renderMobileCard: (row: T, actions: RowActions<T>) => React.ReactNode;

  /** unique id accessor for keys / deletes */
  getRowId: (row: T) => string | number;
  /** label to show in delete dialog, ex. row.full_name */
  getRowLabel: (row: T) => string;

  /** row click action (separate from view details) - called when clicking the row */
  onRowClick?: (row: T) => void;
  /** selected row ID for highlighting */
  selectedRowId?: string | number | null;
  /** view action - only called from Actions menu */
  onView?: (row: T) => void;
  /** edit action */
  onEdit?: (row: T) => void;
  /** delete action (async allowed). if not provided, Delete is hidden */
  onDelete?: (row: T) => Promise<void> | void;

  /** consultation action - shown as button */
  onConsultation?: (row: T) => void;
  /** billing action - shown as button */
  onBilling?: (row: T) => void;

  /** optional: extra action items you want in dropdown */
  extraActions?: (row: T) => React.ReactNode;

  /** empty state text */
  emptyTitle?: string;
  emptySubtitle?: string;
}

// This is just to pass bound handlers down to mobile card
export interface RowActions<T> {
  view?: () => void;
  edit?: () => void;
  askDelete?: () => void;
  consultation?: () => void;
  billing?: () => void;
  dropdown?: React.ReactNode;
}

// --------------------------------------
// Component
// --------------------------------------

export function DataTable<T>({
  rows,
  isLoading,
  columns,
  renderMobileCard,
  getRowId,
  getRowLabel,
  onRowClick,
  selectedRowId,
  onView,
  onEdit,
  onDelete,
  onConsultation,
  onBilling,
  extraActions,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your filters or search criteria',
}: DataTableProps<T>) {
  const isMobile = useIsMobile();

  // delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAskDelete = (row: T) => {
    if (!onDelete) return; // if no delete handler, no dialog
    setRowToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(rowToDelete);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------------------------
  // LOADING STATE
  // ---------------------------
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-12 w-full">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 mb-4">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ---------------------------
  // EMPTY STATE (no rows, not loading)
  // ---------------------------
  if (!isLoading && rows.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center h-full p-8 w-full">
          <div className="text-center max-w-xs">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              {emptyTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              {emptySubtitle}
            </p>
          </div>
        </div>

        {/* delete dialog still mounted so you can delete last row and see dialog etc */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                {rowToDelete ? getRowLabel(rowToDelete) : ''}? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ---------------------------
  // MOBILE CARD LIST
  // ---------------------------
  if (isMobile) {
    return (
      <>
        <div className="p-4 space-y-3">
          {rows.map((row) => {
            const rowActions: RowActions<T> = {
              view: onView ? () => onView(row) : undefined,
              edit: onEdit ? () => onEdit(row) : undefined,
              askDelete: onDelete ? () => handleAskDelete(row) : undefined,
              consultation: onConsultation ? () => onConsultation(row) : undefined,
              billing: onBilling ? () => onBilling(row) : undefined,
            };

            return (
              <div key={getRowId(row)} className="bg-card border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                {renderMobileCard(row, rowActions)}
              </div>
            );
          })}
        </div>

        {/* Delete dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                {rowToDelete ? getRowLabel(rowToDelete) : ''}? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ---------------------------
  // DESKTOP TABLE
  // ---------------------------

  return (
    <>
      <div className="w-full">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="hover:bg-transparent border-b">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`font-medium ${col.className || ''}`}
                >
                  {col.header}
                </TableHead>
              ))}

              {/* Actions header */}
              {(onView || onEdit || onDelete || onConsultation || onBilling || extraActions) && (
                <TableHead className="font-medium text-right">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => {
              const id = getRowId(row);

              // table row click triggers onRowClick if provided, otherwise onView (for backward compatibility)
              const handleRowClick = () => {
                if (onRowClick) {
                  onRowClick(row);
                } else if (onView) {
                  onView(row);
                }
              };

              const rowActions: RowActions<T> = {
                view: onView ? () => onView(row) : undefined,
                edit: onEdit ? () => onEdit(row) : undefined,
                askDelete: onDelete ? () => handleAskDelete(row) : undefined,
                consultation: onConsultation ? () => onConsultation(row) : undefined,
                billing: onBilling ? () => onBilling(row) : undefined,
              };

              // Only make row clickable if onRowClick or onView is provided
              const isRowClickable = !!(onRowClick || onView);
              const isSelected = selectedRowId !== undefined && selectedRowId !== null && id === selectedRowId;

              return (
                <TableRow
                  key={id}
                  className={`group hover:bg-muted/50 transition-colors align-top ${isRowClickable ? 'cursor-pointer' : ''} ${isSelected ? 'bg-muted/70 border-l-4 border-l-primary' : ''}`}
                  onClick={isRowClickable ? handleRowClick : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}

                  {(onView || onEdit || onDelete || onConsultation || onBilling || extraActions) && (
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {/* Consultation Button */}
                        {onConsultation && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onConsultation(row)}
                          >
                            <Stethoscope className="h-4 w-4 mr-1" />
                            Consult
                          </Button>
                        )}

                        {/* Billing Button */}
                        {onBilling && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBilling(row)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Billing
                          </Button>
                        )}

                        {/* Dropdown Menu */}
                        <RowDropdown
                          row={row}
                          rowActions={rowActions}
                          extraActions={extraActions}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              {rowToDelete ? getRowLabel(rowToDelete) : ''}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --------------------------------------
// Row dropdown (3 dots menu)
// --------------------------------------

function RowDropdown<T>({
  row,
  rowActions,
  extraActions,
}: {
  row: T;
  rowActions: RowActions<T>;
  extraActions?: (row: T) => React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {rowActions.view && (
          <DropdownMenuItem onClick={rowActions.view}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
        )}

        {rowActions.edit && (
          <DropdownMenuItem onClick={rowActions.edit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}

        {extraActions && (
          <>
            <DropdownMenuSeparator />
            {extraActions(row)}
          </>
        )}

        {rowActions.askDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={rowActions.askDelete}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}