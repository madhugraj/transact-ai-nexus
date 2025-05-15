
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { DatabaseIcon, UploadCloud, Table, ArrowRight, Loader2 } from 'lucide-react';

const SapDataImport: React.FC = () => {
  const [connectionTab, setConnectionTab] = useState("direct");
  const [server, setServer] = useState('');
  const [port, setPort] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState('');
  const [sapSystem, setSapSystem] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sapTables, setSapTables] = useState<Array<{id: string, name: string, description: string}>>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const { toast } = useToast();

  // Mock data for demonstration purposes
  const mockTables = [
    { id: '1', name: 'MATDOC', description: 'Material Document Table' },
    { id: '2', name: 'MAKT', description: 'Material Descriptions' },
    { id: '3', name: 'MARA', description: 'General Material Data' },
    { id: '4', name: 'BKPF', description: 'Accounting Document Header' },
    { id: '5', name: 'MKPF', description: 'Material Document Header' }
  ];

  const handleConnect = () => {
    if (connectionTab === 'direct' && (!server || !port || !username || !password || !clientId || !sapSystem)) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields for SAP connection",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);

    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setSapTables(mockTables);
      toast({
        title: "Connection successful",
        description: "Successfully connected to SAP system"
      });
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      
      // When file is selected in file mode, simulate immediate "connection"
      if (connectionTab === 'file') {
        setIsConnected(true);
        setSapTables(mockTables);
      }
    }
  };

  const handleImportTable = () => {
    if (!selectedTable && connectionTab === 'direct') {
      toast({
        title: "No table selected",
        description: "Please select a table to import",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);

    // Simulate import process
    setTimeout(() => {
      setIsConnecting(false);
      toast({
        title: "Data imported successfully",
        description: connectionTab === 'direct' 
          ? `SAP table ${selectedTable} has been imported` 
          : `File ${selectedFile?.name} has been processed`
      });
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">SAP Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={connectionTab} 
            onValueChange={setConnectionTab} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct">Direct Connection</TabsTrigger>
              <TabsTrigger value="file">File Upload</TabsTrigger>
            </TabsList>
            
            {/* Direct Connection Tab */}
            <TabsContent value="direct" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="server">Server/Host</Label>
                  <Input 
                    id="server" 
                    placeholder="sap.example.com" 
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    disabled={isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input 
                    id="port" 
                    placeholder="3200" 
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    disabled={isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="SAP_USER" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="•••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input 
                    id="clientId" 
                    placeholder="100" 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    disabled={isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sapSystem">SAP System</Label>
                  <Input 
                    id="sapSystem" 
                    placeholder="PRD" 
                    value={sapSystem}
                    onChange={(e) => setSapSystem(e.target.value)}
                    disabled={isConnected}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* File Upload Tab */}
            <TabsContent value="file" className="mt-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <UploadCloud className="h-10 w-10 text-gray-400" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Upload SAP Data File</h3>
                    <p className="text-sm text-gray-500">
                      Drag and drop your SAP data export file or click to browse
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => document.getElementById("sap-file-upload")?.click()}
                    disabled={isConnecting}
                  >
                    Browse Files
                  </Button>
                  <input
                    id="sap-file-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.csv,.txt,.xls"
                    onChange={handleFileChange}
                    disabled={isConnecting}
                  />
                  {selectedFile && (
                    <div className="mt-4 text-sm bg-gray-100 p-2 rounded-md">
                      Selected: <span className="font-semibold">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          {isConnected ? (
            <Button 
              variant="outline" 
              onClick={() => setIsConnected(false)}
              className="w-full"
              disabled={isConnecting}
            >
              Disconnect
            </Button>
          ) : (
            <Button 
              onClick={handleConnect}
              disabled={isConnecting || (connectionTab === 'file' && !selectedFile)} 
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
                </>
              ) : (
                <>
                  <DatabaseIcon className="mr-2 h-4 w-4" /> Connect to SAP
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* SAP Tables Section - Only shown when connected */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {connectionTab === 'direct' ? 'Available SAP Tables' : 'Process SAP Data File'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionTab === 'direct' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="table-select">Select Table</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {sapTables.map(table => (
                        <SelectItem key={table.id} value={table.name}>
                          {table.name} - {table.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTable && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Table className="h-4 w-4 mr-2" /> Table Details
                    </h4>
                    <p className="text-sm text-gray-500">
                      {sapTables.find(t => t.name === selectedTable)?.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              selectedFile && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-2">File Details</h4>
                  <div className="text-sm space-y-2">
                    <p>Name: <span className="font-medium">{selectedFile.name}</span></p>
                    <p>Size: <span className="font-medium">{(selectedFile.size / 1024).toFixed(2)} KB</span></p>
                    <p>Type: <span className="font-medium">{selectedFile.type || 'Unknown'}</span></p>
                  </div>
                </div>
              )
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleImportTable} 
              disabled={isConnecting || (connectionTab === 'direct' && !selectedTable)} 
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" /> 
                  {connectionTab === 'direct' ? 'Import Selected Table' : 'Process SAP File'}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default SapDataImport;
