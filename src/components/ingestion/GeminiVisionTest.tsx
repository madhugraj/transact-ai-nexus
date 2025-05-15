
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Brain, Image as ImageIcon, FileText, Table as TableIcon, Upload } from 'lucide-react';
import * as api from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DocumentPreview from './DocumentPreview';

const TableExtraction: React.FC = () => {
  // Default OCR prompt template
  const defaultPrompt = `You're an OCR assistant. Read this scanned document image and extract clean, structured text.
You are also an expert in extracting tables from scanned images.
If the image has Checks, Mention that it is a check image and extract the values accordingly.
- Give appropriate title for the image according to the type of image.
Instructions:
- Extract all clear tabular structures from the image.
- Extract all possible tabular structures with data from the image
- Extract the Headings of the table {extracted heading}
- Avoid any logos or text not part of a structured table.
- Output JSON only in the format:

\`\`\`json
{
  "tables": [
    {
      "title": "extracted heading",
      "headers": ["Column A", "Column B"],
      "rows": [
        ["value1", "value2"],
        ...
      ]
    }
  ]
}
\`\`\``;

  // Predefined prompt templates
  const promptTemplates = {
    tableExtraction: defaultPrompt,
    simpleOcr: "Extract all text from this image and maintain the formatting.",
    formExtraction: "Extract form fields and their values from this document in a structured format."
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>(defaultPrompt);
  const [result, setResult] = useState<string>('');
  const [tableData, setTableData] = useState<{
    tables: { title?: string; headers: string[]; rows: string[][]; }[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePromptTemplateChange = (value: string) => {
    switch(value) {
      case 'tableExtraction':
        setPrompt(promptTemplates.tableExtraction);
        break;
      case 'simpleOcr':
        setPrompt(promptTemplates.simpleOcr);
        break;
      case 'formExtraction':
        setPrompt(promptTemplates.formExtraction);
        break;
      case 'custom':
        // Keep current prompt for custom
        break;
    }
  };

  const processImage = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to process",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setResult('');
    setTableData(null);

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Convert image to base64
      const base64Image = await api.fileToBase64(selectedFile);
      setProgress(50);

      // Process with Gemini Vision
      const response = await api.processImageWithGemini(
        prompt,
        base64Image,
        selectedFile.type
      );

      // Try to extract tables from the image using our specialized function
      const tableResponse = await api.extractTablesFromImageWithGemini(
        base64Image,
        selectedFile.type,
        prompt
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success) {
        setResult(response.data || '');
        
        if (tableResponse.success && tableResponse.data) {
          console.log("Table extraction successful:", tableResponse.data);
          setTableData(tableResponse.data);
        }
        
        toast({
          title: "Image processed successfully",
          description: "Table extraction complete",
        });
      } else {
        toast({
          title: "Processing failed",
          description: response.error || "An error occurred during processing",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TableIcon className="h-5 w-5 mr-2 text-blue-500" />
            Table Extraction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column - Document Upload & Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image/PDF
                </Button>
                <Button
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={processImage}
                  disabled={!selectedFile || isProcessing}
                >
                  {isProcessing ? "Processing..." : "Extract Tables"}
                </Button>
              </div>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
              
              {/* Document Preview */}
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Document Preview</h3>
                <DocumentPreview 
                  fileUrl={filePreviewUrl}
                  fileName={selectedFile?.name}
                  fileType={selectedFile?.type}
                  height="300px"
                />
              </div>
            </div>

            {/* Right column - Prompt & Settings */}
            <div className="space-y-4">
              {/* Prompt Templates */}
              <div className="space-y-2">
                <label htmlFor="promptTemplate" className="text-sm font-medium">
                  Prompt Template
                </label>
                <Select onValueChange={handlePromptTemplateChange} defaultValue="tableExtraction">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a prompt template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tableExtraction">Table Extraction</SelectItem>
                    <SelectItem value="simpleOcr">Simple OCR</SelectItem>
                    <SelectItem value="formExtraction">Form Extraction</SelectItem>
                    <SelectItem value="custom">Custom Prompt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Extraction Prompt
                </label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-24 text-xs font-mono"
                  placeholder="Enter instructions for table extraction"
                  disabled={isProcessing}
                />
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Processing with Gemini AI</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {(tableData || result) && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Extraction Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Table Results */}
              {tableData && tableData.tables && tableData.tables.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <TableIcon className="h-4 w-4 mr-1" />
                    Extracted Tables
                  </h3>
                  {tableData.tables.map((table, tableIndex) => (
                    <div key={tableIndex} className="border rounded-md p-4 mt-2 bg-white dark:bg-gray-900">
                      {table.title && <h4 className="font-medium mb-2">{table.title}</h4>}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              {table.headers.map((header, i) => (
                                <th key={i} className="px-3 py-2 bg-muted/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {table.rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-sm">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Raw JSON Results - Minimalistic View */}
              {result && (
                <div className="mt-4 space-y-2 collapse">
                  <details>
                    <summary className="text-sm font-medium flex items-center cursor-pointer">
                      <FileText className="h-4 w-4 mr-1" />
                      Raw Extracted Text
                    </summary>
                    <div className="p-3 border rounded-md bg-muted/10 mt-2 overflow-auto max-h-96">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{result}</pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TableExtraction;
