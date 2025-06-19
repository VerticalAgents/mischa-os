
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calculator, Info } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useEffect, useState } from "react";

// Preços temporários por categoria
const PRECOS_TEMPORARIOS: Record<string, number> = {
  'revenda padrão': 4.50,
  'food service': 70.00,
  'default': 5.00
};

const CUSTO_UNITARIO_FIXO = 1.32;
const ALIQUOTA_PROVISORIA = 0.04; // 4%

interface ProjecaoCliente {
  clienteId: string;
  nomeCliente: string;
  categorias: {
    categoriaId: number;
    nomeCategoria: string;
    giroSemanal: number;
    precoAplicado: number;
    faturamento: number;
    custoInsumos: number;
    margemUnitaria: number;
  }[];
  emiteNotaFiscal: boolean;
  impostoTotal: number;
  tipoLogistica: string;
  percentualLogistico: number;
  custoLogistico: number;
  lucroBruto: number;
}

export default function ProjecaoResultadosPDV() {
  const { clientes, carregarClientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const [projecoes, setProjecoes] = useState<ProjecaoCliente[]>([]);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  useEffect(() => {
    if (clientes.length > 0 && categorias.length > 0) {
      calcularProjecoes();
    }
  }, [clientes, categorias]);

  const obterPrecoCategoria = (nomeCategoria: string): number => {
    const nomeNormalizado = nomeCategoria.toLowerCase();
    for (const [key, preco] of Object.entries(PRECOS_TEMPORARIOS)) {
      if (nomeNormalizado.includes(key)) {
        return preco;
      }
    }
    return PRECOS_TEMPORARIOS.default;
  };

  const calcularGiroSemanal = (qtdPadrao: number, periodicidade: number): number => {
    if (periodicidade === 0) return 0;
    return Math.round((qtdPadrao / periodicidade) * 7);
  };

  const calcularProjecoes = () => {
    const clientesAtivos = clientes.filter(cliente => 
      cliente.statusCliente === 'Ativo' && 
      cliente.categoriasHabilitadas && 
      cliente.categoriasHabilitadas.length > 0
    );

    const projecoesCalculadas: ProjecaoCliente[] = clientesAtivos.map(cliente => {
      const categoriasCliente = cliente.categoriasHabilitadas!.map(categoriaId => {
        const categoria = categorias.find(cat => cat.id === categoriaId);
        if (!categoria) return null;

        const giroSemanal = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);
        const precoAplicado = obterPrecoCategoria(categoria.nome);
        const faturamento = giroSemanal * precoAplicado;
        const custoInsumos = giroSemanal * CUSTO_UNITARIO_FIXO;
        const margemUnitaria = precoAplicado - CUSTO_UNITARIO_FIXO;

        return {
          categoriaId,
          nomeCategoria: categoria.nome,
          giroSemanal,
          precoAplicado,
          faturamento,
          custoInsumos,
          margemUnitaria
        };
      }).filter(Boolean) as any[];

      const faturamentoTotal = categoriasCliente.reduce((sum, cat) => sum + cat.faturamento, 0);
      const custoInsumosTotal = categoriasCliente.reduce((sum, cat) => sum + cat.custoInsumos, 0);
      
      const impostoTotal = cliente.emiteNotaFiscal ? faturamentoTotal * ALIQUOTA_PROVISORIA : 0;
      
      // Obter percentual logístico baseado no tipo
      let percentualLogistico = 0;
      if (cliente.tipoLogistica === 'Distribuição') {
        percentualLogistico = 0.08; // 8% para distribuição
      } else if (cliente.tipoLogistica === 'Própria') {
        percentualLogistico = 0.03; // 3% para logística própria
      }
      
      const custoLogistico = faturamentoTotal * percentualLogistico;
      const lucroBruto = faturamentoTotal - custoInsumosTotal - impostoTotal - custoLogistico;

      return {
        clienteId: cliente.id,
        nomeCliente: cliente.nome,
        categorias: categoriasCliente,
        emiteNotaFiscal: cliente.emiteNotaFiscal || false,
        impostoTotal,
        tipoLogistica: cliente.tipoLogistica || 'Própria',
        percentualLogistico,
        custoLogistico,
        lucroBruto
      };
    });

    setProjecoes(projecoesCalculadas);
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1
    }).format(valor);
  };

  const totalGeral = projecoes.reduce((sum, proj) => sum + proj.lucroBruto, 0);
  const faturamentoGeral = projecoes.reduce((sum, proj) => 
    sum + proj.categorias.reduce((catSum, cat) => catSum + cat.faturamento, 0), 0
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projeção de Resultados por PDV"
        description="Análise de rentabilidade e projeções por ponto de venda"
      />
      
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Projeção com dados estimados
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700">
          <p className="mb-2">
            Esta projeção utiliza valores temporários que serão parametrizados:
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>🔧 Preços por categoria: Revenda Padrão (R$ 4,50), Food Service (R$ 70,00)</li>
            <li>🔧 Custo unitário fixo: R$ 1,32</li>
            <li>🔧 Alíquota de imposto: 4% provisório</li>
            <li>🔧 Logística: Própria (3%), Distribuição (8%)</li>
          </ul>
        </CardContent>
      </Card>

      {projecoes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma projeção disponível</h3>
            <p className="text-muted-foreground">
              Certifique-se de que existem clientes ativos com categorias habilitadas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumo Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Faturamento Semanal</p>
                  <p className="text-2xl font-bold text-blue-600">{formatarMoeda(faturamentoGeral)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Lucro Bruto Semanal</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(totalGeral)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Margem Bruta</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatarPercentual(faturamentoGeral > 0 ? totalGeral / faturamentoGeral : 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projeção Detalhada por Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Giro Semanal</TableHead>
                      <TableHead>Preço Aplicado</TableHead>
                      <TableHead>Faturamento</TableHead>
                      <TableHead>Custo Insumos</TableHead>
                      <TableHead>Margem Unit.</TableHead>
                      <TableHead>NF</TableHead>
                      <TableHead>Imposto</TableHead>
                      <TableHead>Logística</TableHead>
                      <TableHead>Custo Log.</TableHead>
                      <TableHead>Lucro Bruto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projecoes.map((projecao) => 
                      projecao.categorias.map((categoria, index) => (
                        <TableRow key={`${projecao.clienteId}-${categoria.categoriaId}`}>
                          {index === 0 && (
                            <TableCell rowSpan={projecao.categorias.length} className="font-medium border-r">
                              {projecao.nomeCliente}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {categoria.nomeCategoria}
                              <Badge variant="secondary" className="text-xs">🔧</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{categoria.giroSemanal}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {formatarMoeda(categoria.precoAplicado)}
                              <Badge variant="outline" className="text-xs">temp</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{formatarMoeda(categoria.faturamento)}</TableCell>
                          <TableCell>{formatarMoeda(categoria.custoInsumos)}</TableCell>
                          <TableCell className={categoria.margemUnitaria > 0 ? "text-green-600" : "text-red-600"}>
                            {formatarMoeda(categoria.margemUnitaria)}
                          </TableCell>
                          {index === 0 && (
                            <>
                              <TableCell rowSpan={projecao.categorias.length} className="text-center border-l">
                                <Badge variant={projecao.emiteNotaFiscal ? "default" : "secondary"}>
                                  {projecao.emiteNotaFiscal ? "Sim" : "Não"}
                                </Badge>
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length}>
                                <div className="flex items-center gap-1">
                                  {formatarMoeda(projecao.impostoTotal)}
                                  {projecao.impostoTotal > 0 && (
                                    <Badge variant="outline" className="text-xs">4%</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length}>
                                <div className="text-center">
                                  <div>{projecao.tipoLogistica}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatarPercentual(projecao.percentualLogistico)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length}>
                                {formatarMoeda(projecao.custoLogistico)}
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length} className={`font-bold border-l ${projecao.lucroBruto > 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatarMoeda(projecao.lucroBruto)}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
