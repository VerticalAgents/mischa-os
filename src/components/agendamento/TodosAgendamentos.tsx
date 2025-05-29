import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClienteStore } from "@/hooks/useClienteStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { AgendamentoItem } from "./types";
import AgendamentoFilters from "./AgendamentoFilters";
import FiltrosLocalizacao from "./FiltrosLocalizacao";
import AgendamentoTable from "./AgendamentoTable";
import AgendamentoEditModal from "./AgendamentoEditModal";
import { toast } from "sonner";

export default function TodosAgendamentos() {
  const { clientes, carregarClientes } = useClienteStore();
  const { pedidos, criarNovoPedido } = usePedidoStore();
  const { carregarTodosAgendamentos, agendamentos: agendamentosStore, salvarAgendamento } = useAgendamentoClienteStore();
  
  const [abaAtiva, setAbaAtiva] = useState("todos");
  const [filtroRota, setFiltroRota] = useState<{ rota?: string }>({});
  const [agendamentoEditando, setAgendamentoEditando] = useState<AgendamentoItem | null>(null);
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const carregarDados = async () => {
      console.log('TodosAgendamentos: Carregando dados...');
      await carregarClientes();
      await carregarTodosAgendamentos();
    };
    carregarDados();
  }, [carregarClientes, carregarTodosAgendamentos, refreshTrigger]);

  // Helper function to ensure status is valid
  const normalizeStatusAgendamento = (status: string | undefined): "Agendar" | "Previsto" | "Agendado" => {
    if (status === "Previsto" || status === "Agendado" || status === "Agendar") {
      return status;
    }
    return "Agendar"; // Default fallback
  };

  useEffect(() => {
    if (clientes.length === 0) {
      setLoading(true);
      return;
    }
    
    console.log('TodosAgendamentos: Construindo lista de agendamentos baseada nos clientes sincronizados...');
    
    const agendamentosCarregados: AgendamentoItem[] = [];
    
    for (const cliente of clientes.filter(c => c.statusCliente === 'Ativo')) {
      const pedidoCliente = pedidos.find(p => p.cliente?.id === cliente.id && p.statusPedido === 'Agendado');
      
      // Buscar agendamento da store para obter tipo_pedido correto
      const agendamentoClienteStore = agendamentosStore.find(a => a.cliente_id === cliente.id);
      
      // Usar os dados já sincronizados do cliente
      let dataReposicao = cliente.proximaDataReposicao || new Date();
      let statusAgendamento = normalizeStatusAgendamento(cliente.statusAgendamento);
      
      console.log('TodosAgendamentos: Cliente', cliente.nome, '- Status:', statusAgendamento, 'Data:', dataReposicao);
      
      // Criar um pedido virtual com o tipo correto
      let pedidoVirtual = pedidoCliente;
      if (agendamentoClienteStore) {
        pedidoVirtual = {
          id: pedidoCliente?.id || 0,
          idCliente: cliente.id,
          cliente: cliente,
          dataPedido: new Date(),
          dataPrevistaEntrega: dataReposicao,
          totalPedidoUnidades: agendamentoClienteStore.quantidade_total,
          tipoPedido: agendamentoClienteStore.tipo_pedido as 'Padrão' | 'Alterado',
          statusPedido: 'Agendado',
          itensPedido: [],
          historicoAlteracoesStatus: []
        };
      }
      
      agendamentosCarregados.push({
        cliente,
        pedido: pedidoVirtual,
        dataReposicao,
        statusAgendamento,
        isPedidoUnico: false
      });
    }
    
    console.log('TodosAgendamentos: Total de agendamentos construídos:', agendamentosCarregados.length);
    setAgendamentos(agendamentosCarregados);
    setLoading(false);
  }, [clientes, pedidos, agendamentosStore]);

  const agendamentosFiltrados = agendamentos
    .filter(agendamento => {
      if (!filtroRota.rota) return true;
      return true;
    })
    .filter(agendamento => {
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

  const handleSalvarAgendamento = async (agendamentoAtualizado: AgendamentoItem) => {
    try {
      // Salvar o agendamento atualizado
      await salvarAgendamento(agendamentoAtualizado.cliente.id, {
        status_agendamento: agendamentoAtualizado.statusAgendamento,
        data_proxima_reposicao: agendamentoAtualizado.dataReposicao,
        quantidade_total: agendamentoAtualizado.pedido?.totalPedidoUnidades || agendamentoAtualizado.cliente.quantidadePadrao || 0,
        tipo_pedido: agendamentoAtualizado.pedido?.tipoPedido || 'Padrão'
      });

      toast.success("Agendamento atualizado com sucesso!");
      setAgendamentoEditando(null);
      
      // Recarregar todos os dados para garantir sincronização
      console.log('TodosAgendamentos: Recarregando dados após salvamento...');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('TodosAgendamentos: Erro ao salvar agendamento:', error);
      toast.error("Erro ao salvar agendamento");
    }
  };

  const handleConfirmarPrevisto = async (agendamento: AgendamentoItem) => {
    try {
      console.log('TodosAgendamentos: Confirmando agendamento previsto para cliente:', agendamento.cliente.nome);
      
      // PRESERVAR a data existente ao confirmar
      await salvarAgendamento(agendamento.cliente.id, {
        status_agendamento: 'Agendado',
        data_proxima_reposicao: agendamento.dataReposicao,
        quantidade_total: agendamento.cliente.quantidadePadrao || 0,
        tipo_pedido: 'Padrão'
      });

      // Recarregar dados para sincronização
      setRefreshTrigger(prev => prev + 1);

      toast.success(`Agendamento de ${agendamento.cliente.nome} confirmado com sucesso!`);
    } catch (error) {
      console.error('TodosAgendamentos: Erro ao confirmar agendamento:', error);
      toast.error("Erro ao confirmar agendamento");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando agendamentos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        onConfirmarPrevisto={handleConfirmarPrevisto}
      />

      <AgendamentoEditModal
        agendamento={agendamentoEditando}
        open={!!agendamentoEditando}
        onOpenChange={(open) => !open && setAgendamentoEditando(null)}
        onSalvar={handleSalvarAgendamento}
      />
    </div>
  );
}
