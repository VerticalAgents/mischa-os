import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calculator, Download } from "lucide-react";
import { format } from "date-fns";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useAuditoriaPCPData } from "@/hooks/useAuditoriaPCPData";

interface ProjecaoItem {
  idProduto: string;
  nomeProduto: string;
  unidadesNecessarias: number;
  estoqueDisponivel: number;
  unidadesProduzir: number;
  formasNecessarias: number;
  sobraEstimada: number;
}

type TipoAgendamento = 'agendados' | 'agendados-previstos';

export default function ProjecaoProducaoTab() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [tipoAgendamento, setTipoAgendamento] = useState<TipoAgendamento>('agendados');
  const [projecaoItens, setProjecaoItens] = useState<ProjecaoItem[]>([]);

  const { dadosAuditoria, produtosAtivos, loading, processarDadosAuditoria, dadosCarregados } = useAuditoriaPCPData();

  const capacidadeForma = 40; // Capacidade fixa de 40 unidades por forma

  // Processar dados de auditoria quando filtros mudarem
  useEffect(() => {
    if (dadosCarregados) {
      processarDadosAuditoria(dataInicio, dataFim, '', 'todos');
    }
  }, [dataInicio, dataFim, processarDadosAuditoria, dadosCarregados]);

  const { carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { produtos } = useSupabaseProdutos();

  // Carregar agendamentos ao montar o componente
  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  // Processar dados de auditoria quando filtros mudarem
  useEffect(() => {
    processarDadosAuditoria(dataInicio, dataFim, '', 'todos');
  }, [dataInicio, dataFim, processarDadosAuditoria]);

  // Calcular projeção baseada nos dados da auditoria
  useEffect(() => {
    calcularProjecaoFromAuditoria();
  }, [dadosAuditoria, tipoAgendamento, produtos]);

  const calcularProjecaoFromAuditoria = () => {
    console.log('🧮 Calculando projeção baseada nos dados da auditoria...');

    // Filtrar dados de auditoria por status do agendamento
    const dadosFiltrados = dadosAuditoria.filter(item => {
      if (tipoAgendamento === 'agendados') {
        return item.statusAgendamento === 'Agendado';
      } else {
        return item.statusAgendamento === 'Agendado' || item.statusAgendamento === 'Previsto';
      }
    });

    console.log('📊 Dados filtrados por status do agendamento:', dadosFiltrados.length);

    // Obter estoque (manual se houver, senão automático)
    const estoqueManualData = localStorage.getItem('estoque-manual-ajustes');
    const estoqueManual = estoqueManualData ? JSON.parse(estoqueManualData) : {};

    // Calcular necessidades totais por produto
    console.log('🔄 Calculando necessidades totais por produto...');
    
    const necessidadesTotais: Record<string, number> = {};
    
    // Inicializar todos os produtos ativos com 0
    produtosAtivos.forEach(produto => {
      necessidadesTotais[produto.nome] = 0;
    });

    // Somar quantidades de todos os agendamentos filtrados
    dadosFiltrados.forEach(item => {
      console.log(`📦 Processando agendamento: ${item.clienteNome}`, item.quantidadesPorProduto);
      
      Object.keys(item.quantidadesPorProduto).forEach(nomeProduto => {
        const quantidade = item.quantidadesPorProduto[nomeProduto] || 0;
        if (quantidade > 0) {
          if (necessidadesTotais[nomeProduto] !== undefined) {
            necessidadesTotais[nomeProduto] += quantidade;
            console.log(`➕ ${nomeProduto}: +${quantidade} = ${necessidadesTotais[nomeProduto]} total`);
          }
        }
      });
    });

    console.log('📊 Necessidades totais finais por produto:', necessidadesTotais);

    // Calcular projeção para cada produto que tem necessidade > 0
    const projecao: ProjecaoItem[] = [];

    Object.keys(necessidadesTotais).forEach(nomeProduto => {
      const unidadesNecessarias = necessidadesTotais[nomeProduto];
      
      if (unidadesNecessarias > 0) {
        // Encontrar o produto correspondente
        const produto = produtos.find(p => p.nome === nomeProduto && p.ativo);
        
        if (produto) {
          const estoqueDisponivel = estoqueManual[produto.id] !== undefined 
            ? estoqueManual[produto.id] 
            : produto.estoque_atual || 0;
          
          const unidadesProduzir = Math.max(0, unidadesNecessarias - estoqueDisponivel);
          
          let formasNecessarias = 0;
          let sobraEstimada = 0;

          if (unidadesProduzir > 0) {
            if (nomeProduto === "Mini Brownie Tradicional") {
              // Cálculo específico para Mini Brownie Tradicional
              const formasPorPacote = 2 / 2.7;
              formasNecessarias = Math.ceil(unidadesProduzir * formasPorPacote);
              sobraEstimada = (formasNecessarias * 2.7) - (unidadesProduzir * 2);
            } else {
              formasNecessarias = Math.ceil(unidadesProduzir / capacidadeForma);
              sobraEstimada = (formasNecessarias * capacidadeForma) - unidadesProduzir;
            }
          } else {
            sobraEstimada = Math.max(0, estoqueDisponivel - unidadesNecessarias);
          }

          console.log(`🧮 Cálculo para ${nomeProduto}:`, {
            unidadesNecessarias,
            estoqueDisponivel,
            unidadesProduzir,
            formasNecessarias,
            sobraEstimada
          });

          projecao.push({
            idProduto: produto.id,
            nomeProduto: produto.nome,
            unidadesNecessarias,
            estoqueDisponivel,
            unidadesProduzir,
            formasNecessarias,
            sobraEstimada
          });
        }
      }
    });

    console.log('✅ Projeção final com todos os produtos:', projecao);
    setProjecaoItens(projecao);
  };

  const totalFormas = useMemo(() => 
    projecaoItens.reduce((sum, item) => sum + item.formasNecessarias, 0), 
    [projecaoItens]
  );

  const exportarDados = (formato: 'pdf' | 'excel') => {
    const dados = projecaoItens.map(item => ({
      'Produto': item.nomeProduto,
      'Unidades Necessárias': item.unidadesNecessarias,
      'Estoque Disponível': item.estoqueDisponivel,
      'Unidades a Produzir': item.unidadesProduzir,
      'Formas Necessárias': item.formasNecessarias,
      'Sobra Estimada': item.sobraEstimada
    }));

    if (formato === 'excel') {
      const csvContent = [
        Object.keys(dados[0] || {}).join(','),
        ...dados.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projecao-producao-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    }
  };

  if (!dadosCarregados || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 text-lg">
          {!dadosCarregados ? 'Inicializando sistema...' : 'Carregando projeção de produção...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles de filtro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Projeção de Produção
          </CardTitle>
          <CardDescription>
            Calcule automaticamente a necessidade de produção com base nos dados da Auditoria PCP filtrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de filtro */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={tipoAgendamento === 'agendados' ? 'default' : 'outline'}
                onClick={() => setTipoAgendamento('agendados')}
                size="sm"
              >
                Apenas Agendados
              </Button>
              <Button
                variant={tipoAgendamento === 'agendados-previstos' ? 'default' : 'outline'}
                onClick={() => setTipoAgendamento('agendados-previstos')}
                size="sm"
              >
                Agendados + Previstos
              </Button>
            </div>
          </div>

          {/* Indicador do modo ativo */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Considerando: {tipoAgendamento === 'agendados' ? 'somente agendamentos confirmados' : 'agendados + previstos'}
            </Badge>
            <Badge variant="outline">
              Clientes ativos apenas
            </Badge>
          </div>

          {/* Info dos filtros aplicados */}
          <div className="text-xs text-muted-foreground">
            Capacidade por forma: {capacidadeForma} unidades | 
            Produtos ativos: {produtos.filter(p => p.ativo).length} | 
            Agendamentos na auditoria: {dadosAuditoria.length} |
            Considerados para cálculo: {dadosAuditoria.filter(item => {
              if (tipoAgendamento === 'agendados') {
                return item.statusAgendamento === 'Agendado';
              } else {
                return item.statusAgendamento === 'Agendado' || item.statusAgendamento === 'Previsto';
              }
            }).length}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de projeção */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Necessidade de Produção</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarDados('excel')}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarDados('pdf')}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Unidades Necessárias</TableHead>
                  <TableHead className="text-right">Estoque Disponível</TableHead>
                  <TableHead className="text-right">Unidades a Produzir</TableHead>
                  <TableHead className="text-right">Formas Necessárias</TableHead>
                  <TableHead className="text-right">Sobra Estimada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projecaoItens.length > 0 ? (
                  projecaoItens.map((item) => (
                    <TableRow key={item.idProduto}>
                      <TableCell className="font-medium">{item.nomeProduto}</TableCell>
                      <TableCell className="text-right">{item.unidadesNecessarias}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.estoqueDisponivel >= item.unidadesNecessarias ? 'text-green-600' : 'text-red-600'}>
                          {item.estoqueDisponivel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.unidadesProduzir}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.formasNecessarias > 0 ? 'default' : 'secondary'}>
                          {item.formasNecessarias}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.nomeProduto === "Mini Brownie Tradicional" ? 
                          `${item.sobraEstimada.toFixed(0)}g` : 
                          item.sobraEstimada
                        }
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Calculator className="h-4 w-4" />
                        Nenhuma necessidade de produção identificada com os filtros aplicados
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          {projecaoItens.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total de formas necessárias:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {totalFormas} formas
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Baseado em {capacidadeForma} unidades por forma (exceto Mini Brownie Tradicional: 0,74 formas/pacote)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
