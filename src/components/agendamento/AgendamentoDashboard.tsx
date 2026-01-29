import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, CheckCircle, AlertCircle, CheckCheck, Edit, ChevronLeft, ChevronRight, FileDown, Truck, Package, CalendarDays, Filter } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useToast } from "@/hooks/use-toast";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import TipoPedidoBadge from "@/components/expedicao/TipoPedidoBadge";
import AgendamentoEditModal from "./AgendamentoEditModal";
import ReagendamentoEmMassaDialog from "./ReagendamentoEmMassaDialog";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useSupabaseRotasEntrega } from "@/hooks/useSupabaseRotasEntrega";
import jsPDF from 'jspdf';
import QuantidadesProdutosSemanal from "./QuantidadesProdutosSemanal";
import EntregasRealizadasSemanal from "./EntregasRealizadasSemanal";
import { RepresentantesFilter } from "@/components/expedicao/components/RepresentantesFilter";
import { RotasFilter } from "./RotasFilter";

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
  const { representantes } = useSupabaseRepresentantes();
  const { rotasEntrega } = useSupabaseRotasEntrega();
  const { registros: entregasHistorico, carregarHistorico: carregarHistoricoEntregas } = useHistoricoEntregasStore();
  const [isLoading, setIsLoading] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [semanaAtual, setSemanaAtual] = useState<Date>(new Date());
  const [representanteFiltro, setRepresentanteFiltro] = useState<number[]>([]);
  const [rotaFiltro, setRotaFiltro] = useState<number[]>([]);
  const [agendamentosSelecionados, setAgendamentosSelecionados] = useState<Set<string>>(new Set());
  const [modalReagendarAberto, setModalReagendarAberto] = useState(false);
  const [modoGraficos, setModoGraficos] = useState<'agendamentos' | 'unidades'>('agendamentos');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Sempre carregar agendamentos e histórico de entregas na montagem
        await Promise.all([
          agendamentos.length === 0 ? carregarTodosAgendamentos() : Promise.resolve(),
          carregarHistoricoEntregas() // Sempre recarregar para ter dados atualizados
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const navegarSemanaAnterior = () => {
    setSemanaAtual(prev => subWeeks(prev, 1));
  };

  const navegarProximaSemana = () => {
    setSemanaAtual(prev => addWeeks(prev, 1));
  };

  const voltarSemanaAtual = () => {
    setSemanaAtual(new Date());
  };

  const agendamentosFiltrados = useMemo(() => {
    let filtrados = agendamentos;
    
    // Filtro por representante (multi-select)
    if (representanteFiltro.length > 0) {
      filtrados = filtrados.filter(agendamento => 
        agendamento.cliente.representanteId && 
        representanteFiltro.includes(agendamento.cliente.representanteId)
      );
    }
    
    // Filtro por rota (multi-select)
    if (rotaFiltro.length > 0) {
      filtrados = filtrados.filter(agendamento => 
        agendamento.cliente.rotaEntregaId && 
        rotaFiltro.includes(agendamento.cliente.rotaEntregaId)
      );
    }
    
    return filtrados;
  }, [agendamentos, representanteFiltro, rotaFiltro]);

  const indicadoresSemana = useMemo(() => {
    const inicioSemana = startOfWeek(semanaAtual, {
      weekStartsOn: 1
    });
    const fimSemana = endOfWeek(semanaAtual, {
      weekStartsOn: 1
    });
    const agendamentosSemana = agendamentosFiltrados.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
    });
    const previstos = agendamentosSemana.filter(a => a.statusAgendamento === "Previsto");
    const confirmados = agendamentosSemana.filter(a => a.statusAgendamento === "Agendado");
    
    // Calcular entregas realizadas na semana (apenas tipo 'entrega', não 'retorno')
    const entregasRealizadas = entregasHistorico.filter(entrega => {
      const dataEntrega = new Date(entrega.data);
      return dataEntrega >= inicioSemana && dataEntrega <= fimSemana && entrega.tipo === 'entrega';
    });
    
    return {
      totalSemana: agendamentosSemana.length,
      previstos: previstos.length,
      confirmados: confirmados.length,
      entregasRealizadas: entregasRealizadas.length,
      taxaConfirmacao: agendamentosSemana.length > 0 ? confirmados.length / agendamentosSemana.length * 100 : 0
    };
  }, [agendamentosFiltrados, semanaAtual, representanteFiltro, entregasHistorico]);

  const dadosGraficoStatus = useMemo(() => {
    const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
    const agendamentosSemana = agendamentosFiltrados.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
    });
    
    // Calcular contagem, unidades e lista de clientes por status
    const contadores = agendamentosSemana.reduce((acc, agendamento) => {
      const status = agendamento.statusAgendamento;
      const unidades = agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao || 0;
      if (!acc[status]) {
        acc[status] = { quantidade: 0, unidades: 0, clientes: [] as string[] };
      }
      acc[status].quantidade += 1;
      acc[status].unidades += unidades;
      acc[status].clientes.push(agendamento.cliente.nome);
      return acc;
    }, {} as Record<string, { quantidade: number; unidades: number; clientes: string[] }>);
    
    const data = Object.entries(contadores).map(([status, valores]) => ({
      status,
      quantidade: valores.quantidade,
      unidades: valores.unidades,
      clientes: valores.clientes,
      cor: status === "Previsto" ? "#F59E0B" : status === "Agendado" ? "#10B981" : "#EF4444"
    }));
    
    // Adicionar entregas realizadas na semana
    const entregasRealizadasSemana = entregasHistorico.filter(entrega => {
      const dataEntrega = new Date(entrega.data);
      return dataEntrega >= inicioSemana && dataEntrega <= fimSemana && entrega.tipo === 'entrega';
    });
    
    if (entregasRealizadasSemana.length > 0) {
      const unidadesRealizadas = entregasRealizadasSemana.reduce((sum, e) => sum + (e.quantidade || 0), 0);
      // Buscar nomes dos clientes das entregas realizadas
      const clientesRealizadas = entregasRealizadasSemana.map(e => {
        const cliente = clientes.find(c => c.id === e.cliente_id);
        return cliente?.nome || 'Cliente';
      });
      data.push({
        status: "Realizadas",
        quantidade: entregasRealizadasSemana.length,
        unidades: unidadesRealizadas,
        clientes: clientesRealizadas,
        cor: "#3B82F6"
      });
    }
    
    return data;
  }, [agendamentosFiltrados, semanaAtual, entregasHistorico, clientes]);

  const dadosGraficoSemanal = useMemo(() => {
    const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
    const diasSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });
    
    return diasSemana.map(dia => {
      const agendamentosDia = agendamentosFiltrados.filter(agendamento => 
        isSameDay(new Date(agendamento.dataReposicao), dia)
      );
      
      const agendamentosPrevistos = agendamentosDia.filter(a => a.statusAgendamento === "Previsto");
      const agendamentosConfirmados = agendamentosDia.filter(a => a.statusAgendamento === "Agendado");
      
      // Calcular unidades
      const unidadesPrevistos = agendamentosPrevistos.reduce((sum, a) => 
        sum + (a.pedido?.totalPedidoUnidades || a.cliente.quantidadePadrao || 0), 0
      );
      const unidadesConfirmados = agendamentosConfirmados.reduce((sum, a) => 
        sum + (a.pedido?.totalPedidoUnidades || a.cliente.quantidadePadrao || 0), 0
      );
      
      // Entregas realizadas do dia
      const entregasRealizadasDia = entregasHistorico.filter(entrega => 
        isSameDay(new Date(entrega.data), dia) && entrega.tipo === 'entrega'
      );
      const unidadesRealizadas = entregasRealizadasDia.reduce((sum, e) => sum + (e.quantidade || 0), 0);
      
      // Lista de clientes
      const clientesPrevistos = agendamentosPrevistos.map(a => a.cliente.nome);
      const clientesConfirmados = agendamentosConfirmados.map(a => a.cliente.nome);
      const clientesRealizadas = entregasRealizadasDia.map(e => {
        const cliente = clientes.find(c => c.id === e.cliente_id);
        return cliente?.nome || 'Cliente';
      });
      
      return {
        dia: format(dia, 'dd/MM', { locale: ptBR }),
        diaSemana: format(dia, 'EEEE', { locale: ptBR }),
        previstos: agendamentosPrevistos.length,
        confirmados: agendamentosConfirmados.length,
        realizadas: entregasRealizadasDia.length,
        previstosUnidades: unidadesPrevistos,
        confirmadosUnidades: unidadesConfirmados,
        realizadasUnidades: unidadesRealizadas,
        clientesPrevistos,
        clientesConfirmados,
        clientesRealizadas,
        total: agendamentosPrevistos.length + agendamentosConfirmados.length,
        isToday: isToday(dia),
        dataCompleta: dia
      };
    });
  }, [agendamentosFiltrados, semanaAtual, entregasHistorico, clientes]);

  const agendamentosDiaSelecionado = useMemo(() => {
    if (!diaSelecionado) return [];
    
    // Filtrar agendamentos do dia, excluindo status "Agendar"
    const agendamentosFiltered = agendamentosFiltrados.filter(agendamento => 
      isSameDay(new Date(agendamento.dataReposicao), diaSelecionado) &&
      agendamento.statusAgendamento !== "Agendar"
    );

    // Ordenar: Agendados primeiro, depois Previstos
    return agendamentosFiltered.sort((a, b) => {
      if (a.statusAgendamento === "Agendado" && b.statusAgendamento !== "Agendado") return -1;
      if (a.statusAgendamento !== "Agendado" && b.statusAgendamento === "Agendado") return 1;
      return 0;
    });
  }, [agendamentosFiltrados, diaSelecionado]);

  

  const handleDiaClick = (dataCompleta: Date) => {
    setDiaSelecionado(dataCompleta);
  };

  const handleEditarAgendamento = async (agendamento: any) => {
    // Carregar dados atuais do banco antes de abrir o modal
    const agendamentoAtual = await obterAgendamento(agendamento.cliente.id);
    
    if (agendamentoAtual) {
      // Criar objeto com dados completos para o modal
      const agendamentoCompleto = {
        ...agendamento,
        quantidadeAtual: agendamentoAtual.quantidade_total || agendamento.cliente.quantidadePadrao,
        tipoPedidoAtual: agendamentoAtual.tipo_pedido || 'Padrão',
        itensPersonalizados: agendamentoAtual.itens_personalizados || []
      };
      setSelectedAgendamento(agendamentoCompleto);
    } else {
      setSelectedAgendamento(agendamento);
    }
    
    setModalOpen(true);
  };

  const handleSalvarAgendamento = async (agendamentoAtualizado: any) => {
    await carregarTodosAgendamentos();
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

  const toggleSelecao = (clienteId: string) => {
    setAgendamentosSelecionados(prev => {
      const novaSeleção = new Set(prev);
      if (novaSeleção.has(clienteId)) {
        novaSeleção.delete(clienteId);
      } else {
        novaSeleção.add(clienteId);
      }
      return novaSeleção;
    });
  };

  const toggleSelecionarTodos = () => {
    if (agendamentosSelecionados.size === agendamentosDiaSelecionado.length) {
      limparSelecao();
    } else {
      const todosIds = new Set(agendamentosDiaSelecionado.map(a => a.cliente.id));
      setAgendamentosSelecionados(todosIds);
    }
  };

  const limparSelecao = () => {
    setAgendamentosSelecionados(new Set());
  };

  const handleReagendarEmMassa = async (clienteIds: string[], novaData: Date) => {
    try {
      const agendamentosParaReagendar = agendamentosDiaSelecionado.filter(
        a => clienteIds.includes(a.cliente.id)
      );

      await Promise.all(
        agendamentosParaReagendar.map(async (agendamento) => {
          const agendamentoAtual = await obterAgendamento(agendamento.cliente.id);
          
          if (agendamentoAtual) {
            await salvarAgendamento(agendamento.cliente.id, {
              data_proxima_reposicao: novaData,
              tipo_pedido: agendamentoAtual.tipo_pedido,
              quantidade_total: agendamentoAtual.quantidade_total,
              itens_personalizados: agendamentoAtual.itens_personalizados,
              status_agendamento: agendamentoAtual.status_agendamento
            });
          }
        })
      );

      await carregarTodosAgendamentos();
      limparSelecao();
      
      toast({
        title: "Sucesso",
        description: `${agendamentosParaReagendar.length} agendamento(s) reagendado(s) com sucesso`
      });
    } catch (error) {
      console.error('Erro ao reagendar em massa:', error);
      toast({
        title: "Erro",
        description: "Erro ao reagendar agendamentos",
        variant: "destructive"
      });
    }
  };

  // Calcular total de unidades da semana (apenas AGENDADOS + entregas realizadas)
  const totalUnidadesSemana = useMemo(() => {
    const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
    
    // Unidades de agendamentos com status "Agendado" (confirmados) - NÃO inclui Previstos
    const agendamentosSemana = agendamentosFiltrados.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return dataAgendamento >= inicioSemana && 
             dataAgendamento <= fimSemana &&
             agendamento.statusAgendamento === "Agendado";
    });
    
    const unidadesAgendadas = agendamentosSemana.reduce((sum, a) => 
      sum + (a.pedido?.totalPedidoUnidades || a.cliente.quantidadePadrao || 0), 0
    );
    
    // Unidades de entregas realizadas na semana
    const entregasRealizadasSemana = entregasHistorico.filter(entrega => {
      const dataEntrega = new Date(entrega.data);
      return dataEntrega >= inicioSemana && dataEntrega <= fimSemana && entrega.tipo === 'entrega';
    });
    
    const unidadesEntregues = entregasRealizadasSemana.reduce((sum, e) => 
      sum + (e.quantidade || 0), 0
    );
    
    return unidadesAgendadas + unidadesEntregues;
  }, [agendamentosFiltrados, semanaAtual, entregasHistorico]);


  const ehSemanaAtual = useMemo(() => {
    const hoje = new Date();
    const inicioSemanaAtual = startOfWeek(hoje, { weekStartsOn: 1 });
    const inicioSemanaVisualizacao = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    return isSameDay(inicioSemanaAtual, inicioSemanaVisualizacao);
  }, [semanaAtual]);

  const exportarPDFRepresentante = () => {
    const doc = new jsPDF();
    const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
    
    // Filtrar agendamentos da semana
    const agendamentosSemana = agendamentosFiltrados.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
    });

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo de Agendamentos', 20, 20);
    
    // Informações do representante e período
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const nomeRepresentante = representanteFiltro.length === 0 
      ? "Todos os representantes" 
      : representanteFiltro.length === 1
      ? representantes.find(r => r.id === representanteFiltro[0])?.nome || "Representante"
      : `${representanteFiltro.length} representantes`;
    
    doc.text(`Representante: ${nomeRepresentante}`, 20, 35);
    doc.text(`Período: ${format(inicioSemana, 'dd/MM/yyyy')} - ${format(fimSemana, 'dd/MM/yyyy')}`, 20, 42);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 49);

    // Resumo geral
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', 20, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de agendamentos: ${agendamentosSemana.length}`, 20, 68);
    doc.text(`Confirmados: ${indicadoresSemana.confirmados}`, 20, 75);
    doc.text(`Previstos: ${indicadoresSemana.previstos}`, 20, 82);
    doc.text(`Taxa de confirmação: ${indicadoresSemana.taxaConfirmacao.toFixed(1)}%`, 20, 89);

    // Linha separadora
    doc.line(20, 95, 190, 95);

    // Lista de agendamentos por dia
    let yPosition = 105;
    const diasSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });
    
    diasSemana.forEach((dia) => {
      const agendamentosDia = agendamentosSemana.filter(agendamento => 
        isSameDay(new Date(agendamento.dataReposicao), dia)
      );

      if (agendamentosDia.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Cabeçalho do dia
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${format(dia, "EEEE, dd 'de' MMMM", { locale: ptBR })}`, 20, yPosition);
        yPosition += 8;

        // Agendamentos do dia
        doc.setFontSize(9);
        agendamentosDia.forEach((agendamento) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          const status = agendamento.statusAgendamento;
          const statusCor: [number, number, number] = status === "Agendado" ? [16, 185, 129] : [245, 158, 11];
          
          // Status badge
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(statusCor[0], statusCor[1], statusCor[2]);
          const statusTexto = status === "Agendado" ? "[CONFIRMADO]" : "[PREVISTO]";
          doc.text(statusTexto, 28, yPosition);
          
          // Nome do cliente
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(agendamento.cliente.nome.substring(0, 40), 70, yPosition);
          
          yPosition += 6;
          
          // Quantidade
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          if (agendamento.pedido?.totalPedidoUnidades) {
            doc.text(`Quantidade: ${agendamento.pedido.totalPedidoUnidades} unidades`, 28, yPosition);
            yPosition += 5;
          }
          
          // Nome do contato
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          if (agendamento.cliente.contatoNome) {
            doc.text(`Contato: ${agendamento.cliente.contatoNome}`, 28, yPosition);
            yPosition += 4;
          }
          
          // Endereço
          if (agendamento.cliente.enderecoEntrega) {
            doc.text(`Endereço: ${agendamento.cliente.enderecoEntrega.substring(0, 60)}`, 28, yPosition);
            yPosition += 4;
          }
          
          // Telefone
          if (agendamento.cliente.contatoTelefone) {
            doc.text(`Tel: ${agendamento.cliente.contatoTelefone}`, 28, yPosition);
            yPosition += 4;
          }
          
          // Tipo de pedido
          if (agendamento.pedido?.tipoPedido && agendamento.pedido.tipoPedido !== 'Padrão') {
            doc.text(`Tipo: ${agendamento.pedido.tipoPedido}`, 28, yPosition);
            yPosition += 4;
          }
          
          // Linha separadora entre agendamentos
          doc.setDrawColor(220, 220, 220);
          doc.line(28, yPosition, 190, yPosition);
          yPosition += 6;
          
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
        });

        yPosition += 3;
      }
    });

    // Rodapé em todas as páginas
    const totalPaginas = doc.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPaginas}`, 105, 285, { align: 'center' });
    }

    // Salvar arquivo
    const nomeArquivo = `agendamentos_${nomeRepresentante.replace(/\s+/g, '_')}_${format(inicioSemana, 'ddMMyyyy')}.pdf`;
    doc.save(nomeArquivo);

    toast({
      title: "PDF Exportado",
      description: "O resumo de agendamentos foi exportado com sucesso."
    });
  };

  return <div className="space-y-6">
      {/* Barra de Filtros Unificada */}
      <div className="bg-muted/30 border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtros
            {(representanteFiltro.length > 0 || rotaFiltro.length > 0) && (
              <Badge variant="secondary" className="text-xs">
                {[representanteFiltro.length > 0, rotaFiltro.length > 0].filter(Boolean).length} ativo(s)
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{agendamentosFiltrados.length}</span> agendamentos
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Navegador de Semana */}
          <div className="flex items-center gap-1 bg-background border rounded-md px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={navegarSemanaAnterior}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 px-2 min-w-[160px] justify-center">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium whitespace-nowrap">
                {format(startOfWeek(semanaAtual, { weekStartsOn: 1 }), 'dd/MM', { locale: ptBR })} - {format(endOfWeek(semanaAtual, { weekStartsOn: 1 }), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={navegarProximaSemana}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {!ehSemanaAtual && (
              <Button
                variant="default"
                size="sm"
                onClick={voltarSemanaAtual}
                className="text-xs h-8"
              >
                Semana Atual
              </Button>
            )}
          </div>

          <RepresentantesFilter
            selectedIds={representanteFiltro}
            onSelectionChange={setRepresentanteFiltro}
          />
          
          <RotasFilter
            selectedIds={rotaFiltro}
            onSelectionChange={setRotaFiltro}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportarPDFRepresentante}
            className="flex items-center gap-2 ml-auto"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 min-h-[52px]">
            <CardTitle className="text-sm font-medium">Total da Semana</CardTitle>
            <Package className="h-4 w-4 text-purple-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalUnidadesSemana}</div>
            <p className="text-xs text-muted-foreground">Unidades agendadas + entregues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 min-h-[52px]">
            <CardTitle className="text-sm font-medium">Agendamentos Restantes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadoresSemana.totalSemana}</div>
            <p className="text-xs text-muted-foreground">Total de agendamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 min-h-[52px]">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{indicadoresSemana.confirmados}</div>
            <p className="text-xs text-muted-foreground">Agendamentos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 min-h-[52px]">
            <CardTitle className="text-sm font-medium">Previstos</CardTitle>
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{indicadoresSemana.previstos}</div>
            <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 min-h-[52px]">
            <CardTitle className="text-sm font-medium">Entregas Realizadas</CardTitle>
            <Truck className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{indicadoresSemana.entregasRealizadas}</div>
            <p className="text-xs text-muted-foreground">Entregas da semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Produtos da Semana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuantidadesProdutosSemanal 
          agendamentosFiltrados={agendamentosFiltrados} 
          semanaAtual={semanaAtual} 
        />
        <EntregasRealizadasSemanal semanaAtual={semanaAtual} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription className="text-left">
                {modoGraficos === 'unidades' ? 'Volume de unidades por status' : 'Visão geral dos agendamentos por status'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-graficos" className="text-xs text-muted-foreground">
                {modoGraficos === 'unidades' ? 'Unidades' : 'Agendamentos'}
              </Label>
              <Switch
                id="toggle-graficos"
                checked={modoGraficos === 'unidades'}
                onCheckedChange={(checked) => setModoGraficos(checked ? 'unidades' : 'agendamentos')}
              />
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                  <Pie 
                    data={dadosGraficoStatus} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false} 
                    label={({ status, quantidade, unidades }) => 
                      `${status}: ${modoGraficos === 'unidades' ? unidades : quantidade}`
                    } 
                    outerRadius={80} 
                    fill="#8884d8" 
                    dataKey={modoGraficos === 'unidades' ? 'unidades' : 'quantidade'}
                  >
                    {dadosGraficoStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.cor} />)}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 max-w-xs">
                            <p className="font-semibold text-sm mb-1">{data.status}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {modoGraficos === 'unidades' ? `${data.unidades} unidades` : `${data.quantidade} agendamentos`}
                            </p>
                            {data.clientes && data.clientes.length > 0 && (
                              <div className="border-t pt-2">
                                <p className="text-xs font-medium mb-1">Clientes:</p>
                                <ul className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                                  {data.clientes.slice(0, 10).map((cliente: string, i: number) => (
                                    <li key={i} className="truncate">• {cliente}</li>
                                  ))}
                                  {data.clientes.length > 10 && (
                                    <li className="text-muted-foreground/70">... +{data.clientes.length - 10} outros</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos por Dia da Semana</CardTitle>
            <CardDescription className="text-left">
              {modoGraficos === 'unidades' ? 'Volume de unidades ao longo da semana' : 'Distribuição dos agendamentos ao longo da semana'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 max-w-xs">
                            <p className="font-semibold text-sm mb-2">{data.diaSemana} ({label})</p>
                            
                            {(modoGraficos === 'unidades' ? data.previstosUnidades : data.previstos) > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-amber-600">
                                  Previstos: {modoGraficos === 'unidades' ? data.previstosUnidades : data.previstos}
                                </p>
                                {data.clientesPrevistos?.length > 0 && (
                                  <ul className="text-xs text-muted-foreground">
                                    {data.clientesPrevistos.slice(0, 5).map((c: string, i: number) => (
                                      <li key={i} className="truncate">• {c}</li>
                                    ))}
                                    {data.clientesPrevistos.length > 5 && (
                                      <li className="text-muted-foreground/70">... +{data.clientesPrevistos.length - 5}</li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            )}
                            
                            {(modoGraficos === 'unidades' ? data.confirmadosUnidades : data.confirmados) > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-green-600">
                                  Confirmados: {modoGraficos === 'unidades' ? data.confirmadosUnidades : data.confirmados}
                                </p>
                                {data.clientesConfirmados?.length > 0 && (
                                  <ul className="text-xs text-muted-foreground">
                                    {data.clientesConfirmados.slice(0, 5).map((c: string, i: number) => (
                                      <li key={i} className="truncate">• {c}</li>
                                    ))}
                                    {data.clientesConfirmados.length > 5 && (
                                      <li className="text-muted-foreground/70">... +{data.clientesConfirmados.length - 5}</li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            )}
                            
                            {(modoGraficos === 'unidades' ? data.realizadasUnidades : data.realizadas) > 0 && (
                              <div>
                                <p className="text-xs font-medium text-blue-600">
                                  Realizadas: {modoGraficos === 'unidades' ? data.realizadasUnidades : data.realizadas}
                                </p>
                                {data.clientesRealizadas?.length > 0 && (
                                  <ul className="text-xs text-muted-foreground">
                                    {data.clientesRealizadas.slice(0, 5).map((c: string, i: number) => (
                                      <li key={i} className="truncate">• {c}</li>
                                    ))}
                                    {data.clientesRealizadas.length > 5 && (
                                      <li className="text-muted-foreground/70">... +{data.clientesRealizadas.length - 5}</li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey={modoGraficos === 'unidades' ? 'realizadasUnidades' : 'realizadas'} 
                    stackId="a" 
                    fill="#3B82F6" 
                    name="Realizadas" 
                  />
                  <Bar 
                    dataKey={modoGraficos === 'unidades' ? 'confirmadosUnidades' : 'confirmados'} 
                    stackId="a" 
                    fill="#10B981" 
                    name="Confirmados" 
                  />
                  <Bar 
                    dataKey={modoGraficos === 'unidades' ? 'previstosUnidades' : 'previstos'} 
                    stackId="a" 
                    fill="#F59E0B" 
                    name="Previstos" 
                  />
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
          <CardDescription className="text-left">Visão dos agendamentos por dia da semana selecionada - Clique em um dia para ver os detalhes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {dadosGraficoSemanal.map((dia, index) => <div key={index} className={`p-4 border rounded-lg text-center cursor-pointer transition-colors hover:bg-muted/50 ${dia.isToday ? 'border-primary bg-primary/10' : diaSelecionado && isSameDay(dia.dataCompleta, diaSelecionado) ? 'border-primary bg-primary/20' : 'border-border'}`} onClick={() => handleDiaClick(dia.dataCompleta)}>
                <div className="font-medium text-sm mb-2">{dia.diaSemana}</div>
                <div className="text-lg font-bold mb-1">{dia.dia}</div>
                
                <div className="space-y-1">
                  {dia.previstos > 0 && <Badge variant="outline" className="text-[10px] w-full bg-amber-100 rounded-none whitespace-nowrap justify-center">
                      {dia.previstos} Previstos
                    </Badge>}
                  {dia.confirmados > 0 && <Badge variant="default" className="text-[10px] w-full bg-green-500 whitespace-nowrap justify-center">
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agendamentos para {format(diaSelecionado, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR
                })}</CardTitle>
                <CardDescription className="text-left">
                  {agendamentosDiaSelecionado.length === 0 ? "Nenhum agendamento encontrado para este dia" : `${agendamentosDiaSelecionado.length} agendamento(s) encontrado(s)`}
                </CardDescription>
              </div>
              {agendamentosDiaSelecionado.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setModalReagendarAberto(true)}
                  disabled={agendamentosDiaSelecionado.length === 0}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Reagendar em Massa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {agendamentosDiaSelecionado.length > 0 ? <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b mb-3">
                  <Checkbox
                    checked={agendamentosSelecionados.size === agendamentosDiaSelecionado.length && agendamentosDiaSelecionado.length > 0}
                    onCheckedChange={toggleSelecionarTodos}
                  />
                  <span className="text-sm font-medium">
                    Selecionar Todos
                  </span>
                </div>
                {agendamentosDiaSelecionado.map(agendamento => {
                  // Criar um componente que busca a quantidade atualizada
                  const QuantidadeAtualizada = ({ agendamento }: { agendamento: any }) => {
                    const [quantidade, setQuantidade] = useState(agendamento.cliente.quantidadePadrao);
                    const [tipoPedido, setTipoPedido] = useState('Padrão');
                    
                    useEffect(() => {
                      const buscarDados = async () => {
                        try {
                          const agendamentoAtual = await obterAgendamento(agendamento.cliente.id);
                          if (agendamentoAtual) {
                            setQuantidade(agendamentoAtual.quantidade_total || agendamento.cliente.quantidadePadrao);
                            setTipoPedido(agendamentoAtual.tipo_pedido || 'Padrão');
                          }
                        } catch (error) {
                          console.error('Erro ao buscar dados do agendamento:', error);
                        }
                      };
                      buscarDados();
                    }, [agendamento.cliente.id]);

                    // Calcular dias desde última entrega
                    const diasDesdeUltimaEntrega = agendamento.cliente.ultimaDataReposicaoEfetiva 
                      ? differenceInDays(new Date(), new Date(agendamento.cliente.ultimaDataReposicaoEfetiva))
                      : null;

                    const periodicidade = agendamento.cliente.periodicidadePadrao || 7;

                    // Determinar a cor de fundo baseada no status
                    const getBackgroundColor = () => {
                      if (agendamento.statusAgendamento === "Agendado") {
                        return "bg-green-50";
                      }
                      if (agendamento.statusAgendamento === "Previsto") {
                        return "bg-yellow-50";
                      }
                      return "bg-gray-50";
                    };

                    return (
                      <div key={agendamento.cliente.id} className={`flex items-center gap-3 p-3 border rounded-lg ${getBackgroundColor()}`}>
                        <Checkbox
                          checked={agendamentosSelecionados.has(agendamento.cliente.id)}
                          onCheckedChange={() => toggleSelecao(agendamento.cliente.id)}
                        />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-left">{agendamento.cliente.nome}</div>
                          <div className="text-sm text-muted-foreground text-left">
                            Quantidade: {quantidade} unidades
                          </div>
                          {agendamento.statusAgendamento === "Previsto" && (
                            <div className="text-xs text-muted-foreground text-left mt-1">
                              {diasDesdeUltimaEntrega !== null 
                                ? `${diasDesdeUltimaEntrega} dias desde última entrega` 
                                : 'Primeira entrega'
                              } • Periodicidade: {periodicidade} dias
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <TipoPedidoBadge tipo={tipoPedido === 'Alterado' ? 'Alterado' : 'Padrão'} />
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
                      </div>
                    );
                  };

                  return <QuantidadeAtualizada key={agendamento.cliente.id} agendamento={agendamento} />;
                })}
              </div> : <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento para este dia
              </div>}
          </CardContent>
        </Card>}

      <AgendamentoEditModal open={modalOpen} onOpenChange={setModalOpen} agendamento={selectedAgendamento} onSalvar={handleSalvarAgendamento} />
      
      <ReagendamentoEmMassaDialog
        open={modalReagendarAberto}
        onOpenChange={setModalReagendarAberto}
        agendamentosDisponiveis={agendamentosDiaSelecionado}
        onConfirm={handleReagendarEmMassa}
      />
    </div>;
}
