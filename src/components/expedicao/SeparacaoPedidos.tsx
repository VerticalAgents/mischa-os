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

const SeparacaoPedidos = () => {
  const { 
    pedidos, 
    isLoading, 
    carregarPedidos, 
    confirmarSeparacao 
  } = useExpedicaoStore();

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroData, setFiltroData] = useState("");

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  const handleMarcarSeparado = async (pedidoId: string) => {
    await confirmarSeparacao(pedidoId);
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
    
    const matchStatus = filtroStatus === "todos" || 
      (filtroStatus === "agendado" && (!pedido.substatus_pedido || pedido.substatus_pedido === 'Agendado'));
    
    const matchData = !filtroData || 
      format(pedido.data_prevista_entrega, "yyyy-MM-dd") === filtroData;

    return matchTexto && matchStatus && matchData;
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
        
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
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
              showProdutosList={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SeparacaoPedidos;
