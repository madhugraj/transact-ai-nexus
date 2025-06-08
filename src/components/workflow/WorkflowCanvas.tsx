
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
  isEditable?: boolean;
}

const nodeTypes: NodeTypes = {
  workflowStep: WorkflowNode as any,
};

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  steps,
  connections,
  onStepsChange,
  onConnectionsChange,
  isEditable = false
}) => {
  // Convert workflow steps to React Flow nodes
  const initialNodes: Node[] = steps.map((step, index) => ({
    id: step.id || index.toString(),
    type: 'workflowStep',
    position: step.position || { x: index * 200, y: 100 },
    data: { 
      step,
      isEditable,
      onUpdate: (updatedStep: WorkflowStep) => {
        const newSteps = steps.map(s => s.id === updatedStep.id ? updatedStep : s);
        onStepsChange(newSteps);
      }
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

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
