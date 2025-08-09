
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Check, X, Edit, Calendar, Truck, Package, ArrowLeft, Clock } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TipoPedidoBadge from './TipoPedidoBadge';
import ProdutoNomeDisplay from './ProdutoNomeDisplay';

export interface PedidoCardData {
  id: string;
  cliente_nome: string;
  cliente_endereco?: string;
  cliente_telefone?: string;
  data_prevista_entrega: Date | string;
  quantidade_total: number;
  tipo_pedido: string;
  substatus_pedido: string;
  itens?: Array<{
    produto_id: string;
    produto_nome: string;
    quantidade: number;
  }>;
}

interface PedidoCardProps {
  pedido: PedidoCardData;
  onMarcarSeparado?: () => void;
  onEditarAgendamento?: () => void;
  showDespachoActions?: boolean;
  showReagendarButton?: boolean;
  onConfirmarDespacho?: () => void;
  onConfirmarEntrega?: (observacao?: string) => void;
  onConfirmarRetorno?: (observacao?: string) => void;
  onRetornarParaSeparacao?: () => void;
}

export default function PedidoCard({
  pedido,
  onMarcarSeparado,
  onEditarAgendamento,
  showDespachoActions = false,
  showReagendarButton = false,
  onConfirmarDespacho,
  onConfirmarEntrega,
  onConfirmarRetorno,
  onRetornarParaSeparacao
}: PedidoCardProps) {
  const [observacaoEntrega, setObservacaoEntrega] = useState('');
  const [observacaoRetorno, setObservacaoRetorno] = useState('');
  const [dialogEntregaAberto, setDialogEntregaAberto] = useState(false);
  const [dialogRetornoAberto, setDialogRetornoAberto] = useState(false);

  // Helper function to safely convert date
  const getSafeDate = (dateValue: Date | string | null | undefined): Date | null => {
    if (!dateValue) return null;
    
    if (dateValue instanceof Date) {
      return isValid(dateValue) ? dateValue : null;
    }
    
    if (typeof dateValue === 'string') {
      const parsedDate = parseISO(dateValue);
      return isValid(parsedDate) ? parsedDate : null;
    }
    
    return null;
  };

  // Helper function to format date safely
  const formatSafeDate = (dateValue: Date | string | null | undefined, formatStr: string = "dd/MM/yyyy"): string => {
    const safeDate = getSafeDate(dateValue);
    if (!safeDate) {
      console.warn('Invalid date value:', dateValue);
      return '--/--/----';
    }
    
    try {
      return format(safeDate, formatStr, { locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return '--/--/----';
    }
  };

  const handleConfirmarEntrega = () => {
    onConfirmarEntrega?.(observacaoEntrega);
    setObservacaoEntrega('');
    setDialogEntregaAberto(false);
  };

  const handleConfirmarRetorno = () => {
    onConfirmarRetorno?.(observacaoRetorno);
    setObservacaoRetorno('');
    setDialogRetornoAberto(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Agendado':
        return 'bg-blue-100 text-blue-800';
      case 'Separado':
        return 'bg-yellow-100 text-yellow-800';
      case 'Despachado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isPedidoDespachado = pedido.substatus_pedido === 'Despachado';

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Cabeçalho com informações do cliente */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{pedido.cliente_nome}</h3>
              {pedido.cliente_endereco && (
                <p className="text-sm text-muted-foreground mt-1 text-left">{pedido.cliente_endereco}</p>
              )}
              {pedido.cliente_telefone && (
                <p className="text-sm text-muted-foreground text-left">{pedido.cliente_telefone}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getStatusColor(pedido.substatus_pedido)}>
                {pedido.substatus_pedido}
              </Badge>
              <TipoPedidoBadge tipo={pedido.tipo_pedido} />
            </div>
          </div>

          {/* Informações do pedido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-left">Data de Entrega</p>
                <p className="text-sm text-muted-foreground text-left">
                  {formatSafeDate(pedido.data_prevista_entrega)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-left">Quantidade</p>
                <p className="text-sm text-muted-foreground">{pedido.quantidade_total} unidades</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-left">Status</p>
                <p className="text-sm text-muted-foreground text-left">{pedido.substatus_pedido}</p>
              </div>
            </div>
          </div>

          {/* Lista de produtos */}
          {pedido.itens && pedido.itens.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Produtos:</h4>
              <div className="space-y-1">
                {pedido.itens.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-background rounded">
                    <ProdutoNomeDisplay produtoId={item.produto_id} nomeFallback={item.produto_nome} />
                    <span className="font-medium">{item.quantidade}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {!showDespachoActions ? (
              // Ações da separação
              <>
                <Button size="sm" onClick={onMarcarSeparado} className="flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Marcar como Separado
                </Button>
                <Button size="sm" variant="outline" onClick={onEditarAgendamento} className="flex items-center gap-1">
                  <Edit className="h-4 w-4" />
                  Editar Agendamento
                </Button>
              </>
            ) : (
              // Ações do despacho
              <>
                {pedido.substatus_pedido === 'Separado' && (
                  <Button size="sm" onClick={onConfirmarDespacho} className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Despachar Pedido
                  </Button>
                )}

                {pedido.substatus_pedido === 'Despachado' && (
                  <>
                    <Dialog open={dialogEntregaAberto} onOpenChange={setDialogEntregaAberto}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Confirmar Entrega
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirmar Entrega</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Confirmar entrega para <strong>{pedido.cliente_nome}</strong>?</p>
                          <Textarea 
                            placeholder="Observações (opcional)" 
                            value={observacaoEntrega} 
                            onChange={(e) => setObservacaoEntrega(e.target.value)} 
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogEntregaAberto(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleConfirmarEntrega} className="bg-green-600 hover:bg-green-700">
                            Confirmar Entrega
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={dialogRetornoAberto} onOpenChange={setDialogRetornoAberto}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="flex items-center gap-1">
                          <X className="h-4 w-4" />
                          Confirmar Retorno
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirmar Retorno</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Confirmar retorno para <strong>{pedido.cliente_nome}</strong>?</p>
                          <Textarea 
                            placeholder="Motivo do retorno (opcional)" 
                            value={observacaoRetorno} 
                            onChange={(e) => setObservacaoRetorno(e.target.value)} 
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogRetornoAberto(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleConfirmarRetorno} variant="destructive">
                            Confirmar Retorno
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                {/* Botão de reagendar para pedidos atrasados */}
                {showReagendarButton && (
                  <Button size="sm" variant="outline" onClick={onEditarAgendamento} className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Reagendar
                  </Button>
                )}

                <Button size="sm" variant="outline" onClick={onRetornarParaSeparacao} className="flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Retornar p/ Separação
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
