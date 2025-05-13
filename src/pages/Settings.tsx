
import AppLayout from "@/components/layout/AppLayout";
import SettingsPanel from "@/components/settings/SettingsPanel";
import { useAuth } from "@/components/auth/UserAuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isReadOnly = user?.role === 'auditor';
  
  return (
    <AppLayout>
      {isReadOnly && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to settings. Contact an administrator for changes.
          </AlertDescription>
        </Alert>
      )}
      <SettingsPanel isAdmin={isAdmin} isReadOnly={isReadOnly} />
    </AppLayout>
  );
};

export default Settings;
