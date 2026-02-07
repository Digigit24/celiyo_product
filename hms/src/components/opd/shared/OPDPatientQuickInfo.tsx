// src/components/opd/shared/OPDPatientQuickInfo.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplet, Activity } from 'lucide-react';

interface OPDPatientQuickInfoProps {
  visit: any;
  patient: any;
}

export const OPDPatientQuickInfo: React.FC<OPDPatientQuickInfoProps> = ({ visit, patient }) => {
  const calculateBMI = () => 'N/A';

  return (
    <Card className="bg-card/50">
      <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Blood Group</span>
          <span className="font-medium flex items-center gap-2">
            <Droplet className="h-3 w-3 text-red-500" /> {patient?.blood_group || 'N/A'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Vitals (BMI)</span>
          <span className="font-medium flex items-center gap-2">
            <Activity className="h-3 w-3 text-blue-500" /> {calculateBMI()}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Visit Type</span>
          <Badge variant="outline" className="w-fit text-[10px] font-normal">
            {visit.visit_type?.toUpperCase()}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Priority</span>
          <span className={`font-medium ${visit.priority === 'high' || visit.priority === 'urgent' ? 'text-red-600' : ''}`}>
            {visit.priority?.toUpperCase()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
