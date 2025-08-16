import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Bug } from "lucide-react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
interface DebugInfoProps {
  tipo: "separacao" | "despacho";
  dadosAtivos: any[];
}
export const DebugInfo = ({
  tipo,
  dadosAtivos
}: DebugInfoProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isLoading
  } = useExpedicaoStore();
  const getDebugData = () => {
    const agora = new Date();
    if (tipo === "separacao") {
      return {
        titulo: "Separação de Pedidos - Debug",
        hook: "useExpedicaoStore.getPedidosParaSeparacao()",
        tabela: "agendamentos_clientes",
        filtros: ["status_agendamento = 'Agendado'", "substatus_pedido IN ('Agendado', null)", "data_prevista_entrega = hoje"],
        ultimaAtualizacao: agora.toLocaleString(),
        registrosCarregados: dadosAtivos.length,
        detalhes: `Busca pedidos com status 'Agendado' e substatus 'Agendado' ou null, agendados para hoje (${agora.toLocaleDateString()})`
      };
    } else {
      return {
        titulo: "Despacho de Pedidos - Debug",
        hook: "useExpedicaoStore.getPedidosParaDespacho()",
        tabela: "agendamentos_clientes",
        filtros: ["status_agendamento = 'Agendado'", "substatus_pedido IN ('Separado', 'Despachado')", "data_prevista_entrega = hoje"],
        ultimaAtualizacao: agora.toLocaleString(),
        registrosCarregados: dadosAtivos.length,
        detalhes: `Busca pedidos com status 'Agendado' e substatus 'Separado' ou 'Despachado', agendados para hoje (${agora.toLocaleDateString()})`
      };
    }
  };
  const debugData = getDebugData();
  return <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mb-4 border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bug className="h-4 w-4" />
              {debugData.titulo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Hook responsável:</span>
              <div className="bg-muted p-2 rounded text-xs font-mono mt-1">
                {debugData.hook}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Tabela Supabase:</span>
              <div className="bg-muted p-2 rounded text-xs font-mono mt-1">
                {debugData.tabela}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Filtros aplicados:</span>
              <div className="bg-muted p-2 rounded text-xs font-mono mt-1 space-y-1">
                {debugData.filtros.map((filtro, index) => <div key={index}>• {filtro}</div>)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-muted-foreground">Última atualização:</span>
                <div className="text-xs mt-1">{debugData.ultimaAtualizacao}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Registros carregados:</span>
                <div className="text-xs mt-1 font-bold">{debugData.registrosCarregados}</div>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Status de carregamento:</span>
              <div className="text-xs mt-1">
                {isLoading ? <span className="text-yellow-600">🔄 Carregando...</span> : <span className="text-green-600">✅ Dados carregados</span>}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Detalhes:</span>
              <div className="text-xs mt-1 text-muted-foreground">{debugData.detalhes}</div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>;
};