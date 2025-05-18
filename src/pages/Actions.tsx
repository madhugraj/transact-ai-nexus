
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send } from "lucide-react";
import WorkflowBuilder from "@/components/actions/WorkflowBuilder";
import WorkflowCard from "@/components/actions/WorkflowCard";
import { useWorkflow } from "@/hooks/useWorkflow";
import { WorkflowConfig } from "@/types/workflow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WorkflowVisualizer from "@/components/actions/WorkflowVisualizer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplatesContent } from "@/components/actions/EmailTemplatesContent";
import { AutomatedActionsContent } from "@/components/actions/AutomatedActionsContent";
import { ActionHistoryContent } from "@/components/actions/ActionHistoryContent";

const Actions = () => {
  const [activeTab, setActiveTab] = useState("workflows");
  const { workflows } = useWorkflow();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfig | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { toast } = useToast();

  const handleEditWorkflow = (workflow: WorkflowConfig) => {
    setSelectedWorkflow(workflow);
    setShowDetailDialog(true);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Action Workflows</h1>
          {activeTab === "workflows" && (
            <WorkflowBuilder onWorkflowCreated={(workflow) => {
              toast({
                title: "Workflow Created",
                description: `The "${workflow.name}" workflow has been created successfully.`
              });
            }} />
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="workflows">Workflow Pipelines</TabsTrigger>
            <TabsTrigger value="automated">Automated Actions</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="history">Action History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="workflows" className="space-y-4">
            {workflows.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => (
                  <WorkflowCard 
                    key={workflow.id} 
                    workflow={workflow}
                    onEdit={handleEditWorkflow}
                  />
                ))}
              </div>
            ) : (
              <EmptyStateCard />
            )}
          </TabsContent>
          
          <TabsContent value="automated" className="space-y-4">
            <AutomatedActionsContent />
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <EmailTemplatesContent />
          </TabsContent>
          
          <TabsContent value="history">
            <ActionHistoryContent />
          </TabsContent>
        </Tabs>
      </div>

      {selectedWorkflow && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[80%] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedWorkflow.name}</DialogTitle>
            </DialogHeader>
            
            <WorkflowVisualizer workflow={selectedWorkflow} />
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Workflow Details</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Status:</dt>
                <dd>{selectedWorkflow.isActive ? "Active" : "Inactive"}</dd>
                
                <dt className="text-muted-foreground">Created:</dt>
                <dd>{new Date(selectedWorkflow.createdAt).toLocaleDateString()}</dd>
                
                {selectedWorkflow.lastRun && (
                  <>
                    <dt className="text-muted-foreground">Last Executed:</dt>
                    <dd>{new Date(selectedWorkflow.lastRun).toLocaleString()}</dd>
                  </>
                )}
              </dl>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Close
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Workflow Executed",
                  description: "The workflow has started processing documents."
                });
                setShowDetailDialog(false);
              }}>
                Run Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
};

// Empty state when no workflows exist
const EmptyStateCard = () => (
  <Card>
    <CardContent className="p-8 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Send className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium mb-2">No Workflows Created Yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Create your first document processing workflow to automate comparing POs and invoices.
      </p>
      <WorkflowBuilder />
    </CardContent>
  </Card>
);

export default Actions;
