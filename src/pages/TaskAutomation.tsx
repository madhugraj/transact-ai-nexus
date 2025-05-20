
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CheckSquare, X, Edit, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface Transaction {
  id: string;
  description: string;
  amount: string;
  date: string;
  suggestedCategory: string;
  alternativeCategories: string[];
}

const TaskAutomation = () => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(0);
  const [completedTransactions, setCompletedTransactions] = useState<string[]>([]);
  const { toast } = useToast();

  // Mock transactions
  const transactions: Transaction[] = [
    {
      id: "tx-001",
      description: "Quarterly Software License - Creative Cloud",
      amount: "₹45,000",
      date: "2025-04-15",
      suggestedCategory: "Software Subscriptions",
      alternativeCategories: ["IT Expenses", "Creative Department", "Operating Expenses"]
    },
    {
      id: "tx-002",
      description: "Office Supplies - Printer Toner and Paper",
      amount: "₹12,800",
      date: "2025-04-16",
      suggestedCategory: "Office Supplies",
      alternativeCategories: ["Administrative Expenses", "Printing Costs", "Consumables"]
    },
    {
      id: "tx-003",
      description: "Team Lunch with Marketing Department",
      amount: "₹8,500",
      date: "2025-04-17",
      suggestedCategory: "Meals & Entertainment",
      alternativeCategories: ["Marketing Expenses", "Team Building", "Staff Welfare"]
    }
  ];

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowResults(true);
    }, 1500);
  };

  const handleAccept = (id: string) => {
    setCompletedTransactions([...completedTransactions, id]);
    toast({
      title: "Category Accepted",
      description: `Transaction ${transactions[currentTransaction].description} categorized as ${transactions[currentTransaction].suggestedCategory}`,
    });
    
    if (currentTransaction < transactions.length - 1) {
      setCurrentTransaction(currentTransaction + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleChangeCategory = (id: string, category: string) => {
    setCompletedTransactions([...completedTransactions, id]);
    toast({
      title: "Category Changed",
      description: `Transaction categorized as ${category} instead of ${transactions[currentTransaction].suggestedCategory}`,
    });
    
    if (currentTransaction < transactions.length - 1) {
      setCurrentTransaction(currentTransaction + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleAssignForReview = () => {
    toast({
      title: "Assigned for Review",
      description: `Transaction ${transactions[currentTransaction].description} has been assigned to the accounting team for review.`,
    });
    
    if (currentTransaction < transactions.length - 1) {
      setCurrentTransaction(currentTransaction + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleComplete = () => {
    setTimeout(() => {
      toast({
        title: "All Tasks Completed",
        description: "All transactions have been processed. Task log updated in Karbon with status 'Logged for review'.",
      });
      
      setShowResults(false);
      setCurrentTransaction(0);
      setCompletedTransactions([]);
    }, 1000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Task Automation & Workflow Management</h1>
          <p className="text-muted-foreground mt-1">
            AI-assisted transaction categorization and workflow management
          </p>
        </div>

        {!showResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Task Automation Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuerySubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Type 'categorize transactions' or 'what's pending in task flow?'..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? "Fetching recent transactions..." : "Process Tasks"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {showResults && currentTransaction < transactions.length && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Transaction Categorization</CardTitle>
                <Badge variant="outline" className="bg-blue-50 text-blue-600">
                  Transaction {currentTransaction + 1} of {transactions.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{transactions[currentTransaction].description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">{transactions[currentTransaction].amount}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p>{new Date(transactions[currentTransaction].date).toLocaleDateString()}</p>
                </div>
                
                <Separator />
                
                <div className="bg-green-50/30 p-4 rounded-md border border-green-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-700">Suggested Category</p>
                    <Badge variant="outline" className="bg-green-50 text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" /> ML Prediction
                    </Badge>
                  </div>
                  <p className="text-green-800 font-medium mt-1">{transactions[currentTransaction].suggestedCategory}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Alternative Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {transactions[currentTransaction].alternativeCategories.map((category, idx) => (
                      <Button 
                        key={idx} 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleChangeCategory(transactions[currentTransaction].id, category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleAssignForReview}
                >
                  <User className="h-4 w-4 mr-2" />
                  Assign for Review
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleChangeCategory(transactions[currentTransaction].id, "Custom Category")}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Change Category
                </Button>
              </div>
              <Button 
                onClick={() => handleAccept(transactions[currentTransaction].id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default TaskAutomation;
