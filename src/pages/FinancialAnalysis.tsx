
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, TrendingUp, TrendingDown, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer } from "@/components/ui/chart";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentDataSourcePanel } from "@/components/data-access/AgentDataSourcePanel";
import { getMockDataSources } from "@/components/data-access/mockDataUtils";

const FinancialAnalysis = () => {
  const [selectedCRM, setSelectedCRM] = useState("zoho");
  const [selectedTimeRange, setSelectedTimeRange] = useState("6months");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("forecast");
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  // Mock forecast data
  const forecastData = [
    { month: 'Jan', actual: 9.4, forecast: null },
    { month: 'Feb', actual: 10.1, forecast: null },
    { month: 'Mar', actual: 10.9, forecast: null },
    { month: 'Apr', actual: 11.4, forecast: null },
    { month: 'May', actual: 12.0, forecast: null },
    { month: 'Jun', actual: 12.3, forecast: null },
    { month: 'Jul', actual: null, forecast: 12.8 },
    { month: 'Aug', actual: null, forecast: 13.2 },
    { month: 'Sep', actual: null, forecast: 14.1 },
    { month: 'Oct', actual: null, forecast: 15.0 },
    { month: 'Nov', actual: null, forecast: 15.6 },
    { month: 'Dec', actual: null, forecast: 16.2 },
  ];

  // Mock anomaly data
  const anomalyData = [
    {
      client: 'TechNova',
      issue: 'Revenue drop',
      severity: 'high',
      impact: '₹850,000 below expected',
      date: '2025-05-15',
      details: '3x drop in revenue compared to previous quarter average'
    },
    {
      client: 'Global Services Inc',
      issue: 'Payment pattern',
      severity: 'medium',
      impact: '60+ days delay trend forming',
      date: '2025-05-10',
      details: 'Last 3 payments delayed by 60+ days, unusual for this account'
    },
    {
      client: 'Quantum Industries',
      issue: 'Order frequency',
      severity: 'low',
      impact: 'Changed from monthly to quarterly',
      date: '2025-05-05',
      details: 'Order pattern has shifted from monthly small orders to quarterly large orders'
    }
  ];

  // Mock raw data
  const rawData = Array.from({ length: 15 }, (_, i) => ({
    id: `TX-${1000 + i}`,
    client: ['TechNova', 'Global Services', 'Quantum Industries', 'Apex Corp', 'DataFlow Systems'][i % 5],
    amount: `₹${(Math.random() * 100000 + 50000).toFixed(0)}`,
    date: new Date(2025, 4, 1 + i).toLocaleDateString(),
    category: ['Software', 'Hardware', 'Consulting', 'Support', 'Training'][i % 5]
  }));

  // Get mock data sources for the financial analysis agent
  const dataSources = getMockDataSources("financial");

  const handleRefreshDataSources = async () => {
    // Simulate API call to refresh data sources
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast({
          title: "Data sources refreshed",
          description: "All connected systems have been successfully synchronized.",
        });
        resolve();
      }, 1500);
    });
  };

  const handleProcessData = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowResults(true);
    }, 2000);
  };

  const handleExportPDF = () => {
    toast({
      title: "Export Complete",
      description: "Financial analysis has been exported as PDF.",
    });
  };

  const handleEmailFinance = () => {
    toast({
      title: "Email Sent",
      description: "Financial analysis has been emailed to the finance team.",
    });
  };

  const handlePushToCRM = () => {
    toast({
      title: "Data Pushed",
      description: "Analysis has been pushed to CRM dashboard.",
    });
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-50 text-red-600"><TrendingDown className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-50 text-amber-600">Medium</Badge>;
      case 'low':
        return <Badge className="bg-yellow-50 text-yellow-600">Low</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-600">Unknown</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Financial Data Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Analyze historical sales and transactions to forecast trends and detect anomalies
          </p>
        </div>

        {/* Data Source Panel */}
        <AgentDataSourcePanel 
          sources={dataSources}
          agentType="financial"
          onRefresh={handleRefreshDataSources}
        />

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Data Source Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CRM Source</label>
                <Select value={selectedCRM} onValueChange={setSelectedCRM}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select CRM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoho">Zoho CRM</SelectItem>
                    <SelectItem value="netsuite">NetSuite</SelectItem>
                    <SelectItem value="dynamics">Dynamics 365</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Range</label>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="12months">Last 12 Months</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Metrics</label>
                <Select defaultValue="revenue">
                  <SelectTrigger>
                    <SelectValue placeholder="Select metrics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="orders">Order Volume</SelectItem>
                    <SelectItem value="clients">Client Acquisition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleProcessData} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Analyze Financial Data"}
            </Button>
          </CardContent>
        </Card>

        {showResults && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Financial Analysis Results</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Data processed: {new Date().toLocaleDateString()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="forecast" value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b px-6 py-2">
                  <TabsList>
                    <TabsTrigger value="forecast">Forecast</TabsTrigger>
                    <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                    <TabsTrigger value="rawdata">Raw Data</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="forecast" className="p-6 space-y-4">
                  <div className="h-[300px] w-full">
                    <ChartContainer>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={forecastData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="Actual Revenue (₹M)"
                            dot={{ r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecast" 
                            stroke="#10b981" 
                            strokeDasharray="5 5" 
                            strokeWidth={2}
                            name="Forecast (₹M)"
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                  
                  <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-700 mb-2">Forecast Insights</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Projected revenue growth of 31.7% over the next 6 months</li>
                      <li>• Q3 expected to outperform Q2 by approximately 14%</li>
                      <li>• ARIMA model confidence interval: 85-92%</li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="anomalies" className="p-6 space-y-4">
                  <div className="h-[200px] w-full mb-6">
                    <ChartContainer>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={anomalyData.map(item => ({
                          name: item.client,
                          expected: item.issue === "Revenue drop" ? 85 : 
                                    item.issue === "Payment pattern" ? 60 : 40,
                          actual: item.issue === "Revenue drop" ? 30 : 
                                  item.issue === "Payment pattern" ? 15 : 20,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="expected" name="Expected" fill="#9ca3af" />
                          <Bar dataKey="actual" name="Actual" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Impact</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anomalyData.map((anomaly, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{anomaly.client}</TableCell>
                          <TableCell>{anomaly.issue}</TableCell>
                          <TableCell>{getSeverityBadge(anomaly.severity)}</TableCell>
                          <TableCell>{anomaly.impact}</TableCell>
                          <TableCell>{new Date(anomaly.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="rawdata" className="p-0">
                  <div className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing 15 of 243 records. Data has been cleansed and deduplicated.
                    </p>
                  </div>
                  <div className="border-t">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rawData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{row.id}</TableCell>
                            <TableCell>{row.client}</TableCell>
                            <TableCell>{row.amount}</TableCell>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.category}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t pt-4 pb-4 flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEmailFinance}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email to Finance Team
                </Button>
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Full Report
                </Button>
              </div>
              <Button onClick={handlePushToCRM}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Push to CRM Dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default FinancialAnalysis;
