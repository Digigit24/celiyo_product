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
import { Doctors } from "./pages/Doctors";
import DoctorTest from "./pages/doctor";
import { Specialties } from "./pages/Specialties";
import PatientsTest from "./pages/Patients";
import AppointmentsTest from "./pages/Appointments";
import  Contacts from "./pages/Contacts";
import Chats from "./pages/Chats";
import Groups from "./pages/Groups";
import Templates from "./pages/Templates";
import Campaigns from "./pages/Campaigns";
import { useWhatsappSocket } from "@/hooks/whatsapp/useWhatsappSocket";
import { ThemeSync } from "@/components/ThemeSync";
import OPDVisits from "./pages/OPDVisits";  // ✅ Updated to new production page
import OPDBilling from "./pages/opd/Billing";
import OPDConsultation from "./pages/opd/Consultation";
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

const queryClient = new QueryClient();

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  // Ensure WhatsApp socket stays connected app-wide (persists across route changes)
  useWhatsappSocket();

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sync user theme preferences with next-themes */}
      <ThemeSync />

      {/* Universal Sidebar */}
      {!isMobile && (
        <UniversalSidebar
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      )}
      {isMobile && (
        <UniversalSidebar
          collapsed={false}
          onCollapse={() => {}}
          mobileOpen={sidebarMobileOpen}
          setMobileOpen={setSidebarMobileOpen}
        />
      )}

      {/* Main Content Area with Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Universal Header */}
        <UniversalHeader />
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/opd" element={<Navigate to="/opd/visits" replace />} />  {/* Redirect to visits page */}

            {/* CRM Routes */}
            <Route path="/crm" element={<CRMLeads />} />
            <Route path="/crm/leads" element={<CRMLeads />} />
            <Route path="/crm/activities" element={<CRMActivities />} /> {/* ⬅️ ADDED */}
            <Route path="/crm/statuses" element={<CRMLeadStatuses />} />
            <Route path="/crm/settings" element={<CRMFieldConfigurations />} />
            <Route path="/crm/tasks" element={<CRMTasks />} />
            <Route path="/crm/meetings" element={<Meetings />} />

            {/* HMS Routes */}
            <Route path="/hms/doctors" element={<Doctors />} />
            <Route path="/hms/specialties" element={<Specialties />} />
            <Route path="/doctor" element={<DoctorTest />} />
            <Route path="/specialties" element={<Specialties />} />
            <Route path="/patients" element={<PatientsTest />} />
            <Route path="/appointments" element={<AppointmentsTest />} />

            {/* OPD Routes */}
            <Route path="/opd/visits" element={<OPDVisits />} />
            <Route path="/opd/billing/:visitId" element={<OPDBilling />} />
            <Route path="/opd/consultation/:visitId" element={<OPDConsultation />} />
            <Route path="/opd/bills" element={<OPDBills />} />
            <Route path="/opd/clinical-notes" element={<ClinicalNotes />} />
            <Route path="/opd/findings" element={<VisitFindings />} />
            <Route path="/opd/procedures" element={<ProcedureMasters />} />
            <Route path="/opd/packages" element={<ProcedurePackages />} />
            <Route path="/opd/procedure-bills" element={<ProcedureBills />} />
            <Route path="/opd/settings" element={<Navigate to="/opd/settings/general" replace />} />
            <Route path="/opd/settings/:tab" element={<OPDSettings />} />

            {/* Payments Routes */}
            <Route path="/payments/transactions" element={<Transactions />} />
            <Route path="/payments/categories" element={<PaymentCategories />} />
            <Route path="/payments/periods" element={<AccountingPeriods />} />

            {/* WhatsApp Routes */}
            <Route path="/whatsapp/contacts" element={<Contacts />} />
            <Route path="/whatsapp/chats" element={<Chats />} />
            <Route path="/whatsapp/groups" element={<Groups />} />
            <Route path="/whatsapp/templates" element={<Templates />} />
            <Route path="/whatsapp/campaigns" element={<Campaigns />} />

            {/* Admin/User Management Routes */}
            <Route path="/admin/users" element={<Users />} />
            <Route path="/users" element={<Users />} />
            <Route path="/admin/roles" element={<Roles />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/debug" element={<Debug />} />
            <Route path="/debug" element={<Debug />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
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
        </TooltipProvider>
      </QueryClientProvider>
    </SWRConfig>
  );
};

export default App;