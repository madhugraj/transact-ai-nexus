import { useAuth } from "@/components/auth/UserAuthContext";
import LoginForm from "@/components/auth/LoginForm";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./Dashboard";

// Main app entry point
const Index = () => {
  const { isAuthenticated } = useAuth();
  
  // If user is authenticated, show the main application content
  if (isAuthenticated) {
    return (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    );
  }
  
  // Otherwise show the login form
  return <LoginForm />;
};

export default Index;
