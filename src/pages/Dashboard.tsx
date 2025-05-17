
import { useState, useEffect } from 'react';
import { BarChart, CreditCard, DollarSign, Users, TrendingUp, PieChart, Database, FileText } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Get an overview of your transaction processing status and analytics
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-muted/30">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="advanced" 
            className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Advanced Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Documents"
              value={isLoading ? "..." : "127"}
              description="Processed this month"
              icon={<FileText className="h-4 w-4" />}
              trend={{ value: 12, positive: true }}
            />
            <StatCard
              title="Processing Value"
              value={isLoading ? "..." : "$245,890"}
              description="Total transaction value"
              icon={<DollarSign className="h-4 w-4" />}
              trend={{ value: 8, positive: true }}
            />
            <StatCard
              title="Vendors"
              value={isLoading ? "..." : "24"}
              description="Active this quarter"
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="Pending Approvals"
              value={isLoading ? "..." : "12"}
              description="Require attention"
              icon={<CreditCard className="h-4 w-4" />}
              trend={{ value: 3, positive: false }}
            />
          </div>
          
          <DashboardCharts />
          
          <RecentTransactions />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-8 mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Data Processing Rate"
              value={isLoading ? "..." : "98.2%"}
              description="Success rate"
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{ value: 2.5, positive: true }}
            />
            <StatCard
              title="Data Accuracy"
              value={isLoading ? "..." : "95.7%"}
              description="OCR confidence"
              icon={<BarChart className="h-4 w-4" />}
              trend={{ value: 1.3, positive: true }}
            />
            <StatCard
              title="Database Entries"
              value={isLoading ? "..." : "4,271"}
              description="Total records"
              icon={<Database className="h-4 w-4" />}
              trend={{ value: 321, positive: true }}
            />
            <StatCard
              title="AI Processed"
              value={isLoading ? "..." : "87%"}
              description="Of all documents"
              icon={<PieChart className="h-4 w-4" />}
              trend={{ value: 5, positive: true }}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart className="h-12 w-12 mx-auto mb-2 text-muted" />
                    <p>Advanced performance analytics will appear here</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Document Type Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-2 text-muted" />
                    <p>Document type distribution analytics will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Processing History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-2 text-muted" />
                  <p>Connect your database to view processing history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
