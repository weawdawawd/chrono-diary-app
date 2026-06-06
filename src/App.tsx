import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";
import DownloadPage from "./pages/DownloadPage";
import GuideLogbook from "./pages/GuideLogbook";

import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import EmployeesPage from "./pages/admin/EmployeesPage";
import InvitationsPage from "./pages/admin/InvitationsPage";
import ShiftsPage from "./pages/admin/ShiftsPage";
import CatalogPage from "./pages/admin/CatalogPage";
import LogbookPage from "./pages/admin/LogbookPage";
import SessionsPage from "./pages/admin/SessionsPage";
import PatrolPage from "./pages/admin/PatrolPage";
import ChatPage from "./pages/ChatPage";

import { LanguageProvider } from "@/lib/i18n";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/blog/digitales-wachbuch" element={<GuideLogbook />} />



            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="invitations" element={<InvitationsPage />} />
              <Route path="shifts" element={<ShiftsPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="logbook" element={<LogbookPage />} />
              <Route path="sessions" element={<SessionsPage />} />
              <Route path="patrol" element={<PatrolPage />} />



            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
