
import { useState, useEffect } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { compareAsc } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cliente, Pedido } from "@/types";
import FiltrosLocalizacao from "./FiltrosLocalizacao";
import EditarAgendamentoDialog from "./EditarAgendamentoDialog";
import AgendamentoFilters from "./AgendamentoFilters";
import AgendamentoTable from "./AgendamentoTable";

interface AgendamentoItem {
  cliente: Cliente;
  pedido?: Pedido;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

export default function TodosAgendamentos() {
  const { clientes } = useClienteStore();
  const { getPedidosFuturos, getPedidosUnicos, atualizarPedido } = usePedidoStore();
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<AgendamentoItem[]>([]);
  const [filtroAtivo, setFiltroAtivo] = useState<{ rota?: string }>({});
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoItem | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("todos");

  // Carregar agendamentos
  useEffect(() => {
    const pedidosFuturos = getPedidosFuturos();
    const pedidosUnicos = getPedidosUnicos();
    
    const agendamentosTemp: AgendamentoItem[] = [];
    
    // Adicionar clientes com pedidos futuros
    pedidosFuturos.forEach(pedido => {
      if (pedido.cliente) {
        agendamentosTemp.push({
          cliente: pedido.cliente,
          pedido,
          dataReposicao: new Date(pedido.dataPrevistaEntrega),
          statusAgendamento: pedido.cliente.statusAgendamento || "Agendado",
          isPedidoUnico: false
        });
      }
    });
    
    // Adicionar pedidos únicos
    pedidosUnicos.forEach(pedido => {
      const nomeMatch = pedido.observacoes?.match(/Nome: (.*?)(?:\n|$)/);
      const nome = nomeMatch ? nomeMatch[1] : `Pedido Único #${pedido.id}`;
      
      const clienteFicticio: Cliente = {
        id: 0,
        nome,
        quantidadePadrao: 0,
        periodicidadePadrao: 0,
        statusCliente: "Ativo",
        dataCadastro: new Date(),
        contabilizarGiroMedio: false,
        tipoLogistica: "Própria",
        emiteNotaFiscal: false,
        tipoCobranca: "À vista",
        formaPagamento: "Dinheiro"
      };
      
      agendamentosTemp.push({
        cliente: clienteFicticio,
        pedido,
        dataReposicao: new Date(pedido.dataPrevistaEntrega),
        statusAgendamento: "Agendado",
        isPedidoUnico: true
      });
    });
    
    // Ordenar por data e depois por status
    agendamentosTemp.sort((a, b) => {
      const dataCompare = compareAsc(a.dataReposicao, b.dataReposicao);
      if (dataCompare !== 0) return dataCompare;
      
      const statusOrder = { "Previsto": 0, "Agendado": 1, "Reagendar": 2 };
      const aOrder = statusOrder[a.statusAgendamento as keyof typeof statusOrder] ?? 3;
      const bOrder = statusOrder[b.statusAgendamento as keyof typeof statusOrder] ?? 3;
      
      return aOrder - bOrder;
    });
    
    setAgendamentos(agendamentosTemp);
  }, [clientes, getPedidosFuturos, getPedidosUnicos]);

  // Aplicar filtros
  useEffect(() => {
    let filtrados = [...agendamentos];

    // Filtro por rota (implementação básica - pode ser expandida conforme necessário)
    if (filtroAtivo.rota) {
      // Por enquanto, mantém todos os agendamentos já que não temos campo rota nos dados
      // Esta lógica pode ser expandida quando os dados incluírem informação de rota
    }

    // Filtro por aba ativa
    switch (abaAtiva) {
      case "previstos":
        filtrados = filtrados.filter(a => a.statusAgendamento === "Previsto");
        break;
      case "agendados":
        filtrados = filtrados.filter(a => a.statusAgendamento === "Agendado");
        break;
      case "pedidos-unicos":
        filtrados = filtrados.filter(a => a.isPedidoUnico);
        break;
      default:
        // "todos" - não filtra
        break;
    }

    setAgendamentosFiltrados(filtrados);
  }, [agendamentos, filtroAtivo, abaAtiva]);

  const handleFiltroChange = (novoFiltro: { rota?: string }) => {
    setFiltroAtivo(novoFiltro);
  };

  const handleEditarAgendamento = (agendamento: AgendamentoItem) => {
    setAgendamentoSelecionado(agendamento);
    setDialogAberto(true);
  };

  const handleSalvarAgendamento = (agendamentoAtualizado: AgendamentoItem) => {
    // Atualizar no store se for um pedido
    if (agendamentoAtualizado.pedido) {
      atualizarPedido(agendamentoAtualizado.pedido.id, {
        dataPrevistaEntrega: agendamentoAtualizado.dataReposicao,
        totalPedidoUnidades: agendamentoAtualizado.pedido.totalPedidoUnidades,
        observacoes: agendamentoAtualizado.pedido.observacoes,
        tipoPedido: agendamentoAtualizado.pedido.tipoPedido
      });
    }

    // Atualizar na lista local
    setAgendamentos(prev => 
      prev.map(a => 
        a.cliente.id === agendamentoAtualizado.cliente.id && 
        a.pedido?.id === agendamentoAtualizado.pedido?.id
          ? agendamentoAtualizado 
          : a
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos os Agendamentos</CardTitle>
        <CardDescription>
          Visão panorâmica de todos os PDVs com pedidos agendados e pedidos únicos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FiltrosLocalizacao onFiltroChange={handleFiltroChange} />
        
        <AgendamentoFilters
          abaAtiva={abaAtiva}
          setAbaAtiva={setAbaAtiva}
          agendamentos={agendamentos}
        >
          <AgendamentoTable
            agendamentos={agendamentosFiltrados}
            onEditAgendamento={handleEditarAgendamento}
          />
        </AgendamentoFilters>

        <EditarAgendamentoDialog
          agendamento={agendamentoSelecionado}
          open={dialogAberto}
          onOpenChange={setDialogAberto}
          onSave={handleSalvarAgendamento}
        />
      </CardContent>
    </Card>
  );
}
