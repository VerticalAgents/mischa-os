import { useState, useEffect } from "react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoUiStore } from "@/hooks/useExpedicaoUiStore";
import PedidoCard from "./PedidoCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AgendamentoEditModal from "@/components/agendamento/AgendamentoEditModal";
import { AgendamentoItem } from "@/components/agendamento/types";
import { PrintingActions } from "./components/PrintingActions";
import { ResumoQuantidadeProdutos } from "./components/ResumoQuantidadeProdutos";
import { SeparacaoFilters } from "./components/SeparacaoFilters";
import { SeparacaoEmMassaDialog } from "./components/SeparacaoEmMassaDialog";
import { GerarVendasEmMassaDialog } from "./components/GerarVendasEmMassaDialog";
import { useGestaoClickSync } from "@/hooks/useGestaoClickSync";
import { toast } from "sonner";

const SeparacaoPedidos = () => {
  const { 
    pedidos, 
    isLoading, 
    carregarPedidos, 
    confirmarSeparacao 
  } = useExpedicaoStore();

  // Usar store UI para persistir filtros
  const {
    filtroTexto,
    filtroTipoPedido,
    filtroData,
    filtroRepresentantes,
    setFiltroTexto,
    setFiltroTipoPedido,
    setFiltroData,
    setFiltroRepresentantes
  } = useExpedicaoUiStore();

  const [pedidoEditando, setPedidoEditando] = useState<AgendamentoItem | null>(null);
  const [pedidoEditandoOriginal, setPedidoEditandoOriginal] = useState<any | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [separacaoEmMassaOpen, setSeparacaoEmMassaOpen] = useState(false);
  const [gerarVendasEmMassaOpen, setGerarVendasEmMassaOpen] = useState(false);
  
  const { gerarVendaGC, atualizarVendaGC, loading: loadingGC, pedidoEmProcessamento } = useGestaoClickSync();

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  const handleMarcarSeparado = async (pedidoId: string) => {
    await confirmarSeparacao(pedidoId);
  };

  const handleGerarVendaGC = async (pedidoId: string, clienteId: string) => {
    const result = await gerarVendaGC(pedidoId, clienteId);
    // Recarregar para atualizar o estado com o novo gestaoclick_venda_id
    if (result.success) {
      await carregarPedidos();
    }
    return result;
  };

  const handleAtualizarVendaGC = async (pedidoId: string, clienteId: string, vendaId: string) => {
    const success = await atualizarVendaGC(pedidoId, clienteId, vendaId);
    if (success) {
      await carregarPedidos();
    }
    return success;
  };

  const handleEditarPedido = (pedido: any) => {
    // Store original pedido reference for GestaoClick update
    setPedidoEditandoOriginal(pedido);
    
    const agendamentoFormatado: AgendamentoItem = {
      cliente: {
        id: pedido.cliente_id,
        nome: pedido.cliente_nome,
        quantidadePadrao: pedido.quantidade_total || 0,
        contatoTelefone: pedido.cliente_telefone || "",
        enderecoEntrega: pedido.cliente_endereco || "",
        cnpjCpf: "",
        contatoNome: "",
        contatoEmail: "",
        periodicidadePadrao: 7,
        statusCliente: "Ativo",
        dataCadastro: new Date(),
        ativo: true,
        contabilizarGiroMedio: true,
        tipoCobranca: "À vista",
        tipoLogistica: "Própria",
        emiteNotaFiscal: false,
        formaPagamento: "Dinheiro",
        categoriaId: 1,
        subcategoriaId: 1
      },
      dataReposicao: new Date(pedido.data_prevista_entrega),
      statusAgendamento: "Agendado" as const,
      isPedidoUnico: pedido.tipo_pedido === "Único",
      pedido: {
        id: parseInt(pedido.id),
        idCliente: pedido.cliente_id,
        dataPedido: new Date(),
        dataPrevistaEntrega: new Date(pedido.data_prevista_entrega),
        statusPedido: 'Agendado',
        itensPedido: pedido.produtos_info || [],
        totalPedidoUnidades: pedido.quantidade_total,
        tipoPedido: pedido.tipo_pedido as "Padrão" | "Alterado" | "Único"
      }
    };

    setPedidoEditando(agendamentoFormatado);
    setModalEditarAberto(true);
  };

  const handleSalvarAgendamento = (agendamentoAtualizado: AgendamentoItem) => {
    carregarPedidos();
    setModalEditarAberto(false);
    setPedidoEditando(null);
    setPedidoEditandoOriginal(null);
  };

  // Handlers para ações em massa
  const handleAbrirSeparacaoEmMassa = () => {
    const pedidosAgendados = pedidosFiltrados.filter(p => !p.substatus_pedido || p.substatus_pedido === 'Agendado');
    if (pedidosAgendados.length === 0) {
      toast.error("Não há pedidos aguardando separação.");
      return;
    }
    setSeparacaoEmMassaOpen(true);
  };

  const handleAbrirGerarVendasEmMassa = () => {
    const pedidosSemVenda = pedidosFiltrados.filter(p => !p.gestaoclick_venda_id);
    if (pedidosSemVenda.length === 0) {
      toast.error("Todos os pedidos já possuem venda gerada.");
      return;
    }
    setGerarVendasEmMassaOpen(true);
  };

  const handleConfirmarSeparacaoEmMassa = async (pedidoIds: string[]) => {
    for (const pedidoId of pedidoIds) {
      await confirmarSeparacao(pedidoId);
    }
    await carregarPedidos();
  };

  const handleGerarVendasEmMassa = async (pedidoIds: string[]) => {
    for (const pedidoId of pedidoIds) {
      const pedido = pedidosFiltrados.find(p => p.id === pedidoId);
      if (pedido && !pedido.gestaoclick_venda_id) {
        await gerarVendaGC(pedidoId, pedido.cliente_id);
      }
    }
    await carregarPedidos();
  };

  // Filtrar pedidos com substatus Agendado (não separados ainda)
  // O filtro de data (filtroData) cuida de selecionar o dia específico
  const pedidosParaSeparacao = pedidos.filter(pedido => 
    !pedido.substatus_pedido || pedido.substatus_pedido === 'Agendado'
  );

  const pedidosFiltrados = pedidosParaSeparacao.filter(pedido => {
    const matchTexto = !filtroTexto || 
      pedido.cliente_nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      pedido.id.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const matchTipoPedido = filtroTipoPedido === "todos" || 
      (filtroTipoPedido === "padrao" && pedido.tipo_pedido === 'Padrão') ||
      (filtroTipoPedido === "alterado" && pedido.tipo_pedido === 'Alterado');
    
    const matchData = !filtroData || 
      format(pedido.data_prevista_entrega, "yyyy-MM-dd") === filtroData;

    const matchRepresentante = filtroRepresentantes.length === 0 ||
      (pedido.representante_id && filtroRepresentantes.includes(pedido.representante_id));

    return matchTexto && matchTipoPedido && matchData && matchRepresentante;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando pedidos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ResumoQuantidadeProdutos pedidos={pedidosFiltrados} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Separação de Pedidos</h2>
          <Badge variant="secondary">
            {pedidosParaSeparacao.length} pedidos
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={handleAbrirSeparacaoEmMassa} 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
          >
            <CheckCircle2 className="h-4 w-4" /> Separar em Massa
          </Button>
          <Button 
            onClick={handleAbrirGerarVendasEmMassa} 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
          >
            <Send className="h-4 w-4" /> Gerar Vendas
          </Button>
          <PrintingActions
            activeSubTab="todos"
            pedidosPadrao={pedidosFiltrados.filter(p => p.tipo_pedido === 'Padrão')}
            pedidosAlterados={pedidosFiltrados.filter(p => p.tipo_pedido === 'Alterado')}
            pedidosProximoDia={[]}
            todosPedidos={pedidosFiltrados}
          />
          <Button 
            onClick={() => carregarPedidos()} 
            size="sm"
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <SeparacaoFilters
        filtroTexto={filtroTexto}
        filtroTipoPedido={filtroTipoPedido}
        filtroData={filtroData}
        filtroRepresentantes={filtroRepresentantes}
        totalFiltrados={pedidosFiltrados.length}
        totalGeral={pedidosParaSeparacao.length}
        onFiltroTextoChange={setFiltroTexto}
        onFiltroTipoPedidoChange={setFiltroTipoPedido}
        onFiltroDataChange={setFiltroData}
        onFiltroRepresentantesChange={setFiltroRepresentantes}
      />

      <div className="space-y-4">
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {pedidosParaSeparacao.length === 0 
              ? "Nenhum pedido aguardando separação"
              : "Nenhum pedido encontrado com os filtros aplicados"
            }
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onMarcarSeparado={() => handleMarcarSeparado(pedido.id)}
              onEditarAgendamento={() => handleEditarPedido(pedido)}
              onGerarVendaGC={() => handleGerarVendaGC(pedido.id, pedido.cliente_id)}
              onAtualizarVendaGC={
                pedido.gestaoclick_venda_id 
                  ? () => handleAtualizarVendaGC(pedido.id, pedido.cliente_id, pedido.gestaoclick_venda_id!)
                  : undefined
              }
              isGerandoVendaGC={loadingGC && pedidoEmProcessamento === pedido.id}
              showProdutosList={true}
            />
          ))
        )}
      </div>

      <div className="space-y-4">
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {pedidosParaSeparacao.length === 0 
              ? "Nenhum pedido aguardando separação"
              : "Nenhum pedido encontrado com os filtros aplicados"
            }
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onMarcarSeparado={() => handleMarcarSeparado(pedido.id)}
              onEditarAgendamento={() => handleEditarPedido(pedido)}
              onGerarVendaGC={() => handleGerarVendaGC(pedido.id, pedido.cliente_id)}
              onAtualizarVendaGC={
                pedido.gestaoclick_venda_id 
                  ? () => handleAtualizarVendaGC(pedido.id, pedido.cliente_id, pedido.gestaoclick_venda_id!)
                  : undefined
              }
              isGerandoVendaGC={loadingGC && pedidoEmProcessamento === pedido.id}
              showProdutosList={true}
            />
          ))
        )}
      </div>

      <AgendamentoEditModal
        agendamento={pedidoEditando}
        open={modalEditarAberto}
        onOpenChange={(open) => {
          setModalEditarAberto(open);
          if (!open) setPedidoEditandoOriginal(null);
        }}
        onSalvar={handleSalvarAgendamento}
        gestaoclick_venda_id={pedidoEditandoOriginal?.gestaoclick_venda_id}
        onAtualizarVendaGC={
          pedidoEditandoOriginal?.gestaoclick_venda_id
            ? () => atualizarVendaGC(
                pedidoEditandoOriginal.id,
                pedidoEditandoOriginal.cliente_id,
                pedidoEditandoOriginal.gestaoclick_venda_id!
              )
            : undefined
        }
      />

      {/* Modais de ação em massa */}
      <SeparacaoEmMassaDialog
        open={separacaoEmMassaOpen}
        onOpenChange={setSeparacaoEmMassaOpen}
        pedidosDisponiveis={pedidosFiltrados}
        onConfirm={handleConfirmarSeparacaoEmMassa}
      />

      <GerarVendasEmMassaDialog
        open={gerarVendasEmMassaOpen}
        onOpenChange={setGerarVendasEmMassaOpen}
        pedidosDisponiveis={pedidosFiltrados}
        onConfirm={handleGerarVendasEmMassa}
        loading={loadingGC}
      />
    </div>
  );
};

export default SeparacaoPedidos;