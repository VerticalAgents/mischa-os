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
      <Card className={cn("flex h-full flex-col", className)}>
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
        // h-full: a grade estica a celula, mas o cartao encolhe ate o conteudo
        // se ninguem mandar o contrario — era por isso que "Total de PDVs"
        // terminava mais alto que os vizinhos da mesma linha.
        "flex h-full flex-col bg-card shadow-tema",
        "transition-all duration-300 ease-out-expo [@media(hover:hover)]:hover:shadow-tema-md",
        onClick && "cursor-pointer hover:border-primary/50",
        tooltip && !onClick && "cursor-help",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-1 sm:p-5 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-left leading-snug break-words">{title}</CardTitle>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 p-3 pt-0 sm:p-5 sm:pt-0">
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
