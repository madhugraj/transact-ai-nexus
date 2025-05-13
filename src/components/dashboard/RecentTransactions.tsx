
import { useState } from 'react';
import { 
  Check, 
  Clock, 
  FileText, 
  Filter, 
  MoreVertical, 
  XCircle 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock transaction data
const mockTransactions = [
  {
    id: '1',
    documentId: 'INV-2023-042',
    vendor: 'ABC Corporation',
    amount: '$1,240.56',
    date: '2023-05-12',
    status: 'approved',
    type: 'invoice'
  },
  {
    id: '2',
    documentId: 'PO-2023-076',
    vendor: 'Tech Solutions Inc.',
    amount: '$3,650.00',
    date: '2023-05-11',
    status: 'pending',
    type: 'po'
  },
  {
    id: '3',
    documentId: 'INV-2023-041',
    vendor: 'Global Services Ltd.',
    amount: '$875.25',
    date: '2023-05-10',
    status: 'processing',
    type: 'invoice'
  },
  {
    id: '4',
    documentId: 'REC-2023-019',
    vendor: 'XYZ Systems',
    amount: '$450.00',
    date: '2023-05-09',
    status: 'rejected',
    type: 'receipt'
  },
  {
    id: '5',
    documentId: 'PAY-2023-028',
    vendor: 'Acme Supplies',
    amount: '$2,180.75',
    date: '2023-05-08',
    status: 'approved',
    type: 'payment'
  }
];

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusProps = {
    approved: { icon: Check, className: 'status-approved' },
    pending: { icon: Clock, className: 'status-pending' },
    processing: { icon: Clock, className: 'status-processing' },
    rejected: { icon: XCircle, className: 'status-rejected' }
  };
  
  const StatusIcon = statusProps[status as keyof typeof statusProps]?.icon || Clock;
  const className = statusProps[status as keyof typeof statusProps]?.className || '';
  
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      <StatusIcon size={12} />
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

const RecentTransactions = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<typeof mockTransactions[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleViewDetails = (transaction: typeof mockTransactions[0]) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter size={14} />
          Filter
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document ID</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-muted-foreground" />
                      {transaction.documentId}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.vendor}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>
                    <StatusBadge status={transaction.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(transaction)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Route to Agent</DropdownMenuItem>
                        <DropdownMenuItem>Download</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedTransaction && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                Details for document {selectedTransaction.documentId}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Document ID</p>
                  <p>{selectedTransaction.documentId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Type</p>
                  <p className="capitalize">{selectedTransaction.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Vendor</p>
                  <p>{selectedTransaction.vendor}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Amount</p>
                  <p>{selectedTransaction.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Date</p>
                  <p>{selectedTransaction.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <StatusBadge status={selectedTransaction.status} />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Processing History</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <p>Document received</p>
                    <p className="text-muted-foreground">2023-05-12 09:45 AM</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Classified by AI</p>
                    <p className="text-muted-foreground">2023-05-12 09:46 AM</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Matched with PO-2023-065</p>
                    <p className="text-muted-foreground">2023-05-12 09:48 AM</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Approved by John D.</p>
                    <p className="text-muted-foreground">2023-05-12 10:15 AM</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">Download</Button>
                <Button>Process Next Step</Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default RecentTransactions;
