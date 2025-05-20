
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, AlertCircle, ExternalLink, Mail, Download, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComplianceIssue {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  keywords: string[];
  suggestedAction: string;
  sourceRecord?: string;
  client: string;
  type: string;
  status: "open" | "acknowledged" | "resolved";
}

const ComplianceMonitoring = () => {
  const [selectedSource, setSelectedSource] = useState("dynamics");
  const [selectedRegion, setSelectedRegion] = useState("india");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSourceRecord, setShowSourceRecord] = useState(false);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const { toast } = useToast();

  // Mock compliance issues
  const mockIssues: ComplianceIssue[] = [
    {
      id: "ci-001",
      title: "Missing VAT Registration Number",
      description: "International vendor invoice lacks valid VAT registration number required for tax compliance.",
      severity: "high",
      keywords: ["VAT exemption", "international vendor", "tax registration"],
      suggestedAction: "Contact vendor to request updated invoice with valid VAT registration or tax identification number.",
      sourceRecord: "Invoice #INV-2025-0412 from Global Tech Solutions",
      client: "Global Tech Solutions",
      type: "Missing Tax ID",
      status: "open"
    },
    {
      id: "ci-002",
      title: "Inconsistent Tax Treatment",
      description: "Multiple transactions with the same vendor have inconsistent tax treatments across invoices.",
      severity: "medium",
      keywords: ["tax inconsistency", "VAT treatment", "record mismatch"],
      suggestedAction: "Review tax treatment policy for this vendor and standardize in the accounting system.",
      sourceRecord: "Vendor: Eastern Supplies Ltd, Transaction IDs: TR-2345, TR-2401, TR-2567",
      client: "Eastern Supplies Ltd",
      type: "Tax Inconsistency",
      status: "open"
    },
    {
      id: "ci-003",
      title: "Late Filing Risk",
      description: "Upcoming GST filing deadline in 5 days with incomplete documentation from 3 departments.",
      severity: "high",
      keywords: ["GST filing", "deadline", "incomplete documentation"],
      suggestedAction: "Send urgent notification to department heads for missing documentation submission within 48 hours.",
      sourceRecord: "GST Filing Period: Jan-Mar 2025, Due: April 25, 2025",
      client: "Internal",
      type: "Filing Deadline",
      status: "open"
    },
    {
      id: "ci-004",
      title: "Expired Tax Exemption Certificate",
      description: "Tax exemption certificate for Educational Institute client expired last month.",
      severity: "medium",
      keywords: ["tax exemption", "certificate expiry", "education sector"],
      suggestedAction: "Request updated exemption certificate from client before next invoice generation.",
      sourceRecord: "Client: National Institute of Technology, Certificate #TEC-2023-0789, Expired: March 15, 2025",
      client: "National Institute of Technology",
      type: "Certificate Expiry",
      status: "open"
    },
    {
      id: "ci-005",
      title: "Address Mismatch on Legal Documents",
      description: "Corporate address on tax filings doesn't match address on recent legal documents.",
      severity: "low",
      keywords: ["address mismatch", "legal documentation", "compliance risk"],
      suggestedAction: "Update registered address in tax system or correct address on legal documents to ensure consistency.",
      sourceRecord: "Corporate Registry Filing #CR-2025-1204 vs. Tax Filing #GST-Q1-2025",
      client: "Internal",
      type: "Documentation Mismatch",
      status: "open"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 text-red-600";
      case "medium":
        return "bg-orange-50 text-orange-600";
      case "low":
        return "bg-yellow-50 text-yellow-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
      case "medium":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      case "low":
        return <Info className="h-3.5 w-3.5 mr-1" />;
      default:
        return <Info className="h-3.5 w-3.5 mr-1" />;
    }
  };

  const handleProcessScan = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowResults(true);
      setComplianceIssues(mockIssues);
    }, 2000);
  };

  const handleAcknowledge = (id: string) => {
    setComplianceIssues(current => 
      current.map(issue => 
        issue.id === id ? { ...issue, status: "acknowledged" as const } : issue
      )
    );
    
    toast({
      title: "Issue Acknowledged",
      description: `Compliance issue has been acknowledged and flagged for follow-up.`,
    });
  };
  
  const handleNotifyAccountant = (id: string) => {
    setComplianceIssues(current => 
      current.map(issue => 
        issue.id === id ? { ...issue, status: "acknowledged" as const } : issue
      )
    );
    
    toast({
      title: "Accountant Notified",
      description: `An alert has been sent to the accounting team for immediate review.`,
    });
  };

  const handleMarkResolved = (id: string) => {
    setComplianceIssues(current => 
      current.map(issue => 
        issue.id === id ? { ...issue, status: "resolved" as const } : issue
      )
    );
    
    toast({
      title: "Issue Resolved",
      description: `Compliance issue has been marked as resolved.`,
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Export Complete",
      description: "Compliance summary has been exported as PDF.",
    });
  };

  const toggleSourceRecord = () => {
    setShowSourceRecord(!showSourceRecord);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Compliance Monitoring & Anomaly Detection</h1>
          <p className="text-muted-foreground mt-1">
            Scan CRM and accounting data for regulatory and policy violations
          </p>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Source Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Source API</label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dynamics">Dynamics 365</SelectItem>
                    <SelectItem value="sage">Sage</SelectItem>
                    <SelectItem value="sap">SAP Business One</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Region</label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="india">India (GST)</SelectItem>
                    <SelectItem value="eu">European Union (VAT)</SelectItem>
                    <SelectItem value="us">United States (Sales Tax)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Compliance Set</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select compliance set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Compliance Rules</SelectItem>
                    <SelectItem value="tax">Tax Documentation</SelectItem>
                    <SelectItem value="reg">Regulatory Filings</SelectItem>
                    <SelectItem value="corp">Corporate Governance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleProcessScan} disabled={isProcessing}>
              {isProcessing ? "Scanning Records..." : "Run Compliance Scan"}
            </Button>
          </CardContent>
        </Card>

        {showResults && (
          <>
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Compliance Issues</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-1" />
                      Filter
                    </Button>
                    <Badge className="bg-red-50 text-red-600">
                      {complianceIssues.filter(issue => issue.severity === "high").length} High
                    </Badge>
                    <Badge className="bg-orange-50 text-orange-600">
                      {complianceIssues.filter(issue => issue.severity === "medium").length} Medium
                    </Badge>
                    <Badge className="bg-yellow-50 text-yellow-600">
                      {complianceIssues.filter(issue => issue.severity === "low").length} Low
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="issues">
                  <div className="border-b px-6 py-2">
                    <TabsList>
                      <TabsTrigger value="issues">Issues</TabsTrigger>
                      <TabsTrigger value="matrix">Compliance Matrix</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="issues" className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Issue</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complianceIssues.map((issue) => (
                          <TableRow key={issue.id} className={
                            issue.status === "resolved" ? "bg-green-50/30" : 
                            issue.status === "acknowledged" ? "bg-amber-50/30" : ""
                          }>
                            <TableCell>
                              <div>
                                <div className="font-medium">{issue.title}</div>
                                <div className="text-sm text-muted-foreground max-w-md truncate">{issue.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>{issue.client}</TableCell>
                            <TableCell>{issue.type}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${getSeverityColor(issue.severity)} flex items-center`}
                              >
                                {getSeverityIcon(issue.severity)}
                                {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                issue.status === "resolved" ? "bg-green-50 text-green-600" : 
                                issue.status === "acknowledged" ? "bg-amber-50 text-amber-600" : 
                                "bg-blue-50 text-blue-600"
                              }>
                                {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {issue.status === "open" && (
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleNotifyAccountant(issue.id)}>
                                    <Mail className="h-4 w-4 mr-1" />
                                    Notify
                                  </Button>
                                  <Button size="sm" onClick={() => handleAcknowledge(issue.id)}>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Acknowledge
                                  </Button>
                                </div>
                              )}
                              {issue.status === "acknowledged" && (
                                <Button size="sm" onClick={() => handleMarkResolved(issue.id)}>
                                  Mark Resolved
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="matrix" className="px-6 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Compliance Matrix by Client</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="w-3 h-3 inline-block mr-1 bg-green-500 rounded-sm"></span> Compliant
                        <span className="w-3 h-3 inline-block mx-1 bg-red-500 rounded-sm ml-2"></span> Issue Found
                        <span className="w-3 h-3 inline-block mx-1 bg-gray-200 rounded-sm ml-2"></span> Not Applicable
                      </div>
                    </div>
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Tax IDs</TableHead>
                            <TableHead>Invoice Compliance</TableHead>
                            <TableHead>Filing Status</TableHead>
                            <TableHead>Documentation</TableHead>
                            <TableHead>Overall</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from(new Set(mockIssues.map(issue => issue.client))).map((client, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{client}</TableCell>
                              <TableCell>
                                <Badge className={client === "Global Tech Solutions" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}>
                                  {client === "Global Tech Solutions" ? "Issue" : "OK"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={client === "Eastern Supplies Ltd" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}>
                                  {client === "Eastern Supplies Ltd" ? "Issue" : "OK"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={client === "Internal" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}>
                                  {client === "Internal" ? "Issue" : "OK"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={client === "National Institute of Technology" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}>
                                  {client === "National Institute of Technology" ? "Issue" : "OK"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-red-100 text-red-600">
                                  Issues Found
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-4 flex justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-source" 
                    checked={showSourceRecord} 
                    onCheckedChange={toggleSourceRecord} 
                  />
                  <Label htmlFor="show-source">View source records</Label>
                </div>
                
                <Button onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Compliance Summary
                </Button>
              </CardFooter>
            </Card>
            
            {showSourceRecord && (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Source Records</CardTitle>
                    <Badge variant="outline">Raw Data</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {complianceIssues.map((issue) => (
                      <div key={issue.id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{issue.title}</h3>
                          <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.sourceRecord}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {issue.keywords.map((keyword, kidx) => (
                            <Badge key={kidx} variant="secondary" className="bg-blue-50/70 text-blue-600">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ComplianceMonitoring;
