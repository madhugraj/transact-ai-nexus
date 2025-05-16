
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { extractTablesFromImageWithGemini } from '@/services/api/gemini/tableExtractor';
import { Loader, Download, FileText, MessageSquare } from 'lucide-react';
import ExtractedTablePreview from './ExtractedTablePreview';
import AIAssistantDialog from '../assistant/AIAssistantDialog';
import { saveProcessedTables } from '@/utils/documentStorage';

interface TableExtractionResult {
  tables?: {
    title?: string;
    headers?: string[];
    rows?: string[][];
  }[];
}

const TableExtraction: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<TableExtractionResult | null>(null);
  const [displayFormat, setDisplayFormat] = useState<'table' | 'json'>('table');
  const [generatedTableId, setGeneratedTableId] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const { toast } = useToast();

  // Effect to reset extraction results when file changes
  useEffect(() => {
    if (selectedFile) {
      setExtractionResult(null);
      // Create local URL for preview
      const localUrl = URL.createObjectURL(selectedFile);
      setImagePreviewUrl(localUrl);
      
      return () => {
        URL.revokeObjectURL(localUrl);
      };
    } else {
      setImagePreviewUrl(null);
    }
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  // Handle extraction of tables from image
  const handleExtract = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setExtractionResult(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        const base64Content = base64Image.split(',')[1];

        // Call Gemini API for table extraction
        const result = await extractTablesFromImageWithGemini(
          base64Content,
          selectedFile.type,
          prompt || undefined
        );

        if (!result.success) {
          toast({
            title: "Extraction failed",
            description: result.error || "Failed to extract tables from the image",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        console.log("Extraction result:", result.data);

        // Process the result
        if (result.data && result.data.tables && result.data.tables.length > 0) {
          setExtractionResult(result.data);
          
          // Generate a unique ID for the table and save it
          const tableId = `table-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          setGeneratedTableId(tableId);
          
          // Save the extracted tables to localStorage for AI Assistant
          const tablesWithMetadata = result.data.tables.map((table, index) => ({
            id: `${tableId}-${index}`,
            title: table.title || `Extracted Table ${index + 1}`,
            name: table.title || `${selectedFile.name} - Table ${index + 1}`,
            headers: table.headers || [],
            rows: table.rows || [],
            type: 'table',
            extractedAt: new Date().toISOString()
          }));
          
          saveProcessedTables(tablesWithMetadata);
          
          toast({
            title: "Extraction successful",
            description: `Extracted ${result.data.tables.length} table(s)`,
          });
        } else {
          toast({
            title: "No tables found",
            description: "No tables were detected in the image",
            variant: "default",
          });
        }
      };
    } catch (error) {
      toast({
        title: "Error during extraction",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!extractionResult || !extractionResult.tables || extractionResult.tables.length === 0) {
      toast({
        title: "No data to download",
        description: "Please extract table data first",
        variant: "default",
      });
      return;
    }

    try {
      // Generate CSV content
      const table = extractionResult.tables[0];
      let csvContent = '';
      
      // Add headers
      if (table.headers && table.headers.length > 0) {
        csvContent += table.headers.map(header => `"${header}"`).join(',') + '\n';
      }
      
      // Add rows
      if (table.rows && table.rows.length > 0) {
        table.rows.forEach(row => {
          csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
      }
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedFile?.name || 'table'}-extracted.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download complete",
        description: "Table data has been downloaded as CSV",
      });
    } catch (error) {
      toast({
        title: "Download error",
        description: error instanceof Error ? error.message : "Failed to download table data",
        variant: "destructive",
      });
    }
  };

  const openAIAssistant = () => {
    if (!extractionResult || !extractionResult.tables || extractionResult.tables.length === 0) {
      toast({
        title: "No table data available",
        description: "Please extract a table first before using the AI Assistant",
        variant: "destructive",
      });
      return;
    }

    // Get the last generated table ID
    if (!generatedTableId) {
      toast({
        title: "Table data not properly saved",
        description: "Please try extracting the table again",
        variant: "destructive",
      });
      return;
    }

    // Open the AI Assistant with the selected document
    setShowAIAssistant(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Upload Image</h3>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          
          {imagePreviewUrl && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Image Preview</h3>
              <div className="relative border rounded-md overflow-hidden">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Custom Extraction Prompt (Optional)</h3>
            <Textarea
              placeholder="Enter a custom prompt to guide the table extraction..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Leave blank to use the default extraction prompt
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button 
              onClick={handleExtract} 
              disabled={!selectedFile || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? <Loader className="h-4 w-4 animate-spin" /> : null}
              Extract
            </Button>
            
            {extractionResult && extractionResult.tables && extractionResult.tables.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
                
                <Button
                  variant="outline"
                  onClick={openAIAssistant}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Ask AI Assistant
                </Button>
                
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={displayFormat === 'table' ? 'bg-muted' : ''}
                    onClick={() => setDisplayFormat('table')}
                  >
                    Table
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={displayFormat === 'json' ? 'bg-muted' : ''}
                    onClick={() => setDisplayFormat('json')}
                  >
                    Results (Formatted)
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isProcessing && (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg">Extracting tables from image...</p>
          <p className="text-sm text-muted-foreground mt-2">
            This may take a few moments depending on image complexity
          </p>
        </div>
      )}
      
      {extractionResult && !isProcessing && (
        <div className="space-y-4">
          <h3 className="text-xl font-medium">Extraction Results</h3>
          
          {extractionResult.tables && extractionResult.tables.length > 0 ? (
            extractionResult.tables.map((table, index) => (
              <div key={index} className="space-y-2">
                {table.title && <h4 className="text-lg font-medium">{table.title}</h4>}
                <ExtractedTablePreview 
                  initialData={{
                    headers: table.headers || [],
                    rows: table.rows || []
                  }}
                  displayFormat={displayFormat}
                />
              </div>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg">No tables found in the image</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting the extraction prompt or using a different image
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* AI Assistant Dialog */}
      <AIAssistantDialog
        open={showAIAssistant}
        onOpenChange={setShowAIAssistant}
        initialDocument={generatedTableId ? `${generatedTableId}-0` : undefined}
        initialPrompt="Analyze this table data and provide key insights"
      />
    </div>
  );
};

export default TableExtraction;
