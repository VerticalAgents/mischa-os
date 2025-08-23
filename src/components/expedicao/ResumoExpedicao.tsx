
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Package, Eye } from "lucide-react";
import { ResumoUnidadesSeparadas } from "./components/ResumoUnidadesSeparadas";
import { DetalheProdutosModal } from "./components/DetalheProdutosModal";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ResumoExpedicao = () => {
  const { 
    pedidos, 
    isLoading, 
    carregarPedidos 
  } = useExpedicaoStore();

  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  // Filtrar pedidos separados e despachados
  const pedidosSeparados = pedidos.filter(p => p.substatus_pedido === 'Separado');
  const pedidosDespachados = pedidos.filter(p => p.substatus_pedido === 'Despachado');

  const handleVerProdutos = (pedido: any) => {
    setPedidoSelecionado(pedido);
    setModalDetalhesAberto(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-semibold">Resumo da Expedição</h2>
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

      {/* Resumo de Unidades Separadas */}
      <ResumoUnidadesSeparadas 
        pedidosSeparados={pedidosSeparados}
        pedidosDespachados={pedidosDespachados}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos Separados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Pedidos Separados
              <Badge variant="secondary" className="ml-auto">
                {pedidosSeparados.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pedidosSeparados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pedido separado encontrado
                </p>
              ) : (
                pedidosSeparados.map((pedido) => (
                  <div key={pedido.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{pedido.cliente_nome}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {pedido.id} • {pedido.quantidade_total} unidades
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(pedido.data_prevista_entrega), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerProdutos(pedido)}
                      className="ml-2"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Produtos
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Despachados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Pedidos Despachados
              <Badge variant="secondary" className="ml-auto">
                {pedidosDespachados.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pedidosDespachados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pedido despachado encontrado
                </p>
              ) : (
                pedidosDespachados.map((pedido) => (
                  <div key={pedido.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{pedido.cliente_nome}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {pedido.id} • {pedido.quantidade_total} unidades
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(pedido.data_prevista_entrega), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerProdutos(pedido)}
                      className="ml-2"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Produtos
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes dos Produtos */}
      <DetalheProdutosModal
        pedido={pedidoSelecionado}
        open={modalDetalhesAberto}
        onOpenChange={setModalDetalhesAberto}
      />
    </div>
  );
};

export default ResumoExpedicao;
