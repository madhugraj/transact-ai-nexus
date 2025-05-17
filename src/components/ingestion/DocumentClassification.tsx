
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Tag, Check } from 'lucide-react';
import { UploadedFile } from '@/types/fileUpload';
import { DocumentClassification, classifyFileWithAI } from '@/services/api/fileClassificationService';
import { useToast } from '@/hooks/use-toast';

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
  const [autoClassify, setAutoClassify] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifications, setClassifications] = useState<Record<string, DocumentClassification>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleAutoClassifyToggle = (checked: boolean) => {
    setAutoClassify(checked);
  };

  const handleClassificationChange = (fileId: string, classification: DocumentClassification) => {
    setClassifications(prev => ({
      ...prev,
      [fileId]: classification
    }));
    
    onClassify(fileId, classification);
  };
  
  const classifyFile = async (file: UploadedFile) => {
    if (!file.file) return;
    
    setProcessing(prev => ({ ...prev, [file.id]: true }));
    
    try {
      const response = await classifyFileWithAI(file.file);
      
      if (response.success && response.data) {
        handleClassificationChange(file.id, response.data.classification);
        
        toast({
          title: "Document classified",
          description: `"${file.file.name}" classified as ${response.data.classification} (${Math.round(response.data.confidence * 100)}% confidence)`
        });
      } else {
        toast({
          title: "Classification failed",
          description: response.error || "Failed to classify document",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Classification error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setProcessing(prev => ({ ...prev, [file.id]: false }));
    }
  };
  
  const handleBatchClassify = async () => {
    setIsClassifying(true);
    
    try {
      // Process all files
      for (const file of files) {
        if (file.file) {
          await classifyFile(file);
        }
      }
      
      // Save all classifications
      onBatchClassify(classifications);
      
      toast({
        title: "Classification complete",
        description: `Classified ${Object.keys(classifications).length} documents`
      });
    } catch (error) {
      toast({
        title: "Classification error",
        description: error instanceof Error ? error.message : "An error occurred during batch classification",
        variant: "destructive"
      });
    } finally {
      setIsClassifying(false);
    }
  };
  
  const getClassificationLabel = (type: DocumentClassification): string => {
    switch(type) {
      case 'invoice': return 'Invoice';
      case 'purchase_order': return 'Purchase Order';
      case 'bill': return 'Bill';
      case 'receipt': return 'Receipt';
      case 'email': return 'Email';
      case 'report': return 'Report';
      default: return 'Other';
    }
  };
  
  const getClassificationColor = (type: DocumentClassification): string => {
    switch(type) {
      case 'invoice': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'purchase_order': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'bill': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'receipt': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'email': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'report': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Document Classification</CardTitle>
            <CardDescription>Categorize your documents for better organization</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-classify" className="text-sm">Auto-classify</Label>
            <Switch 
              id="auto-classify" 
              checked={autoClassify} 
              onCheckedChange={handleAutoClassifyToggle} 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {files.length === 0 ? (
            <div className="text-center p-4 border rounded-md text-muted-foreground">
              No files to classify. Upload files first.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{file.file?.name}</span>
                      {classifications[file.id] && (
                        <Badge className={getClassificationColor(classifications[file.id])}>
                          {getClassificationLabel(classifications[file.id])}
                        </Badge>
                      )}
                    </div>
                    
                    {processing[file.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Select 
                        value={classifications[file.id] || ''} 
                        onValueChange={(value) => handleClassificationChange(file.id, value as DocumentClassification)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder="Category" />
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
                    )}
                  </div>
                ))}
              </div>
              
              {autoClassify && (
                <Button 
                  onClick={handleBatchClassify} 
                  className="w-full flex items-center justify-center gap-1"
                  disabled={isClassifying || files.length === 0}
                >
                  {isClassifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Classifying...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Classify All Documents</span>
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentClassificationComponent;
