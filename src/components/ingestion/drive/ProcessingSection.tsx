
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ProcessingStats from './processing/ProcessingStats';
import { Loader, Play, X } from 'lucide-react';
import { extractTablesFromImage } from '@/services/api/geminiService';

interface ProcessingSectionProps {
  downloadedFiles: File[];
  onProcessingComplete: (results: any[]) => void;
  onClose: () => void;
}

const ProcessingSection = ({ downloadedFiles, onProcessingComplete, onClose }: ProcessingSectionProps) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingResults, setProcessingResults] = React.useState<any[]>([]);
  const { toast } = useToast();

  if (downloadedFiles.length === 0) return null;

  const processPOFiles = async () => {
    console.log(`🚀 Starting bulk processing of ${downloadedFiles.length} files...`);
    setIsProcessing(true);
    setProcessingResults([]);
    
    try {
      toast({
        title: "Processing Started",
        description: `Processing ${downloadedFiles.length} PO file(s) with Gemini AI...`,
      });

      const results = [];
      
      for (let i = 0; i < downloadedFiles.length; i++) {
        const file = downloadedFiles[i];
        console.log(`📄 Processing file ${i + 1}/${downloadedFiles.length}: ${file.name}`);
        
        try {
          // Use Gemini to extract PO data
          const extractionResult = await extractTablesFromImage(file, `
            Extract Purchase Order (PO) data from this document. Return structured JSON with:
            {
              "po_number": "PO number",
              "vendor": "Vendor name",
              "date": "PO date",
              "total_amount": "Total amount",
              "items": [
                {
                  "description": "Item description",
                  "quantity": "Quantity",
                  "unit_price": "Unit price",
                  "total": "Line total"
                }
              ],
              "shipping_address": "Shipping address",
              "billing_address": "Billing address"
            }
          `);

          if (extractionResult.success && extractionResult.data) {
            results.push({
              fileName: file.name,
              fileSize: file.size,
              status: 'success',
              data: extractionResult.data,
              processingTime: Date.now()
            });
            console.log(`✅ Successfully processed: ${file.name}`);
          } else {
            results.push({
              fileName: file.name,
              fileSize: file.size,
              status: 'error',
              error: extractionResult.error || 'Failed to extract data',
              processingTime: Date.now()
            });
            console.log(`❌ Failed to process: ${file.name}`);
          }
        } catch (error) {
          results.push({
            fileName: file.name,
            fileSize: file.size,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: Date.now()
          });
          console.error(`❌ Error processing ${file.name}:`, error);
        }
      }

      setProcessingResults(results);
      onProcessingComplete(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      toast({
        title: "Processing Complete",
        description: `Processed ${successCount} files successfully. ${errorCount > 0 ? `${errorCount} errors.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

    } catch (error) {
      console.error(`❌ Bulk processing error:`, error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-sm">Ready to Process</h3>
          <p className="text-xs text-muted-foreground">
            {downloadedFiles.length} file{downloadedFiles.length !== 1 ? 's' : ''} ready for PO analysis with Gemini AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={processPOFiles}
            disabled={isProcessing}
            size="sm"
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Process Files
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ProcessingStats 
        results={processingResults} 
        isProcessing={isProcessing} 
      />
    </div>
  );
};

export default ProcessingSection;
