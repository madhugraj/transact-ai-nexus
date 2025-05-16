import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileIcon, Table, AlertTriangle, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DocumentPreview from './DocumentPreview';
import EnhancedTablePreview from './EnhancedTablePreview';
import { extractTablesFromImageWithGemini, fileToBase64 } from '@/services/api';
import { uploadFileToStorage, checkFileProcessed, ensureStorageBucketExists } from '@/services/supabase/fileService';
import { saveExtractedTable } from '@/services/supabase/tableService';
import { saveProcessedTables } from '@/utils/documentStorage';
import { v4 as uuidv4 } from 'uuid';

const TableExtractionPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [initializingStorage, setInitializingStorage] = useState(false);
  const [extractedTableId, setExtractedTableId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check storage bucket exists on component mount
  useEffect(() => {
    const checkStorageBucket = async () => {
      setInitializingStorage(true);
      setUploadError(null);
      
      try {
        console.log("Checking storage bucket existence...");
        const exists = await ensureStorageBucketExists();
        
        if (!exists) {
          console.error("Failed to initialize storage bucket");
          setUploadError('Failed to initialize storage. Please try again later.');
          toast({
            title: "Storage Error",
            description: "Failed to initialize storage. The RLS policies may need to be configured.",
            variant: "destructive",
          });
        } else {
          console.log("Storage bucket exists and is ready for use");
          toast({
            title: "Storage Ready",
            description: "Storage has been successfully initialized and is ready to use.",
          });
        }
      } catch (err) {
        console.error("Error checking storage bucket:", err);
        setUploadError('Error connecting to storage. Please try again later.');
      } finally {
        setInitializingStorage(false);
      }
    };
    
    checkStorageBucket();
  }, [toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    // Reset any previous errors
    setError(null);
    setUploadError(null);
    
    // Validate file type (images and PDFs)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG) or PDF file",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));
    
    // Clear previous extraction data
    setExtractedData(null);
    setExtractedTableId(null);
    
    // Switch to the preview tab
    setActiveTab('preview');
  };
  
  const simulateProgress = () => {
    setProcessingProgress(0);
    
    const increment = () => {
      setProcessingProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 10;
      });
    };
    
    // Simulate the progress with intervals
    const interval = setInterval(increment, 300);
    
    return () => clearInterval(interval);
  };

  const handleExtractTable = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload an image or PDF file first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      setActiveTab('processing');
      setError(null);
      setUploadError(null);
      
      // Start progress simulation
      const stopProgress = simulateProgress();
      
      console.log("Starting table extraction process");
      
      // Check if this file has been processed before
      const existingFile = await checkFileProcessed(file.name, file.size);
      
      if (existingFile && existingFile.processed) {
        console.log("File already processed, using cached data:", existingFile);
        toast({
          title: "File already processed",
          description: "This file was previously processed. Using cached data.",
        });
      }
      
      console.log("Uploading file to storage...");
      // Upload file to Supabase storage
      try {
        const storageResult = await uploadFileToStorage(file);
        
        if (!storageResult) {
          setUploadError("Failed to upload file to storage. Please try again.");
          console.error("Failed to upload file to storage");
          throw new Error("Failed to upload file to storage");
        }
        
        console.log("File uploaded successfully, extracting tables...");
        toast({
          title: "Upload successful",
          description: "Now extracting tables from document...",
        });
        
        // Use Gemini Vision to extract tables from image
        const base64File = await fileToBase64(file);
        console.log("File converted to base64, sending to Gemini...");
        
        const extractResult = await extractTablesFromImageWithGemini(
          base64File,
          file.type
        );
        
        // Stop progress simulation
        stopProgress();
        setProcessingProgress(100);
        
        if (!extractResult.success || !extractResult.data?.tables || extractResult.data.tables.length === 0) {
          const errorMessage = extractResult.error || "No tables found in the image. Try with another image that contains clear tabular data.";
          setError(errorMessage);
          setIsProcessing(false);
          toast({
            title: "Extraction failed",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
        
        console.log('Extraction successful:', extractResult.data);
        
        // Get the first table
        const firstTable = extractResult.data.tables[0];
        
        // Save to Supabase
        if (storageResult.fileId) {
          console.log("Saving extracted table to Supabase...");
          const tableId = await saveExtractedTable(
            storageResult.fileId,
            firstTable.title || `Table from ${file.name}`,
            firstTable.headers,
            firstTable.rows,
            firstTable.confidence || 0.9
          );
          
          console.log('Table saved to Supabase with ID:', tableId);
          
          if (tableId) {
            // Include the Supabase IDs in the extracted data
            firstTable.id = tableId;
            firstTable.fileId = storageResult.fileId;
            setExtractedTableId(tableId);
          }
        }
        
        // Save to local storage for AI Assistant
        await saveProcessedTables([{
          id: firstTable.id || `table-${uuidv4()}`,
          title: firstTable.title || `Table from ${file.name}`,
          name: firstTable.title || `Table from ${file.name}`,
          headers: firstTable.headers,
          rows: firstTable.rows,
          confidence: firstTable.confidence || 0.9,
          fileId: storageResult.fileId,
          extractedAt: new Date().toISOString()
        }]);
        
        // Set the extracted data
        setExtractedData({
          headers: firstTable.headers,
          rows: firstTable.rows,
          metadata: {
            totalRows: firstTable.rows.length,
            confidence: firstTable.confidence || 0.9,
            sourceFile: file.name
          }
        });
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('documentProcessed'));
        
        // Switch to the results tab
        setActiveTab('results');
        
        // Show success toast
        toast({
          title: "Extraction successful",
          description: `Found ${extractResult.data.tables.length} table(s) in the document`,
        });
      } catch (uploadError) {
        stopProgress();
        setProcessingProgress(0);
        setIsProcessing(false);
        
        const errorMessage = uploadError instanceof Error 
          ? uploadError.message 
          : "Failed to upload file. Please check your connection and try again.";
        
        setUploadError(errorMessage);
        toast({
          title: "Upload Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Error extracting table:', error);
      setError(error instanceof Error ? error.message : "Unknown error occurred during extraction");
      toast({
        title: "Extraction error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(100);
    }
  };
  
  const handleNewUpload = () => {
    setFile(null);
    setFileUrl(null);
    setExtractedData(null);
    setError(null);
    setUploadError(null);
    setActiveTab('upload');
    setProcessingProgress(0);
    setExtractedTableId(null);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleAnalyzeWithAI = () => {
    // Navigate to assistant page with tableId parameter
    if (extractedTableId) {
      navigate(`/assistant?tableId=${extractedTableId}`);
    } else {
      // If no tableId (e.g., using local storage), create a parameter based on available data
      navigate(`/assistant?docId=latest`);
    }
    
    toast({
      title: "Opening AI Assistant",
      description: "Loading table data for analysis",
    });
  };

  const handleRetryStorageInit = async () => {
    setInitializingStorage(true);
    setUploadError(null);
    
    try {
      const exists = await ensureStorageBucketExists();
      
      if (!exists) {
        setUploadError('Still unable to initialize storage. Please try again later.');
        toast({
          title: "Storage Error Persists",
          description: "We're still having trouble with storage. Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Storage Connected",
          description: "Storage system is now ready to use.",
        });
      }
    } catch (error) {
      setUploadError('Failed to connect to storage. Please try again later.');
    } finally {
      setInitializingStorage(false);
    }
  };
  
  const renderUploadTab = () => (
    <div className="flex flex-col items-center justify-center py-10 px-6 space-y-6">
      <div className="rounded-full bg-primary/10 p-6">
        <Upload className="h-12 w-12 text-primary" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Upload a document with tables</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Upload an image or PDF file containing tables. We'll use AI to extract the table data automatically.
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/jpeg,image/png,image/webp,application/pdf" 
          onChange={handleFileChange} 
          className="hidden" 
          id="file-upload"
        />
        <Button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
          size="lg"
          disabled={initializingStorage}
        >
          {initializingStorage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Initializing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Select file
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Supported formats: JPEG, PNG, PDF
        </p>
      </div>
    </div>
  );
  
  const renderPreviewTab = () => (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-full max-w-xl border rounded-lg overflow-hidden bg-muted/30 p-2">
          <DocumentPreview 
            fileUrl={fileUrl}
            fileName={file?.name || 'Document'}
            fileType={file?.type || 'application/pdf'}
          />
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <Button onClick={handleNewUpload} variant="outline">
            Choose different file
          </Button>
          <Button onClick={handleExtractTable} disabled={!file || initializingStorage}>
            <Table className="h-4 w-4 mr-2" /> Extract Tables
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-4 mt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderProcessingTab = () => (
    <div className="flex flex-col items-center justify-center py-10 px-6 space-y-8">
      <Loader2 className="h-12 w-12 text-primary animate-spin" />
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Extracting tables...</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          We're using AI to extract tables from your document. This may take a minute.
        </p>
        
        <div className="w-full max-w-md space-y-2">
          <Progress value={processingProgress} className="w-full h-2" />
          <p className="text-xs text-right text-muted-foreground">
            {Math.round(processingProgress)}%
          </p>
        </div>
      </div>
    </div>
  );
  
  const renderResultsTab = () => (
    <div className="space-y-6 py-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Original Document</h3>
          <div className="border rounded-lg overflow-hidden bg-muted/30 p-2">
            <DocumentPreview 
              fileUrl={fileUrl}
              fileName={file?.name || 'Document'}
              fileType={file?.type || 'application/pdf'}
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Extracted Table</h3>
          <EnhancedTablePreview initialData={extractedData} />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-4 mt-6">
        <Button 
          onClick={handleAnalyzeWithAI} 
          className="w-full md:w-auto flex items-center gap-2"
          variant="default"
        >
          <BrainCircuit className="h-4 w-4" /> 
          Analyze with AI Assistant
        </Button>
        
        <Button 
          onClick={handleNewUpload} 
          variant="outline"
          className="w-full md:w-auto"
        >
          Process another document
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Table className="h-5 w-5" />
          Table Extraction
        </CardTitle>
        <CardDescription>
          Extract tables from documents and images using AI
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {uploadError && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-4 mb-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium">Storage Error</p>
                  <p className="text-sm">{uploadError}</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-8 w-fit" 
                onClick={handleRetryStorageInit}
                disabled={initializingStorage}
              >
                {initializingStorage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
                  </>
                ) : (
                  <>Retry Connection</>
                )}
              </Button>
            </div>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="upload" disabled={isProcessing || initializingStorage}>
              <Upload className="h-4 w-4 mr-2" /> Upload
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!file || isProcessing || initializingStorage}>
              <FileIcon className="h-4 w-4 mr-2" /> Preview
            </TabsTrigger>
            <TabsTrigger value="processing" disabled={!isProcessing || initializingStorage}>
              <Loader2 className="h-4 w-4 mr-2" /> Processing
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!extractedData || isProcessing || initializingStorage}>
              <Table className="h-4 w-4 mr-2" /> Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">{renderUploadTab()}</TabsContent>
          <TabsContent value="preview">{renderPreviewTab()}</TabsContent>
          <TabsContent value="processing">{renderProcessingTab()}</TabsContent>
          <TabsContent value="results">{renderResultsTab()}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TableExtractionPage;
