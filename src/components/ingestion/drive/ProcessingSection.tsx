
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle } from 'lucide-react';
import POFileProcessor from '../POFileProcessor';

interface ProcessingSectionProps {
  downloadedFiles: File[];
  onProcessingComplete: (results: any[]) => void;
  onClose: () => void;
}

const ProcessingSection = ({ downloadedFiles, onProcessingComplete, onClose }: ProcessingSectionProps) => {
  if (downloadedFiles.length === 0) return null;

  const handleProcessingComplete = (results: any[]) => {
    console.log('Processing completed:', results);
    onProcessingComplete(results);
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Process Purchase Orders
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <AlertCircle className="h-4 w-4" />
          {downloadedFiles.length} file(s) ready for processing
        </div>
      </CardHeader>
      <CardContent>
        <POFileProcessor
          selectedFiles={downloadedFiles}
          onProcessingComplete={handleProcessingComplete}
        />
      </CardContent>
    </Card>
  );
};

export default ProcessingSection;
