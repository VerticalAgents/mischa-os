
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClienteStore } from "@/hooks/useClienteStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { AgendamentoItem } from "./types";
import AgendamentoFilters from "./AgendamentoFilters";
import FiltrosLocalizacao from "./FiltrosLocalizacao";
import AgendamentoTable from "./AgendamentoTable";
import EditarAgendamentoDialog from "./EditarAgendamentoDialog";
import { toast } from "sonner";

export default function TodosAgendamentos() {
  const { clientes, carregarClientes } = useClienteStore();
  const { pedidos, criarNovoPedido } = usePedidoStore();
  
  const [abaAtiva, setAbaAtiva] = useState("todos");
  const [filtroRota, setFiltroRota] = useState<{ rota?: string }>({});
  const [agendamentoEditando, setAgendamentoEditando] = useState<AgendamentoItem | null>(null);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  // Criar agendamentos baseados nos clientes
  const agendamentos: AgendamentoItem[] = clientes
    .filter(cliente => cliente.statusCliente === 'Ativo')
    .map(cliente => {
      const pedidoCliente = pedidos.find(p => p.cliente?.id === cliente.id && p.statusPedido === 'Agendado');
      
      return {
        cliente,
        pedido: pedidoCliente,
        dataReposicao: cliente.proximaDataReposicao || new Date(),
        statusAgendamento: cliente.statusAgendamento || 'Agendar',
        isPedidoUnico: false
      };
    })
    .filter(agendamento => {
      if (!filtroRota.rota) return true;
      // Aqui você pode implementar a lógica de filtro por rota quando necessário
      return true;
    });

  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    switch (abaAtiva) {
      case 'previstos':
        return agendamento.statusAgendamento === 'Previsto';
      case 'agendados':
        return agendamento.statusAgendamento === 'Agendado';
      case 'pedidos-unicos':
        return agendamento.isPedidoUnico;
      default:
        return true;
    }
  });

  const handleCriarPedido = (clienteId: string) => {
    const novoPedido = criarNovoPedido(clienteId);
    if (novoPedido) {
      toast.success("Pedido criado com sucesso!");
    }
  };

  const handleEditarAgendamento = (agendamento: AgendamentoItem) => {
    setAgendamentoEditando(agendamento);
  };

  const handleSalvarAgendamento = (agendamentoAtualizado: AgendamentoItem) => {
    // Aqui você implementaria a lógica para salvar as alterações
    toast.success("Agendamento atualizado com sucesso!");
    setAgendamentoEditando(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Visualização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AgendamentoFilters 
            abaAtiva={abaAtiva}
            onAbaChange={setAbaAtiva}
            agendamentos={agendamentos}
          />
          <FiltrosLocalizacao onFiltroChange={setFiltroRota} />
        </CardContent>
      </Card>

      <AgendamentoTable 
        agendamentos={agendamentosFiltrados}
        onCriarPedido={handleCriarPedido}
        onEditarAgendamento={handleEditarAgendamento}
      />

      {agendamentoEditando && (
        <EditarAgendamentoDialog
          agendamento={agendamentoEditando}
          open={!!agendamentoEditando}
          onOpenChange={(open) => !open && setAgendamentoEditando(null)}
          onSalvar={handleSalvarAgendamento}
        />
      )}
    </div>
  );
}
