
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowDownIcon, 
  CheckIcon, 
  XIcon,
  Cloud, 
  Database, 
  FileIcon, 
  FileSearch, 
  Mail 
} from "lucide-react";
import { WorkflowStep } from "@/types/workflow";

interface WorkflowDiagramProps {
  steps: WorkflowStep[];
  activeStepId?: string;
  onStepClick?: (stepId: string) => void;
}

const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({
  steps,
  activeStepId,
  onStepClick
}) => {
  // Get step icon based on type
  const getStepIcon = (type: string) => {
    switch (type) {
      case "document-source":
        return <Cloud className="h-5 w-5 text-blue-500" />;
      case "comparison":
        return <FileSearch className="h-5 w-5 text-amber-500" />;
      case "report-generation":
        return <FileIcon className="h-5 w-5 text-green-500" />;
      case "notification":
        return <Mail className="h-5 w-5 text-purple-500" />;
      case "data-storage":
        return <Database className="h-5 w-5 text-gray-500" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="w-full py-4">
      <div className="flex flex-col items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step node */}
            <div 
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`
                flex items-center w-full max-w-md bg-white border rounded-lg p-4 mb-1 
                ${activeStepId === step.id ? 'ring-2 ring-primary' : ''}
                ${onStepClick ? 'cursor-pointer hover:bg-muted/50' : ''}
              `}
            >
              <div className={`
                rounded-full p-3 mr-4 flex-shrink-0
                ${step.type === 'document-source' ? 'bg-blue-100' :
                  step.type === 'comparison' ? 'bg-amber-100' :
                  step.type === 'report-generation' ? 'bg-green-100' :
                  step.type === 'notification' ? 'bg-purple-100' :
                  'bg-gray-100'}
              `}>
                {getStepIcon(step.type)}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium">{step.name}</h3>
                  <Badge variant="outline" className="text-xs">Step {index + 1}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {step.type === 'document-source' && 'Gathers documents from configured sources'}
                  {step.type === 'comparison' && 'Compares document data using defined rules'}
                  {step.type === 'report-generation' && 'Creates reports based on comparison results'}
                  {step.type === 'notification' && 'Sends notifications to specified recipients'}
                  {step.type === 'data-storage' && 'Stores processed data in the database'}
                </p>
              </div>
            </div>
            
            {/* Connector arrow (if not last step) */}
            {index < steps.length - 1 && (
              <div className="flex flex-col items-center justify-center h-10">
                <div className="w-0.5 h-full bg-gray-300"></div>
                <ArrowDownIcon className="h-4 w-4 text-gray-500 -mt-2" />
              </div>
            )}
          </React.Fragment>
        ))}
        
        {/* Final state */}
        <div className="flex items-center justify-center rounded-full bg-blue-100 p-2 mt-2">
          <CheckIcon className="h-5 w-5 text-blue-500" />
        </div>
      </div>
    </div>
  );
};

export default WorkflowDiagram;
