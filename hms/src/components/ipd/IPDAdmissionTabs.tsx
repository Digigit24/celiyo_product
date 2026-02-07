// src/components/ipd/IPDAdmissionTabs.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IPDConsultationTab } from '@/components/ipd/IPDConsultationTab';
import { IPDBillingContent } from '@/components/ipd/IPDBillingContent';
import BedTransfersTab from '@/components/ipd/BedTransfersTab';
import AdmissionInfo from '@/components/ipd/AdmissionInfo';

interface IPDAdmissionTabsProps {
  admission: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const IPDAdmissionTabs: React.FC<IPDAdmissionTabsProps> = ({
  admission,
  activeTab,
  onTabChange,
}) => {
  const handleTabChange = (value: string) => {
    onTabChange(value);
  };

  return (
    <Card className="flex-1 overflow-hidden flex flex-col border-x-0">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
        <div className="border-b bg-muted/30 pt-4">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            {['consultation', 'billing', 'transfers', 'info'].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm py-2"
              >
                {tab === 'transfers' ? 'Bed Transfers' : tab === 'info' ? 'Admission Info' : tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto bg-card">
          <TabsContent value="consultation" className="mt-0 h-full p-6">
            <IPDConsultationTab admission={admission} />
          </TabsContent>

          <TabsContent value="billing" className="mt-0 h-full p-6">
            <IPDBillingContent admission={admission} />
          </TabsContent>

          <TabsContent value="transfers" className="mt-0 h-full p-6">
            <BedTransfersTab admissionId={admission.id} />
          </TabsContent>

          <TabsContent value="info" className="mt-0 h-full p-6">
            <AdmissionInfo admission={admission} onUpdate={() => {}} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};
