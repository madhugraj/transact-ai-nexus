
import { useState } from 'react';
import { 
  AlertCircle, 
  ArrowRight, 
  Check, 
  Clock, 
  Database, 
  File, 
  FileText, 
  Filter, 
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Mock data for documents
const mockDocuments = [
  {
    id: '1',
    name: 'Invoice_ABC_Corp_May2023.pdf',
    source: 'email',
    sourceDetail: 'finance@abccorp.com',
    type: 'invoice',
    status: 'pending',
    confidence: 0.92,
    date: '2023-05-15',
    metadata: {
      vendor: 'ABC Corporation',
      amount: '$1,240.56',
      due: '2023-06-15',
      hasDiscrepancy: false,
    }
  },
  {
    id: '2',
    name: 'PO_TechSolutions_Q2.xlsx',
    source: 'upload',
    sourceDetail: 'Manual upload by User',
    type: 'po',
    status: 'processing',
    confidence: 0.78,
    date: '2023-05-14',
    metadata: {
      vendor: 'Tech Solutions Inc.',
      amount: '$3,650.00',
      due: 'N/A',
      hasDiscrepancy: false,
    }
  },
  {
    id: '3',
    name: 'Receipt_OfficeSupplies.jpg',
    source: 'email',
    sourceDetail: 'receipts@officesupply.com',
    type: 'receipt',
    status: 'complete',
    confidence: 0.85,
    date: '2023-05-13',
    metadata: {
      vendor: 'Office Supplies Ltd.',
      amount: '$245.75',
      due: 'Paid',
      hasDiscrepancy: false,
    }
  },
  {
    id: '4',
    name: 'Invoice_XYZ_April.pdf',
    source: 'database',
    sourceDetail: 'ERP System Import',
    type: 'invoice',
    status: 'error',
    confidence: 0.45,
    date: '2023-05-12',
    metadata: {
      vendor: 'XYZ Systems',
      amount: '$2,840.00',
      due: '2023-05-30',
      hasDiscrepancy: true,
      discrepancies: ['Amount mismatch with PO', 'Missing approval signature']
    }
  },
  {
    id: '5',
    name: 'PaymentAdvice_Vendor123.pdf',
    source: 'email',
    sourceDetail: 'payments@bank.com',
    type: 'payment',
    status: 'pending',
    confidence: 0.89,
    date: '2023-05-11',
    metadata: {
      vendor: 'Multiple Vendors',
      amount: '$12,450.30',
      due: 'N/A',
      hasDiscrepancy: false,
    }
  }
];

// Document card component
const DocumentCard = ({ 
  document, 
  onProcess 
}: { 
  document: typeof mockDocuments[0], 
  onProcess: (id: string) => void 
}) => {
  // Get icon by document type
  const getTypeIcon = () => {
    switch (document.type) {
      case 'invoice':
        return <FileText className="h-5 w-5 text-transaction-invoice" />;
      case 'po':
        return <FileText className="h-5 w-5 text-transaction-po" />;
      case 'receipt':
        return <File className="h-5 w-5 text-transaction-receipt" />;
      case 'payment':
        return <FileText className="h-5 w-5 text-transaction-payment" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };
  
  // Get source icon
  const getSourceIcon = () => {
    switch (document.source) {
      case 'email':
        return 'Mail';
      case 'upload':
        return 'Upload';
      case 'database':
        return <Database className="h-4 w-4 text-muted-foreground" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  // Get status badge
  const getStatusBadge = () => {
    switch (document.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="status-pending">
            <Clock size={12} className="mr-1" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="status-processing">
            <Clock size={12} className="mr-1" />
            Processing
          </Badge>
        );
      case 'complete':
        return (
          <Badge variant="outline" className="status-approved">
            <Check size={12} className="mr-1" />
            Complete
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="status-rejected">
            <X size={12} className="mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className={cn(
      "transition-all hover:shadow",
      document.metadata.hasDiscrepancy && "border-status-rejected border-l-4"
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            {getTypeIcon()}
            <div className="ml-2">
              <h3 className="font-medium text-sm truncate max-w-[180px]">{document.name}</h3>
              <p className="text-xs text-muted-foreground">{document.date}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Vendor</p>
              <p className="font-medium truncate max-w-[150px]">{document.metadata.vendor}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-medium">{document.metadata.amount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Source</p>
              <div className="flex items-center">
                {getSourceIcon()}
                <span className="ml-1 text-xs">
                  {document.source === 'email' ? 'Email' : 
                   document.source === 'upload' ? 'Upload' : 
                   document.source === 'database' ? 'Database' : 'Other'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <div className={cn(
                "flex items-center",
                document.confidence > 0.8 ? "text-status-approved" : 
                document.confidence > 0.6 ? "text-status-pending" : "text-status-rejected"
              )}>
                <span className="text-xs font-medium">{Math.round(document.confidence * 100)}%</span>
              </div>
            </div>
          </div>
          
          {document.metadata.hasDiscrepancy && (
            <div className="bg-status-rejected/10 rounded p-2 text-sm">
              <div className="flex items-center">
                <AlertCircle size={12} className="text-status-rejected mr-1" />
                <p className="text-xs font-medium text-status-rejected">Discrepancies Detected</p>
              </div>
            </div>
          )}
          
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => onProcess(document.id)}
            disabled={document.status === 'processing' || document.status === 'complete'}
          >
            <ArrowRight size={16} className="mr-2" />
            {document.status === 'pending' ? 'Route to Agent' :
             document.status === 'processing' ? 'Processing...' :
             document.status === 'complete' ? 'Processed' : 'Review'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main component
const ProcessTransactions = () => {
  const [documents, setDocuments] = useState(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  // Handle processing a document
  const handleProcessDocument = (id: string) => {
    // Update status to processing
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, status: 'processing' } : doc
    ));
    
    toast({
      title: "Document Routed",
      description: "Document has been sent for processing",
    });
    
    // Simulate processing completion after delay
    setTimeout(() => {
      setDocuments(documents.map(doc => 
        doc.id === id ? { ...doc, status: 'complete' } : doc
      ));
      
      toast({
        title: "Processing Complete",
        description: "Document has been successfully processed",
        variant: "default",
      });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Transaction Processing</h1>
        <p className="text-muted-foreground">
          Review and process incoming documents with AI assistance
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="invoice">Invoices</SelectItem>
              <SelectItem value="po">Purchase Orders</SelectItem>
              <SelectItem value="receipt">Receipts</SelectItem>
              <SelectItem value="payment">Payment Advice</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter size={16} />
            Filters
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="error">
            Issues
            <span className="ml-1 rounded-full bg-status-rejected/20 text-status-rejected text-xs px-2">
              1
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard 
                key={doc.id} 
                document={doc}
                onProcess={handleProcessDocument}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents
              .filter(doc => doc.status === 'pending')
              .map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  document={doc}
                  onProcess={handleProcessDocument}
                />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="processing" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents
              .filter(doc => doc.status === 'processing')
              .map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  document={doc}
                  onProcess={handleProcessDocument}
                />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="error" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents
              .filter(doc => doc.status === 'error' || doc.metadata.hasDiscrepancy)
              .map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  document={doc}
                  onProcess={handleProcessDocument}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProcessTransactions;
