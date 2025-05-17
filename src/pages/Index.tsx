
import { useAuth } from "@/components/auth/UserAuthContext";
import LoginForm from "@/components/auth/LoginForm";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./Dashboard";
import { Tabs } from "@/components/ui/tabs";

// Main app entry point
const Index = () => {
  const { isAuthenticated } = useAuth();
  
  // If user is authenticated, show the main application content
  if (isAuthenticated) {
    return (
      <AppLayout>
        {/* Wrap Dashboard in Tabs so TabsContent components have a Tabs parent */}
        <Tabs defaultValue="overview">
          <Dashboard />
        </Tabs>
      </AppLayout>
    );
  }
  
  // Otherwise show the login form
  return <LoginForm />;
};

export default Index;
