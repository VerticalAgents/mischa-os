
import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface DashboardMetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  loading?: boolean;
  severity?: 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export default function DashboardMetricsCard({
  title,
  value,
  subtitle,
  icon,
  loading = false,
  severity = 'info',
  trend,
  onClick
}: DashboardMetricsCardProps) {
  const getSeverityColors = () => {
    switch (severity) {
      case 'success':
        return 'border-green-200/60 bg-green-50/50';
      case 'warning':
        return 'border-yellow-200/60 bg-yellow-50/50';
      case 'danger':
        return 'border-red-200/60 bg-red-50/50';
      default:
        return 'border-blue-200/60 bg-blue-50/50';
    }
  };

  const getIconColors = () => {
    switch (severity) {
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  if (loading) {
    return (
      <Card className="group border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 text-left flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "group border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300",
        getSeverityColors(),
        onClick && "cursor-pointer hover:scale-[1.02] hover:-translate-y-1"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-left flex-1">
            <p className="text-sm font-medium text-muted-foreground text-left mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-foreground text-left group-hover:text-primary transition-colors">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground text-left mt-1 leading-relaxed">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2 text-left">
                <span 
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/10",
              getIconColors()
            )}>
              {icon}
            </div>
            {onClick && (
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
