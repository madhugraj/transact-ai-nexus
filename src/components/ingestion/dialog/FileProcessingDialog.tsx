
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { ActionSelector } from './ActionSelector';
import { TableExtractionSettings } from './TableExtractionSettings';
import { DataCombiningSettings } from './DataCombiningSettings';
import { DatabasePushSettings } from './DatabasePushSettings';
import { InsightSettings } from './InsightSettings';
import { DocumentSummarySettings } from './DocumentSummarySettings';
import { ProcessingWorkflow } from './ProcessingWorkflow';
import { Badge } from '@/components/ui/badge';

import { UploadedFile } from '@/types/fileUpload';
import { PostProcessAction, ProcessingOptions } from '@/types/processing';
import { Skeleton } from '@/components/ui/skeleton';

interface FileProcessingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFileIds: string[];
  files: UploadedFile[];
  currentAction: PostProcessAction;
  setCurrentAction: (action: PostProcessAction) => void;
  processingOptions: ProcessingOptions;
  setProcessingOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
  onProcess: () => void;
  isDocumentFile: (file: File) => boolean;
  isDataFile: (file: File) => boolean;
}

export const FileProcessingDialog: React.FC<FileProcessingDialogProps> = ({
  open,
  onOpenChange,
  selectedFileIds,
  files,
  currentAction,
  setCurrentAction,
  processingOptions,
  setProcessingOptions,
  onProcess,
  isDocumentFile,
  isDataFile
}) => {
  
  // Get the selected files for display
  const selectedFiles = files.filter(file => selectedFileIds.includes(file.id));
  
  // Render appropriate settings based on current action
  const renderActionSettings = () => {
    switch (currentAction) {
      case 'table_extraction':
        return <TableExtractionSettings processingOptions={processingOptions} setProcessingOptions={setProcessingOptions} />;
      case 'combine_data':
        return <DataCombiningSettings />;
      case 'push_to_db':
        return <DatabasePushSettings processingOptions={processingOptions} setProcessingOptions={setProcessingOptions} />;
      case 'insights':
        return <InsightSettings />;
      case 'summary':
        return <DocumentSummarySettings />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Process Files
            <Badge variant="outline" className="ml-2 bg-blue-100/50 text-blue-600 hover:bg-blue-100">
              {selectedFileIds.length} file{selectedFileIds.length !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Select an action and configure settings for processing
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            {/* Selected files display */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedFiles.map(file => (
                  <Badge key={file.id} variant="secondary" className="px-3 py-1">
                    {file.file.name}
                  </Badge>
                ))}
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">Select Action</label>
              <ActionSelector 
                selectedFileIds={selectedFileIds}
                files={files}
                currentAction={currentAction}
                setCurrentAction={setCurrentAction}
                isDocumentFile={isDocumentFile}
                isDataFile={isDataFile}
              />
            </div>
            
            <Separator className="my-4" />
            
            {/* Action-specific settings */}
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="w-full bg-muted/30 rounded-md">
                <TabsTrigger 
                  value="settings" 
                  className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Preview
                </TabsTrigger>
                <TabsTrigger 
                  value="workflow" 
                  className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Workflow
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-4 py-4">
                {renderActionSettings()}
              </TabsContent>
              
              <TabsContent value="preview">
                <div className="p-6 text-center text-muted-foreground border rounded-md flex flex-col items-center justify-center min-h-[200px] mt-2 bg-muted/10">
                  <Settings className="h-8 w-8 mb-2 opacity-50" />
                  <p>Preview will be generated after processing begins</p>
                  <div className="mt-4 space-y-2 w-full max-w-sm">
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mx-auto" />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="workflow">
                <div className="py-4">
                  <ProcessingWorkflow />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onProcess} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
            Start Processing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
