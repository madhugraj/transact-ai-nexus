
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail, HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FinancialAnalysis = () => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const { toast } = useToast();

  // Mock analysis data
  const analysisData = {
    forecast: {
      value: "₹12.3M",
      trend: "up",
      percentage: "+8%",
      period: "Q3",
      previousValue: "₹11.4M",
    },
    anomalies: [
      {
        client: "TechNova",
        issue: "3x drop in revenue last month",
        impact: "₹850,000 below expected",
        trend: "down",
      },
      {
        client: "Global Services Inc",
        issue: "Unusual payment pattern",
        impact: "60+ days delay trend forming",
        trend: "down",
      }
    ]
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(1);
    }, 2000);
  };

  const handleEmailSummary = () => {
    toast({
      title: "Summary Emailed",
      description: "Financial analysis has been emailed to your team.",
    });
  };

  const handleExplainForecast = () => {
    toast({
      title: "Forecast Explanation",
      description: "The forecast is based on historical trends, seasonality, and confirmed upcoming orders.",
    });
  };

  const handlePushToCRM = () => {
    toast({
      title: "Pushed to CRM",
      description: "Analysis insights have been added to your CRM dashboard.",
    });
    setCurrentStep(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Financial Data Analysis</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights on revenue trends, forecasts, and anomaly detection
          </p>
        </div>

        {currentStep === null && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Financial Analysis Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuerySubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Type 'show revenue anomalies' or 'forecast upcoming revenue'..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? (
                    <>Fetching data from Zoho CRM and NetSuite...</>
                  ) : (
                    "Analyze Financial Data"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Forecast Card */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Revenue Forecast</CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-600">
                    {analysisData.forecast.percentage}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="text-3xl font-bold mr-2">{analysisData.forecast.value}</div>
                  <div className="flex items-center">
                    <span className="text-green-600 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {analysisData.forecast.percentage}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      expected in {analysisData.forecast.period}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    {/* Simple sparkline representation */}
                    <div className="h-full bg-green-500 w-3/4"></div>
                  </div>
                  <span className="text-sm ml-4 text-muted-foreground">vs {analysisData.forecast.previousValue} in Q2</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Anomalies Card */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Detected Anomalies</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {analysisData.anomalies.map((anomaly, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{anomaly.client}</h3>
                      <Badge variant="outline" className="bg-red-50 text-red-600">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Anomaly
                      </Badge>
                    </div>
                    <p className="mt-2">{anomaly.issue}</p>
                    <p className="text-sm text-muted-foreground mt-1">{anomaly.impact}</p>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
                <Button variant="outline" onClick={handleEmailSummary}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Summary
                </Button>
                <Button variant="outline" onClick={handleExplainForecast}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Explain this forecast
                </Button>
                <Button onClick={handlePushToCRM}>
                  Push to CRM Insights
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default FinancialAnalysis;
