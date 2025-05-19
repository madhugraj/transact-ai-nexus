
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TableIcon, BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

interface TableData {
  headers: string[];
  rows: any[][];
}

interface ChartOptions {
  type: 'bar' | 'line' | 'pie';
  xKey?: string;
  yKeys?: string[];
  data?: any[];
}

interface StructuredDataDisplayProps {
  data: {
    tableData?: TableData;
    chartOptions?: ChartOptions;
    rawData?: any;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

const StructuredDataDisplay: React.FC<StructuredDataDisplayProps> = ({ data }) => {
  const { tableData, chartOptions, rawData } = data;
  const [activeView, setActiveView] = useState<string>(tableData ? 'table' : chartOptions ? 'chart' : 'raw');
  
  // Generate chart data from table data if chart options present but no specific chart data
  const chartData = React.useMemo(() => {
    if (chartOptions?.data) {
      return chartOptions.data;
    }
    
    if (tableData && chartOptions) {
      // Try to convert table data to chart data
      return tableData.rows.map((row, index) => {
        const dataPoint: any = { name: row[0] };  // Assume first column is name/label
        
        // Add each column as a data point
        tableData.headers.forEach((header, headerIndex) => {
          if (headerIndex > 0) { // Skip first column which we used as name
            // Try to parse as number if possible
            const value = typeof row[headerIndex] === 'string' 
              ? parseFloat(row[headerIndex].replace(/[^0-9.-]+/g, ''))
              : row[headerIndex];
              
            dataPoint[header] = isNaN(value) ? 0 : value;
          }
        });
        
        return dataPoint;
      });
    }
    
    return [];
  }, [tableData, chartOptions]);

  // Determine what fields to show in charts
  const fields = React.useMemo(() => {
    if (chartOptions?.yKeys) {
      return chartOptions.yKeys;
    }
    
    if (tableData) {
      // Skip first header which we use as name
      return tableData.headers.slice(1);
    }
    
    if (chartData.length > 0) {
      // Get all keys except 'name'
      return Object.keys(chartData[0]).filter(key => key !== 'name');
    }
    
    return [];
  }, [chartData, chartOptions, tableData]);

  if (!tableData && !chartOptions && !rawData) {
    return null;
  }

  return (
    <div className="mt-2 border rounded-md overflow-hidden bg-card">
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <div className="flex items-center justify-between border-b p-2">
          <h4 className="text-sm font-medium">Analysis Results</h4>
          <TabsList className="grid w-auto grid-cols-3 h-8">
            {tableData && (
              <TabsTrigger value="table" className="flex items-center space-x-1 px-3">
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </TabsTrigger>
            )}
            
            {chartOptions && chartData.length > 0 && (
              <TabsTrigger value="chart" className="flex items-center space-x-1 px-3">
                {chartOptions.type === 'bar' && <BarChart2 className="h-3.5 w-3.5" />}
                {chartOptions.type === 'line' && <LineChartIcon className="h-3.5 w-3.5" />}
                {chartOptions.type === 'pie' && <PieChartIcon className="h-3.5 w-3.5" />}
                <span>Chart</span>
              </TabsTrigger>
            )}
            
            <TabsTrigger value="raw" className="px-3">
              <span>JSON</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        {tableData && (
          <TabsContent value="table" className="p-0 m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableData.headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}
        
        {chartOptions && chartData.length > 0 && (
          <TabsContent value="chart" className="p-4 m-0">
            <div className="h-64 w-full">
              {chartOptions.type === 'bar' && (
                <ChartContainer
                  config={{
                    ...fields.reduce((acc, field, i) => ({ 
                      ...acc, 
                      [field]: { color: COLORS[i % COLORS.length] } 
                    }), {}),
                  }}
                >
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {fields.map((field, index) => (
                      <Bar 
                        key={field} 
                        dataKey={field} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </BarChart>
                </ChartContainer>
              )}
              
              {chartOptions.type === 'line' && (
                <ChartContainer
                  config={{
                    ...fields.reduce((acc, field, i) => ({ 
                      ...acc, 
                      [field]: { color: COLORS[i % COLORS.length] } 
                    }), {}),
                  }}
                >
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {fields.map((field, index) => (
                      <Line 
                        key={field}
                        type="monotone" 
                        dataKey={field} 
                        stroke={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </LineChart>
                </ChartContainer>
              )}
              
              {chartOptions.type === 'pie' && (
                <ChartContainer
                  config={{
                    ...fields.reduce((acc, field, i) => ({ 
                      ...acc, 
                      [field]: { color: COLORS[i % COLORS.length] } 
                    }), {}),
                  }}
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Pie
                      data={chartData}
                      dataKey={fields[0]}
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
            </div>
          </TabsContent>
        )}
        
        <TabsContent value="raw" className="p-4 m-0">
          <pre className="text-xs overflow-auto whitespace-pre-wrap bg-muted p-2 rounded-md max-h-64">
            {JSON.stringify(rawData || tableData || chartData, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StructuredDataDisplay;
