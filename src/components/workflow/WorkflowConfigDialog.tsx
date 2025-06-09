import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowStep } from '@/types/workflow';
import { Settings } from 'lucide-react';
import { DataSourceConfig } from './config/DataSourceConfig';
import { DatabaseConfig } from './config/DatabaseConfig';

interface WorkflowConfigDialogProps {
  step: WorkflowStep | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStep: WorkflowStep) => void;
}

export const WorkflowConfigDialog: React.FC<WorkflowConfigDialogProps> = ({
  step,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedStep, setEditedStep] = useState<WorkflowStep | null>(step);

  React.useEffect(() => {
    setEditedStep(step);
  }, [step]);

  if (!editedStep) return null;

  const handleSave = () => {
    onSave(editedStep);
    onClose();
  };

  const updateConfig = (configKey: string, value: any) => {
    setEditedStep(prev => prev ? {
      ...prev,
      config: {
        ...prev.config,
        [configKey]: value
      }
    } : null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Step: {editedStep.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="stepName">Step Name</Label>
              <Input
                id="stepName"
                value={editedStep.name}
                onChange={(e) => setEditedStep(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div>
              <Label htmlFor="stepDescription">Description</Label>
              <Input
                id="stepDescription"
                value={editedStep.description || ''}
                onChange={(e) => setEditedStep(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            {editedStep.type === 'data-source' && (
              <DataSourceConfig
                step={editedStep}
                onConfigUpdate={updateConfig}
              />
            )}

            {editedStep.type === 'data-storage' && (
              <DatabaseConfig
                step={editedStep}
                onConfigUpdate={updateConfig}
              />
            )}

            {editedStep.type === 'document-processing' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Processing Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Processing Type</Label>
                    <Select
                      value={editedStep.config.processingConfig?.type || ''}
                      onValueChange={(value) => updateConfig('processingConfig', {
                        ...editedStep.config.processingConfig,
                        type: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select processing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice-extraction">Invoice Extraction</SelectItem>
                        <SelectItem value="po-extraction">PO Extraction</SelectItem>
                        <SelectItem value="general-ocr">General OCR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>AI Model</Label>
                    <Select
                      value={editedStep.config.processingConfig?.aiModel || 'gemini'}
                      onValueChange={(value) => updateConfig('processingConfig', {
                        ...editedStep.config.processingConfig,
                        aiModel: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Gemini</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Authentication & Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>For this workflow to access external services, you need to:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Gmail:</strong> Connect via Google OAuth (handled automatically)</li>
                    <li><strong>Google Drive:</strong> Connect via Google OAuth (handled automatically)</li>
                    <li><strong>AI Processing:</strong> Gemini API key configured in project settings</li>
                  </ul>
                  <p className="mt-3">
                    ⚠️ If you're getting 400 errors with Google Drive, ensure your OAuth credentials 
                    include the correct redirect URI: <code>{window.location.origin}/oauth/callback</code>
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
                  }}
                >
                  Configure Google OAuth Credentials
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
