
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSearch, File, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// Types for document comparison
interface DocumentDetails {
  vendor?: string;
  amount?: number;
  quantity?: number;
  date?: string;
  documentNumber?: string;
}

interface ComparisonResult {
  field: string;
  poValue: string | number;
  invoiceValue: string | number;
  match: boolean;
}

const DocumentComparison = () => {
  const { toast } = useToast();
  const [poFile, setPoFile] = useState<File | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState<number>(0);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [matchPercentage, setMatchPercentage] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("upload");

  // Mock data for charts
  const chartData = [
    { name: "Vendor", match: 85, mismatch: 15 },
    { name: "Amount", match: 70, mismatch: 30 },
    { name: "Quantity", match: 95, mismatch: 5 },
    { name: "Date", match: 65, mismatch: 35 },
  ];

  // Handle PO file selection
  const handlePoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPoFile(e.target.files[0]);
      toast({
        title: "PO Uploaded",
        description: `Successfully uploaded ${e.target.files[0].name}`,
      });
    }
  };

  // Handle Invoice file selection
  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setInvoiceFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Invoice(s) Uploaded",
        description: `Successfully uploaded ${newFiles.length} invoice(s)`,
      });
    }
  };

  // Remove invoice file
  const removeInvoiceFile = (index: number) => {
    setInvoiceFiles(invoiceFiles.filter((_, i) => i !== index));
    if (activeInvoiceIndex === index) {
      setActiveInvoiceIndex(0);
    }
  };

  // Compare documents
  const compareDocuments = () => {
    if (!poFile || invoiceFiles.length === 0) {
      toast({
        title: "Missing Documents",
        description: "Please upload both PO and at least one Invoice",
        variant: "destructive",
      });
      return;
    }

    setIsComparing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      // Mock comparison results
      const mockResults: ComparisonResult[] = [
        { field: "Vendor", poValue: "Apex Financial Corp", invoiceValue: "Apex Financial", match: false },
        { field: "Amount", poValue: 54000, invoiceValue: 54400, match: false },
        { field: "Quantity", poValue: "1 license, 20 hours", invoiceValue: "1 license, 22 hours", match: false },
        { field: "Date", poValue: "2023-05-15", invoiceValue: "2023-05-16", match: false },
        { field: "Document Number", poValue: "PO-2025-001", invoiceValue: "INV-2025-789", match: false }
      ];
      
      // Calculate match percentage
      const matchCount = mockResults.filter(result => result.match).length;
      const percentage = Math.round((matchCount / mockResults.length) * 100);
      
      setComparisonResults(mockResults);
      setMatchPercentage(percentage);
      setIsComparing(false);
      setActiveTab("results");
      
      toast({
        title: "Comparison Complete",
        description: `Documents compared with ${percentage}% match`,
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="results" disabled={comparisonResults.length === 0}>
            Comparison Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Purchase Order Upload */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-blue-50 dark:bg-blue-950/20 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Purchase Order
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {poFile ? (
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="truncate max-w-[200px]">{poFile.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setPoFile(null)}
                    >
                      Replace
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-md">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">Upload your Purchase Order document</p>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('po-upload')?.click()}
                    >
                      Select PO
                    </Button>
                    <input
                      id="po-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handlePoFileChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Invoice Upload */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-amber-50 dark:bg-amber-950/20 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Invoice(s)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {invoiceFiles.length > 0 ? (
                  <div className="space-y-2">
                    {invoiceFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-amber-500" />
                          <span className="truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeInvoiceFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => document.getElementById('invoice-upload')?.click()}
                    >
                      Add More Invoices
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-md">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">Upload one or more Invoice documents</p>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('invoice-upload')?.click()}
                    >
                      Select Invoice(s)
                    </Button>
                    <input
                      id="invoice-upload"
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleInvoiceFileChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Comparison Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className="gap-2"
              disabled={!poFile || invoiceFiles.length === 0 || isComparing}
              onClick={compareDocuments}
            >
              <FileSearch className="h-5 w-5" />
              {isComparing ? "Processing..." : "Compare Documents"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="mt-4 space-y-4">
          {comparisonResults.length > 0 && (
            <>
              {/* Invoice selector if multiple invoices */}
              {invoiceFiles.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {invoiceFiles.map((file, index) => (
                    <Button
                      key={index}
                      variant={activeInvoiceIndex === index ? "default" : "outline"}
                      className="text-xs"
                      onClick={() => setActiveInvoiceIndex(index)}
                    >
                      {file.name}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Comparison Summary */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-950/20">
                  <CardTitle className="text-lg">
                    Comparison Summary
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {poFile?.name} vs {invoiceFiles[activeInvoiceIndex]?.name}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Field Comparison</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="p-3 text-left font-medium">Field</th>
                              <th className="p-3 text-left font-medium">PO Value</th>
                              <th className="p-3 text-left font-medium">Invoice Value</th>
                              <th className="p-3 text-left font-medium">Match</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {comparisonResults.map((result, index) => (
                              <tr key={index} className={result.match ? "" : "bg-red-50 dark:bg-red-900/10"}>
                                <td className="p-3 font-medium">{result.field}</td>
                                <td className="p-3">{result.poValue}</td>
                                <td className="p-3">{result.invoiceValue}</td>
                                <td className="p-3">
                                  {result.match ? (
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                      Match
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                      Mismatch
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Match Statistics</h3>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-md flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                          <span className="font-medium">Overall Match:</span>
                          <span className="text-2xl font-bold">{matchPercentage}%</span>
                        </div>
                        
                        <div className="pt-2 h-64">
                          <ChartContainer
                            config={{
                              match: { color: "#22c55e" },
                              mismatch: { color: "#ef4444" },
                            }}
                          >
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="match" name="Match" fill="var(--color-match)" stackId="a" />
                              <Bar dataKey="mismatch" name="Mismatch" fill="var(--color-mismatch)" stackId="a" />
                              <ChartLegend content={<ChartLegendContent />} />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Download and Report Options */}
              <div className="flex justify-end gap-4">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Detailed Report
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentComparison;
