
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
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
          isEditable: true,
          onStepDoubleClick: handleNodeConfig,
          onDelete: handleNodeDelete
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleNodeConfig = useCallback((step: WorkflowStep) => {
    setSelectedNode(step);
    setShowConfigDialog(true);
  }, []);

  const handleNodeDelete = useCallback((stepId: string) => {
    console.log('🗑️ Deleting node:', stepId);
    setNodes((nds) => nds.filter(n => n.id !== stepId));
    setEdges((eds) => eds.filter(e => e.source !== stepId && e.target !== stepId));
  }, [setNodes, setEdges]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
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
    if (!workflowName.trim()) {
      toast({
        title: "Workflow Name Required",
        description: "Please enter a name for your workflow",
        variant: "destructive"
      });
      return;
    }

    if (nodes.length === 0) {
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

    console.log('💾 Saving workflow from DragDropWorkflowBuilder:', workflow);
    onWorkflowSave(workflow);
  };

  const handleExecuteWorkflow = () => {
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

    onWorkflowExecute(workflow);
  };

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <TooltipProvider>
      <div className="flex h-[70vh]">
        {/* Collapsible Left Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-12' : 'w-72'} transition-all duration-300 border-r bg-background overflow-hidden`}>
          <div className="flex items-center justify-between p-2 border-b">
            {!sidebarCollapsed && <span className="text-sm font-medium">Components</span>}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="h-8 w-8 p-0"
                >
                  {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </TooltipContent>
            </Tooltip>
          </div>
          
          {!sidebarCollapsed && (
            <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(70vh-60px)]">
              <ComponentPalette onDragStart={onDragStart} />
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Workflow Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                  <Button onClick={handleSaveWorkflow} className="w-full h-8 text-xs gap-2">
                    <Save className="h-3 w-3" />
                    Save Workflow
                  </Button>
                  <Button onClick={handleExecuteWorkflow} variant="outline" className="w-full h-8 text-xs gap-2">
                    <Play className="h-3 w-3" />
                    Execute
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {sidebarCollapsed && (
            <div className="p-2 flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleSaveWorkflow} variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Workflow</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleExecuteWorkflow} variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Execute Workflow</TooltipContent>
              </Tooltip>
            </div>
          )}
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
            onNodeDoubleClick={onNodeDoubleClick}
            fitView
            className="border-none"
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-right">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  Click component icons to configure
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
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
    </TooltipProvider>
  );
};
