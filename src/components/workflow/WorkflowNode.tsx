
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Play,
  Pause
} from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';

const getStepIcon = (type: string) => {
  switch (type) {
    case 'data-source':
    case 'document-source':
    case 'document_source':
      return <Mail className="h-5 w-5" />;
    case 'document-processing':
      return <FileText className="h-5 w-5" />;
    case 'data-storage':
    case 'database_storage':
      return <Database className="h-5 w-5" />;
    case 'analytics':
      return <BarChart3 className="h-5 w-5" />;
    case 'notification':
    case 'approval_notification':
      return <Bell className="h-5 w-5" />;
    case 'conditional':
    case 'comparison':
    case 'document_comparison':
      return <GitBranch className="h-5 w-5" />;
    case 'parallel':
      return <Zap className="h-5 w-5" />;
    case 'report-generation':
    case 'report_generation':
      return <BarChart3 className="h-5 w-5" />;
    default:
      return <Settings className="h-5 w-5" />;
  }
};

const getStepColors = (type: string) => {
  switch (type) {
    case 'data-source':
    case 'document-source':
    case 'document_source':
      return {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700'
      };
    case 'document-processing':
      return {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        border: 'border-green-200',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-700'
      };
    case 'data-storage':
    case 'database_storage':
      return {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        badge: 'bg-purple-100 text-purple-700'
      };
    case 'analytics':
    case 'report-generation':
    case 'report_generation':
      return {
        bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-700'
      };
    case 'notification':
    case 'approval_notification':
      return {
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-700'
      };
    case 'conditional':
    case 'comparison':
    case 'document_comparison':
      return {
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        border: 'border-red-200',
        icon: 'text-red-600',
        badge: 'bg-red-100 text-red-700'
      };
    default:
      return {
        bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        border: 'border-gray-200',
        icon: 'text-gray-600',
        badge: 'bg-gray-100 text-gray-700'
      };
  }
};

export const WorkflowNode: React.FC<NodeProps> = ({ data }) => {
  const step = data.step as WorkflowStep;
  const isEditable = data.isEditable as boolean;
  const onStepDoubleClick = data.onStepDoubleClick as ((step: WorkflowStep) => void) | undefined;
  
  const colors = getStepColors(step.type);
  
  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditable && onStepDoubleClick) {
      onStepDoubleClick(step);
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
      
      <Card className={`w-64 min-h-[140px] ${colors.bg} ${colors.border} border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 ${isEditable ? 'cursor-pointer' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-white shadow-sm ${colors.icon}`}>
                {getStepIcon(step.type)}
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-gray-800 leading-tight">
                  {step.name}
                </CardTitle>
                <Badge className={`text-xs mt-1 ${colors.badge} border-0`}>
                  {step.type.replace('-', ' ').replace('_', ' ')}
                </Badge>
              </div>
            </div>
            {isEditable && (
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-white/50"
                onClick={handleConfigClick}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {step.description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {step.description}
            </p>
          )}
          
          {step.config && Object.keys(step.config).length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700">Configuration:</div>
              <div className="space-y-1">
                {Object.entries(step.config).map(([key, value]) => {
                  if (key === 'x' || key === 'y' || key === 'connectedTo') return null;
                  if (typeof value === 'object' && value !== null) {
                    return (
                      <div key={key} className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                        <span className="font-medium">{key}:</span> {Object.keys(value).length} items
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded truncate">
                      <span className="font-medium">{key}:</span> {String(value).slice(0, 20)}...
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {isEditable && (
            <div className="text-xs text-blue-600 font-medium mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
              💡 Double-click or use ⚙️ to configure
            </div>
          )}
        </CardContent>
      </Card>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 border-2 border-white shadow-md"
      />
      
      {step.isActive && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-md border-2 border-white" />
      )}
    </div>
  );
};
