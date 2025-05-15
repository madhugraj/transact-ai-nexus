import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Brain, Image as ImageIcon, FileText, Table as TableIcon } from 'lucide-react';
import * as api from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
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
        selectedFile.type
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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TableIcon className="h-5 w-5 mr-2 text-blue-500" />
          Table Extraction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Image Upload */}
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label htmlFor="image-upload" className="text-sm font-medium">
              Upload Image
            </label>
            <div className="flex gap-2">
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={isProcessing}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Select Image/PDF
              </Button>
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedFile.name} ({selectedFile.type})
              </p>
            )}
          </div>

          {/* Prompt Templates */}
          <div className="space-y-1.5">
            <label htmlFor="promptTemplate" className="text-sm font-medium">
              Prompt Template
            </label>
            <Select onValueChange={handlePromptTemplateChange} defaultValue="tableExtraction">
              <SelectTrigger>
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
          <div className="space-y-1.5">
            <label htmlFor="prompt" className="text-sm font-medium">
              Prompt for Table Extraction
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24"
              placeholder="Enter instructions for table extraction"
              disabled={isProcessing}
            />
          </div>

          {/* Process Button */}
          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            onClick={processImage}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? "Processing..." : "Extract Tables"}
          </Button>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Processing image with Gemini AI</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Table Results */}
          {tableData && tableData.tables && tableData.tables.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <TableIcon className="h-4 w-4 mr-1" />
                Extracted Tables
              </h3>
              {tableData.tables.map((table, tableIndex) => (
                <div key={tableIndex} className="border rounded-md p-4 mt-2">
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

          {/* Text Results */}
          {result && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Extracted Text
              </h3>
              <div className="p-3 border rounded-md bg-muted/10 whitespace-pre-line text-sm">
                {result}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TableExtraction;
