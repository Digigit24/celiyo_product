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
import { ModuleProtectedRoute } from "@/components/ModuleProtectedRoute";
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
import { PharmacyStatisticsPage } from "./pages/PharmacyStatistics"; // Import PharmacyStatisticsPage
import { CartListPage } from "./pages/CartList";   // Import CartListPage
import ProductsPage from "./pages/pharmacy/ProductsPage"; // Import Pharmacy Products
import POSPage from "./pages/pharmacy/POSPage"; // Import Pharmacy POS
import Wards from "./pages/ipd/Wards"; // Import IPD Wards
import Beds from "./pages/ipd/Beds"; // Import IPD Beds
import Admissions from "./pages/ipd/Admissions"; // Import IPD Admissions
import AdmissionDetails from "./pages/ipd/AdmissionDetails"; // Import IPD Admission Details
import { IPDBillingListPage } from "./pages/ipd-billing/IPDBillingListPage"; // IPD Billing List
import { IPDBillingDetailsPage } from "./pages/ipd-billing/IPDBillingDetailsPage"; // IPD Billing Details
import Diagnostics from "./pages/Diagnostics"; // Import Diagnostics page
import { Requisitions } from "./pages/diagnostics/Requisitions"; // Import Requisitions page
import { Investigations } from "./pages/diagnostics/Investigations"; // Import Investigations page
import { LabReports } from "./pages/diagnostics/LabReports"; // Import Lab Reports page
import Integrations from "./pages/Integrations"; // Import Integrations page
import WorkflowEditor from "./pages/WorkflowEditor"; // Import Workflow Editor page
import { WorkflowLogs } from "./pages/WorkflowLogs"; // Import Workflow Logs page

import { WebSocketProvider } from "./context/WebSocketProvider";
import { OAuthCallback } from "./pages/OAuthCallback";

// Configure QueryClient with optimized settings for WebSocket-based updates
// Disable automatic refetching since we use Pusher for real-time updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Don't refetch when user switches tabs
      refetchOnReconnect: false,    // Don't refetch on network reconnect (Pusher handles this)
      retry: 1,                     // Only retry once on failure
      staleTime: 30000,             // Consider data fresh for 30 seconds
    },
  },
});

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
              <Route path="/crm/leads" element={<ModuleProtectedRoute requiredModule="crm"><CRMLeads /></ModuleProtectedRoute>} />
              <Route path="/crm/leads/:leadId" element={<ModuleProtectedRoute requiredModule="crm"><LeadDetailsPage /></ModuleProtectedRoute>} />
              <Route path="/crm/activities" element={<ModuleProtectedRoute requiredModule="crm"><CRMActivities /></ModuleProtectedRoute>} />
              <Route path="/crm/statuses" element={<ModuleProtectedRoute requiredModule="crm"><CRMLeadStatuses /></ModuleProtectedRoute>} />
              <Route path="/crm/settings" element={<ModuleProtectedRoute requiredModule="crm"><CRMFieldConfigurations /></ModuleProtectedRoute>} />
              <Route path="/crm/tasks" element={<ModuleProtectedRoute requiredModule="crm"><CRMTasks /></ModuleProtectedRoute>} />
              <Route path="/crm/meetings" element={<ModuleProtectedRoute requiredModule="crm"><Meetings /></ModuleProtectedRoute>} />
              <Route path="/crm/pipeline" element={<ModuleProtectedRoute requiredModule="crm"><Navigate to="/crm/leads" replace /></ModuleProtectedRoute>} />

              {/* HMS Routes */}
              <Route path="/hms/doctors" element={<ModuleProtectedRoute requiredModule="hms"><Doctors /></ModuleProtectedRoute>} />
              <Route path="/hms/doctor-test" element={<ModuleProtectedRoute requiredModule="hms"><DoctorTest /></ModuleProtectedRoute>} />
              <Route path="/hms/specialties" element={<ModuleProtectedRoute requiredModule="hms"><Specialties /></ModuleProtectedRoute>} />
              <Route path="/patients" element={<ModuleProtectedRoute requiredModule="hms"><PatientsTest /></ModuleProtectedRoute>} />
              <Route path="/patients/:patientId" element={<ModuleProtectedRoute requiredModule="hms"><PatientDetailsPage /></ModuleProtectedRoute>} />
              <Route path="/appointments" element={<ModuleProtectedRoute requiredModule="hms"><AppointmentsTest /></ModuleProtectedRoute>} />

              {/* OPD Routes */}
              <Route path="/opd/visits" element={<ModuleProtectedRoute requiredModule="opd"><OPDVisits /></ModuleProtectedRoute>} />
              <Route path="/opd/consultation/:visitId" element={<ModuleProtectedRoute requiredModule="opd"><OPDConsultation /></ModuleProtectedRoute>} />
              <Route path="/opd/consultation/:visitId/canvas/:responseId" element={<ModuleProtectedRoute requiredModule="opd"><ConsultationCanvas /></ModuleProtectedRoute>} />
              <Route path="/opd/bills" element={<ModuleProtectedRoute requiredModule="opd"><OPDBills /></ModuleProtectedRoute>} />
              <Route path="/opd/clinical-notes" element={<ModuleProtectedRoute requiredModule="opd"><ClinicalNotes /></ModuleProtectedRoute>} />
              <Route path="/opd/findings" element={<ModuleProtectedRoute requiredModule="opd"><VisitFindings /></ModuleProtectedRoute>} />
              <Route path="/opd/procedures" element={<ModuleProtectedRoute requiredModule="opd"><ProcedureMasters /></ModuleProtectedRoute>} />
              <Route path="/opd/packages" element={<ModuleProtectedRoute requiredModule="opd"><ProcedurePackages /></ModuleProtectedRoute>} />
              <Route path="/opd/procedure-bills" element={<ModuleProtectedRoute requiredModule="opd"><ProcedureBills /></ModuleProtectedRoute>} />
              <Route path="/opd/settings" element={<ModuleProtectedRoute requiredModule="opd"><Navigate to="/opd/settings/templates" replace /></ModuleProtectedRoute>} />
              <Route path="/opd/settings/:tab" element={<ModuleProtectedRoute requiredModule="opd"><OPDSettings /></ModuleProtectedRoute>} />

              {/* IPD Routes */}
              <Route path="/ipd/wards" element={<ModuleProtectedRoute requiredModule="ipd"><Wards /></ModuleProtectedRoute>} />
              <Route path="/ipd/beds" element={<ModuleProtectedRoute requiredModule="ipd"><Beds /></ModuleProtectedRoute>} />
              <Route path="/ipd/admissions" element={<ModuleProtectedRoute requiredModule="ipd"><Admissions /></ModuleProtectedRoute>} />
              <Route path="/ipd/admissions/:id" element={<ModuleProtectedRoute requiredModule="ipd"><AdmissionDetails /></ModuleProtectedRoute>} />
              <Route path="/ipd/billing" element={<ModuleProtectedRoute requiredModule="ipd"><IPDBillingListPage /></ModuleProtectedRoute>} />
              <Route path="/ipd/billing/:billId" element={<ModuleProtectedRoute requiredModule="ipd"><IPDBillingDetailsPage /></ModuleProtectedRoute>} />

              {/* Diagnostics Routes */}
              <Route path="/diagnostics" element={<ModuleProtectedRoute requiredModule="diagnostics"><Diagnostics /></ModuleProtectedRoute>} />
              <Route path="/diagnostics/requisitions" element={<ModuleProtectedRoute requiredModule="diagnostics"><Requisitions /></ModuleProtectedRoute>} />
              <Route path="/diagnostics/investigations" element={<ModuleProtectedRoute requiredModule="diagnostics"><Investigations /></ModuleProtectedRoute>} />
              <Route path="/diagnostics/lab-reports" element={<ModuleProtectedRoute requiredModule="diagnostics"><LabReports /></ModuleProtectedRoute>} />

              {/* Payment Routes */}
              <Route path="/payments/transactions" element={<ModuleProtectedRoute requiredModule="payments"><Transactions /></ModuleProtectedRoute>} />
              <Route path="/payments/categories" element={<ModuleProtectedRoute requiredModule="payments"><PaymentCategories /></ModuleProtectedRoute>} />
              <Route path="/payments/periods" element={<ModuleProtectedRoute requiredModule="payments"><AccountingPeriods /></ModuleProtectedRoute>} />

              {/* Pharmacy Routes */}
              <Route path="/pharmacy/products" element={<ModuleProtectedRoute requiredModule="pharmacy"><ProductsPage /></ModuleProtectedRoute>} />
              <Route path="/pharmacy/pos" element={<ModuleProtectedRoute requiredModule="pharmacy"><POSPage /></ModuleProtectedRoute>} />
              <Route path="/pharmacy/statistics" element={<ModuleProtectedRoute requiredModule="pharmacy"><PharmacyStatisticsPage /></ModuleProtectedRoute>} />
              <Route path="/cart" element={<ModuleProtectedRoute requiredModule="pharmacy"><CartListPage /></ModuleProtectedRoute>} />

              {/* WhatsApp Routes */}
              <Route path="/whatsapp/onboarding" element={<ModuleProtectedRoute requiredModule="whatsapp"><WhatsAppOnboarding /></ModuleProtectedRoute>} />
              <Route path="/whatsapp/contacts" element={<ModuleProtectedRoute requiredModule="whatsapp"><Contacts /></ModuleProtectedRoute>} />
              <Route path="/whatsapp/chats" element={<ModuleProtectedRoute requiredModule="whatsapp"><Chats /></ModuleProtectedRoute>} />
              <Route path="/whatsapp/groups" element={<ModuleProtectedRoute requiredModule="whatsapp"><Groups /></ModuleProtectedRoute>} />
              <Route path="/whatsapp/templates" element={<ModuleProtectedRoute requiredModule="whatsapp"><Templates /></ModuleProtectedRoute>} />
              <Route path="/whatsapp/campaigns" element={<ModuleProtectedRoute requiredModule="whatsapp"><Campaigns /></ModuleProtectedRoute>} />
              <Route path="/whatsapp/flows" element={<ModuleProtectedRoute requiredModule="whatsapp"><Flows /></ModuleProtectedRoute>} />
              <Route path="/whatsapp/flows/:flow_id" element={<ModuleProtectedRoute requiredModule="whatsapp"><FlowEditor /></ModuleProtectedRoute>} />
              <Route path="/whatsapp/qrcode" element={<ModuleProtectedRoute requiredModule="whatsapp"><QRCodes /></ModuleProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/users" element={<ModuleProtectedRoute requiredModule="admin"><Users /></ModuleProtectedRoute>} />
              <Route path="/admin/roles" element={<ModuleProtectedRoute requiredModule="admin"><Roles /></ModuleProtectedRoute>} />
              <Route path="/admin/settings" element={<ModuleProtectedRoute requiredModule="admin"><AdminSettings /></ModuleProtectedRoute>} />
              <Route path="/admin/debug" element={<ModuleProtectedRoute requiredModule="admin"><Debug /></ModuleProtectedRoute>} />

              {/* Integration Routes */}
              <Route path="/integrations" element={<ModuleProtectedRoute requiredModule="integrations"><Integrations /></ModuleProtectedRoute>} />
              <Route path="/integrations/workflows/new" element={<ModuleProtectedRoute requiredModule="integrations"><WorkflowEditor /></ModuleProtectedRoute>} />
              <Route path="/integrations/workflows/:workflowId" element={<ModuleProtectedRoute requiredModule="integrations"><WorkflowEditor /></ModuleProtectedRoute>} />
              <Route path="/integrations/workflows/:workflowId/logs" element={<ModuleProtectedRoute requiredModule="integrations"><WorkflowLogs /></ModuleProtectedRoute>} />
              <Route path="/integrations/oauth/callback" element={<ModuleProtectedRoute requiredModule="integrations"><OAuthCallback /></ModuleProtectedRoute>} />

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
          {/* WebSocketProvider kept for backward compatibility, but connection disabled */}
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
