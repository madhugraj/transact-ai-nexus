
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
      position: step.position || { x: index * 250, y: 100 },
      data: {
        label: step.name,
        type: step.type,
        description: step.description,
      },
    }));

    // Create edges from template connections
    const edges = template.connections.map((conn, index) => ({
      id: `edge-${index}`,
      source: conn.sourceStepId,
      target: conn.targetStepId,
      animated: true,
      style: { stroke: '#8b5cf6' },
    }));

    return { nodes, edges };
  }, [template]);

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        preventScrolling={true}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default TemplateWorkflowVisualizer;
