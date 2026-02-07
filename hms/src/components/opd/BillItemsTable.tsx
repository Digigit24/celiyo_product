// src/components/opd/BillItemsTable.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import type { OPDBillItem } from '@/types/opdBill.types';

interface BillItemsTableProps {
  items: OPDBillItem[];
  onUpdateItem: (index: number, field: 'quantity' | 'unit_price', value: string) => void;
  onRemoveItem: (index: number) => void;
  readOnly?: boolean;
}

// Editable cell component with local state to prevent excessive API calls
const EditableCell: React.FC<{
  value: string | number;
  index: number;
  field: 'quantity' | 'unit_price';
  onUpdate: (index: number, field: 'quantity' | 'unit_price', value: string) => void;
  type?: string;
  className?: string;
  min?: string;
  step?: string;
}> = ({ value, index, field, onUpdate, type = 'number', className, min, step }) => {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync local value when prop value changes (from external updates)
  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    // Only update if value actually changed
    if (String(value) !== localValue) {
      onUpdate(index, field, localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <Input
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      min={min}
      step={step}
    />
  );
};

export const BillItemsTable: React.FC<BillItemsTableProps> = ({
  items,
  onUpdateItem,
  onRemoveItem,
  readOnly = false,
}) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[250px]">Item / Service</TableHead>
            <TableHead className="w-[120px]">Source</TableHead>
            <TableHead className="w-[100px] text-center">Qty</TableHead>
            <TableHead className="w-[120px] text-right">Rate</TableHead>
            <TableHead className="w-[120px] text-right">Amount</TableHead>
            {!readOnly && <TableHead className="w-[80px] text-center">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <TableRow key={item.id || index}>
                <TableCell className="font-medium">
                  <div>
                    <div>{item.item_name}</div>
                    {item.notes && (
                      <div className="text-xs text-muted-foreground">{item.notes}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {item.source}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {readOnly ? (
                    <span>{item.quantity}</span>
                  ) : (
                    <EditableCell
                      value={item.quantity}
                      index={index}
                      field="quantity"
                      onUpdate={onUpdateItem}
                      className="w-16 mx-auto text-center"
                      min="1"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <span>₹{parseFloat(item.unit_price || '0').toFixed(2)}</span>
                  ) : (
                    <EditableCell
                      value={item.unit_price}
                      index={index}
                      field="unit_price"
                      onUpdate={onUpdateItem}
                      className="w-24 ml-auto text-right"
                      min="0"
                      step="0.01"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ₹{parseFloat(item.total_price || '0').toFixed(2)}
                  {item.is_price_overridden && (
                    <span className="text-xs text-orange-600 ml-1">*</span>
                  )}
                </TableCell>
                {!readOnly && (
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={readOnly ? 5 : 6} className="text-center text-muted-foreground py-8">
                No items added yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {items.some(item => item.is_price_overridden) && (
        <div className="p-2 bg-muted/30 text-xs text-muted-foreground">
          * Price has been manually adjusted
        </div>
      )}
    </div>
  );
};
