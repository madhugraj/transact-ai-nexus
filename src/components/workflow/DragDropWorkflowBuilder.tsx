import React, { useState, useCallback, useRef } from 'react';
import { ReactFlowProvider, ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, Panel } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowConfigDialog } from './WorkflowConfigDialog';
import { ComponentPalette } from './builder/ComponentPalette';
import { WorkflowControls } from './builder/WorkflowControls';
import { WorkflowProcessActions } from './builder/WorkflowProcessActions';
import { WorkflowStep, WorkflowConfig, WorkflowConnection } from '@/types/workflow';
import { useToast } from '@/hooks/use-toast';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  workflowStep: WorkflowNode,
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

  const handleExecuteWorkflow = useCallback((workflow?: WorkflowConfig) => {
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

    const finalWorkflow = workflow || {
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

    onWorkflowExecute?.(finalWorkflow);
  }, [nodes, edges, workflowName, onWorkflowExecute]);

  return (
    <div className="h-[700px] flex gap-4">
      {/* Component Palette */}
      <div className="w-64 bg-white border rounded-lg p-4 overflow-y-auto">
        <ComponentPalette onDragStart={onDragStart} />
        <WorkflowControls
          workflowName={workflowName}
          onWorkflowNameChange={setWorkflowName}
          onSave={handleSaveWorkflow}
          onExecute={() => handleExecuteWorkflow()}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />
        
        {/* Add Process Actions */}
        <WorkflowProcessActions
          workflow={{
            id: 'temp',
            name: workflowName,
            description: '',
            steps: nodes.map((node) => node.data.step),
            connections: edges.map((edge, index) => ({
              id: `conn-${index}`,
              sourceStepId: edge.source,
              targetStepId: edge.target,
            })),
            isActive: true,
            createdAt: new Date(),
            totalRuns: 0,
            successRate: 0
          }}
          onExecute={handleExecuteWorkflow}
          nodeCount={nodes.length}
        />
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
