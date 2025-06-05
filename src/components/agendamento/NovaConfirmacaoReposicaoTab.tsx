
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConfirmacaoReposicaoStore } from "@/hooks/useConfirmacaoReposicaoStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, RotateCcw, AlertTriangle, Clock, MessageSquare } from "lucide-react";
import StatusConfirmacaoBadge from "./StatusConfirmacaoBadge";
import { TipoPedidoBadge } from "@/components/expedicao/TipoPedidoBadge";

export default function NovaConfirmacaoReposicaoTab() {
  const { 
    clientesParaConfirmacao, 
    loading, 
    carregarClientesParaConfirmacao,
    confirmarReposicao,
    reenviarContato,
    marcarNaoRespondeu
  } = useConfirmacaoReposicaoStore();

  useEffect(() => {
    carregarClientesParaConfirmacao();
  }, [carregarClientesParaConfirmacao]);

  // Calcular estatísticas
  const hoje = new Date();
  const paraHoje = clientesParaConfirmacao.filter(cliente => 
    cliente.status_contato !== 'confirmado'
  ).length;
  
  const atrasados = clientesParaConfirmacao.filter(cliente => 
    cliente.em_atraso && cliente.status_contato !== 'confirmado'
  ).length;
  
  const total = paraHoje + atrasados;

  const handleConfirmar = async (clienteId: string) => {
    try {
      await confirmarReposicao(clienteId);
    } catch (error) {
      console.error('Erro ao confirmar:', error);
    }
  };

  const handleReenviar = async (clienteId: string) => {
    try {
      await reenviarContato(clienteId);
    } catch (error) {
      console.error('Erro ao reenviar:', error);
    }
  };

  const handleNaoRespondeu = async (clienteId: string) => {
    try {
      await marcarNaoRespondeu(clienteId);
    } catch (error) {
      console.error('Erro ao marcar não respondeu:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Carregando confirmações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Confirmação de Reposições - {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Cards Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span className="font-medium">Para Hoje</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{paraHoje}</div>
              <div className="text-sm text-green-600">Clientes para confirmação</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium">Atrasados</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{atrasados}</div>
              <div className="text-sm text-red-600">Sem resposta após 48h</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{total}</div>
              <div className="text-sm text-blue-600">Necessitam atenção</div>
            </div>
          </div>

          {/* Tabela Principal */}
          {clientesParaConfirmacao.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Tipo Pedido</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Último Contato</TableHead>
                  <TableHead>Status Confirmação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesParaConfirmacao.map((cliente) => (
                  <TableRow 
                    key={cliente.id}
                    className={cliente.em_atraso ? 'bg-red-50' : ''}
                  >
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>
                      {format(cliente.data_proxima_reposicao, "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <TipoPedidoBadge tipo={cliente.tipo_pedido} />
                    </TableCell>
                    <TableCell>{cliente.quantidade_total} un</TableCell>
                    <TableCell>
                      {cliente.ultimo_contato_em ? (
                        <div className="text-sm">
                          <div>{format(cliente.ultimo_contato_em, "dd/MM/yyyy", { locale: ptBR })}</div>
                          <div className="text-muted-foreground">
                            {format(cliente.ultimo_contato_em, "HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusConfirmacaoBadge status={cliente.status_contato} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {cliente.status_contato !== 'confirmado' && (
                          <Button
                            onClick={() => handleConfirmar(cliente.id)}
                            size="sm"
                            className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
                          >
                            <Check className="h-4 w-4" />
                            Confirmar
                          </Button>
                        )}
                        
                        {cliente.pode_reenviar && cliente.status_contato !== 'confirmado' && (
                          <Button
                            onClick={() => handleReenviar(cliente.id)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reenviar
                          </Button>
                        )}
                        
                        {cliente.em_atraso && cliente.status_contato !== 'confirmado' && cliente.status_contato !== 'nao_respondeu' && (
                          <Button
                            onClick={() => handleNaoRespondeu(cliente.id)}
                            size="sm"
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Não respondeu
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma confirmação pendente!</h3>
              <p>Não há clientes que precisam de confirmação para os próximos dias.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
