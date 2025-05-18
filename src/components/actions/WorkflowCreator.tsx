
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Send, Database, Mail, Cloud, FileSearch, FileIcon, Settings2 } from "lucide-react";
import { WorkflowConfig } from "@/types/workflow";
import { useWorkflow } from "@/hooks/useWorkflow";
import WorkflowBuilder from "./WorkflowBuilder";
import WorkflowCard from "./WorkflowCard";
import WorkflowDiagram from "./WorkflowDiagram";

const WorkflowCreator: React.FC = () => {
  const { toast } = useToast();
  const { workflows } = useWorkflow();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfig | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const handleEditWorkflow = (workflow: WorkflowConfig) => {
    setSelectedWorkflow(workflow);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Document Processing Workflows</h2>
        <WorkflowBuilder />
      </div>

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
      )}

      {selectedWorkflow && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedWorkflow.name}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <h3 className="text-sm font-medium mb-3">Workflow Pipeline</h3>
              <WorkflowDiagram steps={selectedWorkflow.steps} />
              
              <div className="mt-4">
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
            </div>
            
            <div className="flex justify-end gap-2">
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
    </div>
  );
};

export default WorkflowCreator;
