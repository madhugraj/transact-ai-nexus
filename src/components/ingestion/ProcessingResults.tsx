
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileText, Database, AlertCircle, Clock } from 'lucide-react';

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  labels: string[];
}

interface ProcessingResult {
  email: GmailMessage;
  emailContext: any;
  attachments: any[];
  invoiceValidation: any[];
  extractedData: any[];
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

interface ProcessingResultsProps {
  results: ProcessingResult[];
}

const ProcessingResults: React.FC<ProcessingResultsProps> = ({ results }) => {
  const getSuccessfulInvoices = () => {
    return results.reduce((count, result) => {
      return count + result.extractedData.filter(ext => ext.success).length;
    }, 0);
  };

  const getTotalAttachments = () => {
    return results.reduce((count, result) => count + result.attachments.length, 0);
  };

  const getTotalDetectedAttachments = () => {
    return results.reduce((count, result) => {
      return count + (result.emailContext?.context?.attachmentCount || 0);
    }, 0);
  };

  const getProcessedInvoices = () => {
    return results.reduce((count, result) => {
      return count + result.invoiceValidation.filter(v => v.success && v.data?.is_invoice).length;
    }, 0);
  };

  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          {getSuccessfulInvoices()} invoices extracted
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <FileText className="h-3 w-3 mr-1" />
          {getProcessedInvoices()} invoices detected
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700">
          <Clock className="h-3 w-3 mr-1" />
          {getTotalAttachments()} supported processed
        </Badge>
        <Badge variant="outline" className="bg-gray-50 text-gray-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          {getTotalDetectedAttachments()} total found
        </Badge>
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          <Database className="h-3 w-3 mr-1" />
          Stored in database
        </Badge>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {results.map((result, index) => (
          <div key={index} className="border rounded p-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium truncate">{result.email.subject}</span>
              <Badge variant={result.status === 'completed' ? 'default' : 'destructive'}>
                {result.status}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              {result.emailContext && (
                <div className="flex items-center gap-1">
                  {result.emailContext.isLikelyInvoice ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                  )}
                  Invoice context: {result.emailContext.isLikelyInvoice ? 'Detected' : 'Not detected'}
                  {result.emailContext.context.invoiceKeywords.length > 0 && (
                    <span className="ml-1">({result.emailContext.context.invoiceKeywords.join(', ')})</span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>📎 {result.emailContext?.context?.attachmentCount || 0} total attachments</div>
                <div>📋 {result.attachments.length} supported types</div>
                <div>✅ {result.invoiceValidation.filter(v => v.success && v.data?.is_invoice).length} invoices detected</div>
                <div>📊 {result.extractedData.filter(e => e.success).length} data extracted</div>
              </div>
              
              {result.attachments.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">Attachment Details:</div>
                  {result.attachments.map((att, attIndex) => {
                    const validation = result.invoiceValidation.find(v => v.filename === att.filename);
                    const extraction = result.extractedData.find(e => e.filename === att.filename);
                    const isInvoice = validation?.success && validation?.data?.is_invoice;
                    const hasData = extraction?.success;
                    
                    return (
                      <div key={attIndex} className="flex items-center gap-2 text-xs">
                        <span className="truncate max-w-32">{att.filename}</span>
                        {isInvoice ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-600">Invoice</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">Other</Badge>
                        )}
                        {hasData && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">Extracted</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {result.error && (
                <div className="text-red-600 mt-1">❌ {result.error}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingResults;
