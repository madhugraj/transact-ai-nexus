
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, AlertCircle, ExternalLink, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ComplianceIssue {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  keywords: string[];
  suggestedAction: string;
  sourceRecord?: string;
}

const ComplianceMonitoring = () => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentIssue, setCurrentIssue] = useState(0);
  const [showSourceRecord, setShowSourceRecord] = useState(false);
  const [acknowledgedIssues, setAcknowledgedIssues] = useState<string[]>([]);
  const { toast } = useToast();

  // Mock compliance issues
  const complianceIssues: ComplianceIssue[] = [
    {
      id: "ci-001",
      title: "Missing VAT Registration Number",
      description: "International vendor invoice lacks valid VAT registration number required for tax compliance.",
      severity: "high",
      keywords: ["VAT exemption", "international vendor", "tax registration"],
      suggestedAction: "Contact vendor to request updated invoice with valid VAT registration or tax identification number.",
      sourceRecord: "Invoice #INV-2025-0412 from Global Tech Solutions"
    },
    {
      id: "ci-002",
      title: "Inconsistent Tax Treatment",
      description: "Multiple transactions with the same vendor have inconsistent tax treatments across invoices.",
      severity: "medium",
      keywords: ["tax inconsistency", "VAT treatment", "record mismatch"],
      suggestedAction: "Review tax treatment policy for this vendor and standardize in the accounting system.",
      sourceRecord: "Vendor: Eastern Supplies Ltd, Transaction IDs: TR-2345, TR-2401, TR-2567"
    },
    {
      id: "ci-003",
      title: "Late Filing Risk",
      description: "Upcoming GST filing deadline in 5 days with incomplete documentation from 3 departments.",
      severity: "high",
      keywords: ["GST filing", "deadline", "incomplete documentation"],
      suggestedAction: "Send urgent notification to department heads for missing documentation submission within 48 hours.",
      sourceRecord: "GST Filing Period: Jan-Mar 2025, Due: April 25, 2025"
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

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowResults(true);
    }, 1500);
  };

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIssues([...acknowledgedIssues, id]);
    toast({
      title: "Issue Acknowledged",
      description: `Compliance issue "${complianceIssues[currentIssue].title}" has been acknowledged.`,
    });
    
    if (currentIssue < complianceIssues.length - 1) {
      setCurrentIssue(currentIssue + 1);
      setShowSourceRecord(false);
    } else {
      handleComplete();
    }
  };
  
  const handleNotifyAccountant = (id: string) => {
    toast({
      title: "Accountant Notified",
      description: `An alert about "${complianceIssues[currentIssue].title}" has been sent to the accounting team.`,
    });
    
    if (currentIssue < complianceIssues.length - 1) {
      setCurrentIssue(currentIssue + 1);
      setShowSourceRecord(false);
    } else {
      handleComplete();
    }
  };
  
  const handleComplete = () => {
    toast({
      title: "Compliance Check Complete",
      description: `All ${complianceIssues.length} compliance issues have been reviewed.`,
    });
    
    setTimeout(() => {
      setShowResults(false);
      setCurrentIssue(0);
      setAcknowledgedIssues([]);
    }, 3000);
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
            AI-powered compliance checks and tax issue identification
          </p>
        </div>

        {!showResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Compliance Monitoring Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuerySubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Type 'check compliance' or 'scan for tax issues'..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? "Analyzing records from Dynamics 365 and Sage..." : "Run Compliance Check"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {showResults && currentIssue < complianceIssues.length && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>{complianceIssues[currentIssue].title}</CardTitle>
                <Badge 
                  variant="outline" 
                  className={`${getSeverityColor(complianceIssues[currentIssue].severity)} flex items-center`}
                >
                  {getSeverityIcon(complianceIssues[currentIssue].severity)}
                  {complianceIssues[currentIssue].severity.charAt(0).toUpperCase() + complianceIssues[currentIssue].severity.slice(1)} Severity
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p>{complianceIssues[currentIssue].description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {complianceIssues[currentIssue].keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-blue-50/70 text-blue-600">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                
                <div className="bg-amber-50/30 p-4 rounded-md border border-amber-100">
                  <p className="text-sm font-medium text-amber-700">Suggested Action</p>
                  <p className="text-amber-800 mt-1">{complianceIssues[currentIssue].suggestedAction}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="show-source" 
                      checked={showSourceRecord} 
                      onCheckedChange={toggleSourceRecord} 
                    />
                    <Label htmlFor="show-source">View source record</Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Issue {currentIssue + 1} of {complianceIssues.length}
                  </Badge>
                </div>
                
                {showSourceRecord && complianceIssues[currentIssue].sourceRecord && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-md text-sm border">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Source Record</p>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="mt-1 text-muted-foreground">{complianceIssues[currentIssue].sourceRecord}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => handleAcknowledge(complianceIssues[currentIssue].id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Acknowledge
              </Button>
              <Button 
                onClick={() => handleNotifyAccountant(complianceIssues[currentIssue].id)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Notify Accountant
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ComplianceMonitoring;
