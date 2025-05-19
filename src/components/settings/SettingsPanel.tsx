
import { Separator } from "@/components/ui/separator";
import SettingsTabs from "./SettingsTabs";

interface SettingsPanelProps {
  isAdmin?: boolean;
  isReadOnly?: boolean;
}

const SettingsPanel = ({ isAdmin = false, isReadOnly = false }: SettingsPanelProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />
      
      <SettingsTabs isAdmin={isAdmin} isReadOnly={isReadOnly} />
    </div>
  );
};

export default SettingsPanel;
