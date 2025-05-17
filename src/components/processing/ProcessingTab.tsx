
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProcessTransactions from './ProcessTransactions';
import AgentProcessingSystem from './AgentProcessingSystem';
import { UploadedFile } from '@/types/fileUpload';
import { ProcessingOptions } from '@/types/processing';

interface ProcessingTabProps {
  files?: UploadedFile[];
  options?: ProcessingOptions;
  onComplete?: (results: any) => void;
}

const ProcessingTab: React.FC<ProcessingTabProps> = ({
  files = [],
  options = {},
  onComplete
}) => {
  const uploadedFiles = files.filter(f => f.status === 'success');
  
  return (
    <Tabs defaultValue="agent" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="agent">Agent System</TabsTrigger>
        <TabsTrigger value="legacy">Legacy Processing</TabsTrigger>
      </TabsList>
      
      <TabsContent value="agent" className="mt-4">
        <AgentProcessingSystem 
          files={uploadedFiles}
          options={options}
          onComplete={onComplete}
        />
      </TabsContent>
      
      <TabsContent value="legacy" className="mt-4">
        <ProcessTransactions />
      </TabsContent>
    </Tabs>
  );
};

export default ProcessingTab;
