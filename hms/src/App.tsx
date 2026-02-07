// src/App.tsx - HMS Application
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
import NotFound from "./pages/NotFound";
import { Doctors } from "./pages/Doctors";
import DoctorTest from "./pages/doctor";
import { Specialties } from "./pages/Specialties";
import PatientsTest from "./pages/Patients";
import { PatientDetailsPage } from "./pages/PatientDetailsPage";
import AppointmentsTest from "./pages/Appointments";

import { ThemeSync } from "@/components/ThemeSync";
import OPDVisits from "./pages/OPDVisits";
import { OPDConsultation } from "./pages/opd/Consultation";
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
import { PharmacyStatisticsPage } from "./pages/PharmacyStatistics";
import { CartListPage } from "./pages/CartList";
import ProductsPage from "./pages/pharmacy/ProductsPage";
import POSPage from "./pages/pharmacy/POSPage";
import Wards from "./pages/ipd/Wards";
import Beds from "./pages/ipd/Beds";
import Admissions from "./pages/ipd/Admissions";
import AdmissionDetails from "./pages/ipd/AdmissionDetails";
import { IPDBillingListPage } from "./pages/ipd-billing/IPDBillingListPage";
import { IPDBillingDetailsPage } from "./pages/ipd-billing/IPDBillingDetailsPage";
import Diagnostics from "./pages/Diagnostics";
import { Requisitions } from "./pages/diagnostics/Requisitions";
import { Investigations } from "./pages/diagnostics/Investigations";
import { LabReports } from "./pages/diagnostics/LabReports";

import { WebSocketProvider } from "./context/WebSocketProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 30000,
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

              {/* Admin Routes */}
              <Route path="/admin/users" element={<ModuleProtectedRoute requiredModule="admin"><Users /></ModuleProtectedRoute>} />
              <Route path="/admin/roles" element={<ModuleProtectedRoute requiredModule="admin"><Roles /></ModuleProtectedRoute>} />
              <Route path="/admin/settings" element={<ModuleProtectedRoute requiredModule="admin"><AdminSettings /></ModuleProtectedRoute>} />
              <Route path="/admin/debug" element={<ModuleProtectedRoute requiredModule="admin"><Debug /></ModuleProtectedRoute>} />

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
                <Route
                  path="/login"
                  element={
                    isAuthenticated ? <Navigate to="/" replace /> : <Login />
                  }
                />
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
