
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { WorkflowNode } from './WorkflowNode';
import { ComponentPalette } from './builder/ComponentPalette';
import { WorkflowConfigDialog } from './WorkflowConfigDialog';
import { WorkflowConfig, WorkflowStep, WorkflowStepType } from '@/types/workflow';
import { useToast } from '@/hooks/use-toast';
import { useWorkflowPersistence } from '@/hooks/useWorkflowPersistence';
import { Save, Play, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface DragDropWorkflowBuilderProps {
  onWorkflowSave: (workflow: WorkflowConfig) => void;
  onWorkflowExecute: (workflow: WorkflowConfig) => void;
}

const nodeTypes = {
  workflowStep: WorkflowNode,
};

const AUTOSAVE_KEY = 'workflow_draft';

export const DragDropWorkflowBuilder: React.FC<DragDropWorkflowBuilderProps> = ({
  onWorkflowSave,
  onWorkflowExecute
}) => {
  const { toast } = useToast();
  const { addWorkflow } = useWorkflowPersistence();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<WorkflowStep | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setWorkflowName(draft.name || '');
        setWorkflowDescription(draft.description || '');
        if (draft.nodes) setNodes(draft.nodes);
        if (draft.edges) setEdges(draft.edges);
        console.log('📄 Loaded workflow draft from localStorage');
        
        toast({
          title: "Draft Restored",
          description: "Your previous work has been restored",
        });
      } catch (error) {
        console.error('❌ Failed to load workflow draft:', error);
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }
  }, [setNodes, setEdges]);

  // Autosave functionality
  useEffect(() => {
    if (nodes.length > 0 || workflowName || workflowDescription) {
      const draft = {
        name: workflowName,
        description: workflowDescription,
        nodes,
        edges,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
      setHasUnsavedChanges(true);
      console.log('💾 Auto-saved workflow draft');
    }
  }, [nodes, edges, workflowName, workflowDescription]);

  const clearDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setHasUnsavedChanges(false);
    console.log('🗑️ Cleared workflow draft');
  };

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

      const stepId = `node_${Date.now()}`;
      
      const workflowStep: WorkflowStep = {
        id: stepId,
        type: nodeType as WorkflowStepType,
        name: nodeLabel || nodeType,
        description: `${nodeLabel || nodeType} processing step`,
        position,
        config: {
          x: position.x,
          y: position.y,
          connectedTo: [],
          ...(nodeType === 'data-source' && nodeLabel?.toLowerCase().includes('gmail') && {
            emailConfig: {
              source: 'gmail' as const,
              filters: [],
              attachmentTypes: ['pdf'],
              useIntelligentFiltering: false
            }
          }),
          ...(nodeType === 'data-source' && nodeLabel?.toLowerCase().includes('drive') && {
            driveConfig: {
              source: 'google-drive' as const,
              fileTypes: ['pdf'],
              folderPath: '',
              processSubfolders: true,
              nameFilters: [],
              dateRange: {
                enabled: false,
                from: '',
                to: ''
              }
            }
          }),
          ...(nodeType === 'data-comparison' && {
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

      const newNode = {
        id: stepId,
        type: 'workflowStep',
        position,
        data: { 
          step: workflowStep,
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

  const handleConfigSave = (updatedStep: WorkflowStep) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === updatedStep.id 
          ? {
              ...node,
              data: {
                ...node.data,
                step: {
                  ...updatedStep,
                  name: updatedStep.name,
                  description: updatedStep.description
                }
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
    return nodes.map((node) => node.data.step as WorkflowStep);
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
    
    // Add to persistent storage
    addWorkflow(workflow);
    
    // Call the parent handler
    onWorkflowSave(workflow);
    
    // Clear the draft after successful save
    clearDraft();
    
    toast({
      title: "Workflow Saved",
      description: `"${workflow.name}" has been saved successfully and will persist across sessions.`,
    });
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
                  <CardTitle className="text-sm flex items-center gap-2">
                    Workflow Details
                    {hasUnsavedChanges && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Auto-saved draft available</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardTitle>
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
            fitView
            className="border-none"
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-right">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setNodes([]);
                    setEdges([]);
                    setWorkflowName('');
                    setWorkflowDescription('');
                    clearDraft();
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
