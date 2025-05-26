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
  const { carregarAgendamentoPorCliente, salvarAgendamento } = useAgendamentoClienteStore();
  
  const [abaAtiva, setAbaAtiva] = useState("todos");
  const [filtroRota, setFiltroRota] = useState<{ rota?: string }>({});
  const [agendamentoEditando, setAgendamentoEditando] = useState<AgendamentoItem | null>(null);
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  // Carregar agendamentos EXCLUSIVAMENTE da tabela agendamentos_clientes
  useEffect(() => {
    const carregarAgendamentos = async () => {
      if (clientes.length === 0) return;
      
      setLoading(true);
      console.log('TodosAgendamentos: Carregando agendamentos da tabela unificada para', clientes.length, 'clientes');
      
      const agendamentosCarregados: AgendamentoItem[] = [];
      
      for (const cliente of clientes.filter(c => c.statusCliente === 'Ativo')) {
        try {
          // Carregar EXCLUSIVAMENTE da tabela agendamentos_clientes
          const agendamentoCliente = await carregarAgendamentoPorCliente(cliente.id);
          const pedidoCliente = pedidos.find(p => p.cliente?.id === cliente.id && p.statusPedido === 'Agendado');
          
          let dataReposicao = new Date();
          let statusAgendamento = 'Agendar';
          let quantidadeTotal = cliente.quantidadePadrao || 0;
          let tipoPedido: 'Padrão' | 'Alterado' = 'Padrão';
          
          // Usar EXCLUSIVAMENTE dados da tabela agendamentos_clientes
          if (agendamentoCliente) {
            console.log('TodosAgendamentos: Agendamento da tabela encontrado para cliente', cliente.nome, ':', agendamentoCliente);
            dataReposicao = agendamentoCliente.data_proxima_reposicao || new Date();
            statusAgendamento = agendamentoCliente.status_agendamento;
            quantidadeTotal = agendamentoCliente.quantidade_total;
            tipoPedido = agendamentoCliente.tipo_pedido;
          } else {
            console.log('TodosAgendamentos: Nenhum agendamento encontrado na tabela para cliente', cliente.nome);
            // Valores padrão quando não há agendamento (será criado automaticamente)
            dataReposicao = new Date();
            statusAgendamento = 'Agendar';
            quantidadeTotal = cliente.quantidadePadrao || 0;
            tipoPedido = 'Padrão';
          }
          
          console.log('TodosAgendamentos: Dados finais para', cliente.nome, ':', {
            dataReposicao,
            statusAgendamento,
            quantidadeTotal,
            tipoPedido
          });
          
          agendamentosCarregados.push({
            cliente,
            pedido: pedidoCliente,
            dataReposicao,
            statusAgendamento,
            isPedidoUnico: false
          });
        } catch (error) {
          console.error('TodosAgendamentos: Erro ao carregar agendamento do cliente', cliente.nome, ':', error);
          // Em caso de erro, usar dados básicos
          agendamentosCarregados.push({
            cliente,
            pedido: undefined,
            dataReposicao: new Date(),
            statusAgendamento: 'Agendar',
            isPedidoUnico: false
          });
        }
      }
      
      console.log('TodosAgendamentos: Total de agendamentos carregados da tabela unificada:', agendamentosCarregados.length);
      setAgendamentos(agendamentosCarregados);
      setLoading(false);
    };

    carregarAgendamentos();
  }, [clientes, pedidos, carregarAgendamentoPorCliente, refreshTrigger]);

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

  const handleSalvarAgendamento = (agendamentoAtualizado: AgendamentoItem) => {
    toast.success("Agendamento atualizado com sucesso!");
    setAgendamentoEditando(null);
    
    // Recarregar todos os agendamentos da tabela unificada
    console.log('TodosAgendamentos: Recarregando dados após salvamento');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleConfirmarPrevisto = async (agendamento: AgendamentoItem) => {
    try {
      console.log('TodosAgendamentos: Confirmando agendamento previsto para cliente:', agendamento.cliente.nome);
      console.log('TodosAgendamentos: Data atual do agendamento:', agendamento.dataReposicao);
      
      // PRESERVAR a data existente ao confirmar
      await salvarAgendamento(agendamento.cliente.id, {
        status_agendamento: 'Agendado',
        data_proxima_reposicao: agendamento.dataReposicao, // Manter a data atual
        quantidade_total: agendamento.cliente.quantidadePadrao || 0,
        tipo_pedido: 'Padrão'
      });

      // Recarregar dados da tabela unificada
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
        onConfirmarPrevisto={onConfirmarPrevisto}
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
