

import { useState, useEffect } from "react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import PedidoCard from "./PedidoCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AgendamentoEditModal from "@/components/agendamento/AgendamentoEditModal";
import { AgendamentoItem } from "@/components/agendamento/types";

const SeparacaoPedidos = () => {
  const { 
    pedidos, 
    isLoading, 
    carregarPedidos, 
    confirmarSeparacao 
  } = useExpedicaoStore();

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipoPedido, setFiltroTipoPedido] = useState("todos");
  const [filtroData, setFiltroData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [pedidoEditando, setPedidoEditando] = useState<AgendamentoItem | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  const handleMarcarSeparado = async (pedidoId: string) => {
    await confirmarSeparacao(pedidoId);
  };

  const handleEditarPedido = (pedido: any) => {
    // Converter o pedido da expedição para o formato AgendamentoItem
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
    // Recarregar pedidos após edição
    carregarPedidos();
    setModalEditarAberto(false);
    setPedidoEditando(null);
  };

  // Filtrar pedidos para separação (Agendado e não separados ainda)
  const pedidosParaSeparacao = pedidos.filter(pedido => 
    !pedido.substatus_pedido || 
    pedido.substatus_pedido === 'Agendado'
  );

  // Aplicar filtros
  const pedidosFiltrados = pedidosParaSeparacao.filter(pedido => {
    const matchTexto = !filtroTexto || 
      pedido.cliente_nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      pedido.id.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const matchTipoPedido = filtroTipoPedido === "todos" || 
      (filtroTipoPedido === "padrao" && pedido.tipo_pedido === 'Padrão') ||
      (filtroTipoPedido === "alterado" && pedido.tipo_pedido === 'Alterado');
    
    const matchData = !filtroData || 
      format(pedido.data_prevista_entrega, "yyyy-MM-dd") === filtroData;

    return matchTexto && matchTipoPedido && matchData;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Separação de Pedidos</h2>
          <Badge variant="secondary">
            {pedidosParaSeparacao.length} pedidos
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
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

        <Input
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          placeholder="Filtrar por data"
        />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {pedidosFiltrados.length} de {pedidosParaSeparacao.length} pedidos
          </span>
        </div>
      </div>

      {/* Lista de Pedidos */}
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
              showProdutosList={true}
            />
          ))
        )}
      </div>

      {/* Modal de Edição - Agora usando o modal completo */}
      <AgendamentoEditModal
        agendamento={pedidoEditando}
        open={modalEditarAberto}
        onOpenChange={setModalEditarAberto}
        onSalvar={handleSalvarAgendamento}
      />
    </div>
  );
};

export default SeparacaoPedidos;
