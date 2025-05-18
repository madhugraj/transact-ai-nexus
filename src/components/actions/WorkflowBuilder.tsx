
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
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowStepNode, SidebarNode } from "./WorkflowNodeTypes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
      case 'document-source':
        return (
          <div className="space-y-4 p-2">
            <h4 className="text-sm font-medium">Document Source Configuration</h4>
            <div className="space-y-2">
              <Label htmlFor="source-type">Source Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="checkbox" id="email" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="email" className="text-sm">Email</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="checkbox" id="upload" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="upload" className="text-sm">File Upload</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="checkbox" id="cloud" className="h-4 w-4" />
                  <Label htmlFor="cloud" className="text-sm">Cloud Storage</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <input type="checkbox" id="sap" className="h-4 w-4" />
                  <Label htmlFor="sap" className="text-sm">SAP Import</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-type">Document Types</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="invoice" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="invoice" className="text-sm">Invoices</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="po" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="po" className="text-sm">Purchase Orders</Label>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'comparison':
        return (
          <div className="space-y-4 p-2">
            <h4 className="text-sm font-medium">Document Comparison Configuration</h4>
            <div className="space-y-2">
              <Label htmlFor="comparison-type">Comparison Type</Label>
              <select id="comparison-type" className="w-full border rounded-md p-2 text-sm">
                <option value="po-invoice">PO - Invoice Matching</option>
                <option value="invoice-receipt">Invoice - Receipt Matching</option>
                <option value="custom">Custom Fields Matching</option>
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
  const initialNodes: Node[] = [
    {
      id: 'source',
      type: 'workflowStep',
      position: { x: 100, y: 100 },
      data: { label: 'Document Source', type: 'document-source', description: 'Get documents from sources' },
    },
    {
      id: 'comparison',
      type: 'workflowStep',
      position: { x: 400, y: 100 },
      data: { label: 'Document Comparison', type: 'comparison', description: 'Compare document data' },
    },
    {
      id: 'report',
      type: 'workflowStep',
      position: { x: 700, y: 100 },
      data: { label: 'Report Generation', type: 'report-generation', description: 'Generate reports' },
    }
  ];

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: 'source', target: 'comparison', animated: true },
    { id: 'e2-3', source: 'comparison', target: 'report', animated: true },
  ];

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
          label: nodeDetails.label, 
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
    return nodes.map((node, index) => ({
      id: node.id,
      type: node.data.type as WorkflowStepType,
      name: node.data.label as string,
      position: index + 1,
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
      steps: generateWorkflowSteps()
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

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
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
            {/* Sidebar with draggable nodes */}
            <div className="col-span-3 border-r pr-4 overflow-y-auto">
              <Label className="mb-2 block">Available Steps</Label>
              <div 
                onDragStart={(event) => onDragStart(event, { type: 'document-source', label: 'Document Source', description: 'Gathers documents from sources' })}
                draggable
              >
                <SidebarNode 
                  type="document-source" 
                  label="Document Source" 
                  description="Gathers documents from sources" 
                />
              </div>
              
              <div 
                onDragStart={(event) => onDragStart(event, { type: 'comparison', label: 'Document Comparison', description: 'Compares document data' })}
                draggable
              >
                <SidebarNode 
                  type="comparison" 
                  label="Document Comparison" 
                  description="Compares document data" 
                />
              </div>
              
              <div 
                onDragStart={(event) => onDragStart(event, { type: 'report-generation', label: 'Report Generation', description: 'Creates reports' })}
                draggable
              >
                <SidebarNode 
                  type="report-generation" 
                  label="Report Generation" 
                  description="Creates reports" 
                />
              </div>
              
              <div 
                onDragStart={(event) => onDragStart(event, { type: 'notification', label: 'Notification', description: 'Sends notifications' })}
                draggable
              >
                <SidebarNode 
                  type="notification" 
                  label="Notification" 
                  description="Sends notifications" 
                />
              </div>
              
              <div 
                onDragStart={(event) => onDragStart(event, { type: 'data-storage', label: 'Data Storage', description: 'Stores processed data' })}
                draggable
              >
                <SidebarNode 
                  type="data-storage" 
                  label="Data Storage" 
                  description="Stores processed data" 
                />
              </div>

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
                          <Input placeholder="PO-Invoice Approval Pipeline" {...field} />
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
                          <Input placeholder="Process PO and invoices for approval" {...field} />
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
                      setNodes(initialNodes);
                      setEdges(initialEdges);
                    }}
                  >
                    Reset Flow
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

