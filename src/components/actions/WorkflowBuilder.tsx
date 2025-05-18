
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
import { WorkflowConfig, WorkflowStep } from "@/types/workflow";
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

interface WorkflowBuilderProps {
  onWorkflowCreated?: (workflow: WorkflowConfig) => void;
}

const nodeTypes = {
  workflowStep: WorkflowStepNode,
};

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onWorkflowCreated }) => {
  const [showDialog, setShowDialog] = useState(false);
  const { createWorkflow } = useWorkflow();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

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

  // Generate workflow steps from nodes and edges
  const generateWorkflowSteps = (): WorkflowStep[] => {
    return nodes.map((node, index) => ({
      id: node.id,
      type: node.data.type,
      name: node.data.label,
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
    <>
      <Button onClick={() => setShowDialog(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Workflow
      </Button>
      
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
    </>
  );
};

export default WorkflowBuilder;
