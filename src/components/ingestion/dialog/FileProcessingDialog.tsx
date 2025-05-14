
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import { ActionSelector } from './ActionSelector';
import { TableExtractionSettings } from './TableExtractionSettings';
import { DataCombiningSettings } from './DataCombiningSettings';
import { DatabasePushSettings } from './DatabasePushSettings';
import { InsightSettings } from './InsightSettings';
import { DocumentSummarySettings } from './DocumentSummarySettings';
import { Badge } from '@/components/ui/badge';

import { UploadedFile } from '@/types/fileUpload';
import { PostProcessAction, ProcessingOptions } from '@/types/processing';
import SelectedFilesDisplay from '../SelectedFilesDisplay';
import FileProcessingOptionsTabs from '../FileProcessingOptionsTabs';
import DocumentPreview from '../DocumentPreview';

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
  const [previewTab, setPreviewTab] = useState('settings');
  
  // Get file URL for the first selected file
  const getFilePreviewUrl = () => {
    if (selectedFiles.length === 0 || !selectedFiles[0].file) return null;
    return URL.createObjectURL(selectedFiles[0].file);
  };
  
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
            <SelectedFilesDisplay selectedFiles={selectedFiles} />
            
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
            
            {/* Action-specific settings with preview tab */}
            <FileProcessingOptionsTabs
              currentAction={currentAction}
              processingOptions={processingOptions}
              setProcessingOptions={setProcessingOptions}
              renderActionSettings={renderActionSettings}
              previewContent={
                <DocumentPreview 
                  fileUrl={getFilePreviewUrl()} 
                  fileName={selectedFiles.length > 0 ? selectedFiles[0].file?.name : undefined}
                  fileType={selectedFiles.length > 0 ? selectedFiles[0].file?.type : undefined}
                />
              }
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onProcess} 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Check className="h-4 w-4 mr-1" /> Start Processing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
