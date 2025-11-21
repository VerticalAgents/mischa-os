import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EntregaItem } from './EntregaItem';
import { CheckSquare, Square, RefreshCw } from 'lucide-react';

interface ListaEntregasPanelProps {
  entregas: any[];
  loading: boolean;
  onToggleSelecao: (id: string) => void;
  onAtualizarObservacao: (id: string, observacao: string) => void;
  onAtualizarOrdem: (id: string, ordem: number) => void;
  onSelecionarTodas: () => void;
  onDesselecionarTodas: () => void;
  onRecarregar: () => void;
}

export const ListaEntregasPanel = ({
  entregas,
  loading,
  onToggleSelecao,
  onAtualizarObservacao,
  onAtualizarOrdem,
  onSelecionarTodas,
  onDesselecionarTodas,
  onRecarregar
}: ListaEntregasPanelProps) => {
  const totalSelecionadas = entregas.filter(e => e.selecionada).length;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Entregas Disponíveis</h2>
            <p className="text-sm text-muted-foreground">
              {totalSelecionadas} de {entregas.length} selecionadas
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRecarregar}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelecionarTodas}
            disabled={loading || entregas.length === 0}
            className="flex-1"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Selecionar todas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDesselecionarTodas}
            disabled={loading || totalSelecionadas === 0}
            className="flex-1"
          >
            <Square className="w-4 h-4 mr-2" />
            Limpar seleção
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando entregas...
            </div>
          ) : entregas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma entrega encontrada para esta data
            </div>
          ) : (
            entregas.map((entrega) => (
              <EntregaItem
                key={entrega.id}
                entrega={entrega}
                totalEntregas={entregas.length}
                onToggleSelecao={onToggleSelecao}
                onAtualizarObservacao={onAtualizarObservacao}
                onAtualizarOrdem={onAtualizarOrdem}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
