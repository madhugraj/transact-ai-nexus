
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

const StatCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className
}: StatCardProps) => {
  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p className={cn(
              "text-xs flex items-center",
              trend.positive ? "text-status-approved" : "text-status-rejected"
            )}>
              <span className={cn(
                "mr-1",
                trend.positive ? "text-status-approved" : "text-status-rejected"
              )}>
                {trend.positive ? '↑' : '↓'}
              </span>
              {trend.value}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
