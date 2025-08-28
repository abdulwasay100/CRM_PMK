import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import AddLead from "./pages/AddLead";
import Groups from "./pages/Groups";
import Tasks from "./pages/Tasks";
import Campaigns from "./pages/Campaigns";
import Discounts from "./pages/Discounts";
import WhatsApp from "./pages/WhatsApp";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import RetargetStudents from './pages/RetargetStudents';
import DetectFakeLeads from './pages/DetectFakeLeads';
import "react-toastify/dist/ReactToastify.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/add" element={<AddLead />} />
            <Route path="groups" element={<Groups />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="whatsapp" element={<WhatsApp />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="retarget-students" element={<RetargetStudents />} />
            <Route path="detect-fake-leads" element={<DetectFakeLeads />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
