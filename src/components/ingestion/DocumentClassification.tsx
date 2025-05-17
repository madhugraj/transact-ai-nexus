
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadedFile } from '@/types/fileUpload';
import { useToast } from '@/hooks/use-toast';
import { Check, AlertCircle, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { classifyFileWithAI, DocumentClassification } from '@/services/api/fileClassificationService';
import { Progress } from '@/components/ui/progress';

interface DocumentClassificationProps {
  files: UploadedFile[];
  onClassify: (fileId: string, classification: DocumentClassification) => void;
  onBatchClassify: (classifications: Record<string, DocumentClassification>) => void;
}

const DocumentClassificationComponent: React.FC<DocumentClassificationProps> = ({
  files,
  onClassify,
  onBatchClassify
}) => {
  const [isAutoClassifying, setIsAutoClassifying] = useState(false);
  const [classifications, setClassifications] = useState<Record<string, DocumentClassification>>({});
  const [processedFiles, setProcessedFiles] = useState<Record<string, boolean>>({});
  const [classificationProgress, setClassificationProgress] = useState(0);
  const { toast } = useToast();

  const uploadedFiles = files.filter(f => f.status === 'success');

  const handleManualClassification = (fileId: string, value: DocumentClassification) => {
    const newClassifications = {
      ...classifications,
      [fileId]: value
    };
    
    setClassifications(newClassifications);
    onClassify(fileId, value);
    setProcessedFiles(prev => ({ ...prev, [fileId]: true }));
  };

  const runAutoClassification = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to classify",
        description: "You need to upload files first before classification.",
      });
      return;
    }

    setIsAutoClassifying(true);
    setClassificationProgress(0);
    const batchSize = uploadedFiles.length;
    let completed = 0;
    const newClassifications: Record<string, DocumentClassification> = { ...classifications };
    const processed: Record<string, boolean> = { ...processedFiles };

    try {
      for (const file of uploadedFiles) {
        if (processed[file.id]) continue;

        try {
          const result = await classifyFileWithAI(file.file);
          
          if (result.success && result.data) {
            newClassifications[file.id] = result.data.classification;
            processed[file.id] = true;
          } else {
            toast({
              title: `Failed to classify ${file.file.name}`,
              description: result.error || "Classification failed",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error(`Error classifying ${file.file.name}:`, error);
        }
        
        completed++;
        setClassificationProgress(Math.floor((completed / batchSize) * 100));
      }
      
      setClassifications(newClassifications);
      setProcessedFiles(processed);
      
      // Notify parent component about batch classification
      onBatchClassify(newClassifications);
      
      toast({
        title: "Classification complete",
        description: `${completed} files have been classified`,
      });
    } catch (error) {
      toast({
        title: "Classification failed",
        description: error instanceof Error ? error.message : "An error occurred during classification",
        variant: "destructive",
      });
    } finally {
      setIsAutoClassifying(false);
      setClassificationProgress(100);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Document Classification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Auto Classification Button */}
          <div className="flex justify-between items-center">
            <Button 
              onClick={runAutoClassification}
              disabled={isAutoClassifying || uploadedFiles.length === 0}
            >
              Auto-Classify Documents
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {uploadedFiles.length} document{uploadedFiles.length !== 1 ? 's' : ''} available
            </span>
          </div>
          
          {/* Classification Progress */}
          {isAutoClassifying && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Classifying documents...</span>
                <span>{classificationProgress}%</span>
              </div>
              <Progress value={classificationProgress} />
            </div>
          )}
          
          {/* Document List */}
          {uploadedFiles.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Document Classification</div>
              <div className="border rounded-md divide-y">
                {uploadedFiles.map(file => {
                  const isClassified = processedFiles[file.id];
                  
                  return (
                    <div key={file.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">{file.file.name}</span>
                        {isClassified && <Check className="h-4 w-4 text-green-500" />}
                      </div>
                      
                      <Select
                        value={classifications[file.id] || ""}
                        onValueChange={(value) => handleManualClassification(file.id, value as DocumentClassification)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="invoice">Invoice</SelectItem>
                          <SelectItem value="purchase_order">Purchase Order</SelectItem>
                          <SelectItem value="bill">Bill</SelectItem>
                          <SelectItem value="receipt">Receipt</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/70 mb-2" />
              <p>No files available for classification</p>
              <p className="text-sm mt-1">Upload files first to classify them</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentClassificationComponent;
