
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatusCardProps = {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

export default function StatusCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend,
  className 
}: StatusCardProps) {
  return (
    <div className={cn("dashboard-card", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span 
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                vs. semana anterior
              </span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
