import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { usePedidoConverter } from "./hooks/usePedidoConverter";
import { useAgendamentoActions } from "./hooks/useAgendamentoActions";
import { useConfirmacaoEntrega } from "@/hooks/useConfirmacaoEntrega";
import { useExportacao } from "@/hooks/useExportacao";
import { useGestaoClickSync } from "@/hooks/useGestaoClickSync";
import { DebugInfo } from "./components/DebugInfo";
import { DespachoFilters } from "./components/DespachoFilters";
import { ResumoStatusCard } from "./components/ResumoStatusCard";
import { DespachoActionsCard } from "./components/DespachoActionsCard";
import { DespachoEmMassaDialog } from "./components/DespachoEmMassaDialog";
import { EntregaEmMassaDialog } from "./components/EntregaEmMassaDialog";
import { useExpedicaoUiStore } from "@/hooks/useExpedicaoUiStore";
import PedidoCard from "./PedidoCard";
import AgendamentoEditModal from "../agendamento/AgendamentoEditModal";
import { toast } from "sonner";
import { Truck, Package, Loader2, Download, MapPin } from "lucide-react";
import { ExportCSVDialog } from "./components/ExportCSVDialog";
import { useExportCSVDialog } from "@/hooks/useExportCSVDialog";
import { startOfDay, startOfWeek, endOfWeek, isBefore, format } from "date-fns";

export const Despacho = () => {
  const {
    pedidos,
    isLoading,
    confirmarDespacho,
    confirmarEntrega,
    confirmarRetorno,
    retornarParaSeparacao,
    desfazerDespacho,
    confirmarDespachoEmMassa,
    confirmarEntregaEmMassa,
    confirmarRetornoEmMassa,
    recarregarSilencioso,
    removerPedidoDaLista
  } = useExpedicaoStore();

  const { converterPedidoParaCard } = usePedidoConverter();
  const { confirmarEntregaEmMassa: confirmarEntregaEmMassaHook, loading: loadingConfirmacao } = useConfirmacaoEntrega();
  const { exportarEntregasCSV } = useExportacao();
  const { gerarVendaGC, atualizarVendaGC, loading: loadingGC, pedidoEmProcessamento } = useGestaoClickSync();
  const {
    modalEditarAberto,
    setModalEditarAberto,
    agendamentoParaEditar,
    handleEditarAgendamento,
    handleSalvarAgendamento
  } = useAgendamentoActions();

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroTipoLogistica, setFiltroTipoLogistica] = useState<string[]>([]);
  const [despachoEmMassaOpen, setDespachoEmMassaOpen] = useState(false);
  const [entregaEmMassaOpen, setEntregaEmMassaOpen] = useState(false);
  
  const {
    filtroRepresentantes,
    setFiltroRepresentantes,
    presetDespacho,
    setPresetDespacho
  } = useExpedicaoUiStore();

  // Usar hook de sincronização
  useExpedicaoSync();

  // Handlers para GestaoClick
  const handleGerarVendaGC = async (pedidoId: string, clienteId: string) => {
    const result = await gerarVendaGC(pedidoId, clienteId);
    if (result.success) {
      await recarregarSilencioso();
    }
    return result;
  };

  const handleAtualizarVendaGC = async (pedidoId: string, clienteId: string, vendaId: string) => {
    const result = await atualizarVendaGC(pedidoId, clienteId, vendaId);
    if (result.success) {
      await recarregarSilencioso();
    }
    return result;
  };

  // Base: pedidos em fluxo de despacho (Separado ou Despachado), não entregues
  const pedidosBase = useMemo(() => {
    return pedidos.filter(
      (p) =>
        p.status_agendamento === 'Agendado' &&
        (p.substatus_pedido === 'Separado' || p.substatus_pedido === 'Despachado')
    );
  }, [pedidos]);

  // Aplicar filtro de preset + filtros gerais
  const pedidosFiltrados = useMemo(() => {
    let resultado = pedidosBase;
    const hoje = startOfDay(new Date());
    const hojeStr = format(hoje, 'yyyy-MM-dd');

    // Filtro por preset de período
    if (presetDespacho === 'hoje') {
      resultado = resultado.filter((p) => {
        if (!p.data_prevista_entrega) return false;
        return format(new Date(p.data_prevista_entrega), 'yyyy-MM-dd') === hojeStr;
      });
    } else if (presetDespacho === 'semana') {
      const inicio = startOfWeek(hoje, { weekStartsOn: 0 });
      const fim = endOfWeek(hoje, { weekStartsOn: 0 });
      resultado = resultado.filter((p) => {
        if (!p.data_prevista_entrega) return false;
        const d = startOfDay(new Date(p.data_prevista_entrega));
        return d >= inicio && d <= fim;
      });
    } else if (presetDespacho === 'atrasados') {
      resultado = resultado.filter((p) => {
        if (!p.data_prevista_entrega) return false;
        return isBefore(startOfDay(new Date(p.data_prevista_entrega)), hoje);
      });
    }
    // 'todos' não filtra por data

    // Filtro por texto (cliente ou ID)
    if (filtroTexto.trim()) {
      const searchTerm = filtroTexto.toLowerCase().trim();
      resultado = resultado.filter(pedido => 
        pedido.cliente_nome?.toLowerCase().includes(searchTerm) ||
        pedido.id?.toString().includes(searchTerm)
      );
    }

    // Filtro por status (substatus_pedido)
    if (filtroTipo !== "todos") {
      resultado = resultado.filter(pedido => 
        pedido.substatus_pedido === filtroTipo
      );
    }

    // Filtro por representante
    if (filtroRepresentantes.length > 0) {
      const incluiSemRepresentante = filtroRepresentantes.includes(-1);
      const idsReais = filtroRepresentantes.filter(id => id !== -1);
      resultado = resultado.filter(pedido =>
        (incluiSemRepresentante && !pedido.representante_id) ||
        (pedido.representante_id && idsReais.includes(pedido.representante_id))
      );
    }

    // Filtro por tipo de logística
    if (filtroTipoLogistica.length > 0) {
      const incluiSemLogistica = filtroTipoLogistica.includes("_sem_logistica");
      const tiposReais = filtroTipoLogistica.filter(t => t !== "_sem_logistica");
      resultado = resultado.filter(pedido => {
        if (incluiSemLogistica && !pedido.tipo_logistica) return true;
        if (!pedido.tipo_logistica) return false;
        const normalizado = pedido.tipo_logistica.toUpperCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return tiposReais.some(tipo => {
          const tipoNorm = tipo.toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizado === tipoNorm;
        });
      });
    }

    return resultado;
  }, [pedidosBase, filtroTexto, filtroTipo, filtroRepresentantes, filtroTipoLogistica, presetDespacho]);
  
  // Hook para o modal de exportação CSV (após pedidosFiltrados estar definido)
  const exportDialog = useExportCSVDialog(pedidosFiltrados);


  // Verificar quantos pedidos estão despachados
  const pedidosDespachados = pedidosFiltrados.filter(p => p.substatus_pedido === 'Despachado');
  const todosDespachados = pedidosFiltrados.length > 0 && pedidosDespachados.length === pedidosFiltrados.length;

  // Handlers para abrir modais de ação em massa
  const handleAbrirDespachoEmMassa = () => {
    const pedidosSeparados = pedidosFiltrados.filter(p => p.substatus_pedido === 'Separado');
    if (pedidosSeparados.length === 0) {
      toast.error("Não há pedidos separados para despachar.");
      return;
    }
    setDespachoEmMassaOpen(true);
  };

  const handleAbrirEntregaEmMassa = () => {
    if (pedidosDespachados.length === 0) {
      toast.error("Não há pedidos despachados para confirmar entrega.");
      return;
    }
    setEntregaEmMassaOpen(true);
  };

  // Handler para confirmar despacho em massa
  const handleConfirmarDespachoEmMassa = async (pedidoIds: string[]) => {
    const pedidosSelecionados = pedidosFiltrados.filter(p => pedidoIds.includes(String(p.id)));
    await confirmarDespachoEmMassa(pedidosSelecionados);
  };

  // Handler para confirmar entrega em massa com data
  const handleConfirmarEntregaEmMassa = async (pedidoIds: string[], dataEntrega: Date) => {
    try {
      const pedidosSelecionados = pedidosFiltrados.filter(p => pedidoIds.includes(String(p.id)));
      const pedidosParaEntrega = pedidosSelecionados.map(pedido => ({
        id: String(pedido.id),
        cliente_id: String(pedido.cliente_id),
        cliente_nome: pedido.cliente_nome,
        quantidade_total: Number(pedido.quantidade_total),
        tipo_pedido: pedido.tipo_pedido,
        itens_personalizados: pedido.itens_personalizados
      }));

      const sucesso = await confirmarEntregaEmMassaHook(pedidosParaEntrega, dataEntrega);
      if (sucesso) {
        pedidosSelecionados.forEach(pedido => {
          removerPedidoDaLista(String(pedido.id));
        });
      }
    } catch (error) {
      console.error('Erro ao confirmar entregas em massa:', error);
    }
  };


  const handleRetornarParaSeparacao = async (pedidoId: string) => {
    await retornarParaSeparacao(pedidoId);
  };

  const handleDesfazerDespacho = async (pedidoId: string) => {
    await desfazerDespacho(pedidoId);
  };

  const handleConfirmarEntregaIndividual = async (pedidoId: string, observacao?: string) => {
    // Remover o pedido da lista imediatamente (atualização otimista)
    removerPedidoDaLista(pedidoId);
  };

  const handleDownloadCSV = () => {
    if (pedidosFiltrados.length === 0) {
      toast.error("Não há pedidos para exportar.");
      return;
    }
    
    exportDialog.openDialog();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando pedidos...</div>
          </div>
        </Card>
      </div>
    );
  }

  const tituloPorPreset: Record<typeof presetDespacho, string> = {
    hoje: 'Entregas de Hoje',
    semana: 'Entregas da Semana',
    atrasados: 'Entregas Atrasadas',
    todos: 'Todas as Entregas',
  };
  const titulo = tituloPorPreset[presetDespacho];
  const icone = <Truck className="h-5 w-5" />;

  // Verificar se há pedidos separados para despacho
  const pedidosSeparados = pedidosFiltrados.filter(p => p.substatus_pedido === 'Separado');

  const handleOtimizadorRota = () => {
    window.open('https://web.lalamove.com/', '_blank');
  };

  const handleAtualizarDados = () => {
    recarregarSilencioso();
  };

  return (
    <div className="space-y-4">
      {/* Cards superiores lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResumoStatusCard 
          preset={presetDespacho}
          pedidos={pedidosFiltrados} 
        />
        <DespachoActionsCard
          onDespacharEmMassa={handleAbrirDespachoEmMassa}
          onEntregarEmMassa={handleAbrirEntregaEmMassa}
          onDownloadCSV={handleDownloadCSV}
          onOtimizadorRota={handleOtimizadorRota}
          onAtualizarDados={handleAtualizarDados}
          temPedidosSeparados={pedidosSeparados.length > 0}
          temPedidosDespachados={pedidosDespachados.length > 0}
          isLoading={isLoading}
        />
      </div>

      {/* Filtros de Despacho */}
      <DespachoFilters
        preset={presetDespacho}
        onPresetChange={setPresetDespacho}
        filtroTexto={filtroTexto}
        filtroTipo={filtroTipo}
        totalPedidos={pedidosFiltrados.length}
        filtroRepresentantes={filtroRepresentantes}
        filtroTipoLogistica={filtroTipoLogistica}
        onFiltroTextoChange={setFiltroTexto}
        onFiltroTipoChange={setFiltroTipo}
        onFiltroRepresentantesChange={setFiltroRepresentantes}
        onFiltroTipoLogisticaChange={setFiltroTipoLogistica}
      />
      
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {icone}
            {titulo}
          </h2>
        </div>
        
        {/* Debug Info Component */}
        <DebugInfo tipo="despacho" dadosAtivos={pedidosFiltrados} />
        
        {pedidosFiltrados.length > 0 ? (
          <div className="space-y-4">
            {pedidosFiltrados.map((pedido) => (
              <PedidoCard 
                key={pedido.id}
                pedido={{
                  ...converterPedidoParaCard(pedido),
                  cliente_id: String(pedido.cliente_id)
                }}
                onMarcarSeparado={() => {}}
                onEditarAgendamento={() => handleEditarAgendamento(String(pedido.id))}
                showDespachoActions={true}
                showProdutosList={true}
                onConfirmarDespacho={() => confirmarDespacho(String(pedido.id))}
                onConfirmarEntrega={(observacao) => handleConfirmarEntregaIndividual(String(pedido.id), observacao)}
                onConfirmarRetorno={(observacao) => confirmarRetorno(String(pedido.id), observacao)}
                onRetornarParaSeparacao={() => handleRetornarParaSeparacao(String(pedido.id))}
                onDesfazerDespacho={() => handleDesfazerDespacho(String(pedido.id))}
                onGerarVendaGC={() => handleGerarVendaGC(String(pedido.id), String(pedido.cliente_id))}
                onAtualizarVendaGC={
                  pedido.gestaoclick_venda_id
                    ? () => handleAtualizarVendaGC(String(pedido.id), String(pedido.cliente_id), pedido.gestaoclick_venda_id!)
                    : undefined
                }
                isGerandoVendaGC={loadingGC && pedidoEmProcessamento === String(pedido.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Não há pedidos no filtro selecionado.
          </div>
        )}
      </Card>

      {/* Modal de edição de agendamento completo */}
      {agendamentoParaEditar && (
        <AgendamentoEditModal
          agendamento={agendamentoParaEditar}
          open={modalEditarAberto}
          onOpenChange={setModalEditarAberto}
          onSalvar={handleSalvarAgendamento}
        />
      )}

      {/* Modal de exportação CSV */}
      <ExportCSVDialog
        open={exportDialog.open}
        onOpenChange={exportDialog.setOpen}
        enderecoPartida={exportDialog.enderecoPartida}
        onEnderecoPartidaChange={exportDialog.setEnderecoPartida}
        filtroRepresentantes={exportDialog.filtroRepresentantes}
        onFiltroRepresentantesChange={exportDialog.setFiltroRepresentantes}
        entregasFiltradas={exportDialog.entregasFiltradas}
        entregasSelecionadas={exportDialog.entregasSelecionadas}
        onToggleEntrega={exportDialog.toggleEntrega}
        onToggleAll={exportDialog.toggleAll}
        onExport={exportDialog.handleExport}
        totalSelecionadas={exportDialog.totalSelecionadas}
        totalFiltradas={exportDialog.totalFiltradas}
      />

      {/* Modal de Despacho em Massa */}
      <DespachoEmMassaDialog
        open={despachoEmMassaOpen}
        onOpenChange={setDespachoEmMassaOpen}
        pedidosDisponiveis={pedidosFiltrados}
        onConfirm={handleConfirmarDespachoEmMassa}
      />

      {/* Modal de Entrega em Massa */}
      <EntregaEmMassaDialog
        open={entregaEmMassaOpen}
        onOpenChange={setEntregaEmMassaOpen}
        pedidosDisponiveis={pedidosFiltrados}
        onConfirm={handleConfirmarEntregaEmMassa}
      />

    </div>
  );
};
