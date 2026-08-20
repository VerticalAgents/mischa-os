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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 sm:p-6 sm:pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
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
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-1 sm:p-6 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-left leading-snug break-words">{title}</CardTitle>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="text-xl sm:text-2xl font-bold text-left">{value}</div>
        <p className="text-[10px] sm:text-xs text-muted-foreground text-left leading-snug break-words">{subtitle}</p>
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
