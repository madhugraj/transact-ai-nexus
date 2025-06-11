import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertTriangle, ExternalLink, Eye, Edit3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WorkflowBuilderTab } from "./tabs/WorkflowBuilderTab";
import { SavedWorkflowsTab } from "./tabs/SavedWorkflowsTab";
import { WorkflowConfigDialog } from "@/components/workflow/WorkflowConfigDialog";
import { ExecutionTracker } from "@/components/workflow/ExecutionTracker";
import { EnhancedWorkflowEngine } from "@/services/workflow/EnhancedWorkflowEngine";
import { workflowTemplates } from "@/data/workflowTemplates";
import { useWorkflowPersistence } from "@/hooks/useWorkflowPersistence";
import { useCurrentWorkflow } from "@/hooks/useCurrentWorkflow";
import { WorkflowConfig, WorkflowTemplate, WorkflowStep } from "@/types/workflow";
import TemplateWorkflowVisualizer from "@/components/workflow/TemplateWorkflowVisualizer";

// Helper function to generate proper UUIDs
const generateUUID = () => {
  return crypto.randomUUID();
};

const Actions = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("builder");
  const { workflows, addWorkflow, updateWorkflow } = useWorkflowPersistence();
  const { currentWorkflow, loadWorkflowInBuilder, clearCurrentWorkflow } = useCurrentWorkflow();
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const workflowEngine = new EnhancedWorkflowEngine();

  const createWorkflowFromTemplate = (template: WorkflowTemplate, switchToBuilder: boolean = true) => {
    console.log('🔄 Creating workflow from template:', template.name);
    
    // Generate new UUIDs for all steps and create ID mapping
    const stepIdMapping: Record<string, string> = {};
    
    // Create steps with new IDs
    const steps = template.steps.map((templateStep, index) => {
      const newStepId = generateUUID();
      const originalId = `template-step-${index}`; // Create a consistent original ID
      stepIdMapping[originalId] = newStepId;
      
      const step: WorkflowStep = {
        id: newStepId,
        type: templateStep.type,
        name: templateStep.name,
        description: templateStep.description,
        position: templateStep.position || { x: index * 200, y: 100 },
        config: templateStep.config || {}
      };
      
      return step;
    });

    // Create connections with proper step ID mapping
    const connections = template.connections.map((conn, index) => {
      // Map template connection IDs to actual step IDs
      const sourceStepId = stepIdMapping[`template-step-${template.steps.findIndex(s => s.type === conn.sourceStepId || s.name === conn.sourceStepId)}`] || steps[0]?.id;
      const targetStepId = stepIdMapping[`template-step-${template.steps.findIndex(s => s.type === conn.targetStepId || s.name === conn.targetStepId)}`] || steps[steps.length - 1]?.id;
      
      return {
        id: generateUUID(),
        sourceStepId,
        targetStepId,
        condition: conn.condition
      };
    });

    const workflow: WorkflowConfig = {
      id: generateUUID(),
      name: template.name,
      description: template.description,
      steps,
      connections,
      isActive: true,
      createdAt: new Date(),
      totalRuns: 0,
      successRate: 0
    };

    console.log('✅ Created workflow with UUID:', workflow.id);
    console.log('📊 Steps:', steps.length, 'Connections:', connections.length);

    // Load into builder instead of saving immediately
    loadWorkflowInBuilder(workflow);
    setShowTemplateDialog(false);
    setShowTemplatePreview(false);
    
    if (switchToBuilder) {
      setActiveTab('builder');
    }
    
    toast({
      title: "Template Loaded",
      description: `${template.name} template has been loaded in the builder. Customize and save when ready.`
    });
  };

  const handlePreviewTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleEditTemplate = (template: WorkflowTemplate) => {
    createWorkflowFromTemplate(template, true);
  };

  const executeWorkflow = async (workflow: WorkflowConfig) => {
    setIsExecuting(true);
    setExecutionResults(null);
    setValidationErrors([]);
    
    try {
      const validation = await workflowEngine.validateWorkflowRequirements(workflow);
      
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        toast({
          title: "Workflow Validation Failed",
          description: "Please fix the issues below before running the workflow.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Workflow Started",
        description: `Executing ${workflow.name}...`
      });

      const execution = await workflowEngine.executeWorkflow(workflow);
      setExecutionResults(execution);
      
      // Update workflow with execution stats
      updateWorkflow(workflow.id, { 
        lastRun: new Date(), 
        totalRuns: (workflow.totalRuns || 0) + 1,
        successRate: execution.status === 'completed' ? 95 : 85
      });

      toast({
        title: "Workflow Completed",
        description: `${workflow.name} executed successfully!`,
      });

    } catch (error) {
      console.error('Workflow execution error:', error);
      setValidationErrors([error instanceof Error ? error.message : 'Unknown error occurred']);
      toast({
        title: "Workflow Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleWorkflowSave = (workflow: WorkflowConfig) => {
    addWorkflow(workflow);
    clearCurrentWorkflow(); // Clear from builder after saving
  };

  const handleStepConfigSave = (updatedStep: WorkflowStep) => {
    toast({
      title: "Configuration Saved",
      description: `${updatedStep.name} configuration has been updated.`
    });
    setShowConfigDialog(false);
    setSelectedStep(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workflow Automation</h1>
            <p className="text-muted-foreground">
              Create and manage end-to-end document processing workflows with drag-and-drop
            </p>
          </div>
          <Button onClick={() => setShowTemplateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Use Template
          </Button>
        </div>

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Workflow cannot run due to the following issues:</p>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/email-connector')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Connect Gmail/Drive
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="builder">
              Workflow Builder {currentWorkflow && "(Template Loaded)"}
            </TabsTrigger>
            <TabsTrigger value="workflows">
              Saved Workflows ({workflows.length})
            </TabsTrigger>
            <TabsTrigger value="templates">Templates ({workflowTemplates.length})</TabsTrigger>
            <TabsTrigger value="executions">Execution Status</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-4">
            <WorkflowBuilderTab
              onWorkflowSave={handleWorkflowSave}
              onWorkflowExecute={executeWorkflow}
              currentWorkflow={currentWorkflow}
              onClearCurrentWorkflow={clearCurrentWorkflow}
            />
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <SavedWorkflowsTab
              onCreateFirst={() => setActiveTab('builder')}
              isExecuting={isExecuting}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workflowTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            {template.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {template.steps.length} steps
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                        className="flex-1 gap-1 hover:bg-gray-50"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => createWorkflowFromTemplate(template)}
                        className="flex-1 gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            <ExecutionTracker execution={executionResults} />
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

        {/* Template Selection Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Choose a Workflow Template</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 md:grid-cols-2">
              {workflowTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                      onClick={() => createWorkflowFromTemplate(template)}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {template.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {template.steps.length} steps
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Template Preview Dialog */}
        <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Template Preview: {selectedTemplate?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Description:</strong> {selectedTemplate.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Category: {selectedTemplate.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {selectedTemplate.steps.length} Components
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      {selectedTemplate.connections.length} Connections
                    </span>
                  </div>
                </div>
                
                <TemplateWorkflowVisualizer template={selectedTemplate} />
                
                <div className="flex justify-end gap-3 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6">
                  <Button variant="outline" onClick={() => setShowTemplatePreview(false)}>
                    Close Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleEditTemplate(selectedTemplate)}
                    className="gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit in Builder
                  </Button>
                  <Button onClick={() => {
                    createWorkflowFromTemplate(selectedTemplate);
                    setShowTemplatePreview(false);
                  }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Use This Template
                  </Button>
                </div>
              </div>
            )}
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
