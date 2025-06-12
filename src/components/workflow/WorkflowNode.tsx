
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
      return <Mail className="h-3 w-3" />;
    case 'document-processing':
      return <FileText className="h-3 w-3" />;
    case 'data-storage':
      return <Database className="h-3 w-3" />;
    case 'data-comparison':
      return <GitCompare className="h-3 w-3" />;
    case 'analytics':
      return <BarChart3 className="h-3 w-3" />;
    case 'notification':
      return <Bell className="h-3 w-3" />;
    case 'conditional':
      return <GitBranch className="h-3 w-3" />;
    case 'parallel':
      return <Zap className="h-3 w-3" />;
    default:
      return <Settings className="h-3 w-3" />;
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
        className="w-2 h-2 !bg-blue-500 border border-white shadow-sm"
      />
      
      <Card className={`w-40 ${colors.bg} ${colors.border} border shadow-sm transition-all duration-200 hover:shadow-md ${selected ? 'ring-1 ring-blue-400' : ''}`}>
        <CardContent className="p-2">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className={`p-1 rounded bg-gray-50 ${colors.icon} flex-shrink-0`}>
                {getStepIcon(step.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-xs text-gray-900 truncate leading-tight">
                  {step.name}
                </div>
                <Badge className={`text-[9px] mt-0.5 ${colors.badge} border px-1 py-0 h-4 leading-none`}>
                  {step.type.replace('-', ' ').replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            {isEditable && (
              <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-gray-100 rounded"
                  onClick={handleConfigClick}
                  title="Configure"
                >
                  <Settings className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600 rounded"
                  onClick={handleDeleteClick}
                  title="Delete"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            )}
          </div>
          
          {step.description && (
            <p className="text-[10px] text-gray-500 mt-1 line-clamp-1 leading-tight">
              {step.description}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-blue-500 border border-white shadow-sm"
      />
      
      {step.isActive && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
      )}
    </div>
  );
};
