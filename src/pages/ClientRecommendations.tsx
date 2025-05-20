
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Mail, CheckCircle, Cog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ClientRecommendations = () => {
  const [selectedCRM, setSelectedCRM] = useState("odoo");
  const [selectedFinance, setSelectedFinance] = useState("zoho");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const { toast } = useToast();

  // Mock client data
  const clients = [
    {
      id: 1,
      name: "Acme Corporation",
      suggestedAction: "Extend credit to 60 days",
      confidence: 87,
      purchasePattern: "Regular quarterly purchases, average ₹215,000 per order",
      financialBehavior: "Payment within 45 days, occasional late payments",
    },
    {
      id: 2,
      name: "TechZone Ltd",
      suggestedAction: "Offer bulk ordering discount of 5% for orders over ₹300,000",
      confidence: 92,
      purchasePattern: "Monthly small orders, increased frequency last quarter",
      financialBehavior: "Always pays within 14 days, preferred electronic transfers",
    },
    {
      id: 3,
      name: "Global Services Inc",
      suggestedAction: "Implement a tiered early payment discount structure",
      confidence: 76,
      purchasePattern: "Large but infrequent orders, seasonal pattern",
      financialBehavior: "Consistently 30+ days late on payments",
    }
  ];

  const processingSteps = [
    "Pulling purchase & payment history",
    "Aggregating & preprocessing data",
    "Applying predictive model (Random Forest)",
    "Generating recommendations",
    "Complete"
  ];

  const handleProcess = () => {
    setIsProcessing(true);
    setCurrentStep(0);
    setRecommendations([]);
    
    // Simulate processing steps with delays
    const interval = setInterval(() => {
      setCurrentStep(current => {
        if (current >= processingSteps.length - 2) {
          clearInterval(interval);
          setRecommendations(clients);
          setIsProcessing(false);
          return processingSteps.length - 1;
        }
        return current + 1;
      });
    }, 1000);
  };

  const handleLogToCRM = (clientId: number) => {
    toast({
      title: "Action Logged",
      description: `Recommendation for ${clients.find(c => c.id === clientId)?.name} logged to CRM successfully.`,
    });
  };

  const handleEmailSummary = () => {
    toast({
      title: "Summary Emailed",
      description: "Client recommendations summary has been emailed to the accounting team.",
    });
  };
  
  const handleExportPDF = () => {
    toast({
      title: "Export Complete",
      description: "Recommendations have been exported to PDF.",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Personalized Client Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            Analysis of CRM and financial data to generate custom client advisory actions
          </p>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Data Source Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CRM API Source</label>
                <Select value={selectedCRM} onValueChange={setSelectedCRM}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select CRM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="odoo">Odoo CRM</SelectItem>
                    <SelectItem value="salesforce">Salesforce</SelectItem>
                    <SelectItem value="hubspot">HubSpot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Financial Data Source</label>
                <Select value={selectedFinance} onValueChange={setSelectedFinance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoho">Zoho Books</SelectItem>
                    <SelectItem value="quickbooks">QuickBooks</SelectItem>
                    <SelectItem value="xero">Xero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleProcess} disabled={isProcessing}>
              <Cog className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Processing..." : "Generate Recommendations"}
            </Button>
          </CardContent>
        </Card>

        {(isProcessing || currentStep > 0) && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Processing Steps</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <Progress value={((currentStep + 1) / processingSteps.length) * 100} className="h-2" />
              
              <div className="space-y-2">
                {processingSteps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    {currentStep >= index ? (
                      <Badge variant="outline" className={currentStep > index ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}>
                        {currentStep > index ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <span className="h-3 w-3 rounded-full bg-blue-500 inline-block mr-1" />
                        )}
                        {step}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-500">
                        {step}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {recommendations.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Client Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Suggested Action</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.suggestedAction}</TableCell>
                      <TableCell>
                        <Badge className={
                          client.confidence > 85 ? "bg-green-50 text-green-600" : 
                          client.confidence > 70 ? "bg-amber-50 text-amber-600" : 
                          "bg-red-50 text-red-600"
                        }>
                          {client.confidence}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleLogToCRM(client.id)}>
                          Log to CRM
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button variant="outline" onClick={handleEmailSummary}>
                <Mail className="h-4 w-4 mr-2" />
                Email to Accountant
              </Button>
              <Button onClick={handleExportPDF}>
                Export Recommendations (PDF)
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ClientRecommendations;
