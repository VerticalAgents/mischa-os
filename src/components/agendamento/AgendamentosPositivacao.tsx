import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AgendamentoItem } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Edit, Search, TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AgendamentoEditModal from "./AgendamentoEditModal";
import TipoPedidoBadge from "@/components/expedicao/TipoPedidoBadge";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import SortDropdown, { SortField, SortDirection } from "./SortDropdown";
import { supabase } from "@/integrations/supabase/client";

export default function AgendamentosPositivacao() {
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientesComVenda, setClientesComVenda] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [usarMesAtual, setUsarMesAtual] = useState(false); // false = últimos 30 dias (padrão)
  const { toast } = useToast();
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();

  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Buscar clientes com vendas no período selecionado
  useEffect(() => {
    const carregarVendasPeriodo = async () => {
      try {
        setLoading(true);
        
        let dataInicio: Date;
        let dataFim: Date = new Date();

        if (usarMesAtual) {
          // Mês atual: do primeiro dia do mês até hoje
          dataInicio = startOfMonth(new Date());
        } else {
          // Últimos 30 dias
          dataInicio = subDays(new Date(), 30);
        }

        const { data: entregas, error } = await supabase
          .from('historico_entregas')
          .select('cliente_id')
          .eq('tipo', 'entrega')
          .gte('data', dataInicio.toISOString())
          .lte('data', dataFim.toISOString());

        if (error) throw error;

        // Criar Set com IDs de clientes que tiveram venda no período
        const clientesIds = new Set(entregas?.map(e => e.cliente_id) || []);
        setClientesComVenda(clientesIds);
        
        console.log(`📊 [Positivação] Clientes com venda (${usarMesAtual ? 'Mês Atual' : 'Últimos 30 dias'}):`, clientesIds.size);
      } catch (error) {
        console.error('Erro ao carregar vendas do período:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados de positivação",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    carregarVendasPeriodo();
  }, [usarMesAtual, toast]);

  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  // Filtrar apenas agendamentos de clientes SEM venda no mês vigente
  const agendamentosNaoPositivados = useMemo(() => {
    return agendamentos.filter(a => {
      // Excluir status "Agendar" e substatus "Despachado"
      if (a.statusAgendamento === "Agendar" || a.substatus_pedido === "Despachado") {
        return false;
      }
      
      // Incluir apenas clientes que NÃO têm venda no mês
      return !clientesComVenda.has(a.cliente.id);
    });
  }, [agendamentos, clientesComVenda]);

  // Estatísticas de positivação
  const estatisticasPositivacao = useMemo(() => {
    // Total de clientes ativos com agendamento
    const totalClientesAtivos = agendamentos.filter(a => 
      a.statusAgendamento !== "Agendar" && a.substatus_pedido !== "Despachado"
    ).length;

    // Clientes positivados (com venda no mês)
    const clientesPositivados = agendamentos.filter(a => 
      clientesComVenda.has(a.cliente.id) &&
      a.statusAgendamento !== "Agendar" && 
      a.substatus_pedido !== "Despachado"
    ).length;

    // Clientes não positivados
    const clientesNaoPositivados = agendamentosNaoPositivados.length;

    // Percentuais
    const percentualPositivado = totalClientesAtivos > 0 
      ? (clientesPositivados / totalClientesAtivos) * 100 
      : 0;
    const percentualNaoPositivado = totalClientesAtivos > 0 
      ? (clientesNaoPositivados / totalClientesAtivos) * 100 
      : 0;

    return {
      totalClientesAtivos,
      clientesPositivados,
      clientesNaoPositivados,
      percentualPositivado,
      percentualNaoPositivado
    };
  }, [agendamentos, clientesComVenda, agendamentosNaoPositivados]);

  // Filtrar por pesquisa
  const filteredAgendamentos = useMemo(() => {
    if (!searchTerm.trim()) return agendamentosNaoPositivados;
    
    const term = searchTerm.toLowerCase();
    return agendamentosNaoPositivados.filter(agendamento => 
      agendamento.cliente.nome.toLowerCase().includes(term) ||
      agendamento.statusAgendamento.toLowerCase().includes(term) ||
      (agendamento.pedido?.tipoPedido || 'Padrão').toLowerCase().includes(term)
    );
  }, [agendamentosNaoPositivados, searchTerm]);

  // Ordenar
  const sortedAgendamentos = useMemo(() => {
    return [...filteredAgendamentos].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'nome':
          valueA = a.cliente.nome.toLowerCase();
          valueB = b.cliente.nome.toLowerCase();
          break;
        case 'data':
          valueA = new Date(a.dataReposicao).getTime();
          valueB = new Date(b.dataReposicao).getTime();
          break;
        case 'status':
          valueA = a.statusAgendamento.toLowerCase();
          valueB = b.statusAgendamento.toLowerCase();
          break;
        case 'tipo':
          valueA = a.isPedidoUnico ? 'único' : 'pdv';
          valueB = b.isPedidoUnico ? 'único' : 'pdv';
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredAgendamentos, sortField, sortDirection]);

  const handleEditarAgendamento = (agendamento: AgendamentoItem) => {
    setSelectedAgendamento(agendamento);
    setOpen(true);
  };

  const handleSalvarAgendamento = () => {
    carregarTodosAgendamentos();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Carregando dados de positivação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Blocos de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Positivados no Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estatisticasPositivacao.clientesPositivados}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticasPositivacao.percentualPositivado.toFixed(1)}% do total
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticasPositivacao.clientesPositivados} de {estatisticasPositivacao.totalClientesAtivos} clientes ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Necessitam Positivação
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {estatisticasPositivacao.clientesNaoPositivados}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticasPositivacao.percentualNaoPositivado.toFixed(1)}% do total
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sem vendas {usarMesAtual ? `em ${format(new Date(), 'MMMM/yyyy', { locale: ptBR })}` : 'nos últimos 30 dias'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Pesquisa */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por cliente, status ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedAgendamentos.length} cliente(s) sem positivação
        </div>
      </div>

      {/* Filtro de Período */}
      <div className="flex items-center gap-3 px-1">
        <Label htmlFor="periodo-toggle" className="text-sm font-medium cursor-pointer">
          Últimos 30 dias
        </Label>
        <Switch
          id="periodo-toggle"
          checked={usarMesAtual}
          onCheckedChange={setUsarMesAtual}
        />
        <Label htmlFor="periodo-toggle" className="text-sm font-medium cursor-pointer">
          Mês Atual
        </Label>
      </div>

      {/* Controles de Ordenação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Ordenar por:</span>
          <SortDropdown
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Tabela de Agendamentos */}
      <Table>
        <TableCaption className="text-left">
          Lista de clientes que necessitam positivação no mês vigente.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">PDV</TableHead>
            <TableHead className="text-left">Data Reposição</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-left">Tipo</TableHead>
            <TableHead className="text-left">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgendamentos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                {searchTerm.trim() 
                  ? "Nenhum cliente encontrado com os critérios de pesquisa"
                  : "Todos os clientes foram positivados este mês! 🎉"
                }
              </TableCell>
            </TableRow>
          ) : (
            sortedAgendamentos.map((agendamento) => (
              <TableRow key={agendamento.cliente.id}>
                <TableCell className="text-left">{agendamento.cliente.nome}</TableCell>
                <TableCell className="text-left">
                  {format(agendamento.dataReposicao, "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-left">
                  <Badge variant="default">
                    {agendamento.statusAgendamento}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                  <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
                </TableCell>
                <TableCell className="text-left">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditarAgendamento(agendamento)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AgendamentoEditModal
        open={open}
        onOpenChange={setOpen}
        agendamento={selectedAgendamento}
        onSalvar={handleSalvarAgendamento}
      />
    </div>
  );
}
