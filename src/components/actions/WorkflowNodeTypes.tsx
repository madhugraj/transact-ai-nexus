
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, FileSearch, FileIcon, Mail, Database } from "lucide-react";
import { WorkflowStepType } from '@/types/workflow';

type NodeData = {
  label: string;
  type: WorkflowStepType;
  description?: string;
}

const getStepIcon = (type: WorkflowStepType) => {
  switch (type) {
    case 'document-source':
      return <Cloud className="h-4 w-4 text-blue-500" />;
    case 'comparison':
      return <FileSearch className="h-4 w-4 text-amber-500" />;
    case 'report-generation':
      return <FileIcon className="h-4 w-4 text-green-500" />;
    case 'notification':
      return <Mail className="h-4 w-4 text-purple-500" />;
    case 'data-storage':
      return <Database className="h-4 w-4 text-gray-500" />;
    default:
      return <FileIcon className="h-4 w-4" />;
  }
};

const getStepBackgroundColor = (type: WorkflowStepType) => {
  switch (type) {
    case 'document-source':
      return 'bg-blue-50';
    case 'comparison':
      return 'bg-amber-50';
    case 'report-generation':
      return 'bg-green-50';
    case 'notification':
      return 'bg-purple-50';
    case 'data-storage':
      return 'bg-gray-50';
    default:
      return 'bg-slate-50';
  }
};

export const WorkflowStepNode = ({ data }: { data: NodeData }) => {
  return (
    <Card className={`w-48 shadow-sm border ${getStepBackgroundColor(data.type)}`}>
      <CardContent className="p-3">
        <div className="flex items-start mb-2">
          <div className={`
            rounded p-1.5 mr-2 flex-shrink-0
            ${data.type === 'document-source' ? 'bg-blue-100' :
              data.type === 'comparison' ? 'bg-amber-100' :
              data.type === 'report-generation' ? 'bg-green-100' :
              data.type === 'notification' ? 'bg-purple-100' :
              'bg-gray-100'}
          `}>
            {getStepIcon(data.type)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm leading-tight">{data.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-tight">{data.description}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {data.type}
        </Badge>
      </CardContent>
      
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="w-2 h-3 rounded-sm bg-slate-400" />
      <Handle type="source" position={Position.Right} className="w-2 h-3 rounded-sm bg-slate-400" />
    </Card>
  );
};

export const SidebarNode = ({ type, label, description }: { type: WorkflowStepType; label: string; description: string }) => {
  return (
    <Card className="mb-1.5 cursor-grab hover:shadow-sm transition-shadow">
      <CardContent className="p-2.5 flex items-center">
        <div className={`
          rounded p-1.5 mr-2 flex-shrink-0
          ${type === 'document-source' ? 'bg-blue-100' :
            type === 'comparison' ? 'bg-amber-100' :
            type === 'report-generation' ? 'bg-green-100' :
            type === 'notification' ? 'bg-purple-100' :
            'bg-gray-100'}
        `}>
          {getStepIcon(type)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-medium leading-tight">{label}</h4>
          <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};
