
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';

// Mock data for charts
const invoiceData = [
  { month: 'Jan', processed: 65, pending: 28 },
  { month: 'Feb', processed: 59, pending: 32 },
  { month: 'Mar', processed: 80, pending: 27 },
  { month: 'Apr', processed: 81, pending: 25 },
  { month: 'May', processed: 56, pending: 15 },
  { month: 'Jun', processed: 55, pending: 22 },
  { month: 'Jul', processed: 78, pending: 30 },
];

const vendorData = [
  { name: 'ABC Corp', value: 400, fill: '#8884d8' },
  { name: 'XYZ Inc', value: 300, fill: '#82ca9d' },
  { name: 'Acme Ltd', value: 300, fill: '#ffc658' },
  { name: 'Tech Solutions', value: 200, fill: '#ff8042' },
  { name: 'Global Services', value: 100, fill: '#0088fe' },
];

const documentTypeData = [
  { name: 'Invoices', count: 135 },
  { name: 'Receipts', count: 85 },
  { name: 'POs', count: 55 },
  { name: 'Payments', count: 40 },
];

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer = ({ title, children }: ChartContainerProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pt-2">
      <div className="h-[300px]">
        {children}
      </div>
    </CardContent>
  </Card>
);

const DashboardCharts = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Analytics</h2>
        {/* Fixed: Making sure Tabs component properly wraps TabsList and TabsContent */}
        <Tabs defaultValue={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="quarter">Quarter</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer title="Invoice Processing">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={invoiceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="processed" 
                name="Processed"
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorProcessed)" 
              />
              <Area 
                type="monotone" 
                dataKey="pending" 
                name="Pending"
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#colorPending)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer title="Document Types">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={documentTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="count"
                name="Count" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer title="Vendor Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={vendorData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
