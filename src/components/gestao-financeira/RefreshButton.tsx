
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useFinancialCache } from '@/hooks/useFinancialCache';
import { useAuditLog } from '@/hooks/useAuditLog';
import { toast } from '@/hooks/use-toast';

interface RefreshButtonProps {
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

export default function RefreshButton({ onRefresh, lastUpdated }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshData } = useFinancialCache();
  const { logAction } = useAuditLog();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Log the refresh action
      await logAction({
        action: 'DATA_REFRESH',
        table_name: 'financial_cache',
        new_values: {
          action: 'manual_refresh',
          timestamp: new Date().toISOString()
        }
      });

      await refreshData();
      if (onRefresh) {
        await onRefresh();
      }
      toast({
        title: "Dados atualizados",
        description: "Os indicadores financeiros foram recalculados com sucesso.",
      });
    } catch (error) {
      // Log the error
      await logAction({
        action: 'DATA_REFRESH_ERROR',
        table_name: 'financial_cache',
        new_values: {
          action: 'manual_refresh_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });

      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados financeiros.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-sm text-muted-foreground">
          Última atualização: {formatLastUpdated(lastUpdated)}
        </span>
      )}
      <Button 
        onClick={handleRefresh}
        disabled={isRefreshing}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
      </Button>
    </div>
  );
}
