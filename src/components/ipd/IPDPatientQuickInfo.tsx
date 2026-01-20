// src/components/ipd/IPDPatientQuickInfo.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bed, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface IPDPatientQuickInfoProps {
  admission: any;
}

export const IPDPatientQuickInfo: React.FC<IPDPatientQuickInfoProps> = ({ admission }) => {
  return (
    <Card className="bg-card/50">
      <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Ward / Bed</span>
          <span className="font-medium flex items-center gap-2">
            <Bed className="h-3 w-3 text-blue-500" /> {admission.ward_name} / {admission.bed_number || 'N/A'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Admission Date</span>
          <span className="font-medium flex items-center gap-2">
            <Calendar className="h-3 w-3 text-green-500" />
            {admission.admission_date ? format(new Date(admission.admission_date), 'dd MMM yyyy') : 'N/A'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Length of Stay</span>
          <span className="font-medium flex items-center gap-2">
            <Clock className="h-3 w-3 text-purple-500" />
            {admission.length_of_stay} {admission.length_of_stay === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Status</span>
          <Badge variant="outline" className="w-fit text-[10px] font-normal">
            {admission.status?.toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
