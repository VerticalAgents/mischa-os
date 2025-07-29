
import { useState, useEffect } from "react";
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
import { Cliente } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function Representantes() {
  const { clientes, loading: clientesLoading, carregarClientes } = useClienteStore();
  const { representantes, loading: representantesLoading, carregarRepresentantes } = useSupabaseRepresentantes();
  const { dados: dadosGiro } = useGiroAnalysisConsolidated();
  
  const [representanteSelecionado, setRepresentanteSelecionado] = useState<string>("todos");

  useEffect(() => {
    carregarClientes();
    carregarRepresentantes();
  }, []);

  // Dados do representante selecionado
  const representanteAtual = representantes.find(r => r.id.toString() === representanteSelecionado);
  
  // Filtrar clientes do representante
  const clientesDoRepresentante = representanteSelecionado === "todos" 
    ? clientes 
    : clientes.filter(cliente => cliente.representanteId?.toString() === representanteSelecionado);

  // Calcular métricas com giro real dos dados consolidados
  const clientesAtivos = clientesDoRepresentante.filter(c => c.statusCliente === 'Ativo');
  const clientesEmAnalise = clientesDoRepresentante.filter(c => c.statusCliente === 'Em análise');
  const clientesAtivar = clientesDoRepresentante.filter(c => c.statusCliente === 'A ativar');
  const clientesInativos = clientesDoRepresentante.filter(c => c.statusCliente === 'Inativo');
  const clientesStandby = clientesDoRepresentante.filter(c => c.statusCliente === 'Standby');

  // Usar giro real dos dados consolidados
  const giroTotalReal = clientesAtivos.reduce((sum, c) => {
    const dadoGiro = dadosGiro.find(d => d.cliente_id === c.id);
    return sum + (dadoGiro?.giro_semanal_calculado || 0);
  }, 0);

  const taxaConversao = clientesDoRepresentante.length > 0 
    ? (clientesAtivos.length / clientesDoRepresentante.length) * 100 
    : 0;

  // Dados para gráficos
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

  // Função para calcular performance baseada na categoria
  const calcularPerformanceCategoria = (clienteId: string) => {
    const dadoCliente = dadosGiro.find(d => d.cliente_id === clienteId);
    if (!dadoCliente || !dadoCliente.giro_semanal_calculado) return 0;

    // Buscar média da categoria (simplificado - em produção seria mais complexo)
    const clientesCategoria = dadosGiro.filter(d => 
      d.categoria_estabelecimento_nome === dadoCliente.categoria_estabelecimento_nome
    );
    
    if (clientesCategoria.length === 0) return 0;
    
    const mediaCategoria = clientesCategoria.reduce((sum, d) => 
      sum + (d.giro_semanal_calculado || 0), 0
    ) / clientesCategoria.length;

    return mediaCategoria > 0 ? (dadoCliente.giro_semanal_calculado / mediaCategoria) * 100 : 0;
  };

  if (clientesLoading || representantesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Representante */}
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

      {/* Indicadores Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesDoRepresentante.length}</div>
            <p className="text-xs text-muted-foreground">
              {clientesAtivos.length} ativos de {clientesDoRepresentante.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giro Semanal Real</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{giroTotalReal.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{taxaConversao.toFixed(1)}%</div>
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
            <div className="text-2xl font-bold">{clientesEmAnalise.length}</div>
            <p className="text-xs text-muted-foreground">
              Clientes em observação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Representante */}
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

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Clientes por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosStatusPie}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosStatusPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Giro */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes - Giro Semanal Real</CardTitle>
            <CardDescription>Giro atual por cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGiroBar}>
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

      {/* Tabelas por Status */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ativos" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="ativos">Ativos ({clientesAtivos.length})</TabsTrigger>
              <TabsTrigger value="em-analise">Em Análise ({clientesEmAnalise.length})</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline ({clientesAtivar.length})</TabsTrigger>
              <TabsTrigger value="standby">Standby ({clientesStandby.length})</TabsTrigger>
              <TabsTrigger value="inativos">Inativos ({clientesInativos.length})</TabsTrigger>
              <TabsTrigger value="todos">Todos ({clientesDoRepresentante.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ativos" className="space-y-4">
              <ClientesTable clientes={clientesAtivos} titulo="Clientes Ativos" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="em-analise" className="space-y-4">
              <ClientesTable clientes={clientesEmAnalise} titulo="Clientes em Análise" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4">
              <ClientesTable clientes={clientesAtivar} titulo="Pipeline de Leads" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="standby" className="space-y-4">
              <ClientesTable clientes={clientesStandby} titulo="Clientes em Standby" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="inativos" className="space-y-4">
              <ClientesTable clientes={clientesInativos} titulo="Clientes Inativos" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>

            <TabsContent value="todos" className="space-y-4">
              <ClientesTable clientes={clientesDoRepresentante} titulo="Todos os Clientes" dadosGiro={dadosGiro} calcularPerformanceCategoria={calcularPerformanceCategoria} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente da tabela de clientes atualizado
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
