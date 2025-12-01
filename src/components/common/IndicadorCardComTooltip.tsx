import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import TooltipExplicativo, { ExplicacaoCalculoProps } from '@/components/common/TooltipExplicativo';
import { cn } from '@/lib/utils';

interface IndicadorCardComTooltipProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  isLoading?: boolean;
  tooltip?: ExplicacaoCalculoProps;
  onClick?: () => void;
  className?: string;
}

const IndicadorCardComTooltip = memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  isLoading = false,
  tooltip,
  onClick,
  className
}: IndicadorCardComTooltipProps) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
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

IndicadorCardComTooltip.displayName = 'IndicadorCardComTooltip';

export default IndicadorCardComTooltip;
