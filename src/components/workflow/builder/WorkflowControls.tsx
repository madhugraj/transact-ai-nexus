
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Play } from 'lucide-react';

interface WorkflowControlsProps {
  workflowName: string;
  onWorkflowNameChange: (name: string) => void;
  onSave: () => void;
  onExecute: () => void;
  nodeCount: number;
  edgeCount: number;
}

export const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  workflowName,
  onWorkflowNameChange,
  onSave,
  onExecute,
  nodeCount,
  edgeCount
}) => {
  return (
    <div className="mt-6 space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Workflow Name</label>
        <input
          type="text"
          value={workflowName}
          onChange={(e) => onWorkflowNameChange(e.target.value)}
          placeholder="Enter workflow name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex flex-col gap-2">
        <Button onClick={onSave} className="w-full gap-2">
          <Save className="h-4 w-4" />
          Save Workflow
        </Button>
        <Button onClick={onExecute} variant="outline" className="w-full gap-2">
          <Play className="h-4 w-4" />
          Execute
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Drag components to canvas</p>
        <p>• Connect components by dragging between handles</p>
        <p>• Double-click to configure</p>
        <p>• Press Delete to remove selected</p>
        <p className="font-medium">{nodeCount} components, {edgeCount} connections</p>
      </div>
    </div>
  );
};
