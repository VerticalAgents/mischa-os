
import { useState, useEffect } from "react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import PedidoCard from "./PedidoCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAgendamentoActions } from "./hooks/useAgendamentoActions";
import EditarAgendamentoDialog from "@/components/agendamento/EditarAgendamentoDialog";
import { toast } from "sonner";

interface DespachoProps {
  tipoFiltro: "hoje" | "atrasadas";
}

export const Despacho = ({ tipoFiltro }: DespachoProps) => {
  const { 
    pedidos, 
    isLoading, 
    carregarPedidos, 
    confirmarDespacho,
    confirmarEntrega,
    confirmarRetorno,
    retornarParaSeparacao
  } = useExpedicaoStore();

  const {
    modalEditarAberto,
    setModalEditarAberto,
    agendamentoParaEditar,
    handleEditarAgendamento,
    handleSalvarAgendamento
  } = useAgendamentoActions();

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipoPedido, setFiltroTipoPedido] = useState("todos");

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  const handleConfirmarDespacho = async (pedidoId: string) => {
    try {
      await confirmarDespacho(pedidoId);
      toast.success("Despacho confirmado com sucesso!");
    } catch (error) {
      console.error('Erro ao confirmar despacho:', error);
      toast.error("Erro ao confirmar despacho");
    }
  };

  const handleConfirmarEntrega = async (pedidoId: string, observacao?: string) => {
    try {
      await confirmarEntrega(pedidoId, observacao);
      toast.success("Entrega confirmada com sucesso!");
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
      toast.error("Erro ao confirmar entrega");
    }
  };

  const handleConfirmarRetorno = async (pedidoId: string, observacao?: string) => {
    try {
      await confirmarRetorno(pedidoId, observacao);
      toast.success("Retorno confirmado com sucesso!");
    } catch (error) {
      console.error('Erro ao confirmar retorno:', error);
      toast.error("Erro ao confirmar retorno");
    }
  };

  const handleRetornarParaSeparacao = async (pedidoId: string) => {
    try {
      await retornarParaSeparacao(pedidoId);
      toast.success("Pedido retornado para separação!");
    } catch (error) {
      console.error('Erro ao retornar para separação:', error);
      toast.error("Erro ao retornar para separação");
    }
  };

  // Aplicar filtro por tipo (hoje ou atrasadas) com lógicas diferentes
  const pedidosPorTipo = pedidos.filter(pedido => {
    const dataEntrega = new Date(pedido.data_prevista_entrega);
    const hoje = new Date();
    
    if (tipoFiltro === "hoje") {
      // Para entregas de hoje: apenas pedidos separados com data de hoje
      return pedido.substatus_pedido === 'Separado' && isToday(dataEntrega);
    } else {
      // Para entregas atrasadas: todos os pedidos despachados com data anterior a hoje
      return pedido.substatus_pedido === 'Despachado' && isBefore(dataEntrega, startOfDay(hoje));
    }
  });

  // Aplicar filtros adicionais
  const pedidosFiltrados = pedidosPorTipo.filter(pedido => {
    const matchTexto = !filtroTexto || 
      pedido.cliente_nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      pedido.id.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const matchTipoPedido = filtroTipoPedido === "todos" || 
      (filtroTipoPedido === "padrao" && pedido.tipo_pedido === 'Padrão') ||
      (filtroTipoPedido === "alterado" && pedido.tipo_pedido === 'Alterado');

    return matchTexto && matchTipoPedido;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando pedidos...
      </div>
    );
  }

  const titulo = tipoFiltro === "hoje" ? "Entregas de Hoje" : "Entregas Atrasadas";
  const cor = tipoFiltro === "hoje" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <Badge variant="secondary" className={cor}>
            {pedidosFiltrados.length} pedidos
          </Badge>
        </div>
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

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente ou ID..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={filtroTipoPedido} onValueChange={setFiltroTipoPedido}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo de Pedido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="padrao">Padrão</SelectItem>
            <SelectItem value="alterado">Alterado</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {pedidosFiltrados.length} de {pedidosPorTipo.length} pedidos
          </span>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {pedidosPorTipo.length === 0 
              ? `Nenhum pedido ${tipoFiltro === "hoje" ? "para entrega hoje" : "atrasado"}`
              : "Nenhum pedido encontrado com os filtros aplicados"
            }
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              showDespachoActions={true}
              showProdutosList={true}
              onEditarAgendamento={() => handleEditarAgendamento(pedido.id)}
              onConfirmarDespacho={() => handleConfirmarDespacho(pedido.id)}
              onConfirmarEntrega={(observacao) => handleConfirmarEntrega(pedido.id, observacao)}
              onConfirmarRetorno={(observacao) => handleConfirmarRetorno(pedido.id, observacao)}
              onRetornarParaSeparacao={() => handleRetornarParaSeparacao(pedido.id)}
            />
          ))
        )}
      </div>

      {/* Modal de Edição de Agendamento */}
      {agendamentoParaEditar && (
        <EditarAgendamentoDialog
          agendamento={agendamentoParaEditar}
          open={modalEditarAberto}
          onOpenChange={setModalEditarAberto}
          onSalvar={handleSalvarAgendamento}
        />
      )}
    </div>
  );
};
