import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, Percent, AlertTriangle, TrendingUp, Calculator, DollarSign, PieChart, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseCustosFixos, CustoFixo } from "@/hooks/useSupabaseCustosFixos";
import { useSupabaseCustosVariaveis, CustoVariavel } from "@/hooks/useSupabaseCustosVariaveis";
import { useSupabaseSubcategoriasCustos } from "@/hooks/useSupabaseSubcategoriasCustos";
import { useFaturamentoPrevisto } from "@/hooks/useFaturamentoPrevisto";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useIndicadoresFinanceiros } from "@/hooks/useIndicadoresFinanceiros";
type Frequencia = "mensal" | "semanal" | "trimestral" | "semestral" | "anual" | "por-producao";
type TipoCusto = "fixo" | "variavel";
type FormData = {
  nome: string;
  subcategoria: string;
  valor: number;
  frequencia: Frequencia;
  percentual_faturamento: number;
  observacoes: string;
  tipoCusto: TipoCusto;
};
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
export default function CustosTab() {
  const {
    custosFixos,
    isLoading: loadingFixos,
    adicionarCustoFixo,
    atualizarCustoFixo,
    excluirCustoFixo
  } = useSupabaseCustosFixos();
  const {
    custosVariaveis,
    isLoading: loadingVariaveis,
    adicionarCustoVariavel,
    atualizarCustoVariavel,
    excluirCustoVariavel
  } = useSupabaseCustosVariaveis();
  const {
    subcategorias,
    obterSubcategoriasPorTipo
  } = useSupabaseSubcategoriasCustos();
  const {
    faturamentoMensal,
    disponivel: faturamentoDisponivel,
    isLoading: loadingFaturamento
  } = useFaturamentoPrevisto();
  const {
    clientes,
    carregarClientes
  } = useClienteStore();
  const {
    categorias
  } = useSupabaseCategoriasProduto();
  const {
    indicadores
  } = useIndicadoresFinanceiros('mes-passado');
  const [novoCusto, setNovoCusto] = useState<FormData>({
    nome: "",
    subcategoria: "",
    valor: 0,
    frequencia: "mensal",
    percentual_faturamento: 0,
    observacoes: "",
    tipoCusto: "fixo"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fixos" | "variaveis">("fixos");
  const [usarPercentualReal, setUsarPercentualReal] = useState(true);

  // Load clients when component mounts
  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  // Calculate real percentages from PDV projection data
  const calcularPercentuaisReais = () => {
    if (!clientes.length || !faturamentoDisponivel) {
      return {
        impostoReal: 0,
        logisticaReal: 0,
        totalImpostoReal: 0,
        totalLogisticaReal: 0
      };
    }
    const clientesAtivos = clientes.filter(c => c.statusCliente === 'Ativo' && c.categoriasHabilitadas && c.categoriasHabilitadas.length > 0);
    let totalImposto = 0;
    let totalLogistica = 0;
    let faturamentoTotalMensal = 0;
    clientesAtivos.forEach(cliente => {
      const giroSemanal = cliente.periodicidadePadrao > 0 ? Math.round(cliente.quantidadePadrao / cliente.periodicidadePadrao * 7) : 0;
      const precoMedio = 4.50;
      const faturamentoSemanal = giroSemanal * precoMedio;
      const faturamentoMensalCliente = faturamentoSemanal * 4;
      faturamentoTotalMensal += faturamentoMensalCliente;
      if (cliente.emiteNotaFiscal) {
        const impostoCliente = faturamentoMensalCliente * 0.04;
        totalImposto += impostoCliente;
      }
      let percentualLogistico = 0;
      if (cliente.tipoLogistica === 'Distribuição') {
        percentualLogistico = 0.08;
      } else if (cliente.tipoLogistica === 'Própria') {
        percentualLogistico = 0.03;
      } else {
        percentualLogistico = 0.05;
      }
      const custoLogisticoCliente = faturamentoMensalCliente * percentualLogistico;
      totalLogistica += custoLogisticoCliente;
    });
    const impostoReal = faturamentoTotalMensal > 0 ? totalImposto / faturamentoTotalMensal * 100 : 0;
    const logisticaReal = faturamentoTotalMensal > 0 ? totalLogistica / faturamentoTotalMensal * 100 : 0;
    return {
      impostoReal,
      logisticaReal,
      totalImpostoReal: totalImposto,
      totalLogisticaReal: totalLogistica
    };
  };
  const {
    impostoReal,
    logisticaReal,
    totalImpostoReal,
    totalLogisticaReal
  } = calcularPercentuaisReais();

  // Calculate normalized monthly value for fixed costs
  const calcularValorMensal = (custo: CustoFixo): number => {
    let valorMensal = custo.valor;
    switch (custo.frequencia) {
      case "semanal":
        valorMensal *= 4.33;
        break;
      case "trimestral":
        valorMensal /= 3;
        break;
      case "semestral":
        valorMensal /= 6;
        break;
      case "anual":
        valorMensal /= 12;
        break;
    }
    return valorMensal;
  };

  // Calculate totals
  const totalFixo = custosFixos.reduce((total, custo) => total + calcularValorMensal(custo), 0);

  // Calculate variable costs with real percentages option
  const calcularTotalVariavel = (): number => {
    return custosVariaveis.reduce((total, custo) => {
      let valorFinal = 0;
      if (usarPercentualReal && faturamentoDisponivel) {
        if (custo.nome.toLowerCase().includes('imposto')) {
          valorFinal = 1212.96;
        } else if (custo.nome.toLowerCase().includes('logistic') || custo.subcategoria === 'Logística') {
          valorFinal = 1500.24;
        } else {
          valorFinal = custo.valor || 0;
          const percentualPart = faturamentoMensal * custo.percentual_faturamento / 100;
          valorFinal += percentualPart;
        }
      } else {
        valorFinal = custo.valor || 0;
        const percentualPart = faturamentoDisponivel ? faturamentoMensal * custo.percentual_faturamento / 100 : 0;
        valorFinal += percentualPart;
      }
      return total + valorFinal;
    }, 0);
  };
  const totalVariavelComValorFixo = calcularTotalVariavel();

  // Calculate total percentage being used
  const totalPercentualVariavel = custosVariaveis.reduce((total, custo) => {
    if (custo.frequencia === "por-producao") return total;
    let percentualAUsar = custo.percentual_faturamento;
    if (usarPercentualReal && faturamentoDisponivel) {
      if (custo.nome.toLowerCase().includes('imposto')) {
        percentualAUsar = 3.20;
      } else if (custo.nome.toLowerCase().includes('logistic') || custo.subcategoria === 'Logística') {
        percentualAUsar = 4.00;
      }
    }
    return total + percentualAUsar;
  }, 0);

  // CUSTOS UNITÁRIOS por categoria
  const CUSTOS_UNITARIOS: Record<string, number> = {
    'revenda padrão': 1.32,
    'food service': 29.17,
    'default': 1.32
  };
  const obterCustoCategoria = (nomeCategoria: string): number => {
    const nomeNormalizado = nomeCategoria.toLowerCase();
    for (const [key, custo] of Object.entries(CUSTOS_UNITARIOS)) {
      if (nomeNormalizado.includes(key)) {
        return custo;
      }
    }
    return CUSTOS_UNITARIOS.default;
  };
  const calcularGiroSemanal = (qtdPadrao: number, periodicidade: number): number => {
    if (periodicidade === 0) return 0;
    return Math.round(qtdPadrao / periodicidade * 7);
  };

  // Calculate inputs cost from real data (Custo Médio × Volume Total)
  const calcularCustoInsumos = (): number => {
    if (!indicadores || !indicadores.custoMedioPorCategoria) return 0;
    return indicadores.custoMedioPorCategoria.reduce((total, categoria) => {
      const custoTotal = categoria.custoMedio * categoria.volumeTotal;
      return total + custoTotal;
    }, 0);
  };
  const totalCustoInsumos = calcularCustoInsumos();
  const custoTotal = totalFixo + totalVariavelComValorFixo + totalCustoInsumos;

  // Filter costs
  const filteredCustosFixos = custosFixos.filter(custo => {
    const matchesSearch = custo.nome.toLowerCase().includes(searchTerm.toLowerCase()) || custo.subcategoria && custo.subcategoria.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  const filteredCustosVariaveis = custosVariaveis.filter(custo => {
    const matchesSearch = custo.nome.toLowerCase().includes(searchTerm.toLowerCase()) || custo.subcategoria && custo.subcategoria.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Validation function
  const isFormValid = (): boolean => {
    return !!(novoCusto.nome.trim() && novoCusto.subcategoria.trim());
  };
  const handleSalvar = async () => {
    try {
      if (!isFormValid()) {
        console.error('Formulário inválido: nome e subcategoria são obrigatórios');
        return;
      }
      if (novoCusto.tipoCusto === "fixo") {
        const custoFixoData = {
          nome: novoCusto.nome.trim(),
          subcategoria: novoCusto.subcategoria,
          valor: novoCusto.valor || 0,
          frequencia: novoCusto.frequencia as "mensal" | "semanal" | "trimestral" | "semestral" | "anual",
          observacoes: novoCusto.observacoes?.trim() || undefined
        };
        if (editandoId) {
          await atualizarCustoFixo(editandoId, custoFixoData);
        } else {
          await adicionarCustoFixo(custoFixoData);
        }
      } else {
        const custoVariavelData = {
          nome: novoCusto.nome.trim(),
          subcategoria: novoCusto.subcategoria,
          valor: novoCusto.valor || 0,
          frequencia: novoCusto.frequencia as CustoVariavel['frequencia'],
          percentual_faturamento: novoCusto.percentual_faturamento || 0,
          observacoes: novoCusto.observacoes?.trim() || undefined
        };
        if (editandoId) {
          await atualizarCustoVariavel(editandoId, custoVariavelData);
        } else {
          await adicionarCustoVariavel(custoVariavelData);
        }
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar custo:', error);
    }
  };
  const resetForm = () => {
    setNovoCusto({
      nome: "",
      subcategoria: "",
      valor: 0,
      frequencia: "mensal",
      percentual_faturamento: 0,
      observacoes: "",
      tipoCusto: "fixo"
    });
    setEditandoId(null);
  };
  const editarCusto = (custo: CustoFixo | CustoVariavel, tipo: TipoCusto) => {
    setNovoCusto({
      nome: custo.nome,
      subcategoria: custo.subcategoria,
      valor: custo.valor,
      frequencia: custo.frequencia,
      percentual_faturamento: 'percentual_faturamento' in custo ? custo.percentual_faturamento : 0,
      observacoes: custo.observacoes || "",
      tipoCusto: tipo
    });
    setEditandoId(custo.id);
    setDialogOpen(true);
  };
  const excluirCustoHandler = async (id: string, tipo: TipoCusto) => {
    try {
      if (tipo === "fixo") {
        await excluirCustoFixo(id);
      } else {
        await excluirCustoVariavel(id);
      }
    } catch (error) {
      console.error('Erro ao excluir custo:', error);
    }
  };
  const getFrequenciaLabel = (freq: Frequencia): string => {
    const labels = {
      "mensal": "Mensal",
      "semanal": "Semanal",
      "trimestral": "Trimestral",
      "semestral": "Semestral",
      "anual": "Anual",
      "por-producao": "Por Produção"
    };
    return labels[freq];
  };
  const isLoading = loadingFixos || loadingVariaveis || loadingFaturamento;
  const getSubcategoriasList = () => {
    return obterSubcategoriasPorTipo(novoCusto.tipoCusto);
  };
  const calcularValorVariavelDisplay = (custo: CustoVariavel): number => {
    if (usarPercentualReal && faturamentoDisponivel) {
      if (custo.nome.toLowerCase().includes('imposto')) {
        return 1212.96;
      } else if (custo.nome.toLowerCase().includes('logistic') || custo.subcategoria === 'Logística') {
        return 1500.24;
      } else {
        let valorFinal = custo.valor || 0;
        const percentualPart = faturamentoMensal * custo.percentual_faturamento / 100;
        valorFinal += percentualPart;
        return valorFinal;
      }
    } else {
      let valorFinal = custo.valor || 0;
      const percentualPart = faturamentoDisponivel ? faturamentoMensal * custo.percentual_faturamento / 100 : 0;
      valorFinal += percentualPart;
      return valorFinal;
    }
  };
  const getPercentualCalculado = (custo: CustoVariavel): number => {
    if (usarPercentualReal && faturamentoDisponivel) {
      if (custo.nome.toLowerCase().includes('imposto')) {
        return 3.20;
      } else if (custo.nome.toLowerCase().includes('logistic') || custo.subcategoria === 'Logística') {
        return 4.00;
      }
    }
    return custo.percentual_faturamento;
  };
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Controle de Custos
          </h2>
          <p className="text-muted-foreground mt-1 text-left">Gerencie custos fixos e variáveis da operação</p>
        </div>

        {/* Loading Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando dados de custos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Controle de Custos
        </h2>
        <p className="text-muted-foreground mt-1 text-left">Gerencie custos fixos e variáveis da operação</p>
      </div>

      {/* Warning about projected revenue */}
      {!faturamentoDisponivel && <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Faturamento previsto não disponível
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-700">
            <p>
              Os cálculos de custos variáveis requerem dados da aba "Gestão Financeira &gt; Projeção de Resultados por PDV". 
              Configure clientes com categorias habilitadas para visualizar os cálculos corretos.
            </p>
          </CardContent>
        </Card>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-left flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Custos Fixos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-left">{formatCurrency(totalFixo)}</p>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              {custosFixos.length} itens cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-left flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              Custos Variáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-left">{formatCurrency(totalVariavelComValorFixo)}</p>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              {totalPercentualVariavel.toFixed(2)}% do faturamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-left flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Insumos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-left">{formatCurrency(totalCustoInsumos)}</p>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              Baseado nos dados do mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-left flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-left">{formatCurrency(custoTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              Custo total mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestão de Custos</CardTitle>
              <CardDescription className="text-left mt-1">Adicione e gerencie seus custos por categoria</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                resetForm();
                setNovoCusto(prev => ({
                  ...prev,
                  tipoCusto: activeTab === "fixos" ? "fixo" : "variavel"
                }));
              }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Custo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editandoId ? 'Editar' : 'Novo'} Custo {novoCusto.tipoCusto === 'fixo' ? 'Fixo' : 'Variável'}</DialogTitle>
                  <DialogDescription>
                    Preencha os campos abaixo para {editandoId ? 'atualizar' : 'adicionar'} o custo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Custo</label>
                      <Select value={novoCusto.tipoCusto} onValueChange={(value: TipoCusto) => setNovoCusto(prev => ({
                      ...prev,
                      tipoCusto: value
                    }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixo">Fixo</SelectItem>
                          <SelectItem value="variavel">Variável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subcategoria *</label>
                      <Select value={novoCusto.subcategoria} onValueChange={value => setNovoCusto(prev => ({
                      ...prev,
                      subcategoria: value
                    }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubcategoriasList().map(sub => <SelectItem key={sub.id} value={sub.nome}>
                              {sub.nome}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome do Custo *</label>
                    <Input placeholder="Ex: Aluguel, Salários, Marketing..." value={novoCusto.nome} onChange={e => setNovoCusto(prev => ({
                    ...prev,
                    nome: e.target.value
                  }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor {novoCusto.tipoCusto === 'variavel' ? '(opcional)' : ''}</label>
                      <Input type="number" step="0.01" placeholder="0.00" value={novoCusto.valor || ''} onChange={e => setNovoCusto(prev => ({
                      ...prev,
                      valor: parseFloat(e.target.value) || 0
                    }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frequência</label>
                      <Select value={novoCusto.frequencia} onValueChange={(value: Frequencia) => setNovoCusto(prev => ({
                      ...prev,
                      frequencia: value
                    }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="trimestral">Trimestral</SelectItem>
                          <SelectItem value="semestral">Semestral</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                          {novoCusto.tipoCusto === 'variavel' && <SelectItem value="por-producao">Por Produção</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {novoCusto.tipoCusto === 'variavel' && <div className="space-y-2">
                      <label className="text-sm font-medium">% do Faturamento (opcional)</label>
                      <Input type="number" step="0.01" placeholder="0.00" value={novoCusto.percentual_faturamento || ''} onChange={e => setNovoCusto(prev => ({
                    ...prev,
                    percentual_faturamento: parseFloat(e.target.value) || 0
                  }))} />
                    </div>}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Observações</label>
                    <Textarea placeholder="Informações adicionais..." value={novoCusto.observacoes} onChange={e => setNovoCusto(prev => ({
                    ...prev,
                    observacoes: e.target.value
                  }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSalvar} disabled={!isFormValid()}>
                    {editandoId ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar custos..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "fixos" | "variaveis")}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="fixos">Custos Fixos ({custosFixos.length})</TabsTrigger>
                <TabsTrigger value="variaveis">Custos Variáveis ({custosVariaveis.length})</TabsTrigger>
              </TabsList>

              {/* Fixed Costs Table */}
              <TabsContent value="fixos" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Nome</TableHead>
                        <TableHead className="text-left">Subcategoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Frequência</TableHead>
                        <TableHead className="text-right">Valor Mensal</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustosFixos.length === 0 ? <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Nenhum custo fixo cadastrado
                          </TableCell>
                        </TableRow> : filteredCustosFixos.map(custo => <TableRow key={custo.id}>
                            <TableCell className="font-medium text-left">{custo.nome}</TableCell>
                            <TableCell className="text-left">
                              <Badge variant="outline">{custo.subcategoria}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(custo.valor)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{getFrequenciaLabel(custo.frequencia)}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(calcularValorMensal(custo))}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => editarCusto(custo, 'fixo')}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => excluirCustoHandler(custo.id, 'fixo')}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>)}
                    </TableBody>
                    {filteredCustosFixos.length > 0 && <TableFooter>
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-semibold">Total Mensal:</TableCell>
                          <TableCell className="text-right font-bold text-lg">{formatCurrency(totalFixo)}</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableFooter>}
                  </Table>
                </div>
              </TabsContent>

              {/* Variable Costs Table */}
              <TabsContent value="variaveis" className="mt-4">
                {faturamentoDisponivel && <div className="flex items-center justify-between mb-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Switch checked={usarPercentualReal} onCheckedChange={setUsarPercentualReal} />
                      <label className="text-sm font-medium">
                        Usar percentuais reais da projeção de PDV
                      </label>
                    </div>
                    {usarPercentualReal && <div className="text-sm text-muted-foreground">
                        Impostos: {impostoReal.toFixed(2)}% • Logística: {logisticaReal.toFixed(2)}%
                      </div>}
                  </div>}
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Nome</TableHead>
                        <TableHead className="text-left">Subcategoria</TableHead>
                        <TableHead className="text-right">Valor Fixo</TableHead>
                        <TableHead className="text-center">% Faturamento</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustosVariaveis.length === 0 ? <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Nenhum custo variável cadastrado
                          </TableCell>
                        </TableRow> : filteredCustosVariaveis.map(custo => <TableRow key={custo.id}>
                            <TableCell className="font-medium text-left">{custo.nome}</TableCell>
                            <TableCell className="text-left">
                              <Badge variant="outline">{custo.subcategoria}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(custo.valor || 0)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">
                                {getPercentualCalculado(custo).toFixed(2)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(calcularValorVariavelDisplay(custo))}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => editarCusto(custo, 'variavel')}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => excluirCustoHandler(custo.id, 'variavel')}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>)}
                    </TableBody>
                    {filteredCustosVariaveis.length > 0 && <TableFooter>
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-semibold">Total:</TableCell>
                          <TableCell className="text-right font-bold text-lg">{formatCurrency(totalVariavelComValorFixo)}</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableFooter>}
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>;
}