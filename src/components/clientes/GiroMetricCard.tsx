
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GiroMetricCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: 'vermelho' | 'amarelo' | 'verde';
  className?: string;
}

export default function GiroMetricCard({ 
  title, 
  value, 
  suffix,
  description, 
  icon,
  trend,
  status,
  className 
}: GiroMetricCardProps) {
  const displayValue = typeof value === 'number' 
    ? (suffix ? `${value} ${suffix}` : value) 
    : value;

  const getStatusColor = () => {
    switch(status) {
      case 'verde': return 'bg-green-500';
      case 'amarelo': return 'bg-yellow-500';
      case 'vermelho': return 'bg-red-500';
      default: return '';
    }
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">
              {displayValue}
              {status && (
                <span 
                  className={cn(
                    "inline-block ml-2 w-3 h-3 rounded-full",
                    getStatusColor()
                  )}
                />
              )}
            </h3>
            
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
                  {trend.isPositive ? '+' : '-'}{trend.value}%
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
