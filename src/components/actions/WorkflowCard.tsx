
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PlayIcon, Settings2Icon, Eye, Trash2 } from "lucide-react";
import { WorkflowConfig } from "@/types/workflow";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WorkflowVisualizer from "./WorkflowVisualizer";

interface WorkflowCardProps {
  workflow: WorkflowConfig;
  onEdit?: (workflow: WorkflowConfig) => void;
  onDelete?: (workflowId: string) => void;
  onExecute?: (workflow: WorkflowConfig) => void;
  isExecuting?: boolean;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ 
  workflow, 
  onEdit, 
  onDelete, 
  onExecute,
  isExecuting = false 
}) => {
  const { updateWorkflow, executeWorkflow } = useWorkflow();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  
  const handleToggleActive = () => {
    updateWorkflow(workflow.id, { isActive: !workflow.isActive });
  };
  
  const handleExecute = () => {
    if (onExecute) {
      // Use the provided onExecute handler (from SavedWorkflowsTab)
      onExecute(workflow);
    } else {
      // Fallback to the hook's executeWorkflow
      executeWorkflow(workflow.id);
      toast({
        title: "Workflow Execution Started",
        description: `${workflow.name} is now running...`,
      });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(workflow.id);
    } else {
      toast({
        title: "Workflow Deleted",
        description: `"${workflow.name}" has been removed`,
      });
    }
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-2" variant={workflow.isActive ? "default" : "outline"}>
                {workflow.isActive ? "Active" : "Inactive"}
              </Badge>
              <CardTitle className="text-base">{workflow.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{workflow.description}</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Switch
                      id={`active-${workflow.id}`}
                      checked={workflow.isActive}
                      onCheckedChange={handleToggleActive}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {workflow.isActive ? "Deactivate workflow" : "Activate workflow"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 mt-2">
            {workflow.steps.map((step, index) => (
              <Badge 
                key={step.id} 
                variant="outline" 
                className={
                  step.type === 'data-source' ? 'bg-blue-50 text-blue-800' :
                  step.type === 'document-processing' ? 'bg-amber-50 text-amber-800' :
                  step.type === 'data-storage' ? 'bg-green-50 text-green-800' :
                  step.type === 'notification' ? 'bg-purple-50 text-purple-800' :
                  'bg-gray-50 text-gray-800'
                }
              >
                {step.name}
                {index < workflow.steps.length - 1 && " →"}
              </Badge>
            ))}
          </div>
          
          {workflow.lastRun && (
            <div className="text-xs text-muted-foreground mt-3">
              Last executed: {new Date(workflow.lastRun).toLocaleString()}
            </div>
          )}
          
          {workflow.successRate !== undefined && (
            <div className="text-xs text-muted-foreground">
              Success rate: {workflow.successRate}% ({workflow.totalRuns || 0} runs)
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2">
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit && onEdit(workflow)}
                  >
                    <Settings2Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Preview</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{workflow.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleExecute}
                  disabled={isExecuting}
                >
                  <PlayIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isExecuting ? 'Running...' : 'Run Now'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[80%] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow: {workflow.name}</DialogTitle>
          </DialogHeader>
          <WorkflowVisualizer workflow={workflow} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkflowCard;
