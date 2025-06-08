
import React, { useState, useCallback, useRef } from 'react';
import { ReactFlowProvider, ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, Panel } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, HardDrive, FileText, Database, BarChart3, Bell, Settings, Play, Save } from 'lucide-react';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowConfigDialog } from './WorkflowConfigDialog';
import { WorkflowStep, WorkflowConfig, WorkflowConnection } from '@/types/workflow';
import { useToast } from '@/hooks/use-toast';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  workflowStep: WorkflowNode,
};

interface ComponentPaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string, label: string) => void;
}

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onDragStart }) => {
  const components = [
    { type: 'data-source', label: 'Gmail Source', icon: Mail, color: 'bg-blue-50 border-blue-200' },
    { type: 'data-source', label: 'Drive Source', icon: HardDrive, color: 'bg-green-50 border-green-200' },
    { type: 'document-processing', label: 'Extract Data', icon: FileText, color: 'bg-purple-50 border-purple-200' },
    { type: 'data-storage', label: 'Store Data', icon: Database, color: 'bg-orange-50 border-orange-200' },
    { type: 'analytics', label: 'Generate Report', icon: BarChart3, color: 'bg-yellow-50 border-yellow-200' },
    { type: 'notification', label: 'Send Alert', icon: Bell, color: 'bg-red-50 border-red-200' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-gray-700 mb-3">Drag Components to Canvas</h3>
      {components.map((component, index) => (
        <Card
          key={index}
          className={`${component.color} cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow`}
          draggable
          onDragStart={(e) => onDragStart(e, component.type, component.label)}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <component.icon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{component.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface DragDropWorkflowBuilderProps {
  onWorkflowSave?: (workflow: WorkflowConfig) => void;
  onWorkflowExecute?: (workflow: WorkflowConfig) => void;
}

export const DragDropWorkflowBuilder: React.FC<DragDropWorkflowBuilderProps> = ({
  onWorkflowSave,
  onWorkflowExecute
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const { toast } = useToast();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const type = event.dataTransfer.getData('application/reactflow-type');
      const label = event.dataTransfer.getData('application/reactflow-label');

      if (!type || !label) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newStep: WorkflowStep = {
        id: `node-${Date.now()}`,
        type: type as any,
        name: label,
        position,
        config: {}
      };

      const newNode: Node = {
        id: newStep.id,
        type: 'workflowStep',
        position,
        data: {
          step: newStep,
          isEditable: true,
          onUpdate: handleStepUpdate,
          onStepDoubleClick: handleStepDoubleClick,
          onDelete: handleStepDelete
        },
        deletable: true,
        draggable: true,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleStepUpdate = useCallback((updatedStep: WorkflowStep) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedStep.id
          ? { ...node, data: { ...node.data, step: updatedStep } }
          : node
      )
    );
  }, [setNodes]);

  const handleStepDoubleClick = useCallback((step: WorkflowStep) => {
    setSelectedStep(step);
    setShowConfigDialog(true);
  }, []);

  const handleStepDelete = useCallback((stepId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== stepId));
    setEdges((eds) => eds.filter((edge) => edge.source !== stepId && edge.target !== stepId));
    toast({
      title: "Component Deleted",
      description: "The workflow component has been removed.",
    });
  }, [setNodes, setEdges, toast]);

  const handleStepConfigSave = useCallback((updatedStep: WorkflowStep) => {
    handleStepUpdate(updatedStep);
    setShowConfigDialog(false);
    setSelectedStep(null);
    toast({
      title: "Configuration Saved",
      description: `${updatedStep.name} has been configured.`,
    });
  }, [handleStepUpdate, toast]);

  const handleSaveWorkflow = useCallback(() => {
    if (!workflowName.trim()) {
      toast({
        title: "Workflow Name Required",
        description: "Please enter a name for your workflow.",
        variant: "destructive",
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: "No Components",
        description: "Please add at least one component to your workflow.",
        variant: "destructive",
      });
      return;
    }

    const steps: WorkflowStep[] = nodes.map((node) => node.data.step);
    const connections: WorkflowConnection[] = edges.map((edge, index) => ({
      id: `conn-${index}`,
      sourceStepId: edge.source,
      targetStepId: edge.target,
    }));

    const workflow: WorkflowConfig = {
      id: `workflow-${Date.now()}`,
      name: workflowName,
      description: `Workflow with ${steps.length} components`,
      steps,
      connections,
      isActive: true,
      createdAt: new Date(),
      totalRuns: 0,
      successRate: 0
    };

    onWorkflowSave?.(workflow);
    toast({
      title: "Workflow Saved",
      description: `"${workflowName}" has been saved successfully.`,
    });
  }, [workflowName, nodes, edges, onWorkflowSave, toast]);

  const handleExecuteWorkflow = useCallback(() => {
    if (nodes.length === 0) {
      toast({
        title: "No Components",
        description: "Please add components to execute the workflow.",
        variant: "destructive",
      });
      return;
    }

    const steps: WorkflowStep[] = nodes.map((node) => node.data.step);
    const connections: WorkflowConnection[] = edges.map((edge, index) => ({
      id: `conn-${index}`,
      sourceStepId: edge.source,
      targetStepId: edge.target,
    }));

    const workflow: WorkflowConfig = {
      id: `temp-workflow-${Date.now()}`,
      name: workflowName || 'Unnamed Workflow',
      description: 'Temporary workflow for execution',
      steps,
      connections,
      isActive: true,
      createdAt: new Date(),
      totalRuns: 0,
      successRate: 0
    };

    onWorkflowExecute?.(workflow);
  }, [nodes, edges, workflowName, onWorkflowExecute]);

  return (
    <div className="h-[700px] flex gap-4">
      {/* Component Palette */}
      <div className="w-64 bg-white border rounded-lg p-4 overflow-y-auto">
        <ComponentPalette onDragStart={onDragStart} />
        
        <div className="mt-6 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Workflow Name</label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter workflow name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleSaveWorkflow} className="w-full gap-2">
              <Save className="h-4 w-4" />
              Save Workflow
            </Button>
            <Button onClick={handleExecuteWorkflow} variant="outline" className="w-full gap-2">
              <Play className="h-4 w-4" />
              Execute
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Drag components to canvas</p>
            <p>• Connect components by dragging between handles</p>
            <p>• Double-click to configure</p>
            <p>• Press Delete to remove selected</p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50 border rounded-lg"
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Meta', 'Ctrl']}
        >
          <Background gap={20} size={1} color="#e5e7eb" />
          <Controls className="bg-white shadow-lg border border-gray-200 rounded-lg" />
          <Panel position="top-right">
            <div className="bg-white rounded-lg border p-2 shadow-sm">
              <Badge variant="outline" className="text-xs">
                {nodes.length} components, {edges.length} connections
              </Badge>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Configuration Dialog */}
      <WorkflowConfigDialog
        step={selectedStep}
        isOpen={showConfigDialog}
        onClose={() => {
          setShowConfigDialog(false);
          setSelectedStep(null);
        }}
        onSave={handleStepConfigSave}
      />
    </div>
  );
};
