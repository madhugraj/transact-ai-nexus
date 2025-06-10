
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowStepNode } from '@/components/actions/WorkflowNodeTypes';
import { ComponentPalette } from './builder/ComponentPalette';
import { WorkflowConfigDialog } from './WorkflowConfigDialog';
import { WorkflowConfig, WorkflowStep, WorkflowStepType } from '@/types/workflow';
import { useToast } from '@/hooks/use-toast';
import { Save, Play, ChevronLeft, ChevronRight } from 'lucide-react';

interface DragDropWorkflowBuilderProps {
  onWorkflowSave: (workflow: WorkflowConfig) => void;
  onWorkflowExecute: (workflow: WorkflowConfig) => void;
}

const nodeTypes = {
  workflowStep: WorkflowStepNode,
};

export const DragDropWorkflowBuilder: React.FC<DragDropWorkflowBuilderProps> = ({
  onWorkflowSave,
  onWorkflowExecute
}) => {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<WorkflowStep | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const onConnect = useCallback((connection: Connection) => {
    console.log('🔗 Creating edge connection:', connection);
    setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData('application/reactflow');
      const nodeLabel = event.dataTransfer.getData('application/reactflow-label');

      if (typeof nodeType === 'undefined' || !nodeType || !reactFlowBounds) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = {
        id: `node_${Date.now()}`,
        type: 'workflowStep',
        position,
        data: { 
          label: nodeLabel || nodeType, 
          type: nodeType,
          description: `${nodeLabel || nodeType} processing step`,
          showControls: true // Enable controls on the node
        },
      };

      console.log('➕ Adding new node:', newNode.id, nodeType);
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('🖱️ Double-clicked node:', node.id, node.data.type);
    
    const workflowStep: WorkflowStep = {
      id: node.id,
      type: node.data.type as WorkflowStepType,
      name: node.data.label as string,
      description: node.data.description as string,
      position: { x: node.position.x, y: node.position.y },
      config: {
        x: node.position.x,
        y: node.position.y,
        connectedTo: edges
          .filter(edge => edge.source === node.id)
          .map(edge => edge.target),
        // Initialize with default config based on type
        ...(node.data.type === 'data-comparison' && {
          comparisonConfig: {
            type: 'po-invoice-comparison' as const,
            fields: ['vendor_name', 'po_number', 'total_amount'],
            tolerance: 0.8,
            matchingCriteria: 'fuzzy' as const,
            sourceTable: 'po_table',
            targetTable: 'invoice_table'
          }
        })
      }
    };
    
    setSelectedNode(workflowStep);
    setShowConfigDialog(true);
  }, [edges]);

  const handleConfigSave = (updatedStep: WorkflowStep) => {
    console.log('💾 Saving node configuration:', updatedStep.id, updatedStep.name);
    
    setNodes((nds) => 
      nds.map((node) => 
        node.id === updatedStep.id 
          ? {
              ...node,
              data: {
                ...node.data,
                label: updatedStep.name,
                description: updatedStep.description
              },
              position: updatedStep.position
            }
          : node
      )
    );
    
    toast({
      title: "Step Updated",
      description: `"${updatedStep.name}" configuration has been saved.`,
    });
  };

  const generateWorkflowSteps = (): WorkflowStep[] => {
    return nodes.map((node) => ({
      id: node.id,
      type: node.data.type as WorkflowStepType,
      name: node.data.label as string,
      description: node.data.description as string,
      position: { x: node.position.x, y: node.position.y },
      config: {
        x: node.position.x,
        y: node.position.y,
        connectedTo: edges
          .filter(edge => edge.source === node.id)
          .map(edge => edge.target),
      }
    }));
  };

  const handleSaveWorkflow = () => {
    console.log('💾 Attempting to save workflow...');
    console.log('📋 Workflow name:', workflowName);
    console.log('📋 Node count:', nodes.length);
    console.log('📋 Edge count:', edges.length);

    if (!workflowName.trim()) {
      console.log('❌ Workflow name missing');
      toast({
        title: "Workflow Name Required",
        description: "Please enter a name for your workflow",
        variant: "destructive"
      });
      return;
    }

    if (nodes.length === 0) {
      console.log('❌ No components in workflow');
      toast({
        title: "No Components",
        description: "Please add at least one component to your workflow",
        variant: "destructive"
      });
      return;
    }

    const workflow: WorkflowConfig = {
      id: `workflow_${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      steps: generateWorkflowSteps(),
      connections: edges.map((edge, index) => ({
        id: edge.id || `conn-${index}`,
        sourceStepId: edge.source,
        targetStepId: edge.target,
      })),
      isActive: true,
      createdAt: new Date(),
    };

    console.log('✅ Saving workflow:', workflow.id, workflow.name);
    console.log('📊 Workflow details:', {
      steps: workflow.steps.length,
      connections: workflow.connections.length
    });

    try {
      onWorkflowSave(workflow);
      toast({
        title: "Workflow Saved",
        description: `"${workflow.name}" has been saved successfully.`,
      });
      console.log('✅ Workflow saved successfully');
    } catch (error) {
      console.error('❌ Failed to save workflow:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExecuteWorkflow = () => {
    console.log('▶️ Executing workflow...');
    
    const workflow: WorkflowConfig = {
      id: `workflow_${Date.now()}`,
      name: workflowName || 'Untitled Workflow',
      description: workflowDescription,
      steps: generateWorkflowSteps(),
      connections: edges.map((edge, index) => ({
        id: edge.id || `conn-${index}`,
        sourceStepId: edge.source,
        targetStepId: edge.target,
      })),
      isActive: true,
      createdAt: new Date(),
    };

    console.log('🚀 Executing workflow with', workflow.steps.length, 'steps');
    onWorkflowExecute(workflow);
  };

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, label: string) => {
    console.log('🖱️ Starting drag for:', nodeType, label);
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const sidebarWidth = sidebarCollapsed ? 'w-12' : 'w-80';
  const canvasWidth = sidebarCollapsed ? 'calc(100% - 3rem)' : 'calc(100% - 20rem)';

  return (
    <div className="flex h-[70vh] relative">
      {/* Collapsible Left Sidebar */}
      <div className={`${sidebarWidth} transition-all duration-300 flex-shrink-0 border-r bg-background`}>
        <div className="h-full flex flex-col">
          {/* Collapse Toggle */}
          <div className="p-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full justify-center"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* Component Palette */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <ComponentPalette onDragStart={onDragStart} />
              </div>

              {/* Workflow Details */}
              <div className="p-4 border-t space-y-3">
                <div>
                  <Label htmlFor="workflow-name" className="text-xs">Name</Label>
                  <Input
                    id="workflow-name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="PO-Invoice Processing"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-desc" className="text-xs">Description</Label>
                  <Input
                    id="workflow-desc"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Process and compare documents"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveWorkflow} className="flex-1 h-8 text-xs gap-2">
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Button onClick={handleExecuteWorkflow} variant="outline" className="flex-1 h-8 text-xs gap-2">
                    <Play className="h-3 w-3" />
                    Execute
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {nodes.length} components • {edges.length} connections
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1" style={{ width: canvasWidth }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
          className="border rounded-lg bg-background"
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                Double-click nodes to configure
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log('🗑️ Clearing canvas');
                  setNodes([]);
                  setEdges([]);
                }}
              >
                Clear Canvas
              </Button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Configuration Dialog */}
      <WorkflowConfigDialog
        step={selectedNode}
        isOpen={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        onSave={handleConfigSave}
      />
    </div>
  );
};
