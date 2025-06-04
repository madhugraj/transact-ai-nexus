import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, FileText, Mail, Download, Database, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceDetectionAgent } from '@/services/agents/InvoiceDetectionAgent';
import { InvoiceDataExtractionAgent } from '@/services/agents/InvoiceDataExtractionAgent';
import { GmailAttachmentProcessor } from '@/services/gmail/attachmentProcessor';

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

interface EmailInvoiceProcessorProps {
  selectedEmails: GmailMessage[];
  accessToken: string;
}

const EmailInvoiceProcessor: React.FC<EmailInvoiceProcessorProps> = ({
  selectedEmails,
  accessToken
}) => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const invoiceDetectionAgent = new InvoiceDetectionAgent();
  const invoiceDataExtractionAgent = new InvoiceDataExtractionAgent();

  const processEmailsToInvoices = async () => {
    if (selectedEmails.length === 0) {
      toast({
        title: "No emails selected",
        description: "Please select emails to process",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setResults([]);
    setCurrentStep(0);

    try {
      const processingResults: ProcessingResult[] = [];
      const attachmentProcessor = new GmailAttachmentProcessor(accessToken);

      for (let i = 0; i < selectedEmails.length; i++) {
        const email = selectedEmails[i];
        setCurrentStep(i + 1);

        console.log(`Processing email ${i + 1}/${selectedEmails.length}: ${email.subject}`);

        const result: ProcessingResult = {
          email,
          emailContext: null,
          attachments: [],
          invoiceValidation: [],
          extractedData: [],
          status: 'processing'
        };

        try {
          // Step 1: Analyze email context for invoice indicators
          console.log('Step 1: Analyzing email context...');
          const emailContext = await attachmentProcessor.analyzeEmailForInvoiceContext(email.id);
          result.emailContext = emailContext;

          if (!emailContext.isLikelyInvoice) {
            console.log('Email does not appear to contain invoice-related content');
            result.status = 'completed';
            result.error = 'Email does not appear invoice-related';
            processingResults.push(result);
            setResults([...processingResults]);
            continue;
          }

          // Step 2: Extract real email attachments
          console.log('Step 2: Extracting real attachments...');
          const attachments = await attachmentProcessor.extractEmailAttachments(email.id);
          result.attachments = attachments;

          if (attachments.length === 0) {
            result.status = 'completed';
            result.error = 'No supported attachments found (PDF/Image files)';
            processingResults.push(result);
            setResults([...processingResults]);
            continue;
          }

          console.log(`Found ${attachments.length} attachments to process`);

          // Step 3: Validate each attachment as invoice using AI
          console.log('Step 3: Validating invoices with AI...');
          for (const attachment of attachments) {
            console.log(`Processing attachment: ${attachment.filename}`);
            
            const validation = await invoiceDetectionAgent.process(attachment.file);
            result.invoiceValidation.push({
              ...validation,
              filename: attachment.filename,
              fileSize: attachment.size
            });

            // Step 4: If it's an invoice, extract structured data
            if (validation.success && validation.data?.is_invoice) {
              console.log(`✅ Invoice detected: ${attachment.filename}`);
              console.log('Step 4: Extracting invoice data with AI...');
              
              const extraction = await invoiceDataExtractionAgent.process(attachment.file);
              result.extractedData.push({
                ...extraction,
                filename: attachment.filename,
                fileSize: attachment.size
              });

              // Step 5: Store in database
              if (extraction.success && extraction.data) {
                console.log('Step 5: Storing in database...');
                await storeInvoiceInDatabase(
                  extraction.data, 
                  email, 
                  attachment.filename,
                  emailContext.context
                );
              }
            } else {
              console.log(`❌ Not an invoice: ${attachment.filename}`);
            }
          }

          result.status = 'completed';
        } catch (error) {
          console.error(`Error processing email ${email.subject}:`, error);
          result.status = 'error';
          result.error = error instanceof Error ? error.message : 'Unknown error';
        }

        processingResults.push(result);
        setResults([...processingResults]);
      }

      toast({
        title: "Processing completed",
        description: `Processed ${selectedEmails.length} emails for invoices`
      });

    } catch (error) {
      console.error('Email processing error:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process emails",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const storeInvoiceInDatabase = async (
    invoiceData: any, 
    email: GmailMessage, 
    fileName: string,
    emailContext: any
  ) => {
    try {
      // Store each line item as a separate row in invoice_table
      for (const lineItem of invoiceData.line_items || []) {
        const { error } = await supabase
          .from('invoice_table')
          .insert({
            invoice_number: parseInt(invoiceData.invoice_number) || 0,
            po_number: parseInt(invoiceData.po_number) || 0,
            invoice_date: invoiceData.invoice_date,
            details: {
              supplier_gst_number: invoiceData.supplier_gst_number,
              bill_to_gst_number: invoiceData.bill_to_gst_number,
              shipping_address: invoiceData.shipping_address,
              seal_and_sign_present: invoiceData.seal_and_sign_present,
              email_subject: email.subject,
              email_from: email.from,
              email_date: email.date,
              file_name: fileName,
              line_item: lineItem,
              extraction_confidence: invoiceData.extraction_confidence,
              email_context: emailContext
            }
          });

        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error storing invoice in database:', error);
      throw error;
    }
  };

  const getSuccessfulInvoices = () => {
    return results.reduce((count, result) => {
      return count + result.extractedData.filter(ext => ext.success).length;
    }, 0);
  };

  const getTotalAttachments = () => {
    return results.reduce((count, result) => count + result.attachments.length, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email to Invoice Processing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {selectedEmails.length} emails selected for processing
            </p>
          </div>
          <Button 
            onClick={processEmailsToInvoices}
            disabled={processing || selectedEmails.length === 0}
          >
            {processing ? 'Processing...' : 'Process Email Invoices'}
          </Button>
        </div>

        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing email {currentStep} of {selectedEmails.length}</span>
              <span>{Math.round((currentStep / selectedEmails.length) * 100)}%</span>
            </div>
            <Progress value={(currentStep / selectedEmails.length) * 100} />
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                {getSuccessfulInvoices()} invoices processed
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <FileText className="h-3 w-3 mr-1" />
                {getTotalAttachments()} attachments analyzed
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
                    <div>📎 {result.attachments.length} attachments downloaded</div>
                    <div>✅ {result.invoiceValidation.filter(v => v.success && v.data?.is_invoice).length} invoices detected</div>
                    <div>📊 {result.extractedData.filter(e => e.success).length} invoices extracted</div>
                    {result.error && (
                      <div className="text-red-600">❌ {result.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailInvoiceProcessor;
