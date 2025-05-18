
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
      return <Cloud className="h-5 w-5 text-blue-500" />;
    case 'comparison':
      return <FileSearch className="h-5 w-5 text-amber-500" />;
    case 'report-generation':
      return <FileIcon className="h-5 w-5 text-green-500" />;
    case 'notification':
      return <Mail className="h-5 w-5 text-purple-500" />;
    case 'data-storage':
      return <Database className="h-5 w-5 text-gray-500" />;
    default:
      return <FileIcon className="h-5 w-5" />;
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
    <Card className={`w-64 shadow-md border-2 ${getStepBackgroundColor(data.type)}`}>
      <CardContent className="p-4">
        <div className="flex items-start mb-2">
          <div className={`
            rounded-full p-2 mr-3 flex-shrink-0
            ${data.type === 'document-source' ? 'bg-blue-100' :
              data.type === 'comparison' ? 'bg-amber-100' :
              data.type === 'report-generation' ? 'bg-green-100' :
              data.type === 'notification' ? 'bg-purple-100' :
              'bg-gray-100'}
          `}>
            {getStepIcon(data.type)}
          </div>
          <div>
            <h3 className="font-medium">{data.label}</h3>
            <p className="text-xs text-muted-foreground">{data.description}</p>
          </div>
        </div>
        <Badge variant="outline" className="ml-auto">
          {data.type}
        </Badge>
      </CardContent>
      
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="w-2 h-4 rounded-sm bg-slate-400" />
      <Handle type="source" position={Position.Right} className="w-2 h-4 rounded-sm bg-slate-400" />
    </Card>
  );
};

export const SidebarNode = ({ type, label, description }: { type: WorkflowStepType; label: string; description: string }) => {
  // Draggable node for the sidebar
  return (
    <Card className="mb-2 cursor-grab">
      <CardContent className="p-3 flex items-center">
        <div className={`
          rounded-full p-2 mr-3 flex-shrink-0
          ${type === 'document-source' ? 'bg-blue-100' :
            type === 'comparison' ? 'bg-amber-100' :
            type === 'report-generation' ? 'bg-green-100' :
            type === 'notification' ? 'bg-purple-100' :
            'bg-gray-100'}
        `}>
          {getStepIcon(type)}
        </div>
        <div>
          <h4 className="text-sm font-medium">{label}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};
