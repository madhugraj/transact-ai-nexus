
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CheckSquare, X, Edit, User, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Transaction {
  id: string;
  description: string;
  amount: string;
  date: string;
  suggestedCategory: string;
  confidence: number;
  status: "pending" | "processed" | "review";
  alternativeCategories?: string[];
}

const TaskAutomation = () => {
  const [selectedCRM, setSelectedCRM] = useState("keap");
  const [selectedAccounting, setSelectedAccounting] = useState("myob");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [completedTransactions, setCompletedTransactions] = useState<string[]>([]);
  const { toast } = useToast();

  // Mock transactions
  const mockTransactions: Transaction[] = [
    {
      id: "tx-001",
      description: "Quarterly Software License - Creative Cloud",
      amount: "₹45,000",
      date: "2025-04-15",
      suggestedCategory: "Software Subscriptions",
      confidence: 95,
      status: "pending",
      alternativeCategories: ["IT Expenses", "Creative Department", "Operating Expenses"]
    },
    {
      id: "tx-002",
      description: "Office Supplies - Printer Toner and Paper",
      amount: "₹12,800",
      date: "2025-04-16",
      suggestedCategory: "Office Supplies",
      confidence: 88,
      status: "pending",
      alternativeCategories: ["Administrative Expenses", "Printing Costs", "Consumables"]
    },
    {
      id: "tx-003",
      description: "Team Lunch with Marketing Department",
      amount: "₹8,500",
      date: "2025-04-17",
      suggestedCategory: "Meals & Entertainment",
      confidence: 72,
      status: "pending",
      alternativeCategories: ["Marketing Expenses", "Team Building", "Staff Welfare"]
    },
    {
      id: "tx-004",
      description: "Annual Conference Registration Fee",
      amount: "₹35,000",
      date: "2025-04-18",
      suggestedCategory: "Conferences & Events",
      confidence: 91,
      status: "pending",
      alternativeCategories: ["Professional Development", "Marketing Expenses", "Travel Expenses"]
    },
    {
      id: "tx-005",
      description: "Server Hosting - Q2 2025",
      amount: "₹78,200",
      date: "2025-04-19",
      suggestedCategory: "Web Hosting & Infrastructure",
      confidence: 94,
      status: "pending",
      alternativeCategories: ["IT Expenses", "Technology Services", "Cloud Services"]
    }
  ];

  // Mock task logs
  const taskLogs = [
    { timestamp: "2025-04-20 09:45:23", action: "System pulled 24 transactions from Keap", user: "System" },
    { timestamp: "2025-04-20 09:45:25", action: "Applied XGBoost categorization to transactions", user: "System" },
    { timestamp: "2025-04-20 09:46:12", action: "Categorized 'Office Renovation' as 'Capital Improvement'", user: "Nisha M." },
    { timestamp: "2025-04-20 10:12:54", action: "Approved batch of 15 transactions", user: "Raj K." }
  ];

  const handleProcessData = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setTransactions(mockTransactions);
    }, 1500);
  };

  const handleAccept = (id: string) => {
    setTransactions(current => 
      current.map(tx => 
        tx.id === id ? { ...tx, status: "processed" as const } : tx
      )
    );
    
    setCompletedTransactions([...completedTransactions, id]);
    
    toast({
      title: "Category Accepted",
      description: `Transaction has been categorized successfully.`,
    });
  };
  
  const handleChangeCategory = (id: string, category: string) => {
    setTransactions(current => 
      current.map(tx => 
        tx.id === id ? { ...tx, suggestedCategory: category, status: "processed" as const } : tx
      )
    );
    
    setCompletedTransactions([...completedTransactions, id]);
    
    toast({
      title: "Category Changed",
      description: `Transaction category has been updated.`,
    });
  };
  
  const handleAssignForReview = (id: string) => {
    setTransactions(current => 
      current.map(tx => 
        tx.id === id ? { ...tx, status: "review" as const } : tx
      )
    );
    
    toast({
      title: "Assigned for Review",
      description: `Transaction has been assigned to the accounting team for review.`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Task Automation & Workflow Management</h1>
          <p className="text-muted-foreground mt-1">
            Automate classification of transactions and assignment of review tasks
          </p>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">System Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CRM System</label>
                <Select value={selectedCRM} onValueChange={setSelectedCRM}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select CRM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keap">Keap (InfusionSoft)</SelectItem>
                    <SelectItem value="zoho">Zoho CRM</SelectItem>
                    <SelectItem value="salesforce">Salesforce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Accounting System</label>
                <Select value={selectedAccounting} onValueChange={setSelectedAccounting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select accounting system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="myob">MYOB</SelectItem>
                    <SelectItem value="xero">Xero</SelectItem>
                    <SelectItem value="quickbooks">QuickBooks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleProcessData} disabled={isProcessing}>
              {isProcessing ? "Processing Transactions..." : "Process New Transactions"}
            </Button>
          </CardContent>
        </Card>

        {transactions.length > 0 && (
          <>
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Live Feed: New Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">{transactions.length}</span> transactions imported from {selectedCRM}
                    </div>
                    <Badge className="bg-blue-50 text-blue-600">XGBoost ML Categorization Applied</Badge>
                  </div>
                </div>
                
                <div className="border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Suggested Category</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id} className={
                          tx.status === "processed" ? "bg-green-50/30" : 
                          tx.status === "review" ? "bg-amber-50/30" : ""
                        }>
                          <TableCell>
                            <div>
                              <div className="font-medium">{tx.description}</div>
                              <div className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>{tx.amount}</TableCell>
                          <TableCell>{tx.suggestedCategory}</TableCell>
                          <TableCell>
                            <Badge className={
                              tx.confidence >= 90 ? "bg-green-50 text-green-600" : 
                              tx.confidence >= 75 ? "bg-amber-50 text-amber-600" : 
                              "bg-red-50 text-red-600"
                            }>
                              {tx.confidence}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              tx.status === "processed" ? "bg-green-50 text-green-600" : 
                              tx.status === "review" ? "bg-amber-50 text-amber-600" : 
                              "bg-blue-50 text-blue-600"
                            }>
                              {tx.status === "processed" ? "Processed" : 
                               tx.status === "review" ? "In Review" : 
                               "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {tx.status === "pending" && (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleAssignForReview(tx.id)}>
                                  <User className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                                <Button size="sm" onClick={() => handleAccept(tx.id)}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Task Logs</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {taskLogs.map((log, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <Badge variant="outline" className="whitespace-nowrap">
                        {log.timestamp}
                      </Badge>
                      <span className="font-medium">{log.user}:</span>
                      <span>{log.action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-4 flex justify-between">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Activity Log
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Classification Rules
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default TaskAutomation;
