
import React, { useState } from "react";
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
import { Send, Plus } from "lucide-react";
import { useWorkflow } from "@/hooks/useWorkflow";
import WorkflowDiagram from "./WorkflowDiagram";
import { WorkflowConfig, WorkflowStep } from "@/types/workflow";

interface WorkflowBuilderProps {
  onWorkflowCreated?: (workflow: WorkflowConfig) => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onWorkflowCreated }) => {
  const [showDialog, setShowDialog] = useState(false);
  const { createWorkflow } = useWorkflow();
  
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      active: true,
    },
  });

  // Generate default workflow steps
  const generateDefaultSteps = (): WorkflowStep[] => {
    const now = Date.now();
    return [
      {
        id: `step-${now}-1`,
        type: "document-source",
        name: "Document Source",
        position: 1,
        config: {
          sources: ["drive", "email"]
        }
      },
      {
        id: `step-${now}-2`,
        type: "comparison",
        name: "Document Comparison",
        position: 2,
        config: {
          comparisonType: "po-invoice"
        }
      },
      {
        id: `step-${now}-3`,
        type: "report-generation",
        name: "Report Generation",
        position: 3,
        config: {
          format: "pdf"
        }
      },
      {
        id: `step-${now}-4`,
        type: "notification",
        name: "Approval Notification",
        position: 4,
        config: {
          recipients: ["approver@example.com"]
        }
      },
      {
        id: `step-${now}-5`,
        type: "data-storage",
        name: "Database Storage",
        position: 5,
        config: {
          table: "processed_documents"
        }
      }
    ];
  };

  const handleCreateWorkflow = (data: any) => {
    const newWorkflow: any = {
      name: data.name,
      description: data.description,
      isActive: data.active,
      steps: generateDefaultSteps()
    };
    
    const createdWorkflow = createWorkflow(newWorkflow);
    setShowDialog(false);
    form.reset();
    
    if (onWorkflowCreated) {
      onWorkflowCreated(createdWorkflow);
    }
  };

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Workflow
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Document Processing Workflow</DialogTitle>
            <DialogDescription>
              Define a workflow pipeline that processes documents from source to storage.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateWorkflow)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>
              
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
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Workflow Pipeline</Label>
                <div className="text-xs text-muted-foreground mb-2">
                  The workflow will include the standard document processing pipeline
                </div>
                
                <div className="border rounded-md p-4">
                  <WorkflowDiagram steps={generateDefaultSteps()} />
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setShowDialog(false)} variant="outline">Cancel</Button>
                <Button type="submit">Create Workflow</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkflowBuilder;
