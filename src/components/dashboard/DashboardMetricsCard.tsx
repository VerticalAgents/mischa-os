
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

  // Formatação do valor principal (mostrar 99+ se > 99)
  const formatValue = (val: string | number): string => {
    const numValue = typeof val === 'string' ? parseInt(val) || 0 : val;
    return numValue > 99 ? '99+' : String(numValue);
  };

  if (loading) {
    return (
      <Card 
        className="border border-border/60 bg-card backdrop-blur-sm hover:shadow-lg hover:shadow-black/5 hover:border-border/80 transition-all duration-300"
        role="region" 
        aria-label="Carregando métricas"
      >
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-32 mb-2" />
              </div>
            </div>
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "group border border-border/60 bg-card backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300",
        getSeverityColors(),
        onClick && "cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5"
      )}
      onClick={onClick}
      role="region"
      aria-label={`${title}: ${value}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 min-w-0 text-left">
          {/* Header: Ícone + Título */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all duration-300 shadow-sm",
              getIconColors()
            )}>
              <div className="text-white w-5 h-5 flex items-center justify-center" aria-hidden="true">
                {icon}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-muted-foreground truncate">
                {title}
              </h3>
            </div>

            {/* Seta de navegação se clicável */}
            {onClick && (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            )}
          </div>

          {/* Número Principal */}
          <div className="text-left">
            <div 
              className="text-4xl sm:text-3xl font-bold leading-none text-foreground group-hover:text-primary transition-colors"
              aria-live="polite"
            >
              {formatValue(value)}
            </div>
          </div>

          {/* Legenda */}
          {subtitle && (
            <p className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
              {subtitle}
            </p>
          )}

          {/* Trend (se houver) */}
          {trend && (
            <div className="flex items-center text-left">
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
      </CardContent>
    </Card>
  );
}
