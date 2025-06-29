
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
  NodeTypes,
  useReactFlow
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
  const { deleteElements } = useReactFlow();

  const handleStepUpdate = useCallback((updatedStep: WorkflowStep) => {
    console.log('📝 Updating step:', updatedStep.name);
    const newSteps = steps.map(s => s.id === updatedStep.id ? updatedStep : s);
    onStepsChange(newSteps);
  }, [steps, onStepsChange]);

  const handleStepDelete = useCallback((stepId: string) => {
    console.log('🗑️ Deleting step with ID:', stepId);
    
    // Remove the step from the steps array
    const newSteps = steps.filter(s => s.id !== stepId);
    console.log('📊 Steps before deletion:', steps.length, 'After deletion:', newSteps.length);
    onStepsChange(newSteps);
    
    // Remove connections involving this step
    const newConnections = connections.filter(c => 
      c.sourceStepId !== stepId && c.targetStepId !== stepId
    );
    console.log('🔗 Connections before deletion:', connections.length, 'After deletion:', newConnections.length);
    onConnectionsChange(newConnections);
    
    // Also remove from React Flow state
    const nodeToDelete = nodes.find(n => n.id === stepId);
    if (nodeToDelete) {
      console.log('🎯 Removing node from React Flow:', nodeToDelete.id);
      setNodes(prevNodes => prevNodes.filter(n => n.id !== stepId));
      setEdges(prevEdges => prevEdges.filter(e => e.source !== stepId && e.target !== stepId));
    }
  }, [steps, connections, onStepsChange, onConnectionsChange]);

  // Convert workflow steps to React Flow nodes
  const initialNodes: Node[] = steps.map((step, index) => ({
    id: step.id || index.toString(),
    type: 'workflowStep',
    position: step.position || { x: index * 300, y: 100 },
    data: { 
      step,
      isEditable,
      onUpdate: handleStepUpdate,
      onStepDoubleClick,
      onDelete: handleStepDelete
    },
    deletable: isEditable,
    draggable: isEditable,
  }));

  // Convert workflow connections to React Flow edges
  const initialEdges: Edge[] = connections.map((conn, index) => ({
    id: conn.id || `edge-${index}`,
    source: conn.sourceStepId,
    target: conn.targetStepId,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 2 },
    label: conn.condition || '',
    deletable: isEditable,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when steps change
  React.useEffect(() => {
    console.log('🔄 Steps changed, updating nodes. Steps count:', steps.length);
    const updatedNodes = steps.map((step, index) => ({
      id: step.id || index.toString(),
      type: 'workflowStep',
      position: step.position || { x: index * 300, y: 100 },
      data: { 
        step,
        isEditable,
        onUpdate: handleStepUpdate,
        onStepDoubleClick,
        onDelete: handleStepDelete
      },
      deletable: isEditable,
      draggable: isEditable,
    }));
    setNodes(updatedNodes);
  }, [steps, isEditable, handleStepUpdate, onStepDoubleClick, handleStepDelete, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!isEditable) return;
      
      console.log('🔗 Creating connection:', params);
      const newEdge = addEdge({
        ...params,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#6b7280', strokeWidth: 2 },
        deletable: true,
      }, edges);
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
      
      console.log('🎯 Node dragged:', node.id, 'to position:', node.position);
      const updatedSteps = steps.map(step => 
        step.id === node.id 
          ? { ...step, position: node.position }
          : step
      );
      onStepsChange(updatedSteps);
    },
    [steps, onStepsChange, isEditable]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      if (!isEditable) return;
      
      console.log('🗑️ Deleting edges:', edgesToDelete.map(e => e.id));
      const edgeIdsToDelete = edgesToDelete.map(edge => edge.id);
      const newConnections = connections.filter(conn => 
        !edgeIdsToDelete.includes(conn.id)
      );
      onConnectionsChange(newConnections);
    },
    [connections, onConnectionsChange, isEditable]
  );

  // Handle keyboard deletion
  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      if (!isEditable) return;
      
      console.log('⌨️ Keyboard delete triggered for nodes:', nodesToDelete.map(n => n.id));
      nodesToDelete.forEach(node => {
        handleStepDelete(node.id);
      });
    },
    [isEditable, handleStepDelete]
  );

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gray-50 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgesDelete={onEdgesDelete}
        onNodesDelete={onNodesDelete}
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
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#d1d5db"
          style={{ opacity: 0.4 }}
        />
        <Controls 
          className="bg-white shadow-lg border border-gray-200 rounded-lg"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
