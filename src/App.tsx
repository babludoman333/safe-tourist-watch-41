import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHome from '@/components/dashboard/DashboardHome';
import TouristMonitoring from '@/components/dashboard/TouristMonitoring';
import TouristRecords from '@/components/dashboard/TouristRecords';
import SosIncidentsPage from '@/components/dashboard/SosIncidentsPage';
import EfirManagement from '@/components/dashboard/EfirManagement';
import HazardManagement from '@/components/dashboard/HazardManagement';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="monitoring" element={<TouristMonitoring />} />
            <Route path="tourists" element={<TouristRecords />} />
            <Route path="sos" element={<SosIncidentsPage />} />
            <Route path="efir" element={<EfirManagement />} />
            <Route path="hazards" element={<HazardManagement />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
