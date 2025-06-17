
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { addBusinessDays, subBusinessDays, format, isWeekend, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Check, Clock, AlertTriangle, Calendar } from "lucide-react";

export default function ConfirmacaoReposicaoFuncional() {
  const { clientes } = useClienteStore();
  const { salvarAgendamento } = useAgendamentoClienteStore();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Calcular data para confirmações (2 dias úteis à frente)
  const dataConfirmacao = addBusinessDays(hoje, 2);

  // Função para obter próximo dia útil
  const getProximoDiaUtil = (data: Date): Date => {
    let proximaData = new Date(data);
    while (isWeekend(proximaData)) {
      proximaData = addDays(proximaData, 1);
    }
    return proximaData;
  };

  // Clientes que precisam de confirmação (previstos para daqui 2 dias úteis)
  const clientesParaConfirmacao = clientes.filter(cliente => {
    if (cliente.statusCliente !== "Ativo" || !cliente.proximaDataReposicao) return false;
    
    const dataReposicao = new Date(cliente.proximaDataReposicao);
    dataReposicao.setHours(0, 0, 0, 0);
    
    return cliente.statusAgendamento === "Previsto" && 
           dataReposicao.getTime() === dataConfirmacao.getTime();
  });

  // Clientes com confirmação atrasada (previstos para antes de hoje)
  const clientesConfirmacaoAtrasada = clientes.filter(cliente => {
    if (cliente.statusCliente !== "Ativo" || !cliente.proximaDataReposicao) return false;
    
    const dataReposicao = new Date(cliente.proximaDataReposicao);
    dataReposicao.setHours(0, 0, 0, 0);
    
    return cliente.statusAgendamento === "Previsto" && dataReposicao < hoje;
  });

  const confirmarReposicao = async (clienteId: string) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) return;

      console.log('Confirmando reposição para cliente:', cliente.nome);
      
      await salvarAgendamento(clienteId, {
        status_agendamento: 'Agendado',
        data_proxima_reposicao: cliente.proximaDataReposicao!,
        quantidade_total: cliente.quantidadePadrao || 0,
        tipo_pedido: 'Padrão'
      });

      setRefreshTrigger(prev => prev + 1);
      toast.success(`Reposição de ${cliente.nome} confirmada com sucesso!`);
    } catch (error) {
      console.error('Erro ao confirmar reposição:', error);
      toast.error("Erro ao confirmar reposição");
    }
  };

  const reagendarParaHoje = async (clienteId: string) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) return;

      // Determinar próximo dia útil (hoje se for dia útil, senão próximo dia útil)
      const proximoDiaUtil = getProximoDiaUtil(hoje);

      console.log('Reagendando para cliente:', cliente.nome, 'para:', proximoDiaUtil);
      
      await salvarAgendamento(clienteId, {
        status_agendamento: 'Previsto',
        data_proxima_reposicao: proximoDiaUtil,
        quantidade_total: cliente.quantidadePadrao || 0,
        tipo_pedido: 'Padrão'
      });

      setRefreshTrigger(prev => prev + 1);
      toast.success(`${cliente.nome} reagendado para ${format(proximoDiaUtil, "dd/MM/yyyy", { locale: ptBR })}`);
    } catch (error) {
      console.error('Erro ao reagendar:', error);
      toast.error("Erro ao reagendar");
    }
  };

  const reagendarTodosAtrasados = async () => {
    try {
      const proximoDiaUtil = getProximoDiaUtil(hoje);
      
      for (const cliente of clientesConfirmacaoAtrasada) {
        await salvarAgendamento(cliente.id, {
          status_agendamento: 'Previsto',
          data_proxima_reposicao: proximoDiaUtil,
          quantidade_total: cliente.quantidadePadrao || 0,
          tipo_pedido: 'Padrão'
        });
      }

      setRefreshTrigger(prev => prev + 1);
      toast.success(`${clientesConfirmacaoAtrasada.length} clientes reagendados para ${format(proximoDiaUtil, "dd/MM/yyyy", { locale: ptBR })}`);
    } catch (error) {
      console.error('Erro ao reagendar todos:', error);
      toast.error("Erro ao reagendar todos os clientes");
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Para Confirmar</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{clientesParaConfirmacao.length}</div>
          <div className="text-sm text-blue-600">
            Para {format(dataConfirmacao, "dd/MM/yyyy", { locale: ptBR })}
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium">Confirmação Atrasada</span>
          </div>
          <div className="text-2xl font-bold text-red-700">{clientesConfirmacaoAtrasada.length}</div>
          <div className="text-sm text-red-600">Necessitam reagendamento</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="font-medium">Total</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {clientesParaConfirmacao.length + clientesConfirmacaoAtrasada.length}
          </div>
          <div className="text-sm text-green-600">Requerem atenção</div>
        </div>
      </div>

      {/* Bloco 1: Clientes para Confirmação */}
      {clientesParaConfirmacao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Confirmações Necessárias - {format(dataConfirmacao, "dd/MM/yyyy", { locale: ptBR })}
              <Badge variant="secondary">{clientesParaConfirmacao.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesParaConfirmacao.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.quantidadePadrao}</TableCell>
                    <TableCell>
                      {cliente.proximaDataReposicao ? 
                        format(cliente.proximaDataReposicao, "dd/MM/yyyy", { locale: ptBR }) : 
                        "—"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-200 text-blue-700">Previsto</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        onClick={() => confirmarReposicao(cliente.id)}
                        size="sm"
                        className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
                      >
                        <Check className="h-4 w-4" />
                        Confirmar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Bloco 2: Confirmações Atrasadas */}
      {clientesConfirmacaoAtrasada.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmações Atrasadas
              <Badge variant="destructive">{clientesConfirmacaoAtrasada.length}</Badge>
            </CardTitle>
            <Button 
              onClick={reagendarTodosAtrasados}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              Reagendar Todos para Hoje
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Dias de Atraso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesConfirmacaoAtrasada.map((cliente) => {
                  const diasAtraso = cliente.proximaDataReposicao ? 
                    Math.floor((hoje.getTime() - new Date(cliente.proximaDataReposicao).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  
                  return (
                    <TableRow key={cliente.id} className="hover:bg-red-50">
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.quantidadePadrao}</TableCell>
                      <TableCell>
                        <span className="text-red-600 font-medium">
                          {cliente.proximaDataReposicao ? 
                            format(cliente.proximaDataReposicao, "dd/MM/yyyy", { locale: ptBR }) : 
                            "—"
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{diasAtraso} dias</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            onClick={() => reagendarParaHoje(cliente.id)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Calendar className="h-4 w-4" />
                            Reagendar
                          </Button>
                          <Button 
                            onClick={() => confirmarReposicao(cliente.id)}
                            size="sm"
                            className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
                          >
                            <Check className="h-4 w-4" />
                            Confirmar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Estado Vazio */}
      {clientesParaConfirmacao.length === 0 && clientesConfirmacaoAtrasada.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Tudo em dia!</h3>
              <p>Não há confirmações pendentes ou atrasadas no momento.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
