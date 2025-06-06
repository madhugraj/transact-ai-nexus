
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, Mail, Paperclip, Check, AlertCircle, CheckCircle } from 'lucide-react';

interface ProcessingResultsProps {
  results: any[];
  isProcessing: boolean;
}

const ProcessingResults: React.FC<ProcessingResultsProps> = ({ results, isProcessing }) => {
  if (isProcessing) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader className="h-5 w-5 animate-spin" />
          <span>Processing emails...</span>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No processing results yet. Select emails and click "Process Selected Emails" to start.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Processing Results</h3>
      
      {results.map((result, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-3">
            {/* Email Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{result.email?.subject || 'Unknown Subject'}</span>
                  {result.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {result.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  From: {result.email?.from || 'Unknown'} • {result.email?.date ? new Date(result.email.date).toLocaleDateString() : 'Unknown Date'}
                </div>
              </div>
              
              <Badge variant={result.status === 'completed' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                {result.status}
              </Badge>
            </div>

            {/* Email Context Analysis */}
            {result.emailContext && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm font-medium mb-2">Email Analysis</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Likely Invoice:</span>{' '}
                    <Badge variant={result.emailContext.isLikelyInvoice ? 'default' : 'secondary'} className="ml-1">
                      {result.emailContext.isLikelyInvoice ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Attachments:</span>{' '}
                    <span className="font-mono">{result.emailContext.context?.attachmentCount || 0}</span>
                  </div>
                  
                  {/* Safe access to context properties */}
                  {result.emailContext.context && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Invoice Keywords:</span>{' '}
                        <Badge variant={result.emailContext.context.hasInvoiceKeywords ? 'default' : 'secondary'} className="ml-1">
                          {result.emailContext.context.hasInvoiceKeywords ? 'Found' : 'None'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Financial Keywords:</span>{' '}
                        <Badge variant={result.emailContext.context.hasFinancialKeywords ? 'default' : 'secondary'} className="ml-1">
                          {result.emailContext.context.hasFinancialKeywords ? 'Found' : 'None'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Business Keywords:</span>{' '}
                        <Badge variant={result.emailContext.context.hasBusinessKeywords ? 'default' : 'secondary'} className="ml-1">
                          {result.emailContext.context.hasBusinessKeywords ? 'Found' : 'None'}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
                
                {result.emailContext.context?.analysis && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {result.emailContext.context.analysis}
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            {result.attachments && result.attachments.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Attachments ({result.attachments.length})</div>
                <div className="space-y-2">
                  {result.attachments.map((attachment, attIndex) => (
                    <div key={attIndex} className="flex items-center space-x-2 text-sm">
                      <Paperclip className="h-3 w-3" />
                      <span>{attachment.filename}</span>
                      <Badge variant="outline" className="text-xs">
                        {attachment.mimeType}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoice Validation Results */}
            {result.invoiceValidation && result.invoiceValidation.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Invoice Detection</div>
                <div className="space-y-1">
                  {result.invoiceValidation.map((validation, valIndex) => (
                    <div key={valIndex} className="flex items-center justify-between text-sm">
                      <span>{validation.filename}</span>
                      <Badge variant={validation.success && validation.data?.is_invoice ? 'default' : 'secondary'}>
                        {validation.success && validation.data?.is_invoice ? 'Invoice' : 'Not Invoice'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extraction Results */}
            {result.extractedData && result.extractedData.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Data Extraction</div>
                <div className="space-y-2">
                  {result.extractedData.map((extraction, extIndex) => (
                    <div key={extIndex} className="bg-muted/30 p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{extraction.filename}</span>
                        <Badge variant={extraction.success ? 'default' : 'destructive'}>
                          {extraction.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      
                      {extraction.success && extraction.data && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Invoice #:</span>{' '}
                            <span className="font-mono">{extraction.data.invoice_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">PO #:</span>{' '}
                            <span className="font-mono">{extraction.data.po_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>{' '}
                            <span className="font-mono">{extraction.data.total_amount || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>{' '}
                            <span className="font-mono">{extraction.data.invoice_date || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                      
                      {!extraction.success && extraction.error && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {extraction.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {result.error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="text-sm font-medium text-red-800 mb-1">Processing Error</div>
                <div className="text-xs text-red-600">{result.error}</div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProcessingResults;
