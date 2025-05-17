
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Check, Loader } from 'lucide-react';
import { DocumentClassificationType } from '@/types/cloudStorage';
import { toast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import { cn } from '@/lib/utils';
import DocumentPreview from './DocumentPreview';

interface DocumentClassificationProps {
  files: { id: string, file: File, documentType?: DocumentClassificationType }[];
  onClassificationComplete: (classifiedFiles: { id: string, file: File, documentType: DocumentClassificationType }[]) => void;
}

const DocumentClassificationComponent: React.FC<DocumentClassificationProps> = ({ 
  files, 
  onClassificationComplete 
}) => {
  const [autoClassify, setAutoClassify] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [classifiedFiles, setClassifiedFiles] = useState<{ 
    id: string, 
    file: File, 
    documentType: DocumentClassificationType,
    confidence?: number 
  }[]>(files.map(f => ({
    ...f,
    documentType: f.documentType || 'other'
  })));
  
  // Handle manual classification change
  const handleClassificationChange = (fileId: string, documentType: DocumentClassificationType) => {
    setClassifiedFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        return { ...file, documentType };
      }
      return file;
    }));
  };

  // Auto-classify all files
  const runAutoClassification = async () => {
    if (files.length === 0) return;
    
    setIsClassifying(true);
    
    try {
      const updatedFiles = [...classifiedFiles];
      
      for (const [index, file] of files.entries()) {
        // Skip if already manually classified
        if (file.documentType && !autoClassify) continue;
        
        try {
          const response = await api.classifyDocument(file.file);
          
          if (response.success && response.data) {
            updatedFiles[index] = {
              ...updatedFiles[index],
              documentType: response.data.documentType as DocumentClassificationType,
              confidence: response.data.confidence
            };
          }
        } catch (error) {
          console.error(`Error classifying ${file.file.name}:`, error);
        }
      }
      
      setClassifiedFiles(updatedFiles);
      
      toast({
        title: "Classification complete",
        description: `Successfully classified ${files.length} documents.`
      });
    } catch (error) {
      toast({
        title: "Classification error",
        description: error instanceof Error ? error.message : "An error occurred during classification",
        variant: "destructive"
      });
    } finally {
      setIsClassifying(false);
    }
  };
  
  // Complete classification and pass back to parent
  const completeClassification = () => {
    onClassificationComplete(classifiedFiles);
    
    toast({
      title: "Processing documents",
      description: `Starting processing for ${classifiedFiles.length} classified documents.`,
    });
  };

  // Auto-classify on component mount if auto-classify is enabled
  React.useEffect(() => {
    if (autoClassify && files.length > 0) {
      runAutoClassification();
    }
  }, []);

  // Get selected file
  const selectedFile = classifiedFiles[selectedFileIndex];
  
  // Get document type label
  const getDocumentTypeLabel = (type: DocumentClassificationType) => {
    switch(type) {
      case 'invoice': return 'Invoice';
      case 'purchase_order': return 'Purchase Order';
      case 'receipt': return 'Receipt';
      case 'bill': return 'Bill';
      case 'email': return 'Email';
      case 'contract': return 'Contract';
      case 'report': return 'Report';
      default: return 'Other';
    }
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No files to classify
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Document Classification</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-classify"
              checked={autoClassify}
              onCheckedChange={setAutoClassify}
            />
            <Label htmlFor="auto-classify">Auto Classify</Label>
          </div>
        </div>
        <CardDescription>
          {autoClassify 
            ? "Documents will be automatically classified using AI" 
            : "Manually classify each document by type"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid md:grid-cols-5 gap-6">
          {/* File list (left sidebar) */}
          <div className="md:col-span-2">
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
              {classifiedFiles.map((file, index) => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileIndex(index)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                    selectedFileIndex === index ? "bg-primary/10" : "hover:bg-muted/40"
                  )}
                >
                  <FileText className={cn(
                    "h-4 w-4",
                    file.confidence && file.confidence > 0.8 ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      file.confidence && file.confidence > 0.9 ? "bg-green-50 text-green-700" :
                      file.confidence && file.confidence > 0.7 ? "bg-blue-50 text-blue-700" :
                      "bg-orange-50 text-orange-700"
                    )}
                  >
                    {getDocumentTypeLabel(file.documentType).substring(0, 3)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          
          {/* Document preview and classification (right side) */}
          <div className="md:col-span-3">
            {selectedFile && (
              <div className="space-y-4">
                <DocumentPreview 
                  fileUrl={selectedFile ? URL.createObjectURL(selectedFile.file) : null}
                  fileName={selectedFile?.file.name}
                  fileType={selectedFile?.file.type}
                  maxHeight="300px"
                />
                
                <div className="space-y-4 pt-2">
                  {selectedFile.confidence && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          selectedFile.confidence > 0.9 ? "bg-green-50 text-green-700" :
                          selectedFile.confidence > 0.7 ? "bg-blue-50 text-blue-700" :
                          "bg-orange-50 text-orange-700"
                        )}
                      >
                        {(selectedFile.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="document-type">Document Type:</Label>
                    <Select
                      value={selectedFile.documentType}
                      onValueChange={(value) => handleClassificationChange(selectedFile.id, value as DocumentClassificationType)}
                    >
                      <SelectTrigger id="document-type" className="w-[180px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="purchase_order">Purchase Order</SelectItem>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="bill">Bill</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="outline" 
          onClick={runAutoClassification}
          disabled={isClassifying}
        >
          {isClassifying ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Classifying...
            </>
          ) : (
            <>Run Auto-Classification</>
          )}
        </Button>
        
        <Button 
          onClick={completeClassification}
          disabled={isClassifying}
        >
          <Check className="mr-2 h-4 w-4" />
          Complete & Process
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentClassificationComponent;
