import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, AlertCircle, CheckCheck, Edit } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import TipoPedidoBadge from "@/components/expedicao/TipoPedidoBadge";
import AgendamentoEditModal from "./AgendamentoEditModal";
export default function AgendamentoDashboard() {
  const {
    agendamentos,
    carregarTodosAgendamentos,
    obterAgendamento,
    salvarAgendamento
  } = useAgendamentoClienteStore();
  const {
    clientes,
    carregarClientes
  } = useClienteStore();
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      if (agendamentos.length === 0 && !isLoading) {
        setIsLoading(true);
        try {
          await carregarTodosAgendamentos();
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData();
  }, []); // Empty dependency array to run only once

  // Calcular indicadores da semana
  const indicadoresSemana = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, {
      weekStartsOn: 1
    });
    const fimSemana = endOfWeek(hoje, {
      weekStartsOn: 1
    });
    const agendamentosSemana = agendamentos.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
    });
    const previstos = agendamentosSemana.filter(a => a.statusAgendamento === "Previsto");
    const confirmados = agendamentosSemana.filter(a => a.statusAgendamento === "Agendado");
    const clientesComAgendamento = new Set(agendamentos.map(a => a.cliente.id));
    const clientesSemAgendamento = clientes.filter(c => c.ativo && !clientesComAgendamento.has(c.id));
    return {
      totalSemana: agendamentosSemana.length,
      previstos: previstos.length,
      confirmados: confirmados.length,
      pendentes: clientesSemAgendamento.length,
      taxaConfirmacao: agendamentosSemana.length > 0 ? confirmados.length / agendamentosSemana.length * 100 : 0
    };
  }, [agendamentos, clientes]);

  // Dados para os gráficos
  const dadosGraficoStatus = useMemo(() => {
    const contadores = agendamentos.reduce((acc, agendamento) => {
      const status = agendamento.statusAgendamento;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(contadores).map(([status, count]) => ({
      status,
      quantidade: count
    }));
  }, [agendamentos]);
  const dadosGraficoSemanal = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, {
      weekStartsOn: 1
    });
    const fimSemana = endOfWeek(hoje, {
      weekStartsOn: 1
    });
    const diasSemana = eachDayOfInterval({
      start: inicioSemana,
      end: fimSemana
    });
    return diasSemana.map(dia => {
      const agendamentosDia = agendamentos.filter(agendamento => isSameDay(new Date(agendamento.dataReposicao), dia));
      const previstos = agendamentosDia.filter(a => a.statusAgendamento === "Previsto").length;
      const confirmados = agendamentosDia.filter(a => a.statusAgendamento === "Agendado").length;
      return {
        dia: format(dia, 'dd/MM', {
          locale: ptBR
        }),
        diaSemana: format(dia, 'EEEE', {
          locale: ptBR
        }),
        previstos,
        confirmados,
        total: previstos + confirmados,
        isToday: isToday(dia),
        dataCompleta: dia
      };
    });
  }, [agendamentos]);

  // Agendamentos do dia selecionado com ordenação
  const agendamentosDiaSelecionado = useMemo(() => {
    if (!diaSelecionado) return [];
    const agendamentosFiltered = agendamentos.filter(agendamento => isSameDay(new Date(agendamento.dataReposicao), diaSelecionado));

    // Ordenar: Agendados primeiro, depois Previstos
    return agendamentosFiltered.sort((a, b) => {
      if (a.statusAgendamento === "Agendado" && b.statusAgendamento === "Previsto") return -1;
      if (a.statusAgendamento === "Previsto" && b.statusAgendamento === "Agendado") return 1;
      return 0;
    });
  }, [agendamentos, diaSelecionado]);
  const coresPieChart = ['#10B981', '#F59E0B', '#EF4444'];
  const handleDiaClick = (dataCompleta: Date) => {
    setDiaSelecionado(dataCompleta);
  };
  const handleEditarAgendamento = (agendamento: any) => {
    setSelectedAgendamento(agendamento);
    setModalOpen(true);
  };
  const handleSalvarAgendamento = (agendamentoAtualizado: any) => {
    carregarTodosAgendamentos();
  };
  const handleConfirmarAgendamento = async (agendamento: any) => {
    try {
      console.log('AgendamentoDashboard: Confirmando agendamento previsto para cliente:', agendamento.cliente.nome);
      const agendamentoAtual = await obterAgendamento(agendamento.cliente.id);
      if (agendamentoAtual) {
        console.log('✅ Preservando dados do agendamento:', {
          tipo: agendamentoAtual.tipo_pedido,
          itens: !!agendamentoAtual.itens_personalizados,
          quantidade: agendamentoAtual.quantidade_total,
          data_atual: agendamentoAtual.data_proxima_reposicao
        });

        // Alterar apenas o status para "Agendado", preservando todos os outros dados
        await salvarAgendamento(agendamento.cliente.id, {
          status_agendamento: 'Agendado',
          // Preservar TODOS os dados existentes sem alteração
          data_proxima_reposicao: agendamentoAtual.data_proxima_reposicao,
          quantidade_total: agendamentoAtual.quantidade_total,
          tipo_pedido: agendamentoAtual.tipo_pedido,
          itens_personalizados: agendamentoAtual.itens_personalizados
        });
        console.log('✅ Agendamento confirmado (Previsto → Agendado)');
      }
      await carregarTodosAgendamentos();
      await carregarClientes();
      toast({
        title: "Sucesso",
        description: `Agendamento confirmado para ${agendamento.cliente.nome}`
      });
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar agendamento",
        variant: "destructive"
      });
    }
  };
  return <div className="space-y-6">
      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadoresSemana.totalSemana}</div>
            <p className="text-xs text-muted-foreground">Total de agendamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{indicadoresSemana.confirmados}</div>
            <p className="text-xs text-muted-foreground">Agendamentos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previstos</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{indicadoresSemana.previstos}</div>
            <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{indicadoresSemana.pendentes}</div>
            <p className="text-xs text-muted-foreground">Sem agendamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Visão geral dos agendamentos por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dadosGraficoStatus} cx="50%" cy="50%" labelLine={false} label={({
                  status,
                  quantidade
                }) => `${status}: ${quantidade}`} outerRadius={80} fill="#8884d8" dataKey="quantidade">
                    {dadosGraficoStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={coresPieChart[index % coresPieChart.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos por Dia da Semana</CardTitle>
            <CardDescription>Distribuição dos agendamentos ao longo da semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="previstos" stackId="a" fill="#F59E0B" name="Previstos" />
                  <Bar dataKey="confirmados" stackId="a" fill="#10B981" name="Confirmados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendário Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Calendário Semanal</CardTitle>
          <CardDescription className="text-left">Visão dos agendamentos por dia da semana atual - Clique em um dia para ver os detalhes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {dadosGraficoSemanal.map((dia, index) => <div key={index} className={`p-4 border rounded-lg text-center cursor-pointer transition-colors hover:bg-muted/50 ${dia.isToday ? 'border-primary bg-primary/10' : diaSelecionado && isSameDay(dia.dataCompleta, diaSelecionado) ? 'border-primary bg-primary/20' : 'border-border'}`} onClick={() => handleDiaClick(dia.dataCompleta)}>
                <div className="font-medium text-sm mb-2">{dia.diaSemana}</div>
                <div className="text-lg font-bold mb-1">{dia.dia}</div>
                
                <div className="space-y-1">
                  {dia.previstos > 0 && <Badge variant="outline" className="text-xs w-full bg-amber-100 rounded-none">
                      {dia.previstos} Previstos
                    </Badge>}
                  {dia.confirmados > 0 && <Badge variant="default" className="text-xs w-full bg-green-500">
                      {dia.confirmados} Confirmados
                    </Badge>}
                  {dia.total === 0 && <span className="text-xs text-muted-foreground">Livre</span>}
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Agendamentos do Dia Selecionado */}
      {diaSelecionado && <Card>
          <CardHeader>
            <CardTitle>Agendamentos para {format(diaSelecionado, "dd 'de' MMMM 'de' yyyy", {
            locale: ptBR
          })}</CardTitle>
            <CardDescription className="text-left">
              {agendamentosDiaSelecionado.length === 0 ? "Nenhum agendamento encontrado para este dia" : `${agendamentosDiaSelecionado.length} agendamento(s) encontrado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agendamentosDiaSelecionado.length > 0 ? <div className="space-y-3">
                {agendamentosDiaSelecionado.map(agendamento => <div key={agendamento.cliente.id} className={`flex items-center justify-between p-3 border rounded-lg ${agendamento.statusAgendamento === "Agendado" ? "bg-green-50" : "bg-yellow-50"}`}>
                    <div className="flex-1">
                      <div className="font-medium">{agendamento.cliente.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        Quantidade: {agendamento.cliente.quantidadePadrao} unidades
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
                      <Badge variant={agendamento.statusAgendamento === "Agendado" ? "default" : agendamento.statusAgendamento === "Previsto" ? "outline" : "secondary"}>
                        {agendamento.statusAgendamento}
                      </Badge>
                      <div className="flex gap-1">
                        {agendamento.statusAgendamento === "Previsto" && <Button variant="default" size="sm" onClick={() => handleConfirmarAgendamento(agendamento)} className="bg-green-500 hover:bg-green-600 h-8 px-2">
                            <CheckCheck className="h-3 w-3" />
                          </Button>}
                        <Button variant="secondary" size="sm" onClick={() => handleEditarAgendamento(agendamento)} className="h-8 px-2">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>)}
              </div> : <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento para este dia
              </div>}
          </CardContent>
        </Card>}

      <AgendamentoEditModal open={modalOpen} onOpenChange={setModalOpen} agendamento={selectedAgendamento} onSalvar={handleSalvarAgendamento} />
    </div>;
}