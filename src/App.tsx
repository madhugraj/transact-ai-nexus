
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { UserAuthProvider } from "@/components/auth/UserAuthContext";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Actions from "./pages/Actions";
import Database from "./pages/Database";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Assistant from "./pages/Assistant";
import SapData from "./pages/SapData";
import NotFound from "./pages/NotFound";
import TaskAutomation from "./pages/TaskAutomation";
import FinancialAnalysis from "./pages/FinancialAnalysis";
import ClientRecommendations from "./pages/ClientRecommendations";
import ComplianceMonitoring from "./pages/ComplianceMonitoring";
import EmailConnectorPage from "./pages/EmailConnector";
import OAuthCallbackPage from "./pages/OAuthCallback";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <UserAuthProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/actions" element={<Actions />} />
                <Route path="/database" element={<Database />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/sap-data" element={<SapData />} />
                <Route path="/task-automation" element={<TaskAutomation />} />
                <Route path="/financial-analysis" element={<FinancialAnalysis />} />
                <Route path="/client-recommendations" element={<ClientRecommendations />} />
                <Route path="/compliance-monitoring" element={<ComplianceMonitoring />} />
                <Route path="/email-connector" element={<EmailConnectorPage />} />
                <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </UserAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
