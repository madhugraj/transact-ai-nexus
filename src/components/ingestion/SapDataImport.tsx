
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Upload, 
  FileSpreadsheet, 
  Filter, 
  TableProperties, 
  BarChart3,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from '@/components/ui/separator';
import { ChartContainer } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Define the data structure matching the SAP data
interface SapRecord {
  material: string;
  materialDescription: string;
  movementType: string;
  quantity: number;
  order: string;
  storageLocation: string;
  businessUnit: string;
  docDate: string;
  entryDate: string;
  user: string;
  purchaseOrder: string;
  docHeaderText: string;
  materialDoc: string;
  vendor: string;
  amountInLC: string;
  reference: string;
  postingDate: string;
  plant: string;
  movementTypeText: string;
  name1: string;
  status: 'complete' | 'partial';
  item: string;
}

// Sample data based on the provided SAP dump
const sampleData: SapRecord[] = [
  {
    material: '2010509',
    materialDescription: 'D4_3_VALVE - 81839',
    movementType: '101',
    quantity: 7,
    order: '',
    storageLocation: '1003',
    businessUnit: 'NOS',
    docDate: '21.01.2025',
    entryDate: '31.01.2025',
    user: 'MMEU6',
    purchaseOrder: '4500433199',
    docHeaderText: '169346',
    materialDoc: '5000467503',
    vendor: '100807',
    amountInLC: '65,416.68',
    reference: '2425409253@10080',
    postingDate: '31.01.2025',
    plant: '1000',
    movementTypeText: 'GR goods receipt',
    name1: 'Bull Plant I',
    status: 'partial',
    item: '1',
  },
  {
    material: '2010509',
    materialDescription: 'D4_3_VALVE - 81839',
    movementType: '101',
    quantity: 15,
    order: '',
    storageLocation: '1003',
    businessUnit: 'NOS',
    docDate: '21.01.2025',
    entryDate: '31.01.2025',
    user: 'MMEU6',
    purchaseOrder: '4500445236',
    docHeaderText: '169346',
    materialDoc: '5000467503',
    vendor: '100807',
    amountInLC: '1,40,178.60',
    reference: '2425409253@10080',
    postingDate: '31.01.2025',
    plant: '1000',
    movementTypeText: 'GR goods receipt',
    name1: 'Bull Plant I',
    status: 'complete',
    item: '3',
  },
  {
    material: '2010524',
    materialDescription: 'SD5_3_VALVE_WITH_HPCO - 102300873',
    movementType: '101',
    quantity: 20,
    order: '',
    storageLocation: '1003',
    businessUnit: 'NOS',
    docDate: '21.01.2025',
    entryDate: '31.01.2025',
    user: 'MMEU6',
    purchaseOrder: '4500443847',
    docHeaderText: '169346',
    materialDoc: '5000467503',
    vendor: '100807',
    amountInLC: '77,234.40',
    reference: '2425409253@10080',
    postingDate: '31.01.2025',
    plant: '1000',
    movementTypeText: 'GR goods receipt',
    name1: 'Bull Plant I',
    status: 'partial',
    item: '2',
  },
  {
    material: '7002031',
    materialDescription: 'H-EXT LDR MS PIPE LINE 7 ASSY',
    movementType: '101',
    quantity: 6,
    order: '11890255',
    storageLocation: '1003',
    businessUnit: 'NOS',
    docDate: '31.01.2025',
    entryDate: '31.01.2025',
    user: 'ABAP',
    purchaseOrder: '',
    docHeaderText: '',
    materialDoc: '4917354326',
    vendor: '',
    amountInLC: '2,571.42',
    reference: '',
    postingDate: '31.01.2025',
    plant: '1000',
    movementTypeText: 'GR for order',
    name1: 'Bull Plant I',
    status: 'complete',
    item: '1',
  },
  {
    material: '7002568',
    materialDescription: 'Ø63 CYLINDER HEAD ASSLY',
    movementType: '101',
    quantity: 1,
    order: '11887972',
    storageLocation: '1003',
    businessUnit: 'NOS',
    docDate: '31.01.2025',
    entryDate: '31.01.2025',
    user: 'ABAP',
    purchaseOrder: '',
    docHeaderText: '',
    materialDoc: '4917354308',
    vendor: '',
    amountInLC: '522.09',
    reference: '',
    postingDate: '31.01.2025',
    plant: '1000',
    movementTypeText: 'GR for order',
    name1: 'Bull Plant I',
    status: 'partial',
    item: '1',
  },
];

// Dashboard chart data
const chartData = [
  { name: 'Complete GR', value: 2, fill: '#4ade80' },
  { name: 'Partial GR', value: 3, fill: '#f97316' },
];

const materialChartData = [
  { name: '2010509', complete: 1, partial: 1 },
  { name: '2010524', complete: 0, partial: 1 },
  { name: '7002031', complete: 1, partial: 0 },
  { name: '7002568', complete: 0, partial: 1 },
];

const SapDataImport = () => {
  const [data, setData] = useState<SapRecord[]>(sampleData);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterPO, setFilterPO] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Start the import progress simulation
    setIsImporting(true);
    setImportProgress(0);
    
    // Simulate file processing
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setImportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsImporting(false);
        toast({
          title: "Import Complete",
          description: "SAP data has been successfully imported",
        });
      }
    }, 300);
  };

  // Filter the data based on user selections
  const filteredData = data.filter(record => {
    const materialMatch = filterMaterial ? record.material.includes(filterMaterial) || 
                                          record.materialDescription.toLowerCase().includes(filterMaterial.toLowerCase()) : true;
    const poMatch = filterPO ? record.purchaseOrder.includes(filterPO) : true;
    const statusMatch = filterStatus === 'all' ? true : record.status === filterStatus;
    
    return materialMatch && poMatch && statusMatch;
  });

  // Group data for charts
  const getPartialGRCount = () => {
    return data.filter(record => record.status === 'partial').length;
  };
  
  const getCompleteGRCount = () => {
    return data.filter(record => record.status === 'complete').length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">SAP Data Connector</h1>
        <p className="text-muted-foreground">
          Import and analyze SAP material movement data for invoice reconciliation and GR tracking
        </p>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList>
          <TabsTrigger value="import">Data Import</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import SAP Data</CardTitle>
              <CardDescription>
                Upload SAP export files to start analyzing your material movements and GR status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="source-type">Data Source</Label>
                    <Select defaultValue="excel">
                      <SelectTrigger>
                        <SelectValue placeholder="Select data source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel/CSV</SelectItem>
                        <SelectItem value="api">SAP API</SelectItem>
                        <SelectItem value="hana">SAP HANA Direct</SelectItem>
                        <SelectItem value="odata">OData Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="import-type">Import Type</Label>
                    <Select defaultValue="material">
                      <SelectTrigger>
                        <SelectValue placeholder="Select import type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material">Material Document</SelectItem>
                        <SelectItem value="po">Purchase Order</SelectItem>
                        <SelectItem value="grn">Goods Receipt</SelectItem>
                        <SelectItem value="invoice">Invoice Verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="font-medium">Upload SAP Export File</h3>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop or click to browse
                      </p>
                    </div>
                    <Input 
                      id="file-upload" 
                      type="file" 
                      className="hidden" 
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload">
                      <Button asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Select File
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: Excel, CSV (max 10MB)
                    </p>
                  </div>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing data...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Import Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-detect field mappings</span>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Update existing records</span>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Validate data during import</span>
                      <input type="checkbox" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>GR Status Overview</CardTitle>
                <CardDescription>
                  Summary of complete vs. partial goods receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartContainer config={{
                    complete: { label: "Complete GR", color: "#4ade80" },
                    partial: { label: "Partial GR", color: "#f97316" },
                  }}>
                    <BarChart
                      width={400}
                      height={300}
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Count" fill="var(--color-complete, #4ade80)" />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material-wise GR Status</CardTitle>
                <CardDescription>
                  Breakdown of complete and partial GRs by material
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartContainer config={{
                    complete: { label: "Complete", color: "#4ade80" },
                    partial: { label: "Partial", color: "#f97316" },
                  }}>
                    <BarChart
                      width={400}
                      height={300}
                      data={materialChartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="complete" name="Complete" fill="var(--color-complete, #4ade80)" />
                      <Bar dataKey="partial" name="Partial" fill="var(--color-partial, #f97316)" />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Material Documents</div>
                    <div className="text-2xl font-semibold">{data.length}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Partial GRNs</div>
                    <div className="text-2xl font-semibold text-orange-500">{getPartialGRCount()}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Complete GRNs</div>
                    <div className="text-2xl font-semibold text-green-500">{getCompleteGRCount()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Material Movement Transactions</CardTitle>
                  <CardDescription>
                    Detailed view of goods movement with status indicators
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <TableProperties className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="filter-material" className="mb-2 block">Material Filter</Label>
                    <div className="flex">
                      <Input
                        id="filter-material"
                        placeholder="Material or description"
                        value={filterMaterial}
                        onChange={(e) => setFilterMaterial(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="filter-po" className="mb-2 block">Purchase Order</Label>
                    <Input
                      id="filter-po"
                      placeholder="PO number"
                      value={filterPO}
                      onChange={(e) => setFilterPO(e.target.value)}
                    />
                  </div>
                  <div className="w-[150px]">
                    <Label htmlFor="filter-status" className="mb-2 block">GR Status</Label>
                    <Select 
                      value={filterStatus} 
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>PO</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Plant</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{record.material}</TableCell>
                          <TableCell>{record.materialDescription}</TableCell>
                          <TableCell>{record.quantity} {record.businessUnit}</TableCell>
                          <TableCell>{record.purchaseOrder || "-"}</TableCell>
                          <TableCell>{record.materialDoc}</TableCell>
                          <TableCell>{record.plant}</TableCell>
                          <TableCell className="text-right">
                            {record.status === 'complete' ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Complete
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Partial
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SapDataImport;
