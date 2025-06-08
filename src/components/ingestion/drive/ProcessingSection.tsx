
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ProcessingStats from './processing/ProcessingStats';
import { Loader, Play, X } from 'lucide-react';
import { extractPODataFromFile } from '@/services/api/poProcessingService';
import PODataDisplay from './PODataDisplay';

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
        description: `Processing ${downloadedFiles.length} PO file(s)...`,
      });

      const results = [];
      
      for (let i = 0; i < downloadedFiles.length; i++) {
        const file = downloadedFiles[i];
        console.log(`📄 Processing file ${i + 1}/${downloadedFiles.length}: ${file.name}`);
        
        try {
          // Use our dedicated PO processing service
          const extractionResult = await extractPODataFromFile(file);

          if (extractionResult.success && extractionResult.data) {
            results.push({
              fileName: file.name,
              fileSize: file.size,
              status: 'success',
              data: extractionResult.data,
              supabaseData: extractionResult.supabaseData,
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
            console.log(`❌ Failed to process: ${file.name}`, extractionResult.error);
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

        // Update results incrementally so user can see progress
        setProcessingResults([...results]);
      }

      onProcessingComplete(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      toast({
        title: "Processing Complete",
        description: `Successfully processed ${successCount} files. ${errorCount > 0 ? `${errorCount} errors.` : ''}`,
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
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium text-sm">Ready to Process</h3>
            <p className="text-xs text-muted-foreground">
              {downloadedFiles.length} file{downloadedFiles.length !== 1 ? 's' : ''} ready for PO analysis
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

      {/* Display Processing Results */}
      {processingResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Processing Results ({processingResults.length})</h3>
          {processingResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-sm">{result.fileName}</h4>
                  <p className="text-xs text-muted-foreground">
                    {result.status === 'success' ? 'Successfully processed' : 'Processing failed'}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </div>
              </div>

              {result.status === 'success' && result.data && (
                <PODataDisplay 
                  poData={result.data} 
                  fileName={result.fileName}
                  supabaseData={result.supabaseData}
                />
              )}

              {result.status === 'error' && result.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800">Error: {result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcessingSection;
