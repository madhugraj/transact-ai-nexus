
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { 
  Send, 
  Database, 
  Mail, 
  Cloud, 
  FileSearch,
  Settings
} from "lucide-react";

// Define workflow step types
type WorkflowStepType = 
  | "document-source" 
  | "comparison" 
  | "report-generation" 
  | "notification" 
  | "data-storage";

// Define a workflow step interface
interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  config: Record<string, any>;
}

// Define workflow interface
interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isActive: boolean;
}

const WorkflowCreator: React.FC = () => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      active: true,
    },
  });

  const createWorkflow = (data: any) => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: data.name,
      description: data.description,
      isActive: data.active,
      steps: [
        {
          id: `step-${Date.now()}-1`,
          type: "document-source",
          name: "Document Source",
          config: {
            sources: ["drive", "email"]
          }
        },
        {
          id: `step-${Date.now()}-2`,
          type: "comparison",
          name: "Document Comparison",
          config: {
            comparisonType: "po-invoice"
          }
        },
        {
          id: `step-${Date.now()}-3`,
          type: "report-generation",
          name: "Report Generation",
          config: {
            format: "pdf"
          }
        },
        {
          id: `step-${Date.now()}-4`,
          type: "notification",
          name: "Approval Notification",
          config: {
            recipients: ["approver@example.com"]
          }
        },
        {
          id: `step-${Date.now()}-5`,
          type: "data-storage",
          name: "Database Storage",
          config: {
            table: "processed_documents"
          }
        }
      ]
    };

    setWorkflows([...workflows, newWorkflow]);
    setShowDialog(false);
    form.reset();
    
    toast({
      title: "Workflow Created",
      description: `"${data.name}" workflow has been created successfully`,
    });
  };

  // Get icon for workflow step
  const getStepIcon = (type: WorkflowStepType) => {
    switch (type) {
      case "document-source":
        return <Cloud className="h-4 w-4" />;
      case "comparison":
        return <FileSearch className="h-4 w-4" />;
      case "report-generation":
        return <File className="h-4 w-4" />;
      case "notification":
        return <Mail className="h-4 w-4" />;
      case "data-storage":
        return <Database className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create Document Processing Workflow</DialogTitle>
            <DialogDescription>
              Define a workflow pipeline that processes documents from source to storage.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(createWorkflow)} className="space-y-4">
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
                      <FormDescription>
                        Workflow will start processing documents immediately
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
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Default Workflow Steps</h3>
                <div className="text-xs text-muted-foreground mb-2">
                  The workflow will include the standard document processing pipeline
                </div>
                <div className="space-y-2">
                  <div className="flex items-center p-2 rounded-md bg-muted/50">
                    <Cloud className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">1. Document Source (Drive, Email)</span>
                  </div>
                  <div className="flex items-center p-2 rounded-md bg-muted/50">
                    <FileSearch className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-sm">2. Document Comparison (PO vs Invoice)</span>
                  </div>
                  <div className="flex items-center p-2 rounded-md bg-muted/50">
                    <File className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">3. Report Generation (Dashboard)</span>
                  </div>
                  <div className="flex items-center p-2 rounded-md bg-muted/50">
                    <Mail className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-sm">4. Notification (Approval Request)</span>
                  </div>
                  <div className="flex items-center p-2 rounded-md bg-muted/50">
                    <Database className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">5. Database Storage (Archive)</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit">Create Workflow</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {workflows.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{workflow.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                <div className="space-y-1">
                  {workflow.steps.map((step) => (
                    <div key={step.id} className="flex items-center text-xs">
                      {getStepIcon(step.type)}
                      <span className="ml-1">{step.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  <div className="flex items-center">
                    <Switch id={`active-${workflow.id}`} checked={workflow.isActive} />
                    <Label htmlFor={`active-${workflow.id}`} className="ml-2 text-xs">
                      {workflow.isActive ? "Active" : "Inactive"}
                    </Label>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast({
                    title: "Workflow Execution",
                    description: "Workflow started execution. Check the history tab for updates.",
                  })}>
                    Run Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowCreator;
