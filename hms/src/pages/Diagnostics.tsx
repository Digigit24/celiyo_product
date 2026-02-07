// src/pages/Diagnostics.tsx
import { RequisitionQueue } from "@/components/diagnostics/RequisitionQueue";
import { LabReports } from "@/components/diagnostics/LabReports";
import { InvestigationsManager } from "@/components/diagnostics/InvestigationsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DiagnosticsPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Diagnostics Hub</h1>
        <p className="text-muted-foreground">Manage requisitions, investigations, and reports.</p>

        <Tabs defaultValue="requisitions" className="mt-6">
            <TabsList>
                <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
                <TabsTrigger value="investigations">Investigations</TabsTrigger>
                <TabsTrigger value="lab-results">Lab Results</TabsTrigger>
            </TabsList>
            <TabsContent value="requisitions">
                <RequisitionQueue />
            </TabsContent>
            <TabsContent value="investigations">
                <InvestigationsManager />
            </TabsContent>
            <TabsContent value="lab-results">
                <LabReports />
            </TabsContent>
        </Tabs>
    </div>
  );
}

export default DiagnosticsPage;
