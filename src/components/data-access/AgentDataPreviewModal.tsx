
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Module {
  name: string;
  lastSynced: string;
  recordsFetched: number;
}

interface DataSource {
  name: string;
  type: "CRM" | "Accounting" | "Financial" | "Compliance";
  status: "connected" | "disconnected" | "error";
  modules: Module[];
}

interface AgentDataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: DataSource | null;
  agentType: "recommendations" | "financial" | "automation" | "compliance";
}

// Mock data for preview
const getMockData = (moduleName: string) => {
  const mockHeaders = {
    'Contacts': ['Name', 'Email', 'Phone', 'Last Contact', 'Status'],
    'Deals': ['Deal Name', 'Amount', 'Stage', 'Close Date', 'Probability'],
    'Activities': ['Activity Type', 'Subject', 'Due Date', 'Status', 'Related To'],
    'Invoices': ['Invoice #', 'Client', 'Amount', 'Issue Date', 'Due Date', 'Status'],
    'Payments': ['Payment #', 'Client', 'Amount', 'Payment Date', 'Method', 'Status']
  };
  
  const headers = mockHeaders[moduleName as keyof typeof mockHeaders] || 
    ['Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5'];
  
  const rows = Array(15).fill(0).map((_, i) => {
    if (moduleName === 'Contacts') {
      return {
        'Name': `Contact ${i+1}`,
        'Email': `contact${i+1}@example.com`,
        'Phone': `+91 ${9800000000 + i}`,
        'Last Contact': `${1 + i} days ago`,
        'Status': i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'New' : 'Inactive'
      };
    } else if (moduleName === 'Invoices') {
      return {
        'Invoice #': `INV-2025-${1000 + i}`,
        'Client': `Client ${i % 5 + 1}`,
        'Amount': `₹${(Math.random() * 100000 + 10000).toFixed(2)}`,
        'Issue Date': `2025-04-${10 + i % 20}`,
        'Due Date': `2025-05-${10 + i % 20}`,
        'Status': i % 4 === 0 ? 'Paid' : i % 4 === 1 ? 'Pending' : i % 4 === 2 ? 'Overdue' : 'Draft'
      };
    } else {
      return headers.reduce((obj, header, j) => {
        obj[header] = `Data ${i+1}-${j+1}`;
        return obj;
      }, {} as Record<string, string>);
    }
  });
  
  return { headers, rows };
};

export function AgentDataPreviewModal({ 
  isOpen, 
  onClose, 
  source, 
  agentType 
}: AgentDataPreviewModalProps) {
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Set initial module when source changes
  if (source && source.modules.length > 0 && (!selectedModule || !source.modules.find(m => m.name === selectedModule))) {
    setSelectedModule(source.modules[0].name);
  }
  
  // Get data for selected module
  const { headers, rows } = selectedModule ? getMockData(selectedModule) : { headers: [], rows: [] };
  
  // Filter rows based on search term
  const filteredRows = rows.filter(row => 
    Object.values(row).some(value => 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  // Handle download CSV
  const handleDownloadCSV = () => {
    if (!headers.length) return;
    
    const headerRow = headers.join(',');
    const dataRows = filteredRows.map(row => headers.map(header => row[header]).join(','));
    const csvContent = [headerRow, ...dataRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedModule || 'data'}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {source ? `${source.name} - Raw Data Preview` : 'Data Preview'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-between items-center my-4">
          <div className="flex items-center gap-4">
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {source?.modules.map((module, index) => (
                  <SelectItem key={index} value={module.name}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedModule && (
              <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {filteredRows.length} records
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
            <Button variant="outline" onClick={handleDownloadCSV}>
              <Download className="h-4 w-4 mr-1" />
              Download CSV
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, index) => (
                  <TableRow key={index}>
                    {headers.map((header, cIndex) => (
                      <TableCell key={cIndex}>{row[header]}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headers.length} className="text-center py-4">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
