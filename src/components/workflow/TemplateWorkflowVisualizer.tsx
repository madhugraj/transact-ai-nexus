
import React, { useMemo } from 'react';
import { WorkflowTemplate } from '@/types/workflow';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowStepNode } from '../actions/WorkflowNodeTypes';

interface TemplateWorkflowVisualizerProps {
  template: WorkflowTemplate;
}

const nodeTypes = {
  workflowStep: WorkflowStepNode,
};

const TemplateWorkflowVisualizer: React.FC<TemplateWorkflowVisualizerProps> = ({ template }) => {
  const { nodes, edges } = useMemo(() => {
    // Transform template steps to ReactFlow nodes
    const nodes = template.steps.map((step, index) => ({
      id: index.toString(),
      type: 'workflowStep',
      position: step.position || { x: index * 280, y: 100 },
      data: {
        label: step.name,
        type: step.type,
        description: step.description,
      },
      draggable: false,
      selectable: false,
    }));

    // Create edges from template connections with better styling
    const edges = template.connections.map((conn, index) => ({
      id: `edge-${index}`,
      source: conn.sourceStepId,
      target: conn.targetStepId,
      animated: true,
      style: { 
        stroke: '#3b82f6', 
        strokeWidth: 2,
      },
      markerEnd: {
        type: 'arrowclosed',
        color: '#3b82f6',
      },
    }));

    return { nodes, edges };
  }, [template]);

  return (
    <div className="h-96 w-full border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        preventScrolling={false}
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls 
          showInteractive={false} 
          showZoom={true}
          showFitView={true}
        />
        <MiniMap 
          nodeColor="#3b82f6" 
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            backgroundColor: 'white',
          }}
        />
      </ReactFlow>
      <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded-md shadow-sm border text-sm font-medium text-gray-700">
        {template.steps.length} components • {template.connections.length} connections
      </div>
    </div>
  );
};

export default TemplateWorkflowVisualizer;
