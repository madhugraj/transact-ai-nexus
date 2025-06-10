import React, { useState } from "react";
import { CheckCircle, Circle, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface WorkflowPipelineProps {
  onStepClick: (stepId: number) => void;
}

const WorkflowPipeline = ({ onStepClick }: WorkflowPipelineProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const steps = [
    { id: 1, name: "Data Source", type: "data-source", status: "completed" },
    { id: 2, name: "Document Processing", type: "document-processing", status: "current" },
    { id: 3, name: "Data Validation", type: "data-validation", status: "pending" },
    { id: 4, name: "Database Storage", type: "data-storage", status: "pending" }, // Fixed: changed from "database_storage" to "data-storage"
    { id: 5, name: "Analytics", type: "analytics", status: "pending" },
  ];

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
    onStepClick(stepId);

    toast({
      title: `Step ${stepId} Clicked`,
      description: `Navigating to step ${stepId}: ${steps.find(step => step.id === stepId)?.name}`,
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center"
          >
            <button
              onClick={() => handleStepClick(step.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                step.status === "completed"
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : step.status === "current"
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              )}
            >
              {step.status === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              {step.name}
            </button>
            {step.id < steps.length && <ChevronsRight className="h-4 w-4 text-gray-500" />}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p>Current Step: {currentStep}</p>
      </div>
    </div>
  );
};

export default WorkflowPipeline;
