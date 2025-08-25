
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
        return 'border-green-200/60 bg-green-50/30';
      case 'warning':
        return 'border-orange-200/60 bg-orange-50/30';
      case 'danger':
        return 'border-red-200/60 bg-red-50/30';
      default:
        return 'border-blue-200/60 bg-blue-50/30';
    }
  };

  const getIconColors = () => {
    switch (severity) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-orange-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <Card className="group border border-border/60 bg-card backdrop-blur-sm hover:shadow-lg hover:shadow-black/5 hover:border-border/80 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "group border border-border/60 bg-card backdrop-blur-sm hover:shadow-lg hover:shadow-black/5 hover:border-border/80 transition-all duration-300",
        getSeverityColors(),
        onClick && "cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Ícone com fundo colorido */}
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all duration-300 shadow-sm",
            getIconColors()
          )}>
            <div className="text-white">
              {icon}
            </div>
          </div>
          
          {/* Conteúdo de texto */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-muted-foreground mb-1 truncate">{title}</p>
            <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-1">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
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

          {/* Seta de navegação se clicável */}
          {onClick && (
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
