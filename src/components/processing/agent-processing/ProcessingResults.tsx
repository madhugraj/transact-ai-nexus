
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingResult {
  fileName: string;
  isPO: boolean;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  reason?: string;
  extractedData?: any;
  dbRecord?: any;
}

interface ProcessingResultsProps {
  results?: ProcessingResult[];
  processingResults?: any;
  hasFileToPreview?: boolean;
  getFileUrl?: () => string | null;
  files?: any[];
}

export const ProcessingResults: React.FC<ProcessingResultsProps> = ({ 
  results, 
  processingResults, 
  hasFileToPreview,
  getFileUrl,
  files 
}) => {
  // Use either results prop or processingResults prop
  const resultData = results || processingResults || [];
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="text-green-600 border-green-200">Success</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600 border-red-200">Error</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Skipped</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!resultData || !Array.isArray(resultData) || resultData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No processing results available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Processing Results</h3>
      
      <div className="grid gap-3">
        {resultData.map((result, index) => (
          <Card key={index} className={cn(
            "border-l-4",
            result.status === 'success' && "border-l-green-500",
            result.status === 'error' && "border-l-red-500",
            result.status === 'skipped' && "border-l-yellow-500"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className="truncate">{result.fileName}</span>
                </div>
                {getStatusBadge(result.status)}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">PO Detected:</span>
                  <span className={cn(
                    result.isPO ? "text-green-600" : "text-gray-600"
                  )}>
                    {result.isPO ? 'Yes' : 'No'}
                  </span>
                </div>
                
                {result.error && (
                  <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
                
                {result.reason && (
                  <div className="text-yellow-600 text-xs bg-yellow-50 p-2 rounded">
                    <strong>Reason:</strong> {result.reason}
                  </div>
                )}
                
                {result.extractedData && (
                  <div className="text-green-600 text-xs bg-green-50 p-2 rounded">
                    <strong>Data Extracted:</strong> PO Number: {result.extractedData.po_number || 'N/A'}
                    {result.extractedData.vendor_code && (
                      <span>, Vendor: {result.extractedData.vendor_code}</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
