
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClientRecommendations = () => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [clientIndex, setClientIndex] = useState(0);
  const { toast } = useToast();

  // Mock client data
  const clients = [
    {
      id: 1,
      name: "Acme Corporation",
      purchasePattern: "Regular quarterly purchases, average ₹215,000 per order",
      financialBehavior: "Payment within 45 days, occasional late payments",
      recommendation: "Offer 60-day payment terms to improve client satisfaction",
    },
    {
      id: 2,
      name: "TechZone Ltd",
      purchasePattern: "Monthly small orders, increased frequency last quarter",
      financialBehavior: "Always pays within 14 days, preferred electronic transfers",
      recommendation: "Suggest bulk ordering discount of 5% for orders over ₹300,000",
    },
    {
      id: 3,
      name: "Global Services Inc",
      purchasePattern: "Large but infrequent orders, seasonal pattern",
      financialBehavior: "Consistently 30+ days late on payments",
      recommendation: "Implement a tiered early payment discount structure (2% for 15 days, 1% for 30 days)",
    }
  ];

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(1);
    }, 1500);
  };

  const handleNextClient = () => {
    if (clientIndex < clients.length - 1) {
      setClientIndex(clientIndex + 1);
    } else {
      setCurrentStep(2);
    }
  };

  const handleLogToCRM = (clientId: number) => {
    toast({
      title: "Action Logged",
      description: `Recommendation for ${clients[clientIndex].name} logged to CRM successfully.`,
    });
  };

  const handleEmailSummary = () => {
    toast({
      title: "Summary Emailed",
      description: "Client recommendations summary has been emailed to the accounting team.",
    });
    setCurrentStep(null);
    setClientIndex(0);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Personalized Client Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights to optimize client relationships and financial terms
          </p>
        </div>

        {currentStep === null && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Get Client Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuerySubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Type 'recommend actions for key clients' or your custom query..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Generate Recommendations"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && clients[clientIndex] && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>{clients[clientIndex].name}</CardTitle>
                <Badge variant="outline" className="bg-blue-50 text-blue-600">
                  Client {clientIndex + 1} of {clients.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Purchase Pattern</h3>
                <p>{clients[clientIndex].purchasePattern}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Financial Behavior</h3>
                <p>{clients[clientIndex].financialBehavior}</p>
              </div>
              
              <div className="space-y-2 bg-blue-50/30 p-4 rounded-md border border-blue-100">
                <h3 className="text-sm font-medium text-blue-700">AI Recommendation</h3>
                <p className="text-blue-800">{clients[clientIndex].recommendation}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => handleLogToCRM(clients[clientIndex].id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Log to CRM
              </Button>
              <Button onClick={handleNextClient}>
                {clientIndex < clients.length - 1 ? (
                  <>Next Client <ArrowRight className="ml-2 h-4 w-4" /></>
                ) : (
                  <>Complete Review <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Complete</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p>You've reviewed recommendations for all {clients.length} priority clients.</p>
              <p className="mt-2">Would you like a summary emailed to the accounting team?</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(null)}>
                Not now
              </Button>
              <Button onClick={handleEmailSummary}>
                <Mail className="h-4 w-4 mr-2" />
                Email Summary
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ClientRecommendations;
