
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { planFeatures, type PlanFeatures } from "@/utils/planFeatures";

interface PlanCardProps {
  planName: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function PlanCard({ planName, isSelected, onSelect }: PlanCardProps) {
  const features = planFeatures[planName];
  if (!features) return null;

  return (
    <div 
      className={cn(
        "flex flex-col p-6 bg-white rounded-lg border transition-all",
        isSelected
          ? "border-primary shadow-md ring-2 ring-primary ring-opacity-50"
          : "border-border hover:border-primary/50"
      )}
    >
      <h3 className="text-lg font-semibold">{planName}</h3>
      
      <div className="mt-2 mb-4">
        <span className="text-3xl font-bold">${features.price}</span>
        <span className="text-muted-foreground">/month</span>
      </div>
      
      <ul className="flex-1 space-y-2 text-sm my-6">
        <PlanFeatureItem 
          available={true} 
          text={`Up to ${features.maxUsers} users`} 
        />
        <PlanFeatureItem 
          available={true} 
          text={`${features.maxDocuments.toLocaleString()} documents`} 
        />
        <PlanFeatureItem 
          available={true} 
          text={`${features.maxStorage}GB storage`} 
        />
        <PlanFeatureItem 
          available={features.aiAssistant} 
          text="AI Assistant" 
        />
        <PlanFeatureItem 
          available={features.advancedAnalytics} 
          text="Advanced Analytics" 
        />
        <PlanFeatureItem 
          available={features.prioritySupport} 
          text="Priority Support" 
        />
        <PlanFeatureItem 
          available={features.customIntegrations} 
          text="Custom Integrations" 
        />
      </ul>
      
      <Button 
        variant={isSelected ? "default" : "outline"}
        className="w-full mt-auto"
        onClick={onSelect}
      >
        {isSelected ? "Selected" : "Select Plan"}
      </Button>
    </div>
  );
}

interface PlanFeatureItemProps {
  available: boolean;
  text: string;
}

function PlanFeatureItem({ available, text }: PlanFeatureItemProps) {
  return (
    <li className="flex items-center">
      {available ? (
        <Check className="h-4 w-4 text-primary mr-2" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground opacity-70 mr-2" />
      )}
      <span className={cn(!available && "text-muted-foreground opacity-70")}>
        {text}
      </span>
    </li>
  );
}
