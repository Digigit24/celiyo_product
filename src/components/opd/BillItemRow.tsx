// src/components/opd/BillItemRow.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Package, FlaskConical, Stethoscope, Pill } from 'lucide-react';
import { OPDBillItem } from '@/types/opdBill.types';
import { TableCell, TableRow } from '@/components/ui/table';

interface BillItemRowProps {
  item: OPDBillItem;
  isEditable?: boolean;
  onUpdate?: (field: keyof OPDBillItem, value: string | number) => void;
  onRemove?: () => void;
}

const getItemIcon = (particular: string) => {
  switch (particular) {
    case 'investigation':
    case 'diagnostic':
      return <FlaskConical className="h-4 w-4 text-blue-600" />;
    case 'procedure':
      return <Stethoscope className="h-4 w-4 text-purple-600" />;
    case 'package':
      return <Package className="h-4 w-4 text-green-600" />;
    case 'medicine':
      return <Pill className="h-4 w-4 text-orange-600" />;
    default:
      return null;
  }
};

const getItemBadgeColor = (particular: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (particular) {
    case 'investigation':
    case 'diagnostic':
      return 'default';
    case 'procedure':
      return 'secondary';
    case 'package':
      return 'outline';
    case 'medicine':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const BillItemRow: React.FC<BillItemRowProps> = ({
  item,
  isEditable = false,
  onUpdate,
  onRemove,
}) => {
  const handleFieldChange = (field: keyof OPDBillItem, value: string) => {
    if (!onUpdate) return;

    if (field === 'quantity') {
      const qty = parseInt(value) || 1;
      const unitCharge = parseFloat(item.unit_charge) || 0;
      const discount = parseFloat(item.discount_amount) || 0;
      const total = (qty * unitCharge) - discount;

      onUpdate('quantity', qty);
      onUpdate('total_amount', total.toFixed(2));
    } else if (field === 'unit_charge') {
      const unitCharge = parseFloat(value) || 0;
      const qty = item.quantity || 1;
      const discount = parseFloat(item.discount_amount) || 0;
      const total = (qty * unitCharge) - discount;

      onUpdate('unit_charge', unitCharge.toFixed(2));
      onUpdate('total_amount', total.toFixed(2));
    } else if (field === 'discount_amount') {
      const discount = parseFloat(value) || 0;
      const qty = item.quantity || 1;
      const unitCharge = parseFloat(item.unit_charge) || 0;
      const total = (qty * unitCharge) - discount;

      onUpdate('discount_amount', discount.toFixed(2));
      onUpdate('total_amount', total.toFixed(2));
    } else {
      onUpdate(field, value);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-start gap-2">
          {getItemIcon(item.particular)}
          <div className="flex-1">
            <div className="font-medium">{item.particular_name || item.particular}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getItemBadgeColor(item.particular)} className="text-xs capitalize">
                {item.particular}
              </Badge>
              {item.note && (
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {item.note}
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-center">
        {isEditable ? (
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleFieldChange('quantity', e.target.value)}
            className="w-20 mx-auto text-center"
            min="1"
          />
        ) : (
          <span>{item.quantity}</span>
        )}
      </TableCell>

      <TableCell className="text-right">
        {isEditable ? (
          <Input
            type="number"
            value={item.unit_charge}
            onChange={(e) => handleFieldChange('unit_charge', e.target.value)}
            className="w-28 ml-auto text-right"
            min="0"
            step="0.01"
          />
        ) : (
          <span>₹{parseFloat(item.unit_charge).toFixed(2)}</span>
        )}
      </TableCell>

      <TableCell className="text-right">
        {isEditable ? (
          <Input
            type="number"
            value={item.discount_amount}
            onChange={(e) => handleFieldChange('discount_amount', e.target.value)}
            className="w-24 ml-auto text-right"
            min="0"
            step="0.01"
          />
        ) : (
          <span className="text-green-600">
            {parseFloat(item.discount_amount) > 0 ? `-₹${parseFloat(item.discount_amount).toFixed(2)}` : '-'}
          </span>
        )}
      </TableCell>

      <TableCell className="text-right font-semibold">
        ₹{parseFloat(item.total_amount).toFixed(2)}
      </TableCell>

      {isEditable && onRemove && (
        <TableCell className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
};
