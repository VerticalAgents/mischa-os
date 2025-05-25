
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

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  // Carregar agendamentos dos clientes
  useEffect(() => {
    const carregarAgendamentos = async () => {
      if (clientes.length === 0) return;
      
      setLoading(true);
      console.log('Carregando agendamentos para', clientes.length, 'clientes');
      
      const agendamentosCarregados: AgendamentoItem[] = [];
      
      for (const cliente of clientes.filter(c => c.statusCliente === 'Ativo')) {
        try {
          // Carregar agendamento específico do cliente
          const agendamentoCliente = await carregarAgendamentoPorCliente(cliente.id);
          const pedidoCliente = pedidos.find(p => p.cliente?.id === cliente.id && p.statusPedido === 'Agendado');
          
          let dataReposicao = new Date();
          let statusAgendamento = 'Agendar';
          
          // Usar dados do agendamento se existir
          if (agendamentoCliente) {
            console.log('Agendamento encontrado para cliente', cliente.nome, ':', agendamentoCliente);
            dataReposicao = agendamentoCliente.data_proxima_reposicao || new Date();
            statusAgendamento = agendamentoCliente.status_agendamento;
          } else {
            // Fallback para dados do cliente
            if (cliente.proximaDataReposicao) {
              dataReposicao = cliente.proximaDataReposicao;
            }
            if (cliente.statusAgendamento) {
              statusAgendamento = cliente.statusAgendamento;
            }
          }
          
          agendamentosCarregados.push({
            cliente,
            pedido: pedidoCliente,
            dataReposicao,
            statusAgendamento,
            isPedidoUnico: false
          });
        } catch (error) {
          console.error('Erro ao carregar agendamento do cliente', cliente.nome, ':', error);
          // Em caso de erro, usar dados básicos do cliente
          agendamentosCarregados.push({
            cliente,
            pedido: undefined,
            dataReposicao: cliente.proximaDataReposicao || new Date(),
            statusAgendamento: cliente.statusAgendamento || 'Agendar',
            isPedidoUnico: false
          });
        }
      }
      
      console.log('Agendamentos carregados:', agendamentosCarregados);
      setAgendamentos(agendamentosCarregados);
      setLoading(false);
    };

    carregarAgendamentos();
  }, [clientes, pedidos, carregarAgendamentoPorCliente]);

  const agendamentosFiltrados = agendamentos
    .filter(agendamento => {
      if (!filtroRota.rota) return true;
      // Aqui você pode implementar a lógica de filtro por rota quando necessário
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
    
    // Recarregar agendamentos após salvar
    setAgendamentos(prev => 
      prev.map(ag => 
        ag.cliente.id === agendamentoAtualizado.cliente.id ? agendamentoAtualizado : ag
      )
    );
  };

  const handleConfirmarPrevisto = async (agendamento: AgendamentoItem) => {
    try {
      // Salvar como "Agendado" no banco
      await salvarAgendamento(agendamento.cliente.id, {
        status_agendamento: 'Agendado'
      });

      // Atualizar estado local
      setAgendamentos(prev => 
        prev.map(ag => 
          ag.cliente.id === agendamento.cliente.id 
            ? { ...ag, statusAgendamento: 'Agendado' }
            : ag
        )
      );

      toast.success(`Agendamento de ${agendamento.cliente.nome} confirmado com sucesso!`);
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
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
