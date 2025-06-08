
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  HardDrive, 
  FileText, 
  Database, 
  BarChart3, 
  Bell,
  GitBranch,
  Zap,
  Settings
} from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';

interface WorkflowNodeData extends Record<string, unknown> {
  step: WorkflowStep;
  isEditable: boolean;
  onUpdate: (step: WorkflowStep) => void;
}

const getStepIcon = (type: string) => {
  switch (type) {
    case 'data-source':
    case 'document-source':
    case 'document_source':
      return <Mail className="h-4 w-4" />;
    case 'document-processing':
      return <FileText className="h-4 w-4" />;
    case 'data-storage':
    case 'database_storage':
      return <Database className="h-4 w-4" />;
    case 'analytics':
      return <BarChart3 className="h-4 w-4" />;
    case 'notification':
    case 'approval_notification':
      return <Bell className="h-4 w-4" />;
    case 'conditional':
    case 'comparison':
    case 'document_comparison':
      return <GitBranch className="h-4 w-4" />;
    case 'parallel':
      return <Zap className="h-4 w-4" />;
    case 'report-generation':
    case 'report_generation':
      return <BarChart3 className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const getStepColor = (type: string) => {
  switch (type) {
    case 'data-source':
    case 'document-source':
    case 'document_source':
      return 'bg-blue-100 border-blue-300';
    case 'document-processing':
      return 'bg-green-100 border-green-300';
    case 'data-storage':
    case 'database_storage':
      return 'bg-purple-100 border-purple-300';
    case 'analytics':
    case 'report-generation':
    case 'report_generation':
      return 'bg-orange-100 border-orange-300';
    case 'notification':
    case 'approval_notification':
      return 'bg-yellow-100 border-yellow-300';
    case 'conditional':
    case 'comparison':
    case 'document_comparison':
      return 'bg-red-100 border-red-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
};

export const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data }) => {
  const { step, isEditable } = data;
  
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500"
      />
      
      <Card className={`w-48 ${getStepColor(step.type)} transition-all hover:shadow-md`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {getStepIcon(step.type)}
            {step.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              {step.type.replace('-', ' ').replace('_', ' ')}
            </Badge>
            {step.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {step.description}
              </p>
            )}
            {step.config && Object.keys(step.config).length > 0 && (
              <div className="text-xs text-muted-foreground">
                {Object.keys(step.config).map(key => {
                  if (key === 'x' || key === 'y' || key === 'connectedTo') return null;
                  return (
                    <div key={key} className="truncate">
                      {key}: {JSON.stringify(step.config[key as keyof typeof step.config])?.slice(0, 20)}...
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500"
      />
      
      {step.isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};
