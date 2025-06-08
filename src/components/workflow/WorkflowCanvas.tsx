
import React, { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  NodeTypes
} from '@xyflow/react';
import { WorkflowStep, WorkflowConnection } from '@/types/workflow';
import { WorkflowNode } from './WorkflowNode';
import '@xyflow/react/dist/style.css';

interface WorkflowCanvasProps {
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  onStepsChange: (steps: WorkflowStep[]) => void;
  onConnectionsChange: (connections: WorkflowConnection[]) => void;
  onStepDoubleClick?: (step: WorkflowStep) => void;
  isEditable?: boolean;
}

const nodeTypes: NodeTypes = {
  workflowStep: WorkflowNode,
};

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  steps,
  connections,
  onStepsChange,
  onConnectionsChange,
  onStepDoubleClick,
  isEditable = false
}) => {
  const handleStepUpdate = useCallback((updatedStep: WorkflowStep) => {
    const newSteps = steps.map(s => s.id === updatedStep.id ? updatedStep : s);
    onStepsChange(newSteps);
  }, [steps, onStepsChange]);

  // Convert workflow steps to React Flow nodes
  const initialNodes: Node[] = steps.map((step, index) => ({
    id: step.id || index.toString(),
    type: 'workflowStep',
    position: step.position || { x: index * 300, y: 100 },
    data: { 
      step,
      isEditable,
      onUpdate: handleStepUpdate,
      onStepDoubleClick
    },
  }));

  // Convert workflow connections to React Flow edges
  const initialEdges: Edge[] = connections.map((conn, index) => ({
    id: conn.id || `edge-${index}`,
    source: conn.sourceStepId,
    target: conn.targetStepId,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    label: conn.condition || '',
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when steps change
  React.useEffect(() => {
    const updatedNodes = steps.map((step, index) => ({
      id: step.id || index.toString(),
      type: 'workflowStep',
      position: step.position || { x: index * 300, y: 100 },
      data: { 
        step,
        isEditable,
        onUpdate: handleStepUpdate,
        onStepDoubleClick
      },
    }));
    setNodes(updatedNodes);
  }, [steps, isEditable, handleStepUpdate, onStepDoubleClick, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!isEditable) return;
      
      const newEdge = addEdge(params, edges);
      setEdges(newEdge);
      
      const newConnection: WorkflowConnection = {
        id: `conn-${Date.now()}`,
        sourceStepId: params.source!,
        targetStepId: params.target!,
      };
      
      onConnectionsChange([...connections, newConnection]);
    },
    [edges, connections, onConnectionsChange, isEditable, setEdges]
  );

  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
      if (!isEditable) return;
      
      // Update the step position in the steps array
      const updatedSteps = steps.map(step => 
        step.id === node.id 
          ? { ...step, position: node.position }
          : step
      );
      onStepsChange(updatedSteps);
    },
    [steps, onStepsChange, isEditable]
  );

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        attributionPosition="bottom-left"
        className="workflow-canvas"
        style={{
          background: 'transparent',
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#e2e8f0"
          style={{ opacity: 0.5 }}
        />
        <Controls 
          className="bg-white shadow-lg border border-gray-200 rounded-lg"
        />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
