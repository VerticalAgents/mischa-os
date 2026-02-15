
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Check, Clock, AlertTriangle } from "lucide-react";
import { PEDIDO_MINIMO_UNIDADES } from "@/utils/constants";

export default function ConfirmacaoReposicaoTab() {
  const { clientes } = useClienteStore();
  const { salvarAgendamento } = useAgendamentoClienteStore();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Filtrar clientes que precisam de confirmação hoje
  const clientesParaConfirmacao = clientes.filter(cliente => {
    if (cliente.statusCliente !== "Ativo" || !cliente.proximaDataReposicao) return false;
    
    const dataReposicao = new Date(cliente.proximaDataReposicao);
    dataReposicao.setHours(0, 0, 0, 0);
    
    // Clientes com status "Previsto" para hoje
    return cliente.statusAgendamento === "Previsto" && isSameDay(dataReposicao, hoje);
  });

  // Clientes com agendamentos atrasados
  const clientesAtrasados = clientes.filter(cliente => {
    if (cliente.statusCliente !== "Ativo" || !cliente.proximaDataReposicao) return false;
    
    const dataReposicao = new Date(cliente.proximaDataReposicao);
    dataReposicao.setHours(0, 0, 0, 0);
    
    return cliente.statusAgendamento === "Previsto" && dataReposicao < hoje;
  });

  const confirmarReposicao = async (clienteId: string) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) return;

      console.log('ConfirmacaoReposicaoTab: Confirmando reposição para cliente:', cliente.nome);
      
      await salvarAgendamento(clienteId, {
        status_agendamento: 'Agendado',
        data_proxima_reposicao: cliente.proximaDataReposicao!,
        quantidade_total: PEDIDO_MINIMO_UNIDADES,
        tipo_pedido: 'Padrão'
      });

      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);

      toast.success(`Reposição de ${cliente.nome} confirmada com sucesso!`);
    } catch (error) {
      console.error('ConfirmacaoReposicaoTab: Erro ao confirmar reposição:', error);
      toast.error("Erro ao confirmar reposição");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Confirmação de Reposições - {format(hoje, "dd/MM/yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium">Para Hoje</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{clientesParaConfirmacao.length}</div>
              <div className="text-sm text-green-600">Clientes para confirmação</div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Atrasados</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{clientesAtrasados.length}</div>
              <div className="text-sm text-amber-600">Agendamentos em atraso</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {clientesParaConfirmacao.length + clientesAtrasados.length}
              </div>
              <div className="text-sm text-blue-600">Necessitam atenção</div>
            </div>
          </div>

          {clientesParaConfirmacao.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-green-700">
                Clientes para Confirmação Hoje ({clientesParaConfirmacao.length})
              </h3>
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
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{PEDIDO_MINIMO_UNIDADES}</TableCell>
                      <TableCell>
                        {cliente.proximaDataReposicao ? 
                          format(cliente.proximaDataReposicao, "dd/MM/yyyy", { locale: ptBR }) : 
                          "—"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Previsto</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => confirmarReposicao(cliente.id)}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Confirmar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {clientesAtrasados.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-amber-700">
                Agendamentos Atrasados ({clientesAtrasados.length})
              </h3>
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
                  {clientesAtrasados.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{PEDIDO_MINIMO_UNIDADES}</TableCell>
                      <TableCell>
                        <span className="text-amber-600 font-medium">
                          {cliente.proximaDataReposicao ? 
                            format(cliente.proximaDataReposicao, "dd/MM/yyyy", { locale: ptBR }) : 
                            "—"
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">Atrasado</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => confirmarReposicao(cliente.id)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Confirmar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {clientesParaConfirmacao.length === 0 && clientesAtrasados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Tudo em dia!</h3>
              <p>Não há clientes pendentes de confirmação para hoje.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
