
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PODetectionAgent } from '@/services/agents/PODetectionAgent';
import { PODataExtractionAgent } from '@/services/agents/PODataExtractionAgent';
import { Loader, FileText, CheckCircle, XCircle } from 'lucide-react';

interface POFileProcessorProps {
  selectedFiles: File[];
  onProcessingComplete?: (results: any[]) => void;
}

const POFileProcessor = ({ selectedFiles, onProcessingComplete }: POFileProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<any[]>([]);
  const { toast } = useToast();

  const processPOFiles = async () => {
    console.log('🔄 Starting PO file processing for', selectedFiles.length, 'files');
    setIsProcessing(true);
    setProcessingResults([]);

    const poDetectionAgent = new PODetectionAgent();
    const poDataExtractionAgent = new PODataExtractionAgent();
    const results = [];

    try {
      for (const [index, file] of selectedFiles.entries()) {
        console.log(`📄 Processing file ${index + 1}/${selectedFiles.length}:`, file.name);
        
        try {
          // Step 1: Detect if it's a PO
          const detectionResult = await poDetectionAgent.process(file);
          
          if (!detectionResult.success) {
            console.error('❌ Detection failed for', file.name);
            results.push({
              fileName: file.name,
              isPO: false,
              error: detectionResult.error || 'Detection failed',
              status: 'error'
            });
            continue;
          }

          const isPO = detectionResult.data?.is_po;
          console.log(`🔍 Detection result for ${file.name}:`, isPO ? 'IS PO' : 'NOT PO');

          if (!isPO) {
            results.push({
              fileName: file.name,
              isPO: false,
              reason: detectionResult.data?.reason,
              status: 'skipped'
            });
            continue;
          }

          // Step 2: Extract PO data
          const extractionResult = await poDataExtractionAgent.process(file);
          
          if (!extractionResult.success) {
            console.error('❌ Extraction failed for', file.name);
            results.push({
              fileName: file.name,
              isPO: true,
              error: extractionResult.error || 'Data extraction failed',
              status: 'error'
            });
            continue;
          }

          const extractedData = extractionResult.data;
          console.log(`📊 Extracted data for ${file.name}:`, extractedData);

          // Step 3: Store in po_table
          try {
            console.log(`💾 Inserting PO data for ${file.name} into database...`);
            
            const { data: insertData, error: insertError } = await supabase
              .from('po_table')
              .insert({
                file_name: file.name,
                po_number: extractedData.po_number,
                po_date: extractedData.po_date,
                vendor_code: extractedData.vendor_code,
                gstn: extractedData.gstn,
                project: extractedData.project,
                bill_to_address: extractedData.bill_to_address,
                ship_to: extractedData.ship_to,
                del_start_date: extractedData.del_start_date,
                del_end_date: extractedData.del_end_date,
                terms_conditions: extractedData.terms_conditions,
                description: extractedData.description
              })
              .select();

            if (insertError) {
              console.error('❌ Database insert failed for', file.name, ':', insertError);
              results.push({
                fileName: file.name,
                isPO: true,
                extractedData,
                error: `Database error: ${insertError.message}`,
                status: 'error'
              });
            } else {
              console.log('✅ Successfully stored PO data for', file.name);
              results.push({
                fileName: file.name,
                isPO: true,
                extractedData,
                dbRecord: insertData?.[0],
                status: 'success'
              });
            }
          } catch (dbError) {
            console.error('❌ Database exception for', file.name, ':', dbError);
            results.push({
              fileName: file.name,
              isPO: true,
              extractedData,
              error: dbError instanceof Error ? dbError.message : 'Database exception',
              status: 'error'
            });
          }
        } catch (fileError) {
          console.error('❌ File processing error for', file.name, ':', fileError);
          results.push({
            fileName: file.name,
            isPO: false,
            error: fileError instanceof Error ? fileError.message : 'Processing failed',
            status: 'error'
          });
        }
      }

      setProcessingResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const poCount = results.filter(r => r.isPO).length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      toast({
        title: "PO Processing Complete",
        description: `Processed ${selectedFiles.length} files. Found ${poCount} PO files, successfully stored ${successCount} records${errorCount > 0 ? `, ${errorCount} errors` : ''}.`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

      onProcessingComplete?.(results);

    } catch (error) {
      console.error('❌ PO processing error:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process PO files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      default:
        return <Loader className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">PO File Processing</h3>
        <Button
          onClick={processPOFiles}
          disabled={isProcessing || selectedFiles.length === 0}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Process ${selectedFiles.length} File(s)`
          )}
        </Button>
      </div>

      {processingResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Processing Results:</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {processingResults.map((result, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                {getStatusIcon(result.status)}
                <span className="flex-1 truncate">{result.fileName}</span>
                <span className="text-sm text-muted-foreground">
                  {result.isPO ? 'PO File' : 'Not PO'} - {result.status}
                </span>
                {result.error && (
                  <span className="text-xs text-red-500 truncate max-w-xs" title={result.error}>
                    {result.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default POFileProcessor;
