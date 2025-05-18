
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlayIcon, Settings2Icon, Trash2Icon } from "lucide-react";
import { WorkflowConfig } from "@/types/workflow";
import { useWorkflow } from "@/hooks/useWorkflow";
import WorkflowDiagram from "./WorkflowDiagram";
import { useToast } from "@/hooks/use-toast";

interface WorkflowCardProps {
  workflow: WorkflowConfig;
  onEdit?: (workflow: WorkflowConfig) => void;
  expanded?: boolean;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ 
  workflow, 
  onEdit,
  expanded = false 
}) => {
  const { updateWorkflow, executeWorkflow, isExecuting } = useWorkflow();
  const { toast } = useToast();
  
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
          <div className="flex items-center">
            <Switch
              id={`active-${workflow.id}`}
              checked={workflow.isActive}
              onCheckedChange={handleToggleActive}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {expanded ? (
          <WorkflowDiagram steps={workflow.steps} />
        ) : (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground overflow-hidden">
            <span>Source</span>
            <span>→</span>
            <span>Compare</span>
            <span>→</span>
            <span>Report</span>
            <span>→</span>
            <span>Notify</span>
            <span>→</span>
            <span>Store</span>
          </div>
        )}
        
        {workflow.lastRun && (
          <div className="text-xs text-muted-foreground mt-3">
            Last executed: {new Date(workflow.lastRun).toLocaleString()}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
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
  );
};

export default WorkflowCard;
