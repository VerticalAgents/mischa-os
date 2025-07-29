
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Users, 
  TrendingUp, 
  Target, 
  Phone, 
  Mail, 
  MapPin,
  DollarSign,
  Activity,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useGiroAnalysisConsolidated } from "@/hooks/useGiroAnalysisConsolidated";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { Cliente } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

type SortField = 'nome' | 'giro' | 'status' | 'achievement' | 'entregas' | 'dias';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function Representantes() {
  const { clientes, loading: clientesLoading, carregarClientes } = useClienteStore();
  const { representantes, loading: representantesLoading, carregarRepresentantes } = useSupabaseRepresentantes();
  const { registros, carregarHistorico } = useHistoricoEntregasStore();
  const [representanteSelecionado, setRepresentanteSelecionado] = useState<string>("todos");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Load giro data efficiently with caching
  const { 
    dadosConsolidados: dadosGiro, 
    isLoading: giroLoading 
  } = useGiroAnalysisConsolidated({});

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('🔄 Iniciando carregamento de dados...');
      try {
        // Load all data in parallel
        await Promise.all([
          clientes.length === 0 ? carregarClientes() : Promise.resolve(),
          registros.length === 0 ? carregarHistorico() : Promise.resolve()
        ]);
        console.log('✅ Dados carregados com sucesso');
      } catch (error) {
        console.error('❌ Erro no carregamento inicial:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad) {
      loadInitialData();
    }
  }, [isInitialLoad, clientes.length, registros.length, carregarClientes, carregarHistorico]);

  // Optimize data calculations with useMemo
  const calculatedData = useMemo(() => {
    if (!clientes.length || !dadosGiro.length) {
      return {
        clientesDoRepresentante: [],
        clientesAtivos: [],
        clientesEmAnalise: [],
        clientesAtivar: [],
        clientesInativos: [],
        clientesStandby: [],
        giroTotalReal: 0,
        giroMedioPorPDV: 0,
        taxaConversao: 0,
        dadosStatusPie: [],
        dadosGiroBar: []
      };
    }

    // Filter clients for selected representative
    const clientesDoRepresentante = representanteSelecionado === "todos" 
      ? clientes 
      : clientes.filter(cliente => cliente.representanteId?.toString() === representanteSelecionado);

    const clientesAtivos = clientesDoRepresentante.filter(c => c.statusCliente === 'Ativo');
    const clientesEmAnalise = clientesDoRepresentante.filter(c => c.statusCliente === 'Em análise');
    const clientesAtivar = clientesDoRepresentante.filter(c => c.statusCliente === 'A ativar');
    const clientesInativos = clientesDoRepresentante.filter(c => c.statusCliente === 'Inativo');
    const clientesStandby = clientesDoRepresentante.filter(c => c.statusCliente === 'Standby');

    // Calculate real giro using consolidated data
    const giroTotalReal = clientesAtivos.reduce((sum, c) => {
      const dadoGiro = dadosGiro.find(d => d.cliente_id === c.id);
      return sum + (dadoGiro?.giro_semanal_calculado || 0);
    }, 0);

    // Calculate average giro per active PDV
    const giroMedioPorPDV = clientesAtivos.length > 0 
      ? Math.round(giroTotalReal / clientesAtivos.length)
      : 0;

    const taxaConversao = clientesDoRepresentante.length > 0 
      ? (clientesAtivos.length / clientesDoRepresentante.length) * 100 
      : 0;

    // Chart data without animations
    const dadosStatusPie = [
      { name: 'Ativos', value: clientesAtivos.length, color: '#22c55e' },
      { name: 'Em análise', value: clientesEmAnalise.length, color: '#3b82f6' },
      { name: 'A ativar', value: clientesAtivar.length, color: '#f59e0b' },
      { name: 'Standby', value: clientesStandby.length, color: '#6b7280' },
      { name: 'Inativos', value: clientesInativos.length, color: '#ef4444' }
    ].filter(item => item.value > 0);

    const dadosGiroBar = clientesAtivos
      .slice(0, 10)
      .map(cliente => {
        const dadoGiro = dadosGiro.find(d => d.cliente_id === cliente.id);
        return {
          nome: cliente.nome.substring(0, 15) + (cliente.nome.length > 15 ? '...' : ''),
          giro: dadoGiro?.giro_semanal_calculado || 0
        };
      })
      .sort((a, b) => b.giro - a.giro);

    return {
      clientesDoRepresentante,
      clientesAtivos,
      clientesEmAnalise,
      clientesAtivar,
      clientesInativos,
      clientesStandby,
      giroTotalReal,
      giroMedioPorPDV,
      taxaConversao,
      dadosStatusPie,
      dadosGiroBar
    };
  }, [clientes, dadosGiro, representanteSelecionado]);

  const representanteNome = useMemo(() => {
    if (representanteSelecionado === "todos") return "Todos os Representantes";
    const rep = representantes.find(r => r.id.toString() === representanteSelecionado);
    return rep ? rep.nome : "Representante não encontrado";
  }, [representanteSelecionado, representantes]);

  const isLoading = clientesLoading || representantesLoading || giroLoading || isInitialLoad;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Representative Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Selecionar Representante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={representanteSelecionado} 
            onValueChange={setRepresentanteSelecionado}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um representante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Representantes</SelectItem>
              {representantes.map((rep) => (
                <SelectItem key={rep.id} value={rep.id.toString()}>
                  {rep.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Enhanced Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedData.clientesDoRepresentante.length}</div>
            <p className="text-xs text-muted-foreground">
              {calculatedData.clientesAtivos.length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giro Semanal Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedData.giroTotalReal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Soma dos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giro Médio por PDV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedData.giroMedioPorPDV.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Apenas PDVs ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedData.taxaConversao.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos / Total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedData.clientesEmAnalise.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando ativação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optimized Charts */}
      {calculatedData.dadosStatusPie.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Clientes por status atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={calculatedData.dadosStatusPie}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={0}
                  >
                    {calculatedData.dadosStatusPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clientes - Giro Semanal</CardTitle>
              <CardDescription>Maiores giros por cliente ativo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={calculatedData.dadosGiroBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nome" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                    fontSize={10} 
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="giro" 
                    fill="#3b82f6" 
                    name="Giro Semanal"
                    animationDuration={0}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Tables with Sorting */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ativos" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="ativos">Ativos ({calculatedData.clientesAtivos.length})</TabsTrigger>
              <TabsTrigger value="em-analise">Em Análise ({calculatedData.clientesEmAnalise.length})</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline ({calculatedData.clientesAtivar.length})</TabsTrigger>
              <TabsTrigger value="standby">Standby ({calculatedData.clientesStandby.length})</TabsTrigger>
              <TabsTrigger value="inativos">Inativos ({calculatedData.clientesInativos.length})</TabsTrigger>
              <TabsTrigger value="todos">Todos ({calculatedData.clientesDoRepresentante.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ativos" className="space-y-4">
              <SortableClientesTable 
                clientes={calculatedData.clientesAtivos} 
                titulo="Clientes Ativos" 
                dadosGiro={dadosGiro} 
                showDeliveryStats={false}
              />
            </TabsContent>

            <TabsContent value="em-analise" className="space-y-4">
              <SortableClientesTable 
                clientes={calculatedData.clientesEmAnalise} 
                titulo="Clientes em Análise" 
                dadosGiro={dadosGiro} 
                showDeliveryStats={true}
              />
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4">
              <SortableClientesTable 
                clientes={calculatedData.clientesAtivar} 
                titulo="Pipeline de Leads" 
                dadosGiro={dadosGiro} 
                showDeliveryStats={false}
              />
            </TabsContent>

            <TabsContent value="standby" className="space-y-4">
              <SortableClientesTable 
                clientes={calculatedData.clientesStandby} 
                titulo="Clientes em Standby" 
                dadosGiro={dadosGiro} 
                showDeliveryStats={false}
              />
            </TabsContent>

            <TabsContent value="inativos" className="space-y-4">
              <SortableClientesTable 
                clientes={calculatedData.clientesInativos} 
                titulo="Clientes Inativos" 
                dadosGiro={dadosGiro} 
                showDeliveryStats={false}
              />
            </TabsContent>

            <TabsContent value="todos" className="space-y-4">
              <SortableClientesTable 
                clientes={calculatedData.clientesDoRepresentante} 
                titulo="Todos os Clientes" 
                dadosGiro={dadosGiro} 
                showDeliveryStats={false}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Sortable table component
function SortableClientesTable({ 
  clientes, 
  titulo, 
  dadosGiro, 
  showDeliveryStats = false
}: { 
  clientes: Cliente[]; 
  titulo: string; 
  dadosGiro: any[];
  showDeliveryStats?: boolean;
}) {
  const { registros } = useHistoricoEntregasStore();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'nome', direction: 'asc' });

  const getDeliveryStats = useCallback((clienteId: string) => {
    const entregas = registros.filter(h => h.cliente_id === clienteId && h.tipo === 'entrega');
    const totalEntregas = entregas.length;
    
    if (totalEntregas === 0) return { count: 0, daysSinceFirst: 0, canActivate: false };
    
    const primeiraEntrega = new Date(Math.min(...entregas.map(e => new Date(e.data).getTime())));
    const hoje = new Date();
    const daysSinceFirst = Math.floor((hoje.getTime() - primeiraEntrega.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      count: totalEntregas,
      daysSinceFirst,
      canActivate: totalEntregas >= 4
    };
  }, [registros]);

  const sortedClientes = useMemo(() => {
    return [...clientes].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'nome':
          aValue = a.nome;
          bValue = b.nome;
          break;
        case 'status':
          aValue = a.statusCliente;
          bValue = b.statusCliente;
          break;
        case 'giro':
          const dadoGiroA = dadosGiro.find(d => d.cliente_id === a.id);
          const dadoGiroB = dadosGiro.find(d => d.cliente_id === b.id);
          aValue = dadoGiroA?.giro_semanal_calculado || 0;
          bValue = dadoGiroB?.giro_semanal_calculado || 0;
          break;
        case 'achievement':
          const dadoGiroAchA = dadosGiro.find(d => d.cliente_id === a.id);
          const dadoGiroAchB = dadosGiro.find(d => d.cliente_id === b.id);
          aValue = dadoGiroAchA?.achievement_meta || 0;
          bValue = dadoGiroAchB?.achievement_meta || 0;
          break;
        case 'entregas':
          aValue = getDeliveryStats(a.id).count;
          bValue = getDeliveryStats(b.id).count;
          break;
        case 'dias':
          aValue = getDeliveryStats(a.id).daysSinceFirst;
          bValue = getDeliveryStats(b.id).daysSinceFirst;
          break;
        default:
          aValue = a.nome;
          bValue = b.nome;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [clientes, sortConfig, dadosGiro, getDeliveryStats]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800';
      case 'Em análise': return 'bg-blue-100 text-blue-800';
      case 'Inativo': return 'bg-red-100 text-red-800';
      case 'A ativar': return 'bg-yellow-100 text-yellow-800';
      case 'Standby': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clientesProntosParaAtivar = showDeliveryStats 
    ? sortedClientes.filter(c => getDeliveryStats(c.id).canActivate).length
    : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{titulo}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('nome')} className="h-auto p-0 font-medium">
                Cliente {getSortIcon('nome')}
              </Button>
            </TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('status')} className="h-auto p-0 font-medium">
                Status {getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('giro')} className="h-auto p-0 font-medium">
                Giro Semanal {getSortIcon('giro')}
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('achievement')} className="h-auto p-0 font-medium">
                Achievement {getSortIcon('achievement')}
              </Button>
            </TableHead>
            {showDeliveryStats && (
              <>
                <TableHead className="text-center">
                  <Button variant="ghost" onClick={() => handleSort('entregas')} className="h-auto p-0 font-medium">
                    Entregas {getSortIcon('entregas')}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" onClick={() => handleSort('dias')} className="h-auto p-0 font-medium">
                    Dias desde 1ª {getSortIcon('dias')}
                  </Button>
                </TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedClientes.map((cliente) => {
            const dadoGiro = dadosGiro.find(d => d.cliente_id === cliente.id);
            const giroReal = dadoGiro?.giro_semanal_calculado || 0;
            const achievement = dadoGiro?.achievement_meta || 0;
            const deliveryStats = showDeliveryStats ? getDeliveryStats(cliente.id) : null;

            return (
              <TableRow 
                key={cliente.id}
                className={deliveryStats?.canActivate ? "bg-green-50 border-green-200" : ""}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {cliente.nome}
                      {deliveryStats?.canActivate && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Pronto para Ativar
                        </Badge>
                      )}
                    </div>
                    {cliente.cnpjCpf && (
                      <div className="text-sm text-muted-foreground">{cliente.cnpjCpf}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {cliente.contatoNome && (
                      <div className="text-sm">{cliente.contatoNome}</div>
                    )}
                    {cliente.contatoTelefone && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {cliente.contatoTelefone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(cliente.statusCliente)}>
                    {cliente.statusCliente}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {giroReal.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {achievement.toFixed(1)}%
                </TableCell>
                {showDeliveryStats && deliveryStats && (
                  <>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={deliveryStats.canActivate ? "font-bold text-green-600" : ""}>
                          {deliveryStats.count}
                        </span>
                        {deliveryStats.canActivate && (
                          <AlertTriangle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {deliveryStats.count > 0 ? (
                        <span className="text-sm">{deliveryStats.daysSinceFirst} dias</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {sortedClientes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum cliente encontrado nesta categoria
        </div>
      )}
      
      {clientesProntosParaAtivar > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              Clientes prontos para ativação: {clientesProntosParaAtivar}
            </span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Estes clientes já possuem 4 ou mais entregas e podem ter seu status alterado para "Ativo".
          </p>
        </div>
      )}
    </div>
  );
}
