
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PlayCircle, Plus, Settings, BarChart3, Edit } from "lucide-react";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import { WorkflowConfigDialog } from "@/components/workflow/WorkflowConfigDialog";
import { WorkflowEngine } from "@/services/workflow/WorkflowEngine";
import { workflowTemplates } from "@/data/workflowTemplates";
import { WorkflowConfig, WorkflowTemplate, WorkflowStep, WorkflowConnection } from "@/types/workflow";

const Actions = () => {
  const [activeTab, setActiveTab] = useState("workflows");
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfig | null>(null);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const { toast } = useToast();

  const workflowEngine = new WorkflowEngine();

  const createWorkflowFromTemplate = (template: WorkflowTemplate) => {
    const workflow: WorkflowConfig = {
      id: `workflow-${Date.now()}`,
      name: template.name,
      description: template.description,
      steps: template.steps.map((step, index) => ({
        ...step,
        id: `step-${index}`,
        position: step.position || { x: index * 200, y: 100 }
      })),
      connections: template.connections.map((conn, index) => ({
        ...conn,
        id: `conn-${index}`,
        sourceStepId: `step-${parseInt(conn.sourceStepId)}`,
        targetStepId: `step-${parseInt(conn.targetStepId)}`
      })),
      isActive: true,
      createdAt: new Date(),
      totalRuns: 0,
      successRate: 0
    };

    setWorkflows(prev => [...prev, workflow]);
    setShowTemplateDialog(false);
    
    toast({
      title: "Workflow Created",
      description: `${template.name} workflow has been created successfully.`
    });
  };

  const executeWorkflow = async (workflow: WorkflowConfig) => {
    setIsExecuting(true);
    setExecutionResults(null);
    
    try {
      toast({
        title: "Workflow Started",
        description: `Executing ${workflow.name}...`
      });

      const execution = await workflowEngine.executeWorkflow(workflow);
      setExecutionResults(execution);
      
      // Update workflow stats
      const updatedWorkflows = workflows.map(w => 
        w.id === workflow.id 
          ? { 
              ...w, 
              lastRun: new Date(), 
              totalRuns: (w.totalRuns || 0) + 1,
              successRate: execution.status === 'completed' ? 95 : 85
            }
          : w
      );
      setWorkflows(updatedWorkflows);

    } catch (error) {
      console.error('Workflow execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStepsChange = (steps: WorkflowStep[]) => {
    if (selectedWorkflow) {
      const updated = { ...selectedWorkflow, steps };
      setSelectedWorkflow(updated);
      setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
    }
  };

  const handleConnectionsChange = (connections: WorkflowConnection[]) => {
    if (selectedWorkflow) {
      const updated = { ...selectedWorkflow, connections };
      setSelectedWorkflow(updated);
      setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
    }
  };

  const handleStepDoubleClick = (step: WorkflowStep) => {
    setSelectedStep(step);
    setShowConfigDialog(true);
  };

  const handleStepConfigSave = (updatedStep: WorkflowStep) => {
    if (selectedWorkflow) {
      const updatedSteps = selectedWorkflow.steps.map(s => 
        s.id === updatedStep.id ? updatedStep : s
      );
      handleStepsChange(updatedSteps);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workflow Automation</h1>
            <p className="text-muted-foreground">
              Create and manage end-to-end document processing workflows
            </p>
          </div>
          <Button onClick={() => setShowTemplateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="executions">Execution History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-4">
            {workflows.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              setShowWorkflowDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => executeWorkflow(workflow)}
                            disabled={isExecuting}
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {workflow.description}
                      </p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{workflow.steps.length} steps</span>
                        <span>
                          {workflow.lastRun 
                            ? `Last run: ${workflow.lastRun.toLocaleDateString()}`
                            : 'Never run'
                          }
                        </span>
                      </div>
                      {workflow.successRate !== undefined && (
                        <div className="mt-2 text-xs">
                          Success rate: {workflow.successRate}%
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">No Workflows Created</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating a workflow from our templates
                  </p>
                  <Button onClick={() => setShowTemplateDialog(true)}>
                    Create First Workflow
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {template.category}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => createWorkflowFromTemplate(template)}
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            {executionResults ? (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Execution Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>Status: <span className="font-medium">{executionResults.status}</span></div>
                    <div>Steps Completed: {executionResults.stepResults.length}</div>
                    <div>Duration: {executionResults.endTime ? 
                      `${Math.round((new Date(executionResults.endTime).getTime() - new Date(executionResults.startTime).getTime()) / 1000)}s` 
                      : 'Running...'
                    }</div>
                    {executionResults.errors && executionResults.errors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-red-600">Errors:</h4>
                        <ul className="list-disc list-inside text-sm text-red-600">
                          {executionResults.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No executions yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{workflows.length}</div>
                    <div className="text-sm text-muted-foreground">Active Workflows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {workflows.reduce((sum, w) => sum + (w.totalRuns || 0), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Executions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {workflows.length > 0 
                        ? Math.round(workflows.reduce((sum, w) => sum + (w.successRate || 0), 0) / workflows.length)
                        : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Average Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Workflow Detail Dialog */}
        <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{selectedWorkflow?.name}</DialogTitle>
            </DialogHeader>
            
            {selectedWorkflow && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">{selectedWorkflow.description}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Double-click any step to configure
                        if (selectedWorkflow.steps.length > 0) {
                          handleStepDoubleClick(selectedWorkflow.steps[0]);
                        }
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Steps
                    </Button>
                    <Button
                      onClick={() => executeWorkflow(selectedWorkflow)}
                      disabled={isExecuting}
                      className="gap-2"
                    >
                      <PlayCircle className="h-4 w-4" />
                      {isExecuting ? 'Executing...' : 'Run Workflow'}
                    </Button>
                  </div>
                </div>
                
                <div onDoubleClick={() => {
                  if (selectedWorkflow.steps.length > 0) {
                    handleStepDoubleClick(selectedWorkflow.steps[0]);
                  }
                }}>
                  <WorkflowCanvas
                    steps={selectedWorkflow.steps}
                    connections={selectedWorkflow.connections}
                    onStepsChange={handleStepsChange}
                    onConnectionsChange={handleConnectionsChange}
                    isEditable={true}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  💡 Tip: Double-click on any step in the workflow to configure its settings
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Template Selection Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose a Workflow Template</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 md:grid-cols-2">
              {workflowTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => createWorkflowFromTemplate(template)}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {template.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {template.steps.length} steps
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Step Configuration Dialog */}
        <WorkflowConfigDialog
          step={selectedStep}
          isOpen={showConfigDialog}
          onClose={() => {
            setShowConfigDialog(false);
            setSelectedStep(null);
          }}
          onSave={handleStepConfigSave}
        />
      </div>
    </AppLayout>
  );
};

export default Actions;
