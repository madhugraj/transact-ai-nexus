
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
import SapData from './pages/SapData';

import { Toaster } from './components/ui/toaster';

function App() {
  console.info("App rendering. Navigate to /documents to access Gemini Vision Test");
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/database" element={<Database />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/email-connector" element={<EmailConnector />} />
        <Route path="/sap-data" element={<SapData />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
    </Router>
  );
}

export default App;
