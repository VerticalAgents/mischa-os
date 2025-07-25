
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabasePrecosCategoriaCliente } from "@/hooks/useSupabasePrecosCategoriaCliente";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EntregasIndicadoresProps {
  dataInicio: string;
  dataFim: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EntregasIndicadores({ dataInicio, dataFim }: EntregasIndicadoresProps) {
  const [indicadores, setIndicadores] = useState({
    totalEntregas: 0,
    totalRetornos: 0,
    faturamentoTotal: 0,
    clientesAtendidos: 0,
    ticketMedio: 0,
    entregasPorProduto: [] as any[],
    faturamentoPorCliente: [] as any[],
    entregasPorDia: [] as any[],
    taxaRetorno: 0
  });
  const [loading, setLoading] = useState(false);

  const { carregarHistorico, registros } = useHistoricoEntregasStore();
  const { clientes } = useClienteStore();
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();

  // Função para calcular faturamento
  const calcularFaturamento = async (entrega: any) => {
    if (entrega.tipo === 'retorno') return 0;
    
    try {
      const precos = await carregarPrecosPorCliente(entrega.cliente_id);
      let faturamentoTotal = 0;
      
      if (entrega.itens && entrega.itens.length > 0) {
        entrega.itens.forEach((item: any) => {
          const precoItem = precos.find(p => p.categoria_id === item.categoria_id);
          if (precoItem) {
            faturamentoTotal += item.quantidade * precoItem.preco_unitario;
          }
        });
      } else {
        const cliente = clientes.find(c => c.id === entrega.cliente_id);
        if (cliente && cliente.categoriasHabilitadas) {
          const categorias = Array.isArray(cliente.categoriasHabilitadas) 
            ? cliente.categoriasHabilitadas 
            : [];
          
          categorias.forEach((categoria: any) => {
            const precoCategoria = precos.find(p => p.categoria_id === categoria.id);
            if (precoCategoria) {
              const quantidadeCategoria = Math.floor(entrega.quantidade / categorias.length);
              faturamentoTotal += quantidadeCategoria * precoCategoria.preco_unitario;
            }
          });
        }
      }
      
      return faturamentoTotal;
    } catch (error) {
      console.error('Erro ao calcular faturamento:', error);
      return 0;
    }
  };

  // Carregar e processar dados
  useEffect(() => {
    const processarDados = async () => {
      setLoading(true);
      try {
        await carregarHistorico();
        
        // Verificar se registros existe e não está vazio
        if (!registros || registros.length === 0) {
          console.log('Nenhum registro encontrado');
          setLoading(false);
          return;
        }
        
        // Filtrar por período
        const dataInicioDate = new Date(dataInicio);
        const dataFimDate = new Date(dataFim);
        
        const entregasPeriodo = registros.filter(h => {
          const dataEntrega = new Date(h.data);
          return dataEntrega >= dataInicioDate && dataEntrega <= dataFimDate;
        });
        
        // Separar entregas e retornos
        const entregas = entregasPeriodo.filter(h => h.tipo === 'entrega');
        const retornos = entregasPeriodo.filter(h => h.tipo === 'retorno');
        
        // Calcular faturamento total
        let faturamentoTotal = 0;
        for (const entrega of entregas) {
          faturamentoTotal += await calcularFaturamento(entrega);
        }
        
        // Clientes únicos
        const clientesUnicos = new Set(entregasPeriodo.map(h => h.cliente_id));
        
        // Ticket médio
        const ticketMedio = entregas.length > 0 ? faturamentoTotal / entregas.length : 0;
        
        // Taxa de retorno
        const taxaRetorno = entregas.length > 0 ? (retornos.length / entregas.length) * 100 : 0;
        
        // Entregas por produto (baseado nos itens)
        const produtoMap = new Map();
        entregasPeriodo.forEach(entrega => {
          if (entrega.itens && entrega.itens.length > 0) {
            entrega.itens.forEach((item: any) => {
              const key = item.nome || `Produto ${item.categoria_id}`;
              if (produtoMap.has(key)) {
                produtoMap.set(key, produtoMap.get(key) + item.quantidade);
              } else {
                produtoMap.set(key, item.quantidade);
              }
            });
          }
        });
        
        const entregasPorProduto = Array.from(produtoMap.entries()).map(([nome, quantidade]) => ({
          nome,
          quantidade
        })).sort((a, b) => b.quantidade - a.quantidade);
        
        // Faturamento por cliente
        const clienteMap = new Map();
        for (const entrega of entregas) {
          const faturamento = await calcularFaturamento(entrega);
          const clienteNome = entrega.cliente_nome;
          
          if (clienteMap.has(clienteNome)) {
            clienteMap.set(clienteNome, clienteMap.get(clienteNome) + faturamento);
          } else {
            clienteMap.set(clienteNome, faturamento);
          }
        }
        
        const faturamentoPorCliente = Array.from(clienteMap.entries()).map(([nome, faturamento]) => ({
          nome,
          faturamento
        })).sort((a, b) => b.faturamento - a.faturamento);
        
        // Entregas por dia
        const diaMap = new Map();
        entregasPeriodo.forEach(entrega => {
          const dia = format(new Date(entrega.data), 'dd/MM');
          if (diaMap.has(dia)) {
            diaMap.set(dia, diaMap.get(dia) + 1);
          } else {
            diaMap.set(dia, 1);
          }
        });
        
        const entregasPorDia = Array.from(diaMap.entries()).map(([dia, quantidade]) => ({
          dia,
          quantidade
        })).sort((a, b) => {
          const [diaA, mesA] = a.dia.split('/');
          const [diaB, mesB] = b.dia.split('/');
          return new Date(2024, parseInt(mesA) - 1, parseInt(diaA)).getTime() - 
                 new Date(2024, parseInt(mesB) - 1, parseInt(diaB)).getTime();
        });
        
        setIndicadores({
          totalEntregas: entregas.length,
          totalRetornos: retornos.length,
          faturamentoTotal,
          clientesAtendidos: clientesUnicos.size,
          ticketMedio,
          entregasPorProduto,
          faturamentoPorCliente,
          entregasPorDia,
          taxaRetorno
        });
        
      } catch (error) {
        console.error('Erro ao processar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    processarDados();
  }, [dataInicio, dataFim, registros?.length || 0]);

  if (loading) {
    return <div className="text-center py-8">Carregando indicadores...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Indicadores principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retorno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {indicadores.taxaRetorno.toFixed(1)}%
            </div>
            <Progress value={indicadores.taxaRetorno} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {indicadores.ticketMedio.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground">
              por entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entregas vs Retornos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="default">{indicadores.totalEntregas} entregas</Badge>
              <Badge variant="secondary">{indicadores.totalRetornos} retornos</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {indicadores.faturamentoTotal.toFixed(2).replace('.', ',')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entregas por produto */}
        <Card>
          <CardHeader>
            <CardTitle>Entregas por Produto</CardTitle>
            <CardDescription>Produtos mais entregues no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={indicadores.entregasPorProduto.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Faturamento por cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por Cliente</CardTitle>
            <CardDescription>Clientes com maior faturamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={indicadores.faturamentoPorCliente.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="faturamento"
                >
                  {indicadores.faturamentoPorCliente.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Entregas por dia */}
      <Card>
        <CardHeader>
          <CardTitle>Entregas por Dia</CardTitle>
          <CardDescription>Distribuição das entregas ao longo do período</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={indicadores.entregasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
