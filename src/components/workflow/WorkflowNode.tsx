
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
  Trash2,
  GitCompare
} from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';

const getStepIcon = (type: string) => {
  switch (type) {
    case 'data-source':
      return <Mail className="h-4 w-4" />;
    case 'document-processing':
      return <FileText className="h-4 w-4" />;
    case 'data-storage':
      return <Database className="h-4 w-4" />;
    case 'data-comparison':
      return <GitCompare className="h-4 w-4" />;
    case 'analytics':
      return <BarChart3 className="h-4 w-4" />;
    case 'notification':
      return <Bell className="h-4 w-4" />;
    case 'conditional':
      return <GitBranch className="h-4 w-4" />;
    case 'parallel':
      return <Zap className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const getStepColors = (type: string) => {
  switch (type) {
    case 'data-source':
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
      return {
        bg: 'bg-white',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        badge: 'bg-purple-50 text-purple-700 border-purple-200'
      };
    case 'data-comparison':
      return {
        bg: 'bg-white',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        badge: 'bg-orange-50 text-orange-700 border-orange-200'
      };
    case 'analytics':
      return {
        bg: 'bg-white',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      };
    case 'notification':
      return {
        bg: 'bg-white',
        border: 'border-pink-200',
        icon: 'text-pink-600',
        badge: 'bg-pink-50 text-pink-700 border-pink-200'
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
    e.preventDefault();
    console.log('🗑️ Delete button clicked for step:', step.id);
    if (isEditable && onDelete) {
      onDelete(step.id);
    }
  };
  
  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 border-2 border-white shadow-md"
      />
      
      <Card className={`w-52 ${colors.bg} ${colors.border} border shadow-sm transition-all duration-200 hover:shadow-md ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`p-1.5 rounded-md bg-gray-50 ${colors.icon} flex-shrink-0`}>
                {getStepIcon(step.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {step.name}
                </div>
                <Badge className={`text-xs mt-1 ${colors.badge} border text-[10px] px-1.5 py-0.5`}>
                  {step.type.replace('-', ' ').replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            {isEditable && (
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={handleConfigClick}
                  title="Configure"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  onClick={handleDeleteClick}
                  title="Delete"
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
