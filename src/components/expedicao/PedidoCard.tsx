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
import ProdutosList from "./ProdutosList";
import ComposicaoPedido from "./ComposicaoPedido";
import { useConfirmacaoEntrega } from "@/hooks/useConfirmacaoEntrega";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";

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
  showProdutosList?: boolean;
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
  showProdutosList = false,
  onConfirmarDespacho,
  onConfirmarEntrega,
  onConfirmarRetorno,
  onRetornarParaSeparacao
}: PedidoCardProps) => {
  const [observacaoEntrega, setObservacaoEntrega] = useState("");
  const [observacaoRetorno, setObservacaoRetorno] = useState("");
  const [dialogEntregaAberto, setDialogEntregaAberto] = useState(false);
  const [dialogRetornoAberto, setDialogRetornoAberto] = useState(false);
  
  // FASE 5: Estado local de loading para cada operação
  const [loadingRetorno, setLoadingRetorno] = useState(false);
  const [loadingSeparacao, setLoadingSeparacao] = useState(false);
  const [loadingDespacho, setLoadingDespacho] = useState(false);
  
  const { confirmarEntrega, loading: loadingConfirmacao } = useConfirmacaoEntrega();
  
  // FASE 5: Usar store para verificar operações em andamento
  const isOperationInProgress = useExpedicaoStore(state => state.isOperationInProgress);
  const retornarParaSeparacao = useExpedicaoStore(state => state.retornarParaSeparacao);

  const handleConfirmarEntrega = async () => {
    try {
      const sucesso = await confirmarEntrega(pedido, observacaoEntrega);
      if (sucesso) {
        setDialogEntregaAberto(false);
        setObservacaoEntrega("");
        if (onConfirmarEntrega) {
          onConfirmarEntrega(observacaoEntrega);
        }
      }
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
    }
  };

  const handleConfirmarRetorno = async () => {
    // FASE 5: Proteção local de loading
    if (loadingRetorno) return;
    
    setLoadingRetorno(true);
    try {
      if (onConfirmarRetorno) {
        await onConfirmarRetorno(observacaoRetorno);
        setDialogRetornoAberto(false);
        setObservacaoRetorno("");
      }
    } catch (error) {
      console.error('Erro ao confirmar retorno:', error);
    } finally {
      setLoadingRetorno(false);
    }
  };

  // FASE 5: Handler para retornar à separação com proteções
  const handleRetornarParaSeparacao = async () => {
    // FASE 5: Múltiplas proteções para evitar cliques duplos
    if (loadingRetorno || isOperationInProgress(pedido.id)) {
      console.log(`⚠️ Operação já em andamento para pedido ${pedido.id} - IGNORANDO CLIQUE`);
      return;
    }
    
    setLoadingRetorno(true);
    console.log(`🔄 Iniciando retorno para separação: ${pedido.id}`);
    
    try {
      // FASE 5: Usar função direta do store com timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na operação')), 10000)
      );
      
      await Promise.race([
        retornarParaSeparacao(pedido.id),
        timeoutPromise
      ]);
      
      console.log(`✅ Sucesso no retorno para separação: ${pedido.id}`);
      
      // Chamar callback se existir
      if (onRetornarParaSeparacao) {
        onRetornarParaSeparacao();
      }
    } catch (error) {
      console.error(`❌ Erro no retorno para separação ${pedido.id}:`, error);
    } finally {
      setLoadingRetorno(false);
      console.log(`🏁 Finalizando operação de retorno: ${pedido.id}`);
    }
  };

  // FASE 5: Handler para separação com proteções
  const handleMarcarSeparado = async () => {
    if (loadingSeparacao || isOperationInProgress(pedido.id)) return;
    
    setLoadingSeparacao(true);
    try {
      if (onMarcarSeparado) {
        await onMarcarSeparado();
      }
    } finally {
      setLoadingSeparacao(false);
    }
  };

  // FASE 5: Handler para despacho com proteções
  const handleConfirmarDespacho = async () => {
    if (loadingDespacho || isOperationInProgress(pedido.id)) return;
    
    setLoadingDespacho(true);
    try {
      if (onConfirmarDespacho) {
        await onConfirmarDespacho();
      }
    } finally {
      setLoadingDespacho(false);
    }
  };

  // FASE 5: Verificar se qualquer operação está em andamento
  const isAnyOperationInProgress = loadingRetorno || loadingSeparacao || loadingDespacho || 
                                   isOperationInProgress(pedido.id) || loadingConfirmacao;

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
            {/* FASE 5: Indicador visual de operação em andamento */}
            {isAnyOperationInProgress && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Processando...
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

        {showDespachoActions && (
          <ComposicaoPedido pedido={pedido} />
        )}

        {showProdutosList && (
          <ProdutosList pedido={pedido} />
        )}

        {!showProdutosList && !showDespachoActions && pedido.itens_personalizados && pedido.itens_personalizados.length > 0 && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-800 mb-2">Itens Personalizados:</h4>
            <div className="space-y-1">
              {pedido.itens_personalizados.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm text-amber-700">
                  <ProdutoNomeDisplay produtoId={item.produto_id || 'custom'} nomeFallback={item.produto || item.nome} />
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
                  onClick={handleMarcarSeparado}
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isAnyOperationInProgress}
                >
                  {loadingSeparacao ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar Separado
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {showDespachoActions && (
            <>
              {pedido.substatus_pedido === 'Separado' && (
                <Button 
                  onClick={handleConfirmarDespacho}
                  size="sm" 
                  variant="outline"
                  disabled={isAnyOperationInProgress}
                >
                  {loadingDespacho ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-1" />
                      Confirmar Despacho
                    </>
                  )}
                </Button>
              )}

              {pedido.substatus_pedido === 'Despachado' && (
                <>
                  <Dialog open={dialogEntregaAberto} onOpenChange={setDialogEntregaAberto}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isAnyOperationInProgress}
                      >
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
                            disabled={loadingConfirmacao}
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
                      <Button 
                        size="sm" 
                        variant="destructive"
                        disabled={isAnyOperationInProgress}
                      >
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
                            disabled={loadingRetorno}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDialogRetornoAberto(false);
                              setObservacaoRetorno("");
                            }}
                            disabled={loadingRetorno}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleConfirmarRetorno}
                            variant="destructive"
                            disabled={loadingRetorno}
                          >
                            {loadingRetorno ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Confirmar Retorno
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* FASE 5: Botão crítico com todas as proteções */}
                  <Button 
                    onClick={handleRetornarParaSeparacao}
                    size="sm" 
                    variant="outline"
                    disabled={isAnyOperationInProgress}
                    className={isAnyOperationInProgress ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {loadingRetorno ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Retornar p/ Separação
                      </>
                    )}
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
              disabled={isAnyOperationInProgress}
            >
              Reagendar
            </Button>
          )}

          <Button 
            onClick={onEditarAgendamento}
            size="sm" 
            variant="outline"
            disabled={isAnyOperationInProgress}
          >
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PedidoCard;
