
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Users, 
  TrendingUp, 
  Target, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  AlertTriangle
} from "lucide-react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useGiroAnalysisConsolidated } from "@/hooks/useGiroAnalysisConsolidated";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { Cliente } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function Representantes() {
  const { clientes, loading: clientesLoading, carregarClientes } = useClienteStore();
  const { representantes, loading: representantesLoading, carregarRepresentantes } = useSupabaseRepresentantes();
  const [representanteSelecionado, setRepresentanteSelecionado] = useState<string>("todos");
  
  // Only load giro data when needed and cache it
  const { 
    dadosConsolidados: dadosGiro, 
    isLoading: giroLoading 
  } = useGiroAnalysisConsolidated();

  useEffect(() => {
    carregarClientes();
    carregarRepresentantes();
  }, []);

  // Memoize expensive calculations
  const calculatedData = useMemo(() => {
    if (!clientes || !dadosGiro) return {
      clientesDoRepresentante: [],
      clientesAtivos: [],
      clientesEmAnalise: [],
      clientesAtivar: [],
      clientesInativos: [],
      clientesStandby: [],
      giroTotalReal: 0,
      taxaConversao: 0,
      dadosStatusPie: [],
      dadosGiroBar: []
    };

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

    const taxaConversao = clientesDoRepresentante.length > 0 
      ? (clientesAtivos.length / clientesDoRepresentante.length) * 100 
      : 0;

    // Chart data
    const dadosStatusPie = [
      { name: 'Ativos', value: clientesAtivos.length, color: '#22c55e' },
      { name: 'Em análise', value: clientesEmAnalise.length, color: '#3b82f6' },
      { name: 'A ativar', value: clientesAtivar.length, color: '#f59e0b' },
      { name: 'Standby', value: clientesStandby.length, color: '#6b7280' },
      { name: 'Inativos', value: clientesInativos.length, color: '#ef4444' }
    ].filter(item => item.value > 0);

    const dadosGiroBar = clientesAtivos.slice(0, 10).map(cliente => {
      const dadoGiro = dadosGiro.find(d => d.cliente_id === cliente.id);
      return {
        nome: cliente.nome.substring(0, 20) + (cliente.nome.length > 20 ? '...' : ''),
        giro: dadoGiro?.giro_semanal_calculado || 0
      };
    });

    return {
      clientesDoRepresentante,
      clientesAtivos,
      clientesEmAnalise,
      clientesAtivar,
      clientesInativos,
      clientesStandby,
      giroTotalReal,
      taxaConversao,
      dadosStatusPie,
      dadosGiroBar
    };
  }, [clientes, dadosGiro, representanteSelecionado]);

  // Function to calculate performance based on category
  const calcularPerformanceCategoria = useMemo(() => {
    return (clienteId: string) => {
      const dadoCliente = dadosGiro.find(d => d.cliente_id === clienteId);
      if (!dadoCliente || !dadoCliente.giro_semanal_calculado) return 0;

      const clientesCategoria = dadosGiro.filter(d => 
        d.categoria_estabelecimento_nome === dadoCliente.categoria_estabelecimento_nome
      );
      
      if (clientesCategoria.length === 0) return 0;
      
      const mediaCategoria = clientesCategoria.reduce((sum, d) => 
        sum + (d.giro_semanal_calculado || 0), 0
      ) / clientesCategoria.length;

      return mediaCategoria > 0 ? (dadoCliente.giro_semanal_calculado / mediaCategoria) * 100 : 0;
    };
  }, [dadosGiro]);

  const representanteAtual = representantes.find(r => r.id.toString() === representanteSelecionado);

  if (clientesLoading || representantesLoading || giroLoading) {
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
          <Select value={representanteSelecionado} onValueChange={setRepresentanteSelecionado}>
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

      {/* Main Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedData.clientesDoRepresentante.length}</div>
            <p className="text-xs text-muted-foreground">
              {calculatedData.clientesAtivos.length} ativos de {calculatedData.clientesDoRepresentante.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giro Semanal Real</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedData.giroTotalReal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Baseado em dados reais
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
              Clientes em observação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Representative Information */}
      {representanteAtual && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {representanteAtual.nome}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              {representanteAtual.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{representanteAtual.email}</span>
                </div>
              )}
              {representanteAtual.telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{representanteAtual.telefone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts - Only render when data is ready */}
      {calculatedData.dadosStatusPie.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Clientes por status atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={calculatedData.dadosStatusPie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {calculatedData.dadosStatusPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Giro Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clientes - Giro Semanal Real</CardTitle>
              <CardDescription>Giro atual por cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={calculatedData.dadosGiroBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="giro" fill="#3b82f6" name="Giro Real" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Tables */}
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
              <ClientesTable clientes={calculatedData.clientesAtivos} titulo="Clientes Ativos" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="em-analise" className="space-y-4">
              <ClientesTableEmAnalise clientes={calculatedData.clientesEmAnalise} titulo="Clientes em Análise" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4">
              <ClientesTable clientes={calculatedData.clientesAtivar} titulo="Pipeline de Leads" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="standby" className="space-y-4">
              <ClientesTable clientes={calculatedData.clientesStandby} titulo="Clientes em Standby" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="inativos" className="space-y-4">
              <ClientesTable clientes={calculatedData.clientesInativos} titulo="Clientes Inativos" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="todos" className="space-y-4">
              <ClientesTable clientes={calculatedData.clientesDoRepresentante} titulo="Todos os Clientes" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced table component for "Em Análise" clients with delivery tracking
function ClientesTableEmAnalise({ 
  clientes, 
  titulo, 
  dadosGiro, 
  calcularPerformanceCategoria 
}: { 
  clientes: Cliente[]; 
  titulo: string; 
  dadosGiro: any[];
  calcularPerformanceCategoria: (clienteId: string) => number;
}) {
  const { registros } = useHistoricoEntregasStore();

  const getDeliveryStats = (clienteId: string) => {
    const entregas = registros.filter(h => h.cliente_id === clienteId);
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

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 100) return { color: 'bg-green-100 text-green-800', icon: <TrendingUp className="h-4 w-4" /> };
    if (performance >= 80) return { color: 'bg-yellow-100 text-yellow-800', icon: null };
    return { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{titulo}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Giro Semanal Real</TableHead>
            <TableHead className="text-right">Performance vs Categoria</TableHead>
            <TableHead className="text-center">Entregas Realizadas</TableHead>
            <TableHead className="text-center">Dias desde 1ª Entrega</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => {
            const dadoGiro = dadosGiro.find(d => d.cliente_id === cliente.id);
            const giroReal = dadoGiro?.giro_semanal_calculado || 0;
            const performanceCategoria = calcularPerformanceCategoria(cliente.id);
            const performanceBadge = getPerformanceBadge(performanceCategoria);
            const deliveryStats = getDeliveryStats(cliente.id);

            return (
              <TableRow 
                key={cliente.id}
                className={deliveryStats.canActivate ? "bg-green-50 border-green-200" : ""}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {cliente.nome}
                      {deliveryStats.canActivate && (
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
                    {cliente.contatoEmail && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {cliente.contatoEmail}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {cliente.enderecoEntrega ? (
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {cliente.enderecoEntrega}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(cliente.statusCliente)}>
                    {cliente.statusCliente}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {giroReal.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Badge className={performanceBadge.color}>
                      {performanceCategoria.toFixed(1)}%
                    </Badge>
                    {performanceBadge.icon}
                  </div>
                </TableCell>
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {clientes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum cliente encontrado nesta categoria
        </div>
      )}
      
      {clientes.some(c => getDeliveryStats(c.id).canActivate) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              Clientes prontos para ativação: {clientes.filter(c => getDeliveryStats(c.id).canActivate).length}
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

// Standard table component for other status
function ClientesTable({ 
  clientes, 
  titulo, 
  dadosGiro, 
  calcularPerformanceCategoria 
}: { 
  clientes: Cliente[]; 
  titulo: string; 
  dadosGiro: any[];
  calcularPerformanceCategoria: (clienteId: string) => number;
}) {
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

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 100) return { color: 'bg-green-100 text-green-800', icon: <TrendingUp className="h-4 w-4" /> };
    if (performance >= 80) return { color: 'bg-yellow-100 text-yellow-800', icon: null };
    return { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{titulo}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Giro Semanal Real</TableHead>
            <TableHead className="text-right">Performance vs Categoria</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => {
            const dadoGiro = dadosGiro.find(d => d.cliente_id === cliente.id);
            const giroReal = dadoGiro?.giro_semanal_calculado || 0;
            const performanceCategoria = calcularPerformanceCategoria(cliente.id);
            const performanceBadge = getPerformanceBadge(performanceCategoria);

            return (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{cliente.nome}</div>
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
                    {cliente.contatoEmail && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {cliente.contatoEmail}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {cliente.enderecoEntrega ? (
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {cliente.enderecoEntrega}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(cliente.statusCliente)}>
                    {cliente.statusCliente}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {giroReal.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Badge className={performanceBadge.color}>
                      {performanceCategoria.toFixed(1)}%
                    </Badge>
                    {performanceBadge.icon}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {clientes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum cliente encontrado nesta categoria
        </div>
      )}
    </div>
  );
}
