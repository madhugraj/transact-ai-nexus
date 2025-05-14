
import { ReactNode } from "react";
import { Organization } from "@/utils/organizations";
import { hasFeatureAccess } from "@/utils/planFeatures";
import { Button } from "@/components/ui/button";
import { LockIcon } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface FeatureGateProps {
  organization: Organization | null;
  feature: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function FeatureGate({ 
  organization, 
  feature, 
  fallback, 
  children 
}: FeatureGateProps) {
  if (!organization) return null;
  
  const hasAccess = hasFeatureAccess(organization.plan, feature as any);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // If no fallback is provided, render a default "upgrade required" message
  if (!fallback) {
    return (
      <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md bg-muted/50 min-h-[120px]">
        <LockIcon className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-center">
          This feature requires a {getMinimumRequiredPlan(feature)} plan or higher.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mt-3">
              Upgrade Plan
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    );
  }
  
  return <>{fallback}</>;
}

// Helper function to determine the minimum required plan for a feature
function getMinimumRequiredPlan(feature: string): string {
  if (feature === "aiAssistant" || feature === "advancedAnalytics") {
    return "Professional";
  }
  if (feature === "prioritySupport" || feature === "customIntegrations") {
    return "Enterprise";
  }
  return "Starter";
}
