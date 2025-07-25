
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useFinancialCache } from '@/hooks/useFinancialCache';
import { toast } from '@/hooks/use-toast';

interface RefreshButtonProps {
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

export default function RefreshButton({ onRefresh, lastUpdated }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshData } = useFinancialCache();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      if (onRefresh) {
        await onRefresh();
      }
      toast({
        title: "Dados atualizados",
        description: "Os indicadores financeiros foram recalculados com sucesso.",
      });
    } catch (error) {
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
