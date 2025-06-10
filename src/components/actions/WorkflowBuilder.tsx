import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { Plus, Save } from "lucide-react";
import { useWorkflow } from "@/hooks/useWorkflow";
import { WorkflowConfig, WorkflowStep, WorkflowStepType } from "@/types/workflow";
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
import { WorkflowStepNode, SidebarNode } from "./WorkflowNodeTypes";
import { WorkflowStepPalette } from "@/components/workflow/WorkflowStepPalette";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkflowBuilderProps {
  onWorkflowCreated?: (workflow: WorkflowConfig) => void;
}

const nodeTypes = {
  workflowStep: WorkflowStepNode,
};

interface NodeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeType: WorkflowStepType | null;
  nodeLabel: string | null;
}

// Node configuration dialog component
const NodeConfigDialog: React.FC<NodeConfigDialogProps> = ({ 
  open, 
  onOpenChange, 
  nodeType, 
  nodeLabel 
}) => {
  if (!nodeType || !nodeLabel) return null;

  const getTabContent = () => {
    switch (nodeType) {
      case 'data-source':
        return (
          <div className="space-y-4 p-2">
            <h4 className="text-sm font-medium">Data Source Configuration</h4>
            <div className="space-y-2">
              <Label htmlFor="source-type">Source Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="checkbox" id="email" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="email" className="text-sm">Email</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="checkbox" id="drive" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="drive" className="text-sm">Google Drive</Label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'document-processing':
        return (
          <div className="space-y-4 p-2">
            <h4 className="text-sm font-medium">Document Processing Configuration</h4>
            <div className="space-y-2">
              <Label htmlFor="processing-type">Processing Type</Label>
              <select id="processing-type" className="w-full border rounded-md p-2 text-sm">
                <option value="invoice-extraction">Invoice Extraction</option>
                <option value="po-extraction">PO Extraction</option>
                <option value="general-ocr">General OCR</option>
              </select>
            </div>
          </div>
        );
      
      case 'data-comparison':
        return (
          <div className="space-y-4 p-2">
            <h4 className="text-sm font-medium">Process Data Configuration</h4>
            <div className="space-y-2">
              <Label htmlFor="comparison-type">Comparison Type</Label>
              <select id="comparison-type" className="w-full border rounded-md p-2 text-sm">
                <option value="po-invoice-comparison">PO vs Invoice Comparison</option>
                <option value="jd-cv-comparison">Job Description vs CV Comparison</option>
                <option value="custom-comparison">Custom Document Comparison</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="match-threshold">Matching Threshold</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  id="match-threshold"
                  min="0"
                  max="100"
                  defaultValue="80"
                  className="flex-1"
                />
                <span className="text-sm">80%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-table">Source Table</Label>
              <Input id="source-table" placeholder="invoice_table" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-table">Target Table</Label>
              <Input id="target-table" placeholder="po_table" />
            </div>
          </div>
        );

      case 'report-generation':
        return (
          <div className="space-y-4 p-2">
            <h4 className="text-sm font-medium">Report Configuration</h4>
            <div className="space-y-2">
              <Label htmlFor="report-format">Report Format</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="radio" name="format" id="pdf" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="pdf" className="text-sm">PDF</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="radio" name="format" id="excel" className="h-4 w-4" />
                  <Label htmlFor="excel" className="text-sm">Excel</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="radio" name="format" id="csv" className="h-4 w-4" />
                  <Label htmlFor="csv" className="text-sm">CSV</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <select id="schedule" className="w-full border rounded-md p-2 text-sm">
                <option value="immediate">Immediate</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        );

      case 'notification':
        return (
          <div className="space-y-4 p-2">
            <h4 className="text-sm font-medium">Notification Settings</h4>
            <div className="space-y-2">
              <Label htmlFor="notify-method">Notification Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="checkbox" id="email-notify" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="email-notify" className="text-sm">Email</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="checkbox" id="app-notify" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="app-notify" className="text-sm">In-App</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients</Label>
              <Input id="recipients" placeholder="email@example.com, another@example.com" />
              <div className="text-xs text-muted-foreground">Separate multiple emails with commas</div>
            </div>
          </div>
        );
        
      case 'data-storage':
        return (
          <div className="space-y-4 p-2">
            <h4 className="text-sm font-medium">Data Storage Configuration</h4>
            <div className="space-y-2">
              <Label htmlFor="storage-type">Storage Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="radio" name="storage" id="database" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="database" className="text-sm">Database</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="radio" name="storage" id="file-system" className="h-4 w-4" />
                  <Label htmlFor="file-system" className="text-sm">File System</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="retention">Data Retention</Label>
              <select id="retention" className="w-full border rounded-md p-2 text-sm">
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
                <option value="365">1 Year</option>
                <option value="forever">Forever</option>
              </select>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            Configuration not available for this node type.
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{nodeLabel} Configuration</DialogTitle>
          <DialogDescription>
            Configure the settings for this workflow step.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="space-y-4 mt-4">
            {getTabContent()}
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="node-id">Node ID</Label>
              <Input id="node-id" value={nodeType} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="node-description">Description</Label>
              <Input id="node-description" placeholder="Enter a description for this step" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="error-handling">Error Handling</Label>
              <select id="error-handling" className="w-full border rounded-md p-2 text-sm">
                <option value="continue">Continue Workflow</option>
                <option value="stop">Stop Workflow</option>
                <option value="retry">Retry (3 times)</option>
              </select>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onWorkflowCreated }) => {
  const [showDialog, setShowDialog] = useState(false);
  const { createWorkflow } = useWorkflow();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [selectedNode, setSelectedNode] = useState<{
    type: WorkflowStepType | null;
    label: string | null;
  }>({ type: null, label: null });
  const [showNodeConfig, setShowNodeConfig] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      active: true,
    },
  });

  // Initial default nodes and edges for the workflow
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      const nodeDetails = JSON.parse(type);

      // Get position where node was dropped
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = {
        id: `node_${Date.now()}`,
        type: 'workflowStep',
        position,
        data: { 
          label: nodeDetails.name, 
          type: nodeDetails.type, 
          description: nodeDetails.description 
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  // Handle node click to open configuration
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const nodeType = node.data.type as WorkflowStepType;
    const nodeLabel = node.data.label as string;
    
    setSelectedNode({ 
      type: nodeType,
      label: nodeLabel
    });
    setShowNodeConfig(true);
  }, []);

  // Generate workflow steps from nodes and edges
  const generateWorkflowSteps = (): WorkflowStep[] => {
    return nodes.map((node) => ({
      id: node.id,
      type: node.data.type as WorkflowStepType,
      name: node.data.label as string,
      position: { x: node.position.x, y: node.position.y },
      config: {
        x: node.position.x,
        y: node.position.y,
        // Store connected nodes
        connectedTo: edges
          .filter(edge => edge.source === node.id)
          .map(edge => edge.target)
      }
    }));
  };

  const handleCreateWorkflow = (data: any) => {
    if (nodes.length === 0) {
      toast({
        title: "Workflow Error",
        description: "Please add at least one node to the workflow",
        variant: "destructive"
      });
      return;
    }
    
    const newWorkflow: any = {
      name: data.name,
      description: data.description,
      isActive: data.active,
      steps: generateWorkflowSteps(),
      connections: []
    };
    
    const createdWorkflow = createWorkflow(newWorkflow);
    setShowDialog(false);
    form.reset();
    
    toast({
      title: "Workflow Created",
      description: `The "${newWorkflow.name}" workflow was created successfully.`
    });
    
    if (onWorkflowCreated) {
      onWorkflowCreated(createdWorkflow);
    }
  };

  const handleAddStep = (template: any) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

    const newNode = {
      id: `node_${Date.now()}`,
      type: 'workflowStep',
      position,
      data: { 
        label: template.name, 
        type: template.type, 
        description: template.description 
      },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <Button onClick={() => setShowDialog(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Create Workflow
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={isMobile ? "max-w-[95%] h-[80vh]" : "sm:max-w-[80%] h-[80vh]"}>
          <DialogHeader>
            <DialogTitle>Create Document Processing Workflow</DialogTitle>
            <DialogDescription>
              Design your workflow pipeline by dragging and connecting steps.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-12 gap-4 overflow-hidden h-full">
            {/* Sidebar with workflow palette */}
            <div className="col-span-3 border-r pr-4 overflow-y-auto">
              <WorkflowStepPalette onAddStep={handleAddStep} />

              <Separator className="my-4" />

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateWorkflow)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workflow Name</FormLabel>
                        <FormControl>
                          <Input placeholder="PO-Invoice Processing Pipeline" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Process and compare documents" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Activate Workflow</FormLabel>
                          <FormDescription className="text-xs">
                            Start processing documents
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full mt-4">
                    <Save className="mr-2 h-4 w-4" />
                    Save Workflow
                  </Button>
                </form>
              </Form>
            </div>
            
            {/* Flow builder */}
            <div className="col-span-9" ref={reactFlowWrapper} style={{ height: '100%' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
              >
                <Background />
                <Controls />
                <MiniMap />
                <Panel position="top-right">
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
                </Panel>
              </ReactFlow>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Node configuration dialog */}
      <NodeConfigDialog 
        open={showNodeConfig} 
        onOpenChange={setShowNodeConfig}
        nodeType={selectedNode.type}
        nodeLabel={selectedNode.label}
      />
    </Button>
  );
};

export default WorkflowBuilder;
