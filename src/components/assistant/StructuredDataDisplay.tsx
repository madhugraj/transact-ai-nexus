
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TableIcon, BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

interface TableData {
  headers: string[];
  rows: any[][];
  title?: string;
}

interface ChartOptions {
  type: 'bar' | 'line' | 'pie';
  xKey?: string;
  yKeys?: string[];
  data?: any[];
  title?: string;
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
  const [activeView, setActiveView] = useState<string>('table');
  const { tableData, chartOptions, rawData } = data;

  // Enhanced function to process data from nested structure
  const processedTableData = React.useMemo(() => {
    // If we have direct tableData, use it
    if (tableData) {
      console.log("Direct tableData found:", tableData);
      return tableData;
    }
    
    // If rawData contains tables array
    if (rawData && rawData.tables && Array.isArray(rawData.tables) && rawData.tables.length > 0) {
      console.log("Using first table from rawData.tables:", rawData.tables[0]);
      return rawData.tables[0];
    }
    
    // Check if rawData has direct headers and rows
    if (rawData && rawData.headers && rawData.rows) {
      console.log("Using headers and rows directly from rawData");
      return rawData;
    }
    
    console.log("No valid table data found");
    return null;
  }, [tableData, rawData]);
  
  // Set initial active view based on available data
  useEffect(() => {
    if (processedTableData) {
      setActiveView('table');
      console.log("Setting active view to table");
    } else if (chartOptions) {
      setActiveView('chart');
      console.log("Setting active view to chart");
    } else {
      setActiveView('raw');
      console.log("Setting active view to raw (no structured data)");
    }
  }, [processedTableData, chartOptions]);
  
  // Enhanced chart data generation with better error handling
  const chartData = React.useMemo(() => {
    // If chart options already has data, use it
    if (chartOptions?.data && chartOptions.data.length > 0) {
      console.log("Using data from chartOptions:", chartOptions.data.length, "items");
      return chartOptions.data;
    }
    
    // Try to generate chart data from table data
    if (processedTableData && processedTableData.rows && processedTableData.rows.length > 0 && processedTableData.headers) {
      console.log("Generating chart data from table data");
      
      try {
        // Convert table data to chart-friendly format
        return processedTableData.rows.map((row, index) => {
          if (!Array.isArray(row) || row.length < 2) {
            console.log("Skipping invalid row:", row);
            return null; // Skip invalid rows
          }
          
          const dataPoint: any = { name: row[0] || `Item ${index + 1}` };  // Use first column as name/label
          
          // Add each column as a data point
          processedTableData.headers.forEach((header, headerIndex) => {
            if (headerIndex > 0 && headerIndex < row.length) { // Skip first column which we used as name
              // Try to parse as number if possible
              let value: any = row[headerIndex];
              
              if (typeof value === 'string') {
                // Remove any non-numeric characters except decimal point and minus sign
                const cleanedValue = value.replace(/[^0-9.-]+/g, '');
                value = cleanedValue ? parseFloat(cleanedValue) : 0;
              } else if (typeof value !== 'number') {
                value = 0;
              }
              
              // Use header as key, if not available use column index
              const key = header || `Column ${headerIndex}`;
              dataPoint[key] = isNaN(value) ? 0 : value;
            }
          });
          
          return dataPoint;
        }).filter(Boolean); // Remove null entries
      } catch (error) {
        console.error("Error generating chart data:", error);
        return [];
      }
    }
    
    console.log("No data available for chart");
    return [];
  }, [processedTableData, chartOptions]);

  // Determine what fields to show in charts - improved with fallbacks
  const fields = React.useMemo(() => {
    // Use explicitly provided fields if available
    if (chartOptions?.yKeys && chartOptions.yKeys.length > 0) {
      console.log("Using yKeys from chartOptions:", chartOptions.yKeys);
      return chartOptions.yKeys;
    }
    
    // Use table headers if available, skipping the first column (used as name)
    if (processedTableData?.headers && processedTableData.headers.length > 1) {
      const fieldNames = processedTableData.headers.slice(1);
      console.log("Using fields from table headers:", fieldNames);
      return fieldNames;
    }
    
    // Extract fields from chart data
    if (chartData.length > 0) {
      // Get all keys except 'name'
      const extractedFields = Object.keys(chartData[0]).filter(key => key !== 'name');
      console.log("Extracted fields from chart data:", extractedFields);
      return extractedFields;
    }
    
    console.log("No fields detected for chart");
    return [];
  }, [chartData, chartOptions, processedTableData]);

  // Early return if no data
  if (!processedTableData && !chartOptions && !rawData) {
    console.log("No data to display");
    return null;
  }

  // Determine which tabs to show
  const showTableTab = processedTableData && processedTableData.headers && processedTableData.rows;
  const showChartTab = chartOptions || (chartData && chartData.length > 0 && fields.length > 0);

  console.log("Rendering with:", { 
    showTableTab, 
    showChartTab, 
    tableRows: processedTableData?.rows?.length,
    chartDataPoints: chartData.length,
    fields: fields.length
  });

  return (
    <div className="mt-2 border rounded-md overflow-hidden bg-card">
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <div className="flex items-center justify-between border-b p-2">
          <h4 className="text-sm font-medium">
            {processedTableData?.title || chartOptions?.title || "Analysis Results"}
          </h4>
          <TabsList className="grid w-auto grid-cols-3 h-8">
            {showTableTab && (
              <TabsTrigger value="table" className="flex items-center space-x-1 px-3">
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </TabsTrigger>
            )}
            
            {showChartTab && (
              <TabsTrigger value="chart" className="flex items-center space-x-1 px-3">
                {(chartOptions?.type === 'bar' || !chartOptions?.type) && <BarChart2 className="h-3.5 w-3.5" />}
                {chartOptions?.type === 'line' && <LineChartIcon className="h-3.5 w-3.5" />}
                {chartOptions?.type === 'pie' && <PieChartIcon className="h-3.5 w-3.5" />}
                <span>Chart</span>
              </TabsTrigger>
            )}
            
            <TabsTrigger value="raw" className="px-3">
              <span>JSON</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        {showTableTab && (
          <TabsContent value="table" className="p-0 m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {processedTableData.headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedTableData.rows.map((row, rowIndex) => (
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
        
        {showChartTab && (
          <TabsContent value="chart" className="p-4 m-0">
            <div className="h-64 w-full">
              {(!chartOptions?.type || chartOptions?.type === 'bar') && chartData.length > 0 && fields.length > 0 && (
                <ChartContainer
                  config={{
                    ...fields.reduce((acc, field, i) => ({ 
                      ...acc, 
                      [field]: { color: COLORS[i % COLORS.length] } 
                    }), {}),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
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
                  </ResponsiveContainer>
                </ChartContainer>
              )}
              
              {chartOptions?.type === 'line' && chartData.length > 0 && fields.length > 0 && (
                <ChartContainer
                  config={{
                    ...fields.reduce((acc, field, i) => ({ 
                      ...acc, 
                      [field]: { color: COLORS[i % COLORS.length] } 
                    }), {}),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
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
                  </ResponsiveContainer>
                </ChartContainer>
              )}
              
              {chartOptions?.type === 'pie' && chartData.length > 0 && fields.length > 0 && (
                <ChartContainer
                  config={{
                    ...fields.reduce((acc, field, i) => ({ 
                      ...acc, 
                      [field]: { color: COLORS[i % COLORS.length] } 
                    }), {}),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
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
                  </ResponsiveContainer>
                </ChartContainer>
              )}
              
              {/* Fallback message if no chart can be rendered */}
              {(chartData.length === 0 || fields.length === 0) && (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Not enough data to display a chart</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}
        
        <TabsContent value="raw" className="p-4 m-0">
          <pre className="text-xs overflow-auto whitespace-pre-wrap bg-muted p-2 rounded-md max-h-64 text-foreground">
            {JSON.stringify(rawData || tableData || chartData, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StructuredDataDisplay;
