
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProcessingControls } from './ProcessingControls';
import { ProcessingResults } from './ProcessingResults';
import { useAgentProcessing } from '@/hooks/useAgentProcessing';
import { FileText, Upload } from 'lucide-react';

interface AgentProcessingInterfaceProps {
  files: File[];
  title?: string;
  description?: string;
}

export const AgentProcessingInterface: React.FC<AgentProcessingInterfaceProps> = ({
  files,
  title = "AI Agent Processing",
  description = "Process your files using intelligent AI agents"
}) => {
  const {
    isProcessing,
    processingComplete,
    processingResults,
    startProcessing,
    resetProcessing
  } = useAgentProcessing();

  const handleStartProcessing = async () => {
    console.log('🚀 AgentProcessingInterface: Starting processing with files:', files);
    await startProcessing(files);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Upload className="h-4 w-4" />
          <span>{files.length} file(s) ready for processing</span>
        </div>

        {/* Processing Results */}
        {processingResults && (
          <ProcessingResults results={processingResults} />
        )}

        {/* Processing Controls */}
        <ProcessingControls
          isProcessing={isProcessing}
          processingComplete={processingComplete}
          resetProcessing={resetProcessing}
          handleStartProcessing={handleStartProcessing}
          filesLength={files.length}
        />
      </CardContent>
    </Card>
  );
};
