// src/components/ProcedureBillFormDrawer.tsx
import React from 'react';
import { SideDrawer } from '@/components/SideDrawer';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ProcedureBillFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  billId?: number | null;
  onSuccess?: () => void;
}

export const ProcedureBillFormDrawer: React.FC<ProcedureBillFormDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  billId,
  onSuccess,
}) => {
  const getTitle = () => {
    if (mode === 'create') return 'Create Procedure Bill';
    if (mode === 'edit') return 'Edit Procedure Bill';
    return 'Procedure Bill Details';
  };

  return (
    <SideDrawer
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={getTitle()}
      description="Multi-item procedure billing"
    >
      <div className="space-y-4">
        <div className="bg-muted p-6 rounded-lg text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Procedure Bill Form</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Full form with multi-item billing, procedure selection, and payment processing will be implemented here.
          </p>
          <p className="text-xs text-muted-foreground">
            Features: Procedure selection, quantities, pricing, discounts, payment modes, and receipt generation.
          </p>
        </div>
      </div>
    </SideDrawer>
  );
};
