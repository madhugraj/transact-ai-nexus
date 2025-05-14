
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Eye, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcessingOptions, PostProcessAction } from '@/types/processing';
import { ProcessingWorkflow } from './dialog/ProcessingWorkflow';

interface FileProcessingOptionsTabsProps {
  currentAction: PostProcessAction;
  processingOptions: ProcessingOptions;
  setProcessingOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
  renderActionSettings: () => React.ReactNode;
  previewContent?: React.ReactNode;
}

const FileProcessingOptionsTabs: React.FC<FileProcessingOptionsTabsProps> = ({
  currentAction,
  processingOptions,
  setProcessingOptions,
  renderActionSettings,
  previewContent
}) => {
  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="w-full bg-muted/30 rounded-md">
        <TabsTrigger 
          value="settings" 
          className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Settings className="h-4 w-4 mr-1" /> Settings
        </TabsTrigger>
        <TabsTrigger 
          value="preview" 
          className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Eye className="h-4 w-4 mr-1" /> Preview
        </TabsTrigger>
        <TabsTrigger 
          value="workflow" 
          className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <FileText className="h-4 w-4 mr-1" /> Workflow
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="settings" className="space-y-4 py-4">
        {renderActionSettings()}
      </TabsContent>
      
      <TabsContent value="preview">
        {previewContent ? (
          <div className="pt-4">{previewContent}</div>
        ) : (
          <div className="p-6 text-center text-muted-foreground border rounded-md flex flex-col items-center justify-center min-h-[200px] mt-2 bg-muted/10">
            <Eye className="h-8 w-8 mb-2 opacity-50" />
            <p>Preview will be generated after processing begins</p>
            <div className="mt-4 space-y-2 w-full max-w-sm">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="workflow">
        <div className="py-4">
          <ProcessingWorkflow />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default FileProcessingOptionsTabs;
