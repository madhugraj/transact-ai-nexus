
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Brain, Image as ImageIcon, FileText, Table as TableIcon } from 'lucide-react';
import * as api from '@/services/api';

const GeminiVisionTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('Analyze this image and extract all text and data.');
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
      // Only allow image files
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
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

      // Try to extract tables from the image
      const tableExtractPrompt = `
You are an expert in extracting tables from scanned images.
Instructions:
- Extract all clear tabular structures from the image.
- Output JSON only in the format:
\`\`\`json
{
  "tables": [
    {
      "title": "optional title",
      "headers": ["Column A", "Column B"],
      "rows": [
        ["value1", "value2"],
        ...
      ]
    }
  ]
}
\`\`\``;

      // Use the processImageWithGemini function as a fallback since extractTablesFromImageWithGemini 
      // might not be available yet in the build
      const tableResponse = await api.processImageWithGemini(
        tableExtractPrompt,
        base64Image,
        selectedFile.type
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success) {
        setResult(response.data || '');
        
        if (tableResponse.success && tableResponse.data) {
          try {
            // Try to parse table data from the response
            const jsonMatch = tableResponse.data.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
            if (jsonMatch) {
              const parsedData = JSON.parse(jsonMatch[0]);
              if (parsedData.tables && Array.isArray(parsedData.tables)) {
                setTableData(parsedData);
              }
            }
          } catch (parseError) {
            console.error("Failed to parse table data:", parseError);
          }
        }
        
        toast({
          title: "Image processed successfully",
          description: "Gemini Vision has analyzed your image",
        });
      } else {
        toast({
          title: "Processing failed",
          description: response.error || "An error occurred during processing",
          variant: "destructive",
        });
      }
    } catch (error) {
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
          <Brain className="h-5 w-5 mr-2 text-blue-500" />
          Gemini Vision Test
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
                accept="image/*"
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
                Select Image
              </Button>
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <label htmlFor="prompt" className="text-sm font-medium">
              Prompt for Gemini
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24"
              placeholder="Enter instructions for Gemini Vision"
              disabled={isProcessing}
            />
          </div>

          {/* Process Button */}
          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            onClick={processImage}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? "Processing..." : "Process with Gemini Vision"}
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
                Gemini Vision Results
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

export default GeminiVisionTest;
