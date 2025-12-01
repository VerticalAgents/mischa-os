import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import TooltipExplicativo, { ExplicacaoCalculoProps } from '@/components/common/TooltipExplicativo';
import { cn } from '@/lib/utils';

interface IndicadorCardComTendenciaProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  isLoading?: boolean;
  tooltip?: ExplicacaoCalculoProps;
  onClick?: () => void;
  className?: string;
  // Novos props para tendência
  variacao?: number;              // % de variação
  variacaoLabel?: string;         // Ex: "vs histórico"
}

const IndicadorCardComTendencia = memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  isLoading = false,
  tooltip,
  onClick,
  className,
  variacao,
  variacaoLabel = "vs histórico"
}: IndicadorCardComTendenciaProps) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50",
        tooltip && !onClick && "cursor-help",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-left">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-left">{value}</div>
        
        {/* Indicador de tendência */}
        {variacao !== undefined && (
          <div className="flex items-center gap-1 mt-1 mb-1">
            {variacao > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs font-semibold text-green-600">
                  +{variacao.toFixed(1)}%
                </span>
              </>
            ) : variacao < 0 ? (
              <>
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span className="text-xs font-semibold text-red-600">
                  {variacao.toFixed(1)}%
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                Estável
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-1">
              {variacaoLabel}
            </span>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground text-left">{subtitle}</p>
      </CardContent>
    </Card>
  );

  // Se tem tooltip, envolve o card
  if (tooltip) {
    return (
      <TooltipExplicativo 
        explicacao={tooltip}
        variant="indicator"
      >
        {cardContent}
      </TooltipExplicativo>
    );
  }

  return cardContent;
});

IndicadorCardComTendencia.displayName = 'IndicadorCardComTendencia';

export default IndicadorCardComTendencia;
