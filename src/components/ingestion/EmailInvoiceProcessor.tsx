
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Mail } from 'lucide-react';
import { EmailProcessingService } from '@/services/email/emailProcessingUtils';
import ProcessingResults from './ProcessingResults';

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

  const emailProcessingService = new EmailProcessingService();

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

      for (let i = 0; i < selectedEmails.length; i++) {
        const email = selectedEmails[i];
        setCurrentStep(i + 1);

        console.log(`Processing email ${i + 1}/${selectedEmails.length}: ${email.subject}`);

        const result = await emailProcessingService.processEmailForInvoices(email, accessToken);
        
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

        <ProcessingResults results={results} isProcessing={processing} />
      </CardContent>
    </Card>
  );
};

export default EmailInvoiceProcessor;
