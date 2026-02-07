// src/components/procedure-package-drawer/ProcedurePackageBasicInfo.tsx
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProcedurePackage, ProcedurePackageCreateData } from '@/types/procedurePackage.types';
import { useProcedureMaster } from '@/hooks/useProcedureMaster';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const procedurePackageSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  code: z.string().min(1, 'Package code is required'),
  total_charge: z.string().min(1, 'Total charge is required'),
  discounted_charge: z.string().min(1, 'Discounted charge is required'),
  is_active: z.boolean(),
});

type ProcedurePackageFormData = z.infer<typeof procedurePackageSchema>;

interface ProcedurePackageBasicInfoProps {
  mode: 'create' | 'edit' | 'view';
  package?: ProcedurePackage;
  onSubmit: (data: ProcedurePackageCreateData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProcedurePackageBasicInfo: React.FC<ProcedurePackageBasicInfoProps> = ({
  mode,
  package: pkg,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const isReadOnly = mode === 'view';
  const isCreateMode = mode === 'create';

  const [selectedProcedureIds, setSelectedProcedureIds] = useState<number[]>([]);
  const [procedureSearch, setProcedureSearch] = useState('');

  const { useProcedureMasters } = useProcedureMaster();
  const { data: proceduresData } = useProcedureMasters({ is_active: true, page_size: 100 });
  const allProcedures = proceduresData?.results || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProcedurePackageFormData>({
    resolver: zodResolver(procedurePackageSchema),
    defaultValues: pkg ? {
      name: pkg.name,
      code: pkg.code,
      total_charge: pkg.total_charge,
      discounted_charge: pkg.discounted_charge,
      is_active: pkg.is_active,
    } : {
      is_active: true,
    },
  });

  const totalCharge = watch('total_charge');
  const discountedCharge = watch('discounted_charge');

  // Calculate discount percentage
  const discountPercent = totalCharge && discountedCharge
    ? (((parseFloat(totalCharge) - parseFloat(discountedCharge)) / parseFloat(totalCharge)) * 100).toFixed(1)
    : '0';

  // Calculate savings
  const savings = totalCharge && discountedCharge
    ? (parseFloat(totalCharge) - parseFloat(discountedCharge)).toFixed(2)
    : '0';

  useEffect(() => {
    if (pkg) {
      reset({
        name: pkg.name,
        code: pkg.code,
        total_charge: pkg.total_charge,
        discounted_charge: pkg.discounted_charge,
        is_active: pkg.is_active,
      });
      setSelectedProcedureIds(pkg.procedures.map(p => p.id));
    }
  }, [pkg, reset]);

  // Auto-calculate total charge when procedures are selected
  useEffect(() => {
    if (selectedProcedureIds.length > 0 && isCreateMode) {
      const total = selectedProcedureIds.reduce((sum, id) => {
        const procedure = allProcedures.find(p => p.id === id);
        return sum + (procedure ? parseFloat(procedure.default_charge) : 0);
      }, 0);
      setValue('total_charge', total.toFixed(2));
    }
  }, [selectedProcedureIds, allProcedures, isCreateMode, setValue]);

  const handleAddProcedure = (procedureId: number) => {
    if (!selectedProcedureIds.includes(procedureId)) {
      setSelectedProcedureIds([...selectedProcedureIds, procedureId]);
    }
    setProcedureSearch('');
  };

  const handleRemoveProcedure = (procedureId: number) => {
    setSelectedProcedureIds(selectedProcedureIds.filter(id => id !== procedureId));
  };

  const filteredProcedures = allProcedures.filter(p =>
    !selectedProcedureIds.includes(p.id) &&
    (p.name.toLowerCase().includes(procedureSearch.toLowerCase()) ||
     p.code.toLowerCase().includes(procedureSearch.toLowerCase()))
  );

  // Display procedures based on mode and data availability
  const selectedProcedures = (() => {
    // In view mode, always show procedures from package data
    if (mode === 'view' && pkg?.procedures) {
      return pkg.procedures;
    }

    // In edit mode, try to match from allProcedures first, fallback to package data
    if (mode === 'edit' && pkg?.procedures) {
      const matchedFromFetched = allProcedures.filter(p => selectedProcedureIds.includes(p.id));
      // If we found all procedures in the fetched data, use that
      if (matchedFromFetched.length === selectedProcedureIds.length) {
        return matchedFromFetched;
      }
      // Otherwise use the package data
      return pkg.procedures;
    }

    // In create mode, filter from fetched procedures
    return allProcedures.filter(p => selectedProcedureIds.includes(p.id));
  })();

  const onFormSubmit = (data: ProcedurePackageFormData) => {
    if (selectedProcedureIds.length === 0) {
      toast.error('Please select at least one procedure');
      return;
    }

    const submitData: ProcedurePackageCreateData = {
      name: data.name,
      code: data.code,
      procedures: selectedProcedureIds,
      total_charge: data.total_charge,
      discounted_charge: data.discounted_charge,
      is_active: data.is_active,
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Package Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Package Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g., Basic Health Checkup"
          disabled={isReadOnly}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* Package Code */}
      <div className="space-y-2">
        <Label htmlFor="code">Package Code *</Label>
        <Input
          id="code"
          {...register('code')}
          placeholder="e.g., PKG001"
          disabled={isReadOnly}
        />
        {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
      </div>

      {/* Procedures Selection */}
      <div className="space-y-2">
        <Label>Procedures in Package *</Label>
        {!isReadOnly && (
          <div className="mb-2">
            <Input
              placeholder="Search procedures to add..."
              value={procedureSearch}
              onChange={(e) => setProcedureSearch(e.target.value)}
            />
            {filteredProcedures.length > 0 && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto bg-background">
                {filteredProcedures.slice(0, 20).map((procedure) => (
                  <div
                    key={procedure.id}
                    className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-b-0"
                    onClick={() => handleAddProcedure(procedure.id)}
                  >
                    <div>
                      <div className="font-medium text-sm">{procedure.name}</div>
                      <div className="text-xs text-muted-foreground">{procedure.code} - ₹{procedure.default_charge}</div>
                    </div>
                  </div>
                ))}
                {filteredProcedures.length > 20 && (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    {filteredProcedures.length - 20} more procedures available. Use search to filter.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected Procedures */}
        <div className="space-y-2">
          {selectedProcedures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No procedures selected</p>
          ) : (
            selectedProcedures.map((procedure) => (
              <div key={procedure.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex-1">
                  <div className="font-medium text-sm">{procedure.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {procedure.code} - ₹{procedure.default_charge}
                  </div>
                </div>
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProcedure(procedure.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_charge">Total Charge (₹) *</Label>
          <Input
            id="total_charge"
            {...register('total_charge')}
            placeholder="5000.00"
            disabled={isReadOnly}
          />
          {errors.total_charge && <p className="text-sm text-destructive">{errors.total_charge.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="discounted_charge">Package Price (₹) *</Label>
          <Input
            id="discounted_charge"
            {...register('discounted_charge')}
            placeholder="3999.00"
            disabled={isReadOnly}
          />
          {errors.discounted_charge && <p className="text-sm text-destructive">{errors.discounted_charge.message}</p>}
        </div>
      </div>

      {/* Discount Info */}
      {totalCharge && discountedCharge && (
        <div className="bg-muted p-4 rounded-md">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Discount:</span>
              <span className="ml-2 font-medium">{discountPercent}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Savings:</span>
              <span className="ml-2 font-medium text-green-600">₹{savings}</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          className="h-4 w-4"
          disabled={isReadOnly}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Active
        </Label>
      </div>

      {/* Form Actions */}
      {!isReadOnly && (
        <div className="flex gap-2 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving...' : isCreateMode ? 'Create Package' : 'Update Package'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
};
