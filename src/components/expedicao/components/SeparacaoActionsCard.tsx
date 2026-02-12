import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Send, RefreshCw, Settings2 } from "lucide-react";
import { PrintingActions } from "./PrintingActions";

interface SeparacaoActionsCardProps {
  onSepararEmMassa: () => void;
  onGerarVendas: () => void;
  onAtualizar: () => void;
  isLoading: boolean;
  pedidosFiltrados: any[];
  representantes?: { id: number; nome: string }[];
  className?: string;
}

export const SeparacaoActionsCard = ({
  onSepararEmMassa,
  onGerarVendas,
  onAtualizar,
  isLoading,
  pedidosFiltrados,
  representantes = [],
  className = ""
}: SeparacaoActionsCardProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Ações
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button 
            onClick={onSepararEmMassa} 
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Separar em Massa
          </Button>
          
          <Button 
            onClick={onGerarVendas} 
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <Send className="h-4 w-4" />
            Gerar Vendas
          </Button>
          
          <PrintingActions
            activeSubTab="todos"
            pedidosPadrao={pedidosFiltrados.filter(p => p.tipo_pedido === 'Padrão')}
            pedidosAlterados={pedidosFiltrados.filter(p => p.tipo_pedido === 'Alterado')}
            pedidosProximoDia={[]}
            todosPedidos={pedidosFiltrados}
            representantes={representantes}
          />
          
          <Button 
            onClick={onAtualizar}
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
