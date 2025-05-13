
import { useState, useEffect } from 'react';
import { BarChart, CreditCard, DollarSign, Users } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import RecentTransactions from '@/components/dashboard/RecentTransactions';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  
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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={isLoading ? "..." : "127"}
          description="Processed this month"
          icon={<BarChart className="h-4 w-4" />}
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
    </div>
  );
};

export default Dashboard;
