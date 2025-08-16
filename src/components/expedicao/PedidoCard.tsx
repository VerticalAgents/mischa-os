
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Phone, Package, Edit, CheckCircle, XCircle, Truck, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import TipoPedidoBadge from "./TipoPedidoBadge";
import ProdutosList from "./ProdutosList";
import { useEstoqueConsolidado } from "@/hooks/useEstoqueConsolidado";
import { EstoqueConsolidadoInfo } from "@/components/estoque/EstoqueConsolidadoInfo";

interface PedidoCardProps {
  pedido: {
    id: string;
    cliente_nome: string;
    cliente_endereco?: string;
    cliente_telefone?: string;
    link_google_maps?: string;
    data_prevista_entrega: Date;
    quantidade_total: number;
    tipo_pedido: string;
    substatus_pedido?: string;
    itens_personalizados?: any;
    produtos?: Array<{
      produto_id: string;
      produto_nome: string;
      quantidade: number;
    }>;
  };
  onMarcarSeparado?: () => void;
  onDesfazerSeparacao?: () => void;
  onEditarAgendamento?: () => void;
  onConfirmarDespacho?: () => void;
  onRetornarParaSeparacao?: () => void;
  onConfirmarEntrega?: () => void;
  onConfirmarRetorno?: () => void;
  showActions?: boolean;
}

export default function PedidoCard({
  pedido,
  onMarcarSeparado,
  onDesfazerSeparacao,
  onEditarAgendamento,
  onConfirmarDespacho,
  onRetornarParaSeparacao,
  onConfirmarEntrega,
  onConfirmarRetorno,
  showActions = true
}: PedidoCardProps) {
  const [showProducts, setShowProducts] = useState(false);
  
  // Obter IDs dos produtos para verificar estoque
  const produtoIds = pedido.produtos?.map(p => p.produto_id) || [];
  const { estoques, loading: loadingEstoque } = useEstoqueConsolidado(produtoIds);

  const getStatusColor = (substatus?: string) => {
    switch (substatus) {
      case 'Separado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Despachado':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isDataAtrasada = pedido.data_prevista_entrega < new Date();
  
  // Verificar se há estoque insuficiente para separação
  const temEstoqueInsuficiente = estoques.some(estoque => {
    const produto = pedido.produtos?.find(p => p.produto_id === estoque.produto_id);
    return produto && estoque.saldoReal < produto.quantidade;
  });

  const podeMarcarSeparado = (!pedido.substatus_pedido || pedido.substatus_pedido === 'Agendado') && !temEstoqueInsuficiente;
  const podeDdDesfazerSeparacao = pedido.substatus_pedido === 'Separado';
  const podeConfirmarDespacho = pedido.substatus_pedido === 'Separado';
  const podeRetornarParaSeparacao = pedido.substatus_pedido === 'Despachado';
  const podeConfirmarEntrega = pedido.substatus_pedido === 'Despachado';

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isDataAtrasada && "border-orange-200 bg-orange-50/50",
      pedido.substatus_pedido === 'Separado' && "border-blue-200 bg-blue-50/50",
      pedido.substatus_pedido === 'Despachado' && "border-green-200 bg-green-50/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            {pedido.cliente_nome}
          </CardTitle>
          <div className="flex items-center gap-2">
            <TipoPedidoBadge tipo={pedido.tipo_pedido} />
            {pedido.substatus_pedido && (
              <Badge className={cn("text-xs", getStatusColor(pedido.substatus_pedido))}>
                {pedido.substatus_pedido}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {format(pedido.data_prevista_entrega, "EEEE, dd/MM/yyyy", { locale: ptBR })}
            </span>
            {isDataAtrasada && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Atrasado
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{pedido.quantidade_total} unidades</span>
          </div>

          {pedido.cliente_endereco && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{pedido.cliente_endereco}</span>
            </div>
          )}

          {pedido.cliente_telefone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{pedido.cliente_telefone}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Informações de Estoque */}
        {pedido.produtos && pedido.produtos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Produtos e Estoque:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProducts(!showProducts)}
                className="h-6 px-2 text-xs"
              >
                {showProducts ? 'Ocultar' : 'Ver detalhes'}
              </Button>
            </div>
            
            {!showProducts ? (
              <div className="space-y-1">
                {pedido.produtos.map(produto => {
                  const estoque = estoques.find(e => e.produto_id === produto.produto_id);
                  const insuficiente = estoque && estoque.saldoReal < produto.quantidade;
                  
                  return (
                    <div key={produto.produto_id} className="flex items-center justify-between text-xs">
                      <span className={cn(
                        "font-medium",
                        insuficiente && "text-destructive"
                      )}>
                        {produto.produto_nome} ({produto.quantidade})
                      </span>
                      {estoque && (
                        <EstoqueConsolidadoInfo estoque={estoque} compact />
                      )}
                      {insuficiente && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Insuficiente
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {pedido.produtos.map(produto => {
                  const estoque = estoques.find(e => e.produto_id === produto.produto_id);
                  const insuficiente = estoque && estoque.saldoReal < produto.quantidade;
                  
                  return (
                    <div key={produto.produto_id} className={cn(
                      "p-2 rounded border",
                      insuficiente ? "border-destructive bg-destructive/5" : "border-border"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {produto.produto_nome}
                        </span>
                        <Badge variant="outline">
                          Necessário: {produto.quantidade}
                        </Badge>
                      </div>
                      
                      {estoque && (
                        <EstoqueConsolidadoInfo estoque={estoque} />
                      )}
                      
                      {insuficiente && (
                        <div className="mt-2 text-xs text-destructive font-medium">
                          ⚠️ Estoque insuficiente para separação
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {temEstoqueInsuficiente && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
            <strong>⚠️ Atenção:</strong> Estoque insuficiente para alguns produtos. Não é possível separar este pedido.
          </div>
        )}

        {showActions && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {podeMarcarSeparado && (
                <Button
                  onClick={onMarcarSeparado}
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={loadingEstoque}
                >
                  <CheckCircle className="h-4 w-4" />
                  Separar
                </Button>
              )}

              {podeDdDesfazerSeparacao && (
                <Button
                  onClick={onDesfazerSeparacao}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Desfazer
                </Button>
              )}

              {podeConfirmarDespacho && (
                <Button
                  onClick={onConfirmarDespacho}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Truck className="h-4 w-4" />
                  Despachar
                </Button>
              )}

              {podeRetornarParaSeparacao && (
                <Button
                  onClick={onRetornarParaSeparacao}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Voltar
                </Button>
              )}

              {podeConfirmarEntrega && (
                <Button
                  onClick={onConfirmarEntrega}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Entregar
                </Button>
              )}

              {podeConfirmarEntrega && (
                <Button
                  onClick={onConfirmarRetorno}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retorno
                </Button>
              )}

              {onEditarAgendamento && (
                <Button
                  onClick={onEditarAgendamento}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 ml-auto"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
