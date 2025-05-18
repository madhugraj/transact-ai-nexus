
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PlayIcon, Settings2Icon, Eye } from "lucide-react";
import { WorkflowConfig } from "@/types/workflow";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WorkflowVisualizer from "./WorkflowVisualizer";

interface WorkflowCardProps {
  workflow: WorkflowConfig;
  onEdit?: (workflow: WorkflowConfig) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, onEdit }) => {
  const { updateWorkflow, executeWorkflow, isExecuting } = useWorkflow();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  
  const handleToggleActive = () => {
    updateWorkflow(workflow.id, { isActive: !workflow.isActive });
  };
  
  const handleExecute = () => {
    executeWorkflow(workflow.id);
    toast({
      title: "Workflow Execution Started",
      description: `${workflow.name} is now running...`,
    });
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
                  step.type === 'document-source' ? 'bg-blue-50 text-blue-800' :
                  step.type === 'comparison' ? 'bg-amber-50 text-amber-800' :
                  step.type === 'report-generation' ? 'bg-green-50 text-green-800' :
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
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onEdit && onEdit(workflow)}
            >
              <Settings2Icon className="h-3.5 w-3.5 mr-1" />
              Settings
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview
            </Button>
          </div>
          
          <Button
            size="sm"
            className="text-xs"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            <PlayIcon className="h-3.5 w-3.5 mr-1" />
            Run Now
          </Button>
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
