
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  HardDrive, 
  FileText, 
  Database, 
  BarChart3, 
  Bell,
  GitBranch,
  Zap,
  Settings,
  X,
  Trash2
} from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';

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

const getStepColors = (type: string) => {
  switch (type) {
    case 'data-source':
    case 'document-source':
    case 'document_source':
      return {
        bg: 'bg-white',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        badge: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    case 'document-processing':
      return {
        bg: 'bg-white',
        border: 'border-green-200',
        icon: 'text-green-600',
        badge: 'bg-green-50 text-green-700 border-green-200'
      };
    case 'data-storage':
    case 'database_storage':
      return {
        bg: 'bg-white',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        badge: 'bg-purple-50 text-purple-700 border-purple-200'
      };
    case 'analytics':
    case 'report-generation':
    case 'report_generation':
      return {
        bg: 'bg-white',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        badge: 'bg-orange-50 text-orange-700 border-orange-200'
      };
    case 'notification':
    case 'approval_notification':
      return {
        bg: 'bg-white',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      };
    case 'conditional':
    case 'comparison':
    case 'document_comparison':
      return {
        bg: 'bg-white',
        border: 'border-red-200',
        icon: 'text-red-600',
        badge: 'bg-red-50 text-red-700 border-red-200'
      };
    default:
      return {
        bg: 'bg-white',
        border: 'border-gray-200',
        icon: 'text-gray-600',
        badge: 'bg-gray-50 text-gray-700 border-gray-200'
      };
  }
};

export const WorkflowNode: React.FC<NodeProps> = ({ data, selected }) => {
  const step = data.step as WorkflowStep;
  const isEditable = data.isEditable as boolean;
  const onStepDoubleClick = data.onStepDoubleClick as ((step: WorkflowStep) => void) | undefined;
  const onDelete = data.onDelete as ((stepId: string) => void) | undefined;
  
  const colors = getStepColors(step.type);
  
  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditable && onStepDoubleClick) {
      onStepDoubleClick(step);
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditable && onDelete) {
      onDelete(step.id);
    }
  };
  
  const handleDoubleClick = () => {
    if (isEditable && onStepDoubleClick) {
      onStepDoubleClick(step);
    }
  };
  
  return (
    <div className="relative group" onDoubleClick={handleDoubleClick}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 border-2 border-white shadow-md"
      />
      
      <Card className={`w-56 ${colors.bg} ${colors.border} border-2 shadow-sm transition-all duration-200 hover:shadow-md ${selected ? 'ring-2 ring-blue-500' : ''} ${isEditable ? 'cursor-pointer' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg bg-gray-50 ${colors.icon} flex-shrink-0`}>
                {getStepIcon(step.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {step.name}
                </div>
                <Badge className={`text-xs mt-1 ${colors.badge} border`}>
                  {step.type.replace('-', ' ').replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            {isEditable && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={handleConfigClick}
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {step.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
              {step.description}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 border-2 border-white shadow-md"
      />
      
      {step.isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
};
