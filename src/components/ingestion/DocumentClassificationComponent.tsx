
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, FileImage, File, CheckCircle2, Loader } from 'lucide-react';
import { DocumentClassificationType } from '@/types/cloudStorage';
import { toast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import { cn } from '@/lib/utils';

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

  // Get appropriate icon based on file type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage size={20} className="text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText size={20} className="text-red-500" />;
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.type === 'text/csv') {
      return <FileText size={20} className="text-green-500" />;
    }
    return <File size={20} className="text-gray-500" />;
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

  return (
    <Card>
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
      
      <CardContent className="space-y-4">
        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
          {classifiedFiles.map((file) => (
            <div 
              key={file.id}
              className={cn(
                "flex items-center justify-between p-3 border rounded-md transition-all",
                file.confidence && file.confidence > 0.8 ? "bg-green-50/50" : "bg-orange-50/30"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-muted/30 w-10 h-10 rounded-md flex items-center justify-center">
                  {getFileIcon(file.file)}
                </div>
                <div className="flex-1">
                  <p className="font-medium truncate max-w-[200px]">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {file.confidence && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      file.confidence > 0.9 ? "bg-green-50 text-green-700" :
                      file.confidence > 0.7 ? "bg-blue-50 text-blue-700" :
                      "bg-orange-50 text-orange-700"
                    )}
                  >
                    {(file.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                )}
                
                <Select
                  value={file.documentType}
                  onValueChange={(value) => handleClassificationChange(file.id, value as DocumentClassificationType)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Document Type</SelectLabel>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="purchase_order">Purchase Order</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="bill">Bill</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          
          {classifiedFiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No files to classify
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="outline" 
          onClick={runAutoClassification}
          disabled={isClassifying || files.length === 0}
        >
          {isClassifying ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Classifying...
            </>
          ) : (
            <>
              Run Auto-Classification
            </>
          )}
        </Button>
        
        <Button 
          onClick={completeClassification}
          disabled={isClassifying || files.length === 0}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Complete & Process Files
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentClassificationComponent;
