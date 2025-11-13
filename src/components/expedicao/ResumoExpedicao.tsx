
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Package, Eye, User, Calendar, Hash } from "lucide-react";
import { ProdutosEmExpedicao } from "./components/ProdutosEmExpedicao";
import { ProdutosNecessarios } from "./components/ProdutosNecessarios";
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

      {/* Grid 2 colunas - Cards de Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos Necessários (esquerda) */}
        <ProdutosNecessarios 
          pedidosSeparados={pedidosSeparados}
          pedidosDespachados={pedidosDespachados}
        />
        
        {/* Produtos em Expedição (direita) */}
        <ProdutosEmExpedicao 
          pedidosSeparados={pedidosSeparados}
          pedidosDespachados={pedidosDespachados}
        />
      </div>

      {/* Grid 2 colunas - Lista de Pedidos */}
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
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pedidosSeparados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 italic">
                  Nenhum pedido separado encontrado
                </p>
              ) : (
                pedidosSeparados.map((pedido) => (
                  <div key={pedido.id} className="group p-4 border border-green-200 rounded-xl bg-gradient-to-r from-green-50/80 to-green-50/40 hover:from-green-100/80 hover:to-green-100/40 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-800">{pedido.cliente_nome}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{pedido.quantidade_total} unidades</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(pedido.data_prevista_entrega), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerProdutos(pedido)}
                        className="ml-4 opacity-70 group-hover:opacity-100 transition-opacity border-green-300 hover:bg-green-100 hover:border-green-400"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Produtos
                      </Button>
                    </div>
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
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pedidosDespachados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 italic">
                  Nenhum pedido despachado encontrado
                </p>
              ) : (
                pedidosDespachados.map((pedido) => (
                  <div key={pedido.id} className="group p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50/80 to-blue-50/40 hover:from-blue-100/80 hover:to-blue-100/40 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-blue-800">{pedido.cliente_nome}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{pedido.quantidade_total} unidades</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(pedido.data_prevista_entrega), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerProdutos(pedido)}
                        className="ml-4 opacity-70 group-hover:opacity-100 transition-opacity border-blue-300 hover:bg-blue-100 hover:border-blue-400"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Produtos
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes dos Produtos */}
      <DetalheProdutosModal
        agendamento={pedidoSelecionado}
        open={modalDetalhesAberto}
        onOpenChange={setModalDetalhesAberto}
      />
    </div>
  );
};

export default ResumoExpedicao;
