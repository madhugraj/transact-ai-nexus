
import React, { useMemo } from 'react';
import { WorkflowConfig } from '@/types/workflow';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowStepNode } from './WorkflowNodeTypes';

interface WorkflowVisualizerProps {
  workflow: WorkflowConfig;
}

const nodeTypes = {
  workflowStep: WorkflowStepNode,
};

const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ workflow }) => {
  const { nodes, edges } = useMemo(() => {
    // Transform workflow steps to ReactFlow nodes
    const nodes = workflow.steps.map((step, index) => ({
      id: step.id,
      type: 'workflowStep',
      // Use stored position if available, otherwise position nodes horizontally
      position: {
        x: step.config.x || index * 300 - 200,
        y: step.config.y || 100
      },
      data: {
        label: step.name,
        type: step.type,
        description: getStepDescription(step.type),
      },
    }));

    // Create edges between connected steps
    const edges = workflow.steps.reduce((acc, step) => {
      if (step.config.connectedTo) {
        // If we have explicit connections saved
        const connections = step.config.connectedTo.map((targetId: string) => ({
          id: `${step.id}-${targetId}`,
          source: step.id,
          target: targetId,
          animated: true,
        }));
        return [...acc, ...connections];
      } else {
        // Default: connect to the next step in sequence
        const stepIndex = workflow.steps.findIndex(s => s.id === step.id);
        if (stepIndex >= 0 && stepIndex < workflow.steps.length - 1) {
          return [
            ...acc, 
            {
              id: `${step.id}-${workflow.steps[stepIndex + 1].id}`,
              source: step.id,
              target: workflow.steps[stepIndex + 1].id,
              animated: true,
            }
          ];
        }
        return acc;
      }
    }, [] as any[]);

    return { nodes, edges };
  }, [workflow]);

  function getStepDescription(type: string) {
    switch (type) {
      case 'document-source':
        return 'Gathers documents from configured sources';
      case 'comparison':
        return 'Compares document data using defined rules';
      case 'report-generation':
        return 'Creates reports based on comparison results';
      case 'notification':
        return 'Sends notifications to specified recipients';
      case 'data-storage':
        return 'Stores processed data in the database';
      default:
        return 'Workflow step';
    }
  }

  return (
    <div style={{ height: '500px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default WorkflowVisualizer;
