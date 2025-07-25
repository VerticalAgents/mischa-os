
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Eye } from "lucide-react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabasePrecosCategoriaCliente } from "@/hooks/useSupabasePrecosCategoriaCliente";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useConfiguracoesStore } from "@/hooks/useConfiguracoesStore";

interface ClienteAuditoria {
  id: string;
  nome: string;
  categoriasHabilitadas: any[];
  precosPraticados: { [key: string]: number };
  statusCliente: string;
  quantidadePadrao: number;
  statusAgendamento: string;
}

interface AuditoriaEntregasClientesProps {
  dataInicio: string;
  dataFim: string;
}

// Cache para preços por cliente
const precosCache = new Map<string, { precos: { [key: string]: number }, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default function AuditoriaEntregasClientes({ dataInicio, dataFim }: AuditoriaEntregasClientesProps) {
  const [clientesAuditoria, setClientesAuditoria] = useState<ClienteAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { clientes } = useClienteStore();
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();
  const { categorias } = useSupabaseCategoriasProduto();
  const { obterConfiguracao } = useConfiguracoesStore();

  // Função para buscar preços praticados pelo cliente com cache
  const obterPrecosPraticados = async (clienteId: string) => {
    try {
      // Verificar cache
      const cached = precosCache.get(clienteId);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.precos;
      }

      const precos = await carregarPrecosPorCliente(clienteId);
      const precosMap: { [key: string]: number } = {};
      
      precos.forEach(preco => {
        const categoriaKey = preco.categoria_id.toString();
        precosMap[categoriaKey] = preco.preco_unitario;
      });

      // Se não há preços personalizados, usar preços padrão
      if (Object.keys(precosMap).length === 0) {
        const configPrecificacao = obterConfiguracao('precificacao');
        const precosPadrao = configPrecificacao?.precosPorCategoria || {};
        
        Object.keys(precosPadrao).forEach(categoriaId => {
          precosMap[categoriaId] = precosPadrao[categoriaId];
        });
      }
      
      // Atualizar cache
      precosCache.set(clienteId, {
        precos: precosMap,
        timestamp: Date.now()
      });
      
      return precosMap;
    } catch (error) {
      console.error('Erro ao carregar preços do cliente:', error);
      return {};
    }
  };

  // Função para obter nome da categoria por ID
  const obterNomeCategoria = (categoriaId: string | number) => {
    if (!categoriaId) return 'Categoria não identificada';
    const categoriaIdNum = Number(categoriaId);
    const categoria = categorias.find(cat => cat.id === categoriaIdNum);
    return categoria?.nome || `Categoria ${categoriaId}`;
  };

  // Carregar dados dos clientes
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const clientesComAuditoria = await Promise.all(
          clientes.map(async (cliente) => {
            const precosPraticados = await obterPrecosPraticados(cliente.id);
            
            return {
              id: cliente.id,
              nome: cliente.nome,
              categoriasHabilitadas: Array.isArray(cliente.categoriasHabilitadas) 
                ? cliente.categoriasHabilitadas 
                : [],
              precosPraticados,
              statusCliente: cliente.statusCliente || 'Ativo',
              quantidadePadrao: cliente.quantidadePadrao || 0,
              statusAgendamento: cliente.statusAgendamento || 'Sem agendamento'
            } as ClienteAuditoria;
          })
        );
        
        setClientesAuditoria(clientesComAuditoria);
      } catch (error) {
        console.error('Erro ao carregar dados dos clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [clientes, categorias]);

  // Filtrar clientes
  const clientesFiltrados = clientesAuditoria.filter(cliente =>
    cliente.nome.toLowerCase().includes(filtroCliente.toLowerCase())
  );

  const toggleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const exportarCSV = () => {
    const csvContent = [
      ['Cliente', 'Status Cliente', 'Quantidade Padrão', 'Categorias Habilitadas', 'Preços Praticados'],
      ...clientesFiltrados.map(cliente => [
        cliente.nome,
        cliente.statusCliente,
        cliente.quantidadePadrao.toString(),
        cliente.categoriasHabilitadas.map(cat => obterNomeCategoria(cat.id)).join('; '),
        Object.entries(cliente.precosPraticados)
          .map(([catId, preco]) => `${obterNomeCategoria(catId)}: R$ ${preco.toFixed(2)}`)
          .join('; ')
      ])
    ].map(row => row.join(';')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_clientes_${dataInicio}_${dataFim}.csv`;
    link.click();
  };

  // Calcular indicadores
  const indicadores = {
    totalClientes: clientesFiltrados.length,
    clientesAtivos: clientesFiltrados.filter(c => c.statusCliente === 'Ativo').length,
    clientesComPrecos: clientesFiltrados.filter(c => Object.keys(c.precosPraticados).length > 0).length,
    mediaQuantidadePadrao: clientesFiltrados.length > 0 
      ? clientesFiltrados.reduce((sum, c) => sum + c.quantidadePadrao, 0) / clientesFiltrados.length
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Indicadores principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalClientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.clientesAtivos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes com Preços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.clientesComPrecos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Média Qtd. Padrão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {indicadores.mediaQuantidadePadrao.toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Auditoria de Clientes</CardTitle>
              <CardDescription>
                Configuração de categorias e preços por cliente
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por cliente..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" onClick={exportarCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando dados...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Qtd. Padrão</TableHead>
                  <TableHead>Categorias</TableHead>
                  <TableHead>Preços Configurados</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <>
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">
                        {cliente.nome}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cliente.statusCliente === 'Ativo' ? 'default' : 'secondary'}>
                          {cliente.statusCliente}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {cliente.quantidadePadrao}
                      </TableCell>
                      <TableCell>
                        {cliente.categoriasHabilitadas.length} categoria(s)
                      </TableCell>
                      <TableCell>
                        {Object.keys(cliente.precosPraticados).length > 0 ? (
                          <Badge variant="default">Configurado</Badge>
                        ) : (
                          <Badge variant="secondary">Padrão</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandRow(cliente.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {expandedRows.has(cliente.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/50">
                          <div className="py-4 space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Categorias Habilitadas:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {cliente.categoriasHabilitadas.map((categoria: any, index: number) => (
                                  <div key={index} className="text-sm p-2 bg-background rounded border">
                                    <div className="font-medium">{obterNomeCategoria(categoria.id)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Preços Praticados:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Object.entries(cliente.precosPraticados).map(([categoriaId, preco]) => (
                                  <div key={categoriaId} className="text-sm p-2 bg-background rounded border">
                                    <div className="font-medium">{obterNomeCategoria(categoriaId)}</div>
                                    <div className="text-green-600 font-medium">
                                      R$ {preco.toFixed(2).replace('.', ',')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
