
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Phone, User, Package, ArrowLeft, CheckCircle2, XCircle, Truck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TipoPedidoBadge from "./TipoPedidoBadge";
import ProdutoNomeDisplay from "./ProdutoNomeDisplay";
import { useConfirmacaoEntrega } from "@/hooks/useConfirmacaoEntrega";

interface PedidoCardProps {
  pedido: {
    id: string;
    cliente_id: string;
    cliente_nome: string;
    cliente_endereco?: string;
    cliente_telefone?: string;
    link_google_maps?: string;
    data_prevista_entrega: Date;
    quantidade_total: number;
    tipo_pedido: string;
    substatus_pedido?: string;
    itens_personalizados?: any;
  };
  onMarcarSeparado?: () => void;
  onEditarAgendamento?: () => void;
  showDespachoActions?: boolean;
  showReagendarButton?: boolean;
  onConfirmarDespacho?: () => void;
  onConfirmarEntrega?: (observacao?: string) => void;
  onConfirmarRetorno?: (observacao?: string) => void;
  onRetornarParaSeparacao?: () => void;
}

const PedidoCard = ({
  pedido,
  onMarcarSeparado,
  onEditarAgendamento,
  showDespachoActions = false,
  showReagendarButton = false,
  onConfirmarDespacho,
  onConfirmarEntrega,
  onConfirmarRetorno,
  onRetornarParaSeparacao
}: PedidoCardProps) => {
  const [observacaoEntrega, setObservacaoEntrega] = useState("");
  const [observacaoRetorno, setObservacaoRetorno] = useState("");
  const [dialogEntregaAberto, setDialogEntregaAberto] = useState(false);
  const [dialogRetornoAberto, setDialogRetornoAberto] = useState(false);
  
  const { confirmarEntrega, loading: loadingConfirmacao } = useConfirmacaoEntrega();

  const handleConfirmarEntrega = async () => {
    try {
      const sucesso = await confirmarEntrega(pedido, observacaoEntrega);
      if (sucesso) {
        setDialogEntregaAberto(false);
        setObservacaoEntrega("");
        // Chamar callback se existir para atualizar o estado do componente pai
        if (onConfirmarEntrega) {
          onConfirmarEntrega(observacaoEntrega);
        }
      }
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
    }
  };

  const handleConfirmarRetorno = () => {
    if (onConfirmarRetorno) {
      onConfirmarRetorno(observacaoRetorno);
      setDialogRetornoAberto(false);
      setObservacaoRetorno("");
    }
  };

  return (
    <Card className="mb-4 shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{pedido.cliente_nome}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(pedido.data_prevista_entrega, "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {pedido.quantidade_total} unidades
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TipoPedidoBadge tipo={pedido.tipo_pedido} />
            {pedido.substatus_pedido && (
              <Badge 
                variant={
                  pedido.substatus_pedido === 'Separado' ? 'default' :
                  pedido.substatus_pedido === 'Despachado' ? 'secondary' :
                  'outline'
                }
              >
                {pedido.substatus_pedido}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {pedido.cliente_endereco && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{pedido.cliente_endereco}</span>
          </div>
        )}

        {pedido.cliente_telefone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{pedido.cliente_telefone}</span>
          </div>
        )}

        {pedido.itens_personalizados && pedido.itens_personalizados.length > 0 && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-800 mb-2">Itens Personalizados:</h4>
            <div className="space-y-1">
              {pedido.itens_personalizados.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm text-amber-700">
                  <ProdutoNomeDisplay nome={item.produto || item.nome} />
                  <span className="font-medium">{item.quantidade}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {!showDespachoActions && (
            <>
              {(!pedido.substatus_pedido || pedido.substatus_pedido === 'Agendado') && (
                <Button 
                  onClick={onMarcarSeparado}
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Marcar Separado
                </Button>
              )}
            </>
          )}

          {showDespachoActions && (
            <>
              {pedido.substatus_pedido === 'Separado' && (
                <Button 
                  onClick={onConfirmarDespacho}
                  size="sm" 
                  variant="outline"
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Confirmar Despacho
                </Button>
              )}

              {pedido.substatus_pedido === 'Despachado' && (
                <>
                  <Dialog open={dialogEntregaAberto} onOpenChange={setDialogEntregaAberto}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Confirmar Entrega
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Entrega - {pedido.cliente_nome}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Tem certeza que deseja confirmar a entrega? Esta ação irá:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Validar se há estoque suficiente dos produtos</li>
                          <li>Dar baixa automática no estoque</li>
                          <li>Registrar no histórico de entregas</li>
                          <li>Reagendar automaticamente para próxima entrega</li>
                        </ul>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observação (opcional):
                          </label>
                          <Textarea
                            value={observacaoEntrega}
                            onChange={(e) => setObservacaoEntrega(e.target.value)}
                            placeholder="Digite uma observação sobre a entrega..."
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDialogEntregaAberto(false);
                              setObservacaoEntrega("");
                            }}
                            disabled={loadingConfirmacao}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleConfirmarEntrega}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={loadingConfirmacao}
                          >
                            {loadingConfirmacao ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Confirmando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirmar Entrega
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={dialogRetornoAberto} onOpenChange={setDialogRetornoAberto}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <XCircle className="h-4 w-4 mr-1" />
                        Confirmar Retorno
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Retorno - {pedido.cliente_nome}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Tem certeza que deseja confirmar o retorno? O pedido será reagendado para o próximo dia útil.
                        </p>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo do retorno:
                          </label>
                          <Textarea
                            value={observacaoRetorno}
                            onChange={(e) => setObservacaoRetorno(e.target.value)}
                            placeholder="Digite o motivo do retorno..."
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDialogRetornoAberto(false);
                              setObservacaoRetorno("");
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleConfirmarRetorno}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Confirmar Retorno
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    onClick={onRetornarParaSeparacao}
                    size="sm" 
                    variant="outline"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retornar p/ Separação
                  </Button>
                </>
              )}
            </>
          )}

          {showReagendarButton && (
            <Button 
              onClick={onEditarAgendamento}
              size="sm" 
              variant="outline"
            >
              Reagendar
            </Button>
          )}

          <Button 
            onClick={onEditarAgendamento}
            size="sm" 
            variant="outline"
          >
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PedidoCard;
