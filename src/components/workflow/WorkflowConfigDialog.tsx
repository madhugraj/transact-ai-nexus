
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { WorkflowStep } from '@/types/workflow';
import { DataSourceConfig } from './config/DataSourceConfig';
import { ComparisonConfig } from './config/ComparisonConfig';
import { DatabaseConfig } from './config/DatabaseConfig';

interface WorkflowConfigDialogProps {
  step: WorkflowStep | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (step: WorkflowStep) => void;
}

export const WorkflowConfigDialog: React.FC<WorkflowConfigDialogProps> = ({
  step,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedStep, setEditedStep] = React.useState<WorkflowStep | null>(step);

  React.useEffect(() => {
    setEditedStep(step);
  }, [step]);

  if (!editedStep) return null;

  const handleConfigUpdate = (configKey: string, value: any) => {
    setEditedStep(prev => prev ? {
      ...prev,
      config: {
        ...prev.config,
        [configKey]: value
      }
    } : null);
  };

  const handleSave = () => {
    if (editedStep) {
      onSave(editedStep);
      onClose();
    }
  };

  const getConfigComponent = () => {
    switch (editedStep.type) {
      case 'data-source':
        return (
          <DataSourceConfig 
            step={editedStep} 
            onConfigUpdate={handleConfigUpdate}
          />
        );
      case 'data-comparison':
        return (
          <ComparisonConfig 
            step={editedStep} 
            onConfigUpdate={handleConfigUpdate}
          />
        );
      case 'database-storage':
        return (
          <DatabaseConfig 
            step={editedStep} 
            onConfigUpdate={handleConfigUpdate}
          />
        );
      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            Configuration not available for this step type
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Step: {editedStep.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Config</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="step-name">Step Name</Label>
              <Input
                id="step-name"
                value={editedStep.name}
                onChange={(e) => setEditedStep(prev => prev ? {
                  ...prev,
                  name: e.target.value
                } : null)}
                placeholder="Enter step name"
              />
            </div>

            <div>
              <Label htmlFor="step-description">Description</Label>
              <Textarea
                id="step-description"
                value={editedStep.description}
                onChange={(e) => setEditedStep(prev => prev ? {
                  ...prev,
                  description: e.target.value
                } : null)}
                placeholder="Describe what this step does"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {getConfigComponent()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
