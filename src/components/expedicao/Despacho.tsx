import { useState, useEffect, useMemo } from "react";
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
import { WeekNavigator } from "./components/WeekNavigator";
import { useExpedicaoUiStore } from "@/hooks/useExpedicaoUiStore";
import PedidoCard from "./PedidoCard";
import AgendamentoEditModal from "../agendamento/AgendamentoEditModal";
import { toast } from "sonner";
import { Truck, Package, Loader2, Download, MapPin } from "lucide-react";
import { ExportCSVDialog } from "./components/ExportCSVDialog";
import { useExportCSVDialog } from "@/hooks/useExportCSVDialog";
import { startOfWeek, endOfWeek, subWeeks, addWeeks, isSameWeek, parseISO } from "date-fns";

interface DespachoProps {
  tipoFiltro: "hoje" | "atrasadas" | "antecipada";
}

export const Despacho = ({ tipoFiltro }: DespachoProps) => {
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
    getPedidosParaDespacho,
    getPedidosAtrasados,
    getPedidosSeparadosAntecipados,
    carregarPedidos,
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
  
  const {
    filtroRepresentantes,
    setFiltroRepresentantes,
    semanaAtrasados,
    setSemanaAtrasados
  } = useExpedicaoUiStore();

  // Parse semana selecionada
  const semanaAtrasadosDate = useMemo(() => {
    try {
      return parseISO(semanaAtrasados);
    } catch {
      return new Date();
    }
  }, [semanaAtrasados]);

  // Verificar se está na semana atual
  const ehSemanaAtual = useMemo(() => {
    return isSameWeek(semanaAtrasadosDate, new Date(), { weekStartsOn: 0 });
  }, [semanaAtrasadosDate]);

  // Handlers de navegação de semana
  const navegarSemanaAnterior = () => {
    setSemanaAtrasados(subWeeks(semanaAtrasadosDate, 1));
  };

  const navegarProximaSemana = () => {
    setSemanaAtrasados(addWeeks(semanaAtrasadosDate, 1));
  };

  const voltarSemanaAtual = () => {
    setSemanaAtrasados(new Date());
  };

  // Usar hook de sincronização
  useExpedicaoSync();

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

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

  // Obter pedidos filtrados baseado no tipo
  const pedidosBase = tipoFiltro === "hoje" 
    ? getPedidosParaDespacho() 
    : tipoFiltro === "atrasadas"
    ? getPedidosAtrasados()
    : getPedidosSeparadosAntecipados();

  // Aplicar filtros de busca, tipo e semana
  const pedidosFiltrados = useMemo(() => {
    let resultado = pedidosBase;

    // Filtro por semana (apenas para entregas pendentes/atrasadas)
    if (tipoFiltro === "atrasadas") {
      const inicioSemana = startOfWeek(semanaAtrasadosDate, { weekStartsOn: 0 });
      const fimSemana = endOfWeek(semanaAtrasadosDate, { weekStartsOn: 0 });
      
      resultado = resultado.filter(pedido => {
        if (!pedido.data_prevista_entrega) return false;
        const dataPedido = new Date(pedido.data_prevista_entrega);
        return dataPedido >= inicioSemana && dataPedido <= fimSemana;
      });
    }

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
      resultado = resultado.filter(pedido =>
        pedido.representante_id && filtroRepresentantes.includes(pedido.representante_id)
      );
    }

    return resultado;
  }, [pedidosBase, filtroTexto, filtroTipo, filtroRepresentantes, tipoFiltro, semanaAtrasadosDate]);
  
  // Hook para o modal de exportação CSV (após pedidosFiltrados estar definido)
  const exportDialog = useExportCSVDialog(pedidosFiltrados);


  // Verificar quantos pedidos estão despachados
  const pedidosDespachados = pedidosFiltrados.filter(p => p.substatus_pedido === 'Despachado');
  const todosDespachados = pedidosFiltrados.length > 0 && pedidosDespachados.length === pedidosFiltrados.length;

  const handleDespachoEmMassa = async () => {
    if (pedidosFiltrados.length === 0) {
      toast.error("Não há pedidos para despachar.");
      return;
    }
    
    await confirmarDespachoEmMassa(pedidosFiltrados);
  };

  const handleEntregaEmMassa = async () => {
    if (!todosDespachados) {
      toast.error("Todos os pedidos devem estar despachados para confirmar entrega em massa.");
      return;
    }
    
    try {
      // Transformar pedidos despachados no formato correto para o hook
      const pedidosParaEntrega = pedidosDespachados.map(pedido => ({
        id: String(pedido.id),
        cliente_id: String(pedido.cliente_id),
        cliente_nome: pedido.cliente_nome,
        quantidade_total: Number(pedido.quantidade_total),
        tipo_pedido: pedido.tipo_pedido,
        itens_personalizados: pedido.itens_personalizados
      }));

      const sucesso = await confirmarEntregaEmMassaHook(pedidosParaEntrega);
      if (sucesso) {
        // Remover todos os pedidos entregues da lista imediatamente
        pedidosDespachados.forEach(pedido => {
          removerPedidoDaLista(String(pedido.id));
        });
        // Recarregar dados em background para sincronizar
        recarregarSilencioso();
      }
    } catch (error) {
      console.error('Erro ao confirmar entregas em massa:', error);
    }
  };

  const handleRetornoEmMassa = async () => {
    if (!todosDespachados) {
      toast.error("Todos os pedidos devem estar despachados para confirmar retorno em massa.");
      return;
    }
    
    await confirmarRetornoEmMassa(pedidosFiltrados);
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
    // Recarregar dados em background para sincronizar com o banco
    recarregarSilencioso();
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

  const titulo = tipoFiltro === "hoje" 
    ? "Entregas de Hoje" 
    : tipoFiltro === "atrasadas"
    ? "Entregas Pendentes"
    : "Separação Antecipada";
    
  const icone = tipoFiltro === "hoje" 
    ? <Truck className="h-5 w-5" /> 
    : tipoFiltro === "atrasadas"
    ? <Package className="h-5 w-5" />
    : <Package className="h-5 w-5" />;

  return (
    <div className="space-y-4">
      {/* Card de Resumo de Status */}
      <ResumoStatusCard 
        tipo={tipoFiltro === "hoje" ? "hoje" : tipoFiltro === "atrasadas" ? "pendentes" : "antecipada"} 
        pedidos={pedidosFiltrados} 
      />

      {/* Navegador de Semana (apenas para entregas pendentes) */}
      {tipoFiltro === "atrasadas" && (
        <WeekNavigator
          semanaAtual={semanaAtrasadosDate}
          onSemanaAnterior={navegarSemanaAnterior}
          onProximaSemana={navegarProximaSemana}
          onVoltarHoje={voltarSemanaAtual}
          ehSemanaAtual={ehSemanaAtual}
        />
      )}

      {/* Filtros de Despacho */}
      <DespachoFilters
        filtroTexto={filtroTexto}
        filtroTipo={filtroTipo}
        totalPedidos={pedidosFiltrados.length}
        filtroRepresentantes={filtroRepresentantes}
        onFiltroTextoChange={setFiltroTexto}
        onFiltroTipoChange={setFiltroTipo}
        onFiltroRepresentantesChange={setFiltroRepresentantes}
      />
      
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {icone}
            {titulo}
          </h2>
          {tipoFiltro !== "antecipada" && (
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => window.open('https://web.lalamove.com/', '_blank')}
                size="sm" 
                variant="outline"
                className="flex items-center gap-1"
              >
                <MapPin className="h-4 w-4" /> Otimizador de Rota
              </Button>
              <Button 
                onClick={handleDownloadCSV} 
                size="sm" 
                variant="outline"
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" /> Download CSV
              </Button>
              <Button 
                onClick={handleDespachoEmMassa} 
                size="sm" 
                variant="outline"
                className="flex items-center gap-1"
              >
                <Truck className="h-4 w-4" /> Despachar Todos
              </Button>
              <Button 
                onClick={handleEntregaEmMassa} 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                disabled={!todosDespachados || loadingConfirmacao}
                title={!todosDespachados ? "Todos os pedidos devem estar despachados" : ""}
              >
                {loadingConfirmacao ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-1" /> 
                    Entregar Todos
                  </>
                )}
              </Button>
              <Button 
                onClick={handleRetornoEmMassa} 
                size="sm" 
                variant="destructive"
                disabled={!todosDespachados}
                title={!todosDespachados ? "Todos os pedidos devem estar despachados" : ""}
              >
                Retorno em Massa
              </Button>
            </div>
          )}
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
                showDespachoActions={tipoFiltro !== "antecipada"}
                showReagendarButton={tipoFiltro === "atrasadas" && pedido.substatus_pedido === 'Agendado'}
                showRetornarParaSeparacaoButton={tipoFiltro === "antecipada"}
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
            {tipoFiltro === "hoje" 
              ? "Não há pedidos agendados para entrega hoje."
              : tipoFiltro === "atrasadas"
              ? "Não há pedidos pendentes."
              : "Não há pedidos separados antecipadamente."
            }
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

    </div>
  );
};
