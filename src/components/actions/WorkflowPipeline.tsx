
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Cloud, Database, File, FileSearch, Mail } from 'lucide-react';
import { WorkflowConfig, WorkflowStep } from '@/types/workflow';

interface WorkflowPipelineProps {
  workflow?: WorkflowConfig;
  activeStep?: string;
}

const WorkflowPipeline: React.FC<WorkflowPipelineProps> = ({
  workflow,
  activeStep
}) => {
  // Default steps if no workflow is provided
  const defaultSteps: Partial<WorkflowStep>[] = [
    {
      id: 'source',
      name: 'Document Source',
      type: 'document_source',
      position: { x: 0, y: 0 }
    },
    {
      id: 'compare',
      name: 'Document Comparison',
      type: 'document_comparison',
      position: { x: 0, y: 0 }
    },
    {
      id: 'report',
      name: 'Report Generation',
      type: 'report_generation',
      position: { x: 0, y: 0 }
    },
    {
      id: 'notify',
      name: 'Approval Notification',
      type: 'approval_notification',
      position: { x: 0, y: 0 }
    },
    {
      id: 'store',
      name: 'Database Storage',
      type: 'database_storage',
      position: { x: 0, y: 0 }
    }
  ];
  
  const steps = workflow?.steps || defaultSteps;
  
  // Get icon based on step type
  const getStepIcon = (type?: string) => {
    switch (type) {
      case 'document_source':
        return <Cloud className="h-4 w-4" />;
      case 'document_comparison':
        return <FileSearch className="h-4 w-4" />;
      case 'report_generation':
        return <File className="h-4 w-4" />;
      case 'approval_notification':
      case 'email_notification':
        return <Mail className="h-4 w-4" />;
      case 'database_storage':
        return <Database className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };
  
  // Get color based on step type
  const getStepColor = (type?: string) => {
    switch (type) {
      case 'document_source':
        return 'bg-blue-500';
      case 'document_comparison':
        return 'bg-amber-500';
      case 'report_generation':
        return 'bg-green-500';
      case 'approval_notification':
      case 'email_notification':
        return 'bg-purple-500';
      case 'database_storage':
        return 'bg-gray-500';
      default:
        return 'bg-slate-500';
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-0 left-6 w-[2px] h-full bg-muted-foreground/20"></div>
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id || index} className="flex relative">
                <div className={`${getStepColor(step.type as string)} rounded-full h-3 w-3 mt-1.5 z-10 ${activeStep === step.id ? 'ring-2 ring-offset-2' : ''}`}>
                  {activeStep === step.id && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="ml-8">
                  <div className="font-medium text-sm flex items-center">
                    {getStepIcon(step.type as string)}
                    <span className="ml-2">{step.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Step {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowPipeline;
