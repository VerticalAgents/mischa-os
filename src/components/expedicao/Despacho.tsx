import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { usePedidoConverter } from "./hooks/usePedidoConverter";
import { useAgendamentoActions } from "./hooks/useAgendamentoActions";
import { useConfirmacaoEntrega } from "@/hooks/useConfirmacaoEntrega";
import { DebugInfo } from "./components/DebugInfo";
import { DespachoFilters } from "./components/DespachoFilters";
import { ResumoStatusCard } from "./components/ResumoStatusCard";
import PedidoCard from "./PedidoCard";
import AgendamentoEditModal from "../agendamento/AgendamentoEditModal";
import { OrganizadorEntregas } from "./OrganizadorEntregas";
import { toast } from "sonner";
import { Truck, Package, ArrowLeft, ClipboardList, Loader2 } from "lucide-react";

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
    confirmarDespachoEmMassa,
    confirmarEntregaEmMassa,
    confirmarRetornoEmMassa,
    getPedidosParaDespacho,
    getPedidosAtrasados,
    getPedidosSeparadosAntecipados,
    carregarPedidos
  } = useExpedicaoStore();

  const { converterPedidoParaCard } = usePedidoConverter();
  const { confirmarEntregaEmMassa: confirmarEntregaEmMassaHook, loading: loadingConfirmacao } = useConfirmacaoEntrega();
  const {
    modalEditarAberto,
    setModalEditarAberto,
    agendamentoParaEditar,
    handleEditarAgendamento,
    handleSalvarAgendamento
  } = useAgendamentoActions();

  const [organizadorAberto, setOrganizadorAberto] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Usar hook de sincronização
  useExpedicaoSync();

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // Obter pedidos filtrados baseado no tipo
  const pedidosBase = tipoFiltro === "hoje" 
    ? getPedidosParaDespacho() 
    : tipoFiltro === "atrasadas"
    ? getPedidosAtrasados()
    : getPedidosSeparadosAntecipados();

  // Aplicar filtros de busca e tipo
  const pedidosFiltrados = useMemo(() => {
    let pedidosFiltrados = pedidosBase;

    // Filtro por texto (cliente ou ID)
    if (filtroTexto.trim()) {
      const searchTerm = filtroTexto.toLowerCase().trim();
      pedidosFiltrados = pedidosFiltrados.filter(pedido => 
        pedido.cliente_nome?.toLowerCase().includes(searchTerm) ||
        pedido.id?.toString().includes(searchTerm)
      );
    }

    // Filtro por tipo
    if (filtroTipo !== "todos") {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => 
        pedido.tipo_pedido === filtroTipo
      );
    }

    return pedidosFiltrados;
  }, [pedidosBase, filtroTexto, filtroTipo]);

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
        // Recarregar os dados após confirmação bem-sucedida
        await carregarPedidos();
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
    await carregarPedidos();
  };

  const handleOrganizarEntregas = () => {
    if (pedidosFiltrados.length === 0) {
      toast.error("Não há entregas para organizar.");
      return;
    }
    setOrganizadorAberto(true);
  };

  const handleConfirmarEntregaIndividual = async (pedidoId: string, observacao?: string) => {
    // A confirmação já é feita pelo PedidoCard usando o hook useConfirmacaoEntrega
    // Aqui só precisamos recarregar os dados
    await carregarPedidos();
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
    : <ClipboardList className="h-5 w-5" />;

  return (
    <div className="space-y-4">
      {/* Card de Resumo de Status */}
      <ResumoStatusCard 
        tipo={tipoFiltro === "hoje" ? "hoje" : tipoFiltro === "atrasadas" ? "pendentes" : "antecipada"} 
        pedidos={pedidosFiltrados} 
      />

      {/* Filtros de Despacho */}
      <DespachoFilters
        filtroTexto={filtroTexto}
        filtroTipo={filtroTipo}
        totalPedidos={pedidosFiltrados.length}
        onFiltroTextoChange={setFiltroTexto}
        onFiltroTipoChange={setFiltroTipo}
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
                onClick={handleOrganizarEntregas}
                size="sm" 
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <ClipboardList className="h-4 w-4" />
                Organizar Entregas
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
                onConfirmarDespacho={async () => {
                  await confirmarDespacho(String(pedido.id));
                  // Forçar atualização da UI após confirmar despacho
                  await carregarPedidos();
                }}
                onConfirmarEntrega={(observacao) => handleConfirmarEntregaIndividual(String(pedido.id), observacao)}
                onConfirmarRetorno={async (observacao) => {
                  await confirmarRetorno(String(pedido.id), observacao);
                  await carregarPedidos();
                }}
                onRetornarParaSeparacao={async () => {
                  await handleRetornarParaSeparacao(String(pedido.id));
                  await carregarPedidos();
                }}
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

      {/* Modal do Organizador de Entregas - só mostrar se não for separação antecipada */}
      {tipoFiltro !== "antecipada" && (
        <OrganizadorEntregas
          open={organizadorAberto}
          onOpenChange={setOrganizadorAberto}
          entregas={pedidosFiltrados.map(p => ({
            id: p.id,
            cliente_nome: p.cliente_nome,
            cliente_endereco: p.cliente_endereco,
            link_google_maps: (p as any).link_google_maps
          }))}
        />
      )}
    </div>
  );
};
