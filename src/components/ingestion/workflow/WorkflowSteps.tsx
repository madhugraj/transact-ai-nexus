
import React from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface WorkflowStep {
  id: string;
  label: string;
  status: 'active' | 'complete' | 'pending';
}

interface WorkflowStepsProps {
  steps: WorkflowStep[];
}

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({ steps }) => {
  return (
    <div className="flex items-center justify-center mt-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center 
                ${step.status === 'active' ? 'bg-primary text-primary-foreground' : 
                  step.status === 'complete' ? 'bg-green-100 text-green-700' : 
                  'bg-muted text-muted-foreground'}`}
            >
              {step.status === 'complete' ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span className={`text-xs mt-1 ${step.status === 'active' ? 'font-medium' : ''}`}>
              {step.label}
            </span>
          </div>
          
          {index < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
