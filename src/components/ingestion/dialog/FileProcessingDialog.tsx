
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

import { UploadedFile } from '@/types/fileUpload';
import { PostProcessAction, ProcessingOptions } from '@/types/processing';

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
          <DialogTitle>Process Files</DialogTitle>
          <DialogDescription>
            {selectedFileIds.length} file(s) selected for processing
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
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
            <Tabs defaultValue="settings">
              <TabsList>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-4 py-4">
                {renderActionSettings()}
              </TabsContent>
              
              <TabsContent value="preview">
                <div className="p-6 text-center text-muted-foreground border rounded-md flex flex-col items-center justify-center h-40 mt-2">
                  <Settings className="h-8 w-8 mb-2 opacity-50" />
                  <p>Preview will be generated after processing begins</p>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Next Steps Workflow */}
            <ProcessingWorkflow />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onProcess}>
            Start Processing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
