
// src/components/diagnostics/LabResultEntryForm.tsx
import React, { useState, useEffect } from 'react';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { Requisition, Investigation, InvestigationRange, CreateLabReportPayload } from '@/types/diagnostics.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LabResultEntryFormProps {
  requisition: Requisition;
  onFinished: () => void;
}

type ResultValue = {
  parameter_id: number;
  value: string;
  notes?: string;
};

type OrderResult = {
  order_id: number;
  results: ResultValue[];
};

export const LabResultEntryForm: React.FC<LabResultEntryFormProps> = ({ requisition, onFinished }) => {
  const { useInvestigation, createLabReport } = useDiagnostics();
  const [resultsData, setResultsData] = useState<OrderResult[]>([]);
  const [overallNotes, setOverallNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // This is a bit complex: we need to fetch details for EACH investigation in the requisition's investigation_orders
  // For simplicity, we'll do this one by one. In a real app, you might want a batch endpoint.
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const currentOrder = requisition.investigation_orders[currentOrderIndex];
  const { data: investigationDetails, isLoading } = useInvestigation(currentOrder?.investigation_id || null);

  useEffect(() => {
    // Pre-fill the resultsData state once investigation details are loaded
    if (investigationDetails && !resultsData.find(r => r.order_id === currentOrder.id)) {
      const initialResults: ResultValue[] = investigationDetails.ranges.map(range => ({
        parameter_id: range.id,
        value: '',
      }));
      setResultsData(prev => [...prev, { order_id: currentOrder.id, results: initialResults }]);
    }
  }, [investigationDetails, currentOrder, resultsData]);

  const handleValueChange = (orderId: number, parameterId: number, value: string) => {
    setResultsData(prev =>
      prev.map(orderResult =>
        orderResult.order_id === orderId
          ? {
              ...orderResult,
              results: orderResult.results.map(res =>
                res.parameter_id === parameterId ? { ...res, value } : res
              ),
            }
          : orderResult
      )
    );
  };
  
  const checkIsCritical = (value: string, range: InvestigationRange): boolean => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return false;
      return numValue < range.lower_bound || numValue > range.upper_bound;
  }

  const handleSubmit = async () => {
      setIsSaving(true);
      try {
          const payload: CreateLabReportPayload = {
              requisition_id: requisition.id,
              notes: overallNotes,
              order_reports: resultsData.map(orderResult => ({
                  order_id: orderResult.order_id,
                  result_data: orderResult.results.reduce((acc, res) => {
                      // Find the parameter name from the investigation details
                      const range = investigationDetails?.ranges.find(r => r.id === res.parameter_id);
                      if(range) {
                        acc[range.parameter_name] = res.value;
                      }
                      return acc;
                  }, {} as Record<string, string>)
              }))
          };
          
          await createLabReport(payload);
          toast.success("Lab report submitted successfully!");
          onFinished();

      } catch (error) {
          toast.error("Failed to submit lab report.");
          console.error(error);
      } finally {
          setIsSaving(false);
      }
  };
  
  const renderCurrentOrderForm = () => {
    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!investigationDetails) return <p>Could not load investigation details.</p>;
    
    const orderResult = resultsData.find(r => r.order_id === currentOrder.id);

    return (
        <div key={currentOrder.id}>
            <h3 className="text-lg font-semibold mb-4">{investigationDetails.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investigationDetails.ranges.map(range => {
                    const result = orderResult?.results.find(r => r.parameter_id === range.id);
                    const isCritical = checkIsCritical(result?.value || '', range);
                    
                    return (
                        <div key={range.id} className="space-y-2">
                            <Label htmlFor={`param-${range.id}`}>
                                {range.parameter_name} <span className="text-muted-foreground">({range.unit})</span>
                            </Label>
                            <Input
                                id={`param-${range.id}`}
                                value={result?.value || ''}
                                onChange={e => handleValueChange(currentOrder.id, range.id, e.target.value)}
                                className={isCritical ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            />
                            <p className={`text-sm ${isCritical ? 'text-red-500' : 'text-muted-foreground'}`}>
                                Range: {range.lower_bound} - {range.upper_bound}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
  }
  
  const hasNextOrder = currentOrderIndex < requisition.investigation_orders.length - 1;
  const hasPrevOrder = currentOrderIndex > 0;

  return (
    <div className="p-4 space-y-6">
        <div>
            <div className="flex justify-between items-center mb-4">
                <Button variant="outline" onClick={() => setCurrentOrderIndex(i => i-1)} disabled={!hasPrevOrder}>Previous</Button>
                <div className="text-center">
                    <p className="font-semibold">{currentOrder.investigation_name}</p>
                    <p className="text-sm text-muted-foreground">Test {currentOrderIndex + 1} of {requisition.investigation_orders.length}</p>
                </div>
                <Button variant="outline" onClick={() => setCurrentOrderIndex(i => i+1)} disabled={!hasNextOrder}>Next</Button>
            </div>
            <Card>
                <CardContent className="p-6">
                    {renderCurrentOrderForm()}
                </CardContent>
            </Card>
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="overall-notes">Overall Report Notes</Label>
            <Textarea
                id="overall-notes"
                value={overallNotes}
                onChange={e => setOverallNotes(e.target.value)}
                placeholder="Add any summary notes or pathologist comments..."
            />
        </div>

        <div className="flex justify-end gap-4">
            <Button variant="ghost" onClick={onFinished}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
            </Button>
        </div>
    </div>
  );
};
