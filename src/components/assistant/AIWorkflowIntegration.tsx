import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Database, Link, Settings, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AIWorkflowIntegration: React.FC = () => {
  const [activeTools, setActiveTools] = useState<string[]>(['table-analysis']);
  
  const toggleTool = (toolId: string) => {
    if (activeTools.includes(toolId)) {
      setActiveTools(activeTools.filter(id => id !== toolId));
    } else {
      setActiveTools([...activeTools, toolId]);
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-blue-500" />
            Assistant Tools
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tools">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`border rounded-lg p-3 transition-all ${activeTools.includes('table-analysis') ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'hover:border-gray-300'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">Table Analysis</span>
                  </div>
                  <Switch 
                    checked={activeTools.includes('table-analysis')} 
                    onCheckedChange={() => toggleTool('table-analysis')} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Analyze tabular data and extract insights automatically
                </p>
              </div>
              
              <div className={`border rounded-lg p-3 transition-all ${activeTools.includes('visualization') ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'hover:border-gray-300'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <BarChart2 className="h-4 w-4 mr-2 text-green-600" />
                    <span className="font-medium">Visualization</span>
                  </div>
                  <Switch 
                    checked={activeTools.includes('visualization')} 
                    onCheckedChange={() => toggleTool('visualization')} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Generate charts and graphs from your data
                </p>
              </div>
              
              <div className={`border rounded-lg p-3 transition-all ${activeTools.includes('external-data') ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'hover:border-gray-300'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Link className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="font-medium">External Data</span>
                  </div>
                  <Switch 
                    checked={activeTools.includes('external-data')} 
                    onCheckedChange={() => toggleTool('external-data')} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Connect to external APIs and data sources
                </p>
              </div>
            </div>
            
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">
                Selected tools will be available to the assistant
              </Label>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Intelligence Level</Label>
                <Slider defaultValue={[75]} max={100} step={25} className="py-4" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Basic</span>
                  <span>Standard</span>
                  <span>Advanced</span>
                  <span>Expert</span>
                </div>
              </div>
              
              <div>
                <Label>Response Style</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Data History</Label>
                  <p className="text-xs text-muted-foreground">Enable for better responses based on past interactions</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="integrations" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border p-3 rounded-lg">
                <div>
                  <p className="font-medium">Database Connection</p>
                  <p className="text-xs text-muted-foreground">Connect to your Supabase database</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between border p-3 rounded-lg">
                <div>
                  <p className="font-medium">External API</p>
                  <p className="text-xs text-muted-foreground">Connect to external data sources</p>
                </div>
                <Button variant="outline" size="sm">Add API</Button>
              </div>
              
              <div className="pt-2">
                <Input placeholder="Enter Webhook URL" />
                <p className="text-xs text-muted-foreground mt-1">
                  Connect external services via webhooks
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIWorkflowIntegration;
