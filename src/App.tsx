// src/App.tsx
import { useState, useEffect } from "react";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UniversalSidebar } from "@/components/UniversalSidebar";
import { UniversalHeader } from "@/components/UniversalHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { swrConfig } from "@/lib/swrConfig";
import { authService } from "@/services/authService";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import NotFound from "./pages/NotFound";
import { CRMLeads } from "./pages/CRMLeads";
import { CRMActivities } from "./pages/CRMActivities"; // ⬅️ ADDED
import { CRMLeadStatuses } from "./pages/CRMLeadStatuses";
import { CRMFieldConfigurations } from "./pages/CRMFieldConfigurations";
import { CRMTasks } from "./pages/CRMTasks";
import { Meetings } from "./pages/Meetings";
import { LeadDetailsPage } from "./pages/LeadDetailsPage";
import { Doctors } from "./pages/Doctors";
import DoctorTest from "./pages/doctor";
import { Specialties } from "./pages/Specialties";
import PatientsTest from "./pages/Patients";
import { PatientDetailsPage } from "./pages/PatientDetailsPage";
import AppointmentsTest from "./pages/Appointments";
import  Contacts from "./pages/Contacts";
import Chats from "./pages/Chats";
import Groups from "./pages/Groups";
import Templates from "./pages/Templates";
import Campaigns from "./pages/Campaigns";
import Flows from "./pages/Flows";
import FlowEditor from "./pages/FlowEditor";
import QRCodes from "./pages/QRCodes";
import WhatsAppOnboarding from "./pages/WhatsAppOnboarding";

import { ThemeSync } from "@/components/ThemeSync";
import OPDVisits from "./pages/OPDVisits";  // ✅ Updated to new production page
import { OPDConsultation } from "./pages/opd/Consultation"; // ✅ Updated import for Consultation (Modern UI)
import OPDVisitDetails from "./pages/opd-production/OPDVisitDetails"; // ✅ Unified page for consultation and billing
import ConsultationCanvas from "./pages/opd-production/ConsultationCanvas";
import OPDBills from "./pages/opd-production/OPDBills";
import ClinicalNotes from "./pages/opd-production/ClinicalNotes";
import VisitFindings from "./pages/opd-production/VisitFindings";
import ProcedureMasters from "./pages/opd-production/ProcedureMasters";
import ProcedurePackages from "./pages/opd-production/ProcedurePackages";
import ProcedureBills from "./pages/opd-production/ProcedureBills";
import { OPDSettings } from "./pages/OPDSettings";
import { Users } from "./pages/Users";
import { Roles } from "./pages/Roles";
import { Debug } from "./pages/Debug";
import { AdminSettings } from "./pages/AdminSettings";
import { Transactions } from "./pages/Transactions";
import { PaymentCategories } from "./pages/PaymentCategories";
import { AccountingPeriods } from "./pages/AccountingPeriods";
import { PharmacyPage } from "./pages/Pharmacy"; // Import PharmacyPage
import { PharmacyStatisticsPage } from "./pages/PharmacyStatistics"; // Import PharmacyStatisticsPage
import { CartListPage } from "./pages/CartList";   // Import CartListPage
import Wards from "./pages/ipd/Wards"; // Import IPD Wards
import Beds from "./pages/ipd/Beds"; // Import IPD Beds
import Admissions from "./pages/ipd/Admissions"; // Import IPD Admissions
import AdmissionDetails from "./pages/ipd/AdmissionDetails"; // Import IPD Admission Details
import IPDBillingPage from "./pages/ipd/Billing"; // IPD Billing
import Diagnostics from "./pages/Diagnostics"; // Import Diagnostics page

import { WebSocketProvider } from "./context/WebSocketProvider";

const queryClient = new QueryClient();

const AppLayout = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      <ThemeSync />
      <div className="flex h-screen overflow-hidden bg-background">
        <UniversalSidebar
          mobileOpen={sidebarOpen}
          setMobileOpen={setSidebarOpen}
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <UniversalHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inbox" element={<Inbox />} />

              {/* CRM Routes */}
              <Route path="/crm/leads" element={<CRMLeads />} />
              <Route path="/crm/leads/:leadId" element={<LeadDetailsPage />} />
              <Route path="/crm/activities" element={<CRMActivities />} />
              <Route path="/crm/statuses" element={<CRMLeadStatuses />} />
              <Route path="/crm/settings" element={<CRMFieldConfigurations />} />
              <Route path="/crm/tasks" element={<CRMTasks />} />
              <Route path="/crm/meetings" element={<Meetings />} />
              <Route path="/crm/pipeline" element={<Navigate to="/crm/leads" replace />} />

              {/* HMS Routes */}
              <Route path="/hms/doctors" element={<Doctors />} />
              <Route path="/hms/doctor-test" element={<DoctorTest />} />
              <Route path="/hms/specialties" element={<Specialties />} />
              <Route path="/patients" element={<PatientsTest />} />
              <Route path="/patients/:patientId" element={<PatientDetailsPage />} />
              <Route path="/appointments" element={<AppointmentsTest />} />

              {/* OPD Routes */}
              <Route path="/opd/visits" element={<OPDVisits />} />
              <Route path="/opd/billing/:visitId" element={<OPDVisitDetails />} />
              <Route path="/opd/consultation/:visitId" element={<OPDConsultation />} />
              <Route path="/opd/consultation/:visitId/canvas/:responseId" element={<ConsultationCanvas />} />
              <Route path="/opd/bills" element={<OPDBills />} />
              <Route path="/opd/clinical-notes" element={<ClinicalNotes />} />
              <Route path="/opd/findings" element={<VisitFindings />} />
              <Route path="/opd/procedures" element={<ProcedureMasters />} />
              <Route path="/opd/packages" element={<ProcedurePackages />} />
              <Route path="/opd/procedure-bills" element={<ProcedureBills />} />
              <Route path="/opd/settings" element={<Navigate to="/opd/settings/templates" replace />} />
              <Route path="/opd/settings/:tab" element={<OPDSettings />} />

              {/* IPD Routes */}
              <Route path="/ipd/wards" element={<Wards />} />
              <Route path="/ipd/beds" element={<Beds />} />
              <Route path="/ipd/admissions" element={<Admissions />} />
              <Route path="/ipd/admissions/:id" element={<AdmissionDetails />} />
              <Route path="/ipd/billing" element={<IPDBillingPage />} />

              {/* Diagnostics Routes */}
              <Route path="/diagnostics" element={<Diagnostics />} />

              {/* Payment Routes */}
              <Route path="/payments/transactions" element={<Transactions />} />
              <Route path="/payments/categories" element={<PaymentCategories />} />
              <Route path="/payments/periods" element={<AccountingPeriods />} />

              {/* Pharmacy Routes */}
              <Route path="/pharmacy" element={<PharmacyPage />} />
              <Route path="/pharmacy/statistics" element={<PharmacyStatisticsPage />} />
              <Route path="/cart" element={<CartListPage />} />

              {/* WhatsApp Routes */}
              <Route path="/whatsapp/onboarding" element={<WhatsAppOnboarding />} />
              <Route path="/whatsapp/contacts" element={<Contacts />} />
              <Route path="/whatsapp/chats" element={<Chats />} />
              <Route path="/whatsapp/groups" element={<Groups />} />
              <Route path="/whatsapp/templates" element={<Templates />} />
              <Route path="/whatsapp/campaigns" element={<Campaigns />} />
              <Route path="/whatsapp/flows" element={<Flows />} />
              <Route path="/whatsapp/flows/:flow_id" element={<FlowEditor />} />
              <Route path="/whatsapp/qrcode" element={<QRCodes />} />

              {/* Admin Routes */}
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/roles" element={<Roles />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/debug" element={<Debug />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
};

const App = () => {
  const isAuthenticated = authService.isAuthenticated();

  // Apply stored user preferences on app load
  useEffect(() => {
    if (isAuthenticated) {
      authService.applyStoredPreferences();
    }
  }, [isAuthenticated]);

  return (
    <SWRConfig value={swrConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <WebSocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    isAuthenticated ? <Navigate to="/" replace /> : <Login />
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </WebSocketProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SWRConfig>
  );
};

export default App;
