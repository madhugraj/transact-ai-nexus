
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart2, LineChart, PieChart, Table } from 'lucide-react';

export const InsightSettings: React.FC = () => {
  return (
    <Tabs defaultValue="analysis">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
        <TabsTrigger value="visualization">Visualization</TabsTrigger>
      </TabsList>
      
      <TabsContent value="analysis" className="space-y-4 pt-4">
        <div>
          <Label>Analysis Type</Label>
          <Select defaultValue="standard">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Analysis</SelectItem>
              <SelectItem value="financial">Financial Analysis</SelectItem>
              <SelectItem value="detailed">Detailed Breakdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Key Metrics</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="metric-amounts" defaultChecked />
              <label htmlFor="metric-amounts" className="text-sm">Amount Analysis</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="metric-dates" defaultChecked />
              <label htmlFor="metric-dates" className="text-sm">Date Patterns</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="metric-vendors" defaultChecked />
              <label htmlFor="metric-vendors" className="text-sm">Vendor Analysis</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="metric-category" defaultChecked />
              <label htmlFor="metric-category" className="text-sm">Category Detection</label>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="visualization" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Chart Preferences</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="chart-bar" defaultChecked />
              <label htmlFor="chart-bar" className="text-sm flex items-center">
                <BarChart2 className="h-3.5 w-3.5 mr-1" />
                Bar Charts
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="chart-line" defaultChecked />
              <label htmlFor="chart-line" className="text-sm flex items-center">
                <LineChart className="h-3.5 w-3.5 mr-1" />
                Line Charts
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="chart-pie" defaultChecked />
              <label htmlFor="chart-pie" className="text-sm flex items-center">
                <PieChart className="h-3.5 w-3.5 mr-1" />
                Pie Charts
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="chart-table" defaultChecked />
              <label htmlFor="chart-table" className="text-sm flex items-center">
                <Table className="h-3.5 w-3.5 mr-1" />
                Data Tables
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <Label>Default Visualization</Label>
          <Select defaultValue="bar">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
              <SelectItem value="table">Table View</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Additional Options</Label>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="viz-auto" defaultChecked />
              <label htmlFor="viz-auto" className="text-sm">Auto-select best visualization</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="viz-color-coded" defaultChecked />
              <label htmlFor="viz-color-coded" className="text-sm">Color-code data by category</label>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
