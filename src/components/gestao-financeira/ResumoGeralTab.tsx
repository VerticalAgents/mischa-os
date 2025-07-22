
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Percent, Truck, FileText, Calculator, Tag } from 'lucide-react';
import { useClienteStore } from '@/hooks/useClienteStore';

interface ResumoGeralTabProps {
  faturamentoMensal: number;
  faturamentoSemanal: number;
  precosDetalhados: Array<{
    clienteId: string;
    clienteNome: string;
    categoriaId: number;
    categoriaNome: string;
    precoUnitario: number;
    precoPersonalizado: boolean;
    giroSemanal: number;
    faturamentoSemanal: number;
  }>;
}

export default function ResumoGeralTab({ 
  faturamentoMensal, 
  faturamentoSemanal, 
  precosDetalhados 
}: ResumoGeralTabProps) {
  const { clientes } = useClienteStore();

  // Percentuais conforme mostrado na página de Projeção de Resultados por PDV
  const PERCENTUAL_IMPOSTOS = 2.1; // 2,1%
  const PERCENTUAL_LOGISTICA = 3.8; // 3,8%
  const PERCENTUAL_INSUMOS_REVENDA = 31; // 31%
  const PERCENTUAL_INSUMOS_FOOD_SERVICE = 42; // 42%

  // Calcular custos por categoria
  const categoriaRevenda = precosDetalhados.filter(item => 
    item.categoriaNome.toLowerCase().includes('revenda') || 
    item.categoriaNome.toLowerCase().includes('padrão')
  );
  
  const categoriaFoodService = precosDetalhados.filter(item => 
    item.categoriaNome.toLowerCase().includes('food service') ||
    item.categoriaNome.toLowerCase().includes('foodservice')
  );

  const faturamentoRevenda = categoriaRevenda.reduce((sum, item) => sum + (item.faturamentoSemanal * 4), 0);
  const faturamentoFoodService = categoriaFoodService.reduce((sum, item) => sum + (item.faturamentoSemanal * 4), 0);
  const outrosFaturamento = faturamentoMensal - faturamentoRevenda - faturamentoFoodService;

  // Calcular preço médio de venda para categoria Revenda Padrão (apenas clientes com giro habilitado)
  const calcularPrecoMedioRevenda = () => {
    // Filtrar apenas dados da categoria "Revenda Padrão"
    const dadosRevenda = precosDetalhados.filter(item => 
      item.categoriaNome.toLowerCase().includes('revenda') || 
      item.categoriaNome.toLowerCase().includes('padrão')
    );

    // Filtrar apenas clientes que têm o giro habilitado (contabilizar_giro_medio = true)
    const dadosRevendaComGiroHabilitado = dadosRevenda.filter(item => {
      const cliente = clientes.find(c => c.id === item.clienteId);
      return cliente && cliente.contabilizarGiroMedio === true;
    });

    if (dadosRevendaComGiroHabilitado.length === 0) {
      return {
        precoMedio: 0,
        quantidadeClientes: 0,
        totalVolume: 0
      };
    }

    // Calcular média ponderada pelo volume (giro semanal)
    const somaPrecosPonderados = dadosRevendaComGiroHabilitado.reduce((sum, item) => {
      return sum + (item.precoUnitario * item.giroSemanal);
    }, 0);

    const somaVolume = dadosRevendaComGiroHabilitado.reduce((sum, item) => {
      return sum + item.giroSemanal;
    }, 0);

    const precoMedio = somaVolume > 0 ? somaPrecosPonderados / somaVolume : 0;

    // Contar clientes únicos
    const clientesUnicos = new Set(dadosRevendaComGiroHabilitado.map(item => item.clienteId));

    return {
      precoMedio,
      quantidadeClientes: clientesUnicos.size,
      totalVolume: somaVolume
    };
  };

  const { precoMedio, quantidadeClientes, totalVolume } = calcularPrecoMedioRevenda();

  // Calcular custos
  const custosInsumosRevenda = faturamentoRevenda * (PERCENTUAL_INSUMOS_REVENDA / 100);
  const custosInsumosFoodService = faturamentoFoodService * (PERCENTUAL_INSUMOS_FOOD_SERVICE / 100);
  const custosLogisticos = faturamentoMensal * (PERCENTUAL_LOGISTICA / 100);
  const impostos = faturamentoMensal * (PERCENTUAL_IMPOSTOS / 100);

  const totalCustosVariaveis = custosInsumosRevenda + custosInsumosFoodService + custosLogisticos + impostos;
  const margemBruta = faturamentoMensal - totalCustosVariaveis;
  const percentualMargemBruta = faturamentoMensal > 0 ? (margemBruta / faturamentoMensal) * 100 : 0;

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Cards de Faturamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatarMoeda(faturamentoMensal)}
                </div>
                <p className="text-xs text-muted-foreground">Mensal</p>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {formatarMoeda(faturamentoSemanal)}
                </div>
                <p className="text-xs text-muted-foreground">Semanal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Revenda Padrão
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {formatarMoeda(faturamentoRevenda)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {faturamentoMensal > 0 ? formatarPercentual((faturamentoRevenda / faturamentoMensal) * 100) : '0%'} do total
                </p>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Custos Insumos: </span>
                <span className="font-semibold">{formatarMoeda(custosInsumosRevenda)}</span>
                <span className="text-xs text-muted-foreground ml-1">({PERCENTUAL_INSUMOS_REVENDA}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              Food Service
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div>
                <div className="text-xl font-bold text-purple-600">
                  {formatarMoeda(faturamentoFoodService)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {faturamentoMensal > 0 ? formatarPercentual((faturamentoFoodService / faturamentoMensal) * 100) : '0%'} do total
                </p>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Custos Insumos: </span>
                <span className="font-semibold">{formatarMoeda(custosInsumosFoodService)}</span>
                <span className="text-xs text-muted-foreground ml-1">({PERCENTUAL_INSUMOS_FOOD_SERVICE}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novo card para Preço Médio de Venda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo-600" />
              Preço Médio - Revenda Padrão
            </CardTitle>
            <CardDescription>
              Apenas clientes com giro habilitado
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatarMoeda(precoMedio)}
                </div>
                <p className="text-xs text-muted-foreground">Preço médio por unidade</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Clientes:</span>
                  <div className="font-semibold">{quantidadeClientes}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Volume Semanal:</span>
                  <div className="font-semibold">{Math.round(totalVolume)} unidades</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4 text-green-600" />
              Margem Bruta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div>
              <div className="text-xl font-bold text-green-600">
                {formatarMoeda(margemBruta)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatarPercentual(percentualMargemBruta)} do faturamento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Custos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-600" />
              Custos Logísticos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div>
              <div className="text-xl font-bold text-orange-600">
                {formatarMoeda(custosLogisticos)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatarPercentual(PERCENTUAL_LOGISTICA)} do faturamento
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-600" />
              Impostos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div>
              <div className="text-xl font-bold text-red-600">
                {formatarMoeda(impostos)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatarPercentual(PERCENTUAL_IMPOSTOS)} do faturamento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Detalhado de Custos</CardTitle>
          <CardDescription>
            Breakdown completo dos custos e margens por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Item</th>
                  <th className="text-right p-3">Valor</th>
                  <th className="text-right p-3">% do Faturamento</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-green-50">
                  <td className="p-3 font-semibold">Faturamento Total</td>
                  <td className="p-3 text-right font-semibold">{formatarMoeda(faturamentoMensal)}</td>
                  <td className="p-3 text-right font-semibold">100,0%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 pl-6">• Revenda Padrão</td>
                  <td className="p-3 text-right">{formatarMoeda(faturamentoRevenda)}</td>
                  <td className="p-3 text-right">{formatarPercentual((faturamentoRevenda / faturamentoMensal) * 100)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 pl-6">• Food Service</td>
                  <td className="p-3 text-right">{formatarMoeda(faturamentoFoodService)}</td>
                  <td className="p-3 text-right">{formatarPercentual((faturamentoFoodService / faturamentoMensal) * 100)}</td>
                </tr>
                {outrosFaturamento > 0 && (
                  <tr className="border-b">
                    <td className="p-3 pl-6">• Outros</td>
                    <td className="p-3 text-right">{formatarMoeda(outrosFaturamento)}</td>
                    <td className="p-3 text-right">{formatarPercentual((outrosFaturamento / faturamentoMensal) * 100)}</td>
                  </tr>
                )}
                <tr className="border-b bg-red-50">
                  <td className="p-3 font-semibold">(-) Custos Variáveis</td>
                  <td className="p-3 text-right font-semibold text-red-600">-{formatarMoeda(totalCustosVariaveis)}</td>
                  <td className="p-3 text-right font-semibold text-red-600">-{formatarPercentual((totalCustosVariaveis / faturamentoMensal) * 100)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 pl-6">• Insumos Revenda</td>
                  <td className="p-3 text-right text-red-600">-{formatarMoeda(custosInsumosRevenda)}</td>
                  <td className="p-3 text-right text-red-600">-{formatarPercentual(PERCENTUAL_INSUMOS_REVENDA)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 pl-6">• Insumos Food Service</td>
                  <td className="p-3 text-right text-red-600">-{formatarMoeda(custosInsumosFoodService)}</td>
                  <td className="p-3 text-right text-red-600">-{formatarPercentual((custosInsumosFoodService / faturamentoMensal) * 100)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 pl-6">• Logística</td>
                  <td className="p-3 text-right text-red-600">-{formatarMoeda(custosLogisticos)}</td>
                  <td className="p-3 text-right text-red-600">-{formatarPercentual(PERCENTUAL_LOGISTICA)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 pl-6">• Impostos</td>
                  <td className="p-3 text-right text-red-600">-{formatarMoeda(impostos)}</td>
                  <td className="p-3 text-right text-red-600">-{formatarPercentual(PERCENTUAL_IMPOSTOS)}</td>
                </tr>
                <tr className="border-b bg-blue-50">
                  <td className="p-3 font-bold">= Margem Bruta</td>
                  <td className="p-3 text-right font-bold text-blue-600">{formatarMoeda(margemBruta)}</td>
                  <td className="p-3 text-right font-bold text-blue-600">{formatarPercentual(percentualMargemBruta)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
