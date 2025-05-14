
import { Check, X } from "lucide-react";
import { planFeatures, PlanFeatures } from "@/utils/planFeatures";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PlanComparisonProps {
  currentPlan?: string;
}

export function PlanComparison({ currentPlan }: PlanComparisonProps) {
  const plans = ["Starter", "Professional", "Enterprise"];
  const features = [
    { name: "Users", accessor: "maxUsers", format: (val: number) => `${val} users` },
    { name: "Documents", accessor: "maxDocuments", format: (val: number) => `${val.toLocaleString()} docs` },
    { name: "Storage", accessor: "maxStorage", format: (val: number) => `${val} GB` },
    { name: "AI Assistant", accessor: "aiAssistant", format: (val: boolean) => val ? "✓" : "✗" },
    { name: "Advanced Analytics", accessor: "advancedAnalytics", format: (val: boolean) => val ? "✓" : "✗" },
    { name: "Priority Support", accessor: "prioritySupport", format: (val: boolean) => val ? "✓" : "✗" },
    { name: "Custom Integrations", accessor: "customIntegrations", format: (val: boolean) => val ? "✓" : "✗" },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="py-3 px-4 text-left font-medium">Features</th>
            {plans.map(plan => (
              <th key={plan} className={cn(
                "py-3 px-4 text-center",
                currentPlan === plan && "bg-primary/10"
              )}>
                <div className="flex flex-col items-center">
                  <span className="font-bold">{plan}</span>
                  <span className="text-lg font-bold">${planFeatures[plan]?.price}/mo</span>
                  {currentPlan === plan && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded mt-1">
                      Current Plan
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map(feature => (
            <tr key={feature.name} className="border-t">
              <td className="py-3 px-4 text-left font-medium">{feature.name}</td>
              {plans.map(plan => {
                const planData = planFeatures[plan];
                if (!planData) return <td key={plan}>-</td>;
                
                const value = planData[feature.accessor as keyof PlanFeatures];
                const formattedValue = feature.format(value as any);
                
                return (
                  <td 
                    key={plan} 
                    className={cn(
                      "py-3 px-4 text-center",
                      currentPlan === plan && "bg-primary/10"
                    )}
                  >
                    {typeof formattedValue === "string" ? (
                      formattedValue
                    ) : formattedValue === true ? (
                      <Check className="mx-auto h-5 w-5 text-green-500" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-gray-400" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t">
            <td className="py-3 px-4"></td>
            {plans.map(plan => (
              <td 
                key={plan} 
                className={cn(
                  "py-3 px-4 text-center",
                  currentPlan === plan && "bg-primary/10"
                )}
              >
                <DialogTrigger asChild>
                  <Button 
                    variant={currentPlan === plan ? "outline" : "default"}
                    className="w-full"
                    disabled={currentPlan === plan}
                  >
                    {currentPlan === plan ? "Current" : "Select"}
                  </Button>
                </DialogTrigger>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
