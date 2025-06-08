
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import EmailConnector from "./pages/EmailConnector";
import Upload from "./pages/Upload";
import Database from "./pages/Database";
import Actions from "./pages/Actions";
import ClientRecommendations from "./pages/ClientRecommendations";
import FinancialAnalysis from "./pages/FinancialAnalysis";
import TaskAutomation from "./pages/TaskAutomation";
import ComplianceMonitoring from "./pages/ComplianceMonitoring";
import Settings from "./pages/Settings";
import Assistant from "./pages/Assistant";
import SapData from "./pages/SapData";
import NotFound from "./pages/NotFound";

export const navItems = [
  {
    to: "/",
    page: <Index />,
  },
  {
    to: "/dashboard",
    page: <Dashboard />,
  },
  {
    to: "/documents", 
    page: <Documents />,
  },
  {
    to: "/email-connector",
    page: <EmailConnector />,
  },
  {
    to: "/upload",
    page: <Upload />,
  },
  {
    to: "/database",
    page: <Database />,
  },
  {
    to: "/actions",
    page: <Actions />,
  },
  {
    to: "/client-recommendations",
    page: <ClientRecommendations />,
  },
  {
    to: "/financial-analysis", 
    page: <FinancialAnalysis />,
  },
  {
    to: "/task-automation",
    page: <TaskAutomation />,
  },
  {
    to: "/compliance-monitoring",
    page: <ComplianceMonitoring />,
  },
  {
    to: "/settings",
    page: <Settings />,
  },
  {
    to: "/assistant",
    page: <Assistant />,
  },
  {
    to: "/sap-data",
    page: <SapData />,
  },
  {
    to: "*",
    page: <NotFound />,
  },
];
