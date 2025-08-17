
import React from "react";
import { Card } from "@/components/ui/card";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { PedidoCard } from "./PedidoCard";
import { ResumoQuantidadeProdutos } from "./components/ResumoQuantidadeProdutos";
import { SeparacaoTabs } from "./components/SeparacaoTabs";
import { PrintingActions } from "./components/PrintingActions";
import { Package, Calendar, Clock, Users } from "lucide-react";

export default function SeparacaoPedidos() {
  const { 
    pedidos,
    isLoading,
    getPedidosParaSeparacao,
    getPedidosProximoDia,
    marcarTodosSeparados,
    ultimaAtualizacao
  } = useExpedicaoStore();

  const pedidosHoje = getPedidosParaSeparacao();
  const pedidosProximoDia = getPedidosProximoDia();
  const pedidosSeparados = pedidos.filter(p => p.substatus_pedido === 'Separado');

  console.log('📦 SeparacaoPedidos - Pedidos para resumo:', pedidosHoje);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Produtos - sempre mostrar, mesmo se vazio */}
      <ResumoQuantidadeProdutos 
        pedidos={pedidosHoje} 
        contexto="separacao"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Para Separar</h3>
              <p className="text-2xl font-bold">{pedidosHoje.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Separados</h3>
              <p className="text-2xl font-bold">{pedidosSeparados.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-muted-foregreen">Próximo Dia</h3>
              <p className="text-2xl font-bold">{pedidosProximoDia.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-gray-600" />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
              <p className="text-sm">
                {ultimaAtualizacao ? new Date(ultimaAtualizacao).toLocaleTimeString() : 'Nunca'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Ações de Impressão */}
      <PrintingActions pedidos={pedidosHoje} />

      {/* Separação Tabs */}
      <SeparacaoTabs 
        pedidosHoje={pedidosHoje}
        pedidosProximoDia={pedidosProximoDia}
        onMarcarTodosSeparados={marcarTodosSeparados}
      />
    </div>
  );
}
