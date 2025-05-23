
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Documents from './pages/Documents';
import Database from './pages/Database';
import Actions from './pages/Actions';
import Assistant from './pages/Assistant';
import Settings from './pages/Settings';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import EmailConnector from './pages/EmailConnector';
import ClientRecommendations from './pages/ClientRecommendations';
import FinancialAnalysis from './pages/FinancialAnalysis';
import TaskAutomation from './pages/TaskAutomation';
import ComplianceMonitoring from './pages/ComplianceMonitoring';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { Toaster } from './components/ui/toaster';

function App() {
  console.info("App rendering. Navigate to /documents to access Gemini Vision Test");
  
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/database" element={<Database />} />
          <Route path="/actions" element={<Actions />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/client-recommendations" element={<ClientRecommendations />} />
          <Route path="/financial-analysis" element={<FinancialAnalysis />} />
          <Route path="/task-automation" element={<TaskAutomation />} />
          <Route path="/compliance-monitoring" element={<ComplianceMonitoring />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/email-connector" element={<EmailConnector />} />
          <Route path="/index" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
