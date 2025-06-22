import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableFooter
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, Percent, AlertTriangle, TrendingUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useSupabaseCustosFixos, CustoFixo } from "@/hooks/useSupabaseCustosFixos";
import { useSupabaseCustosVariaveis, CustoVariavel } from "@/hooks/useSupabaseCustosVariaveis";
import { useFaturamentoPrevisto } from "@/hooks/useFaturamentoPrevisto";
import { useClienteStore } from "@/hooks/useClienteStore";

// Subcategorias predefinidas
const SUBCATEGORIAS_FIXAS = [
  "Instalações",
  "Utilidades", 
  "Marketing",
  "Manutenção",
  "Infraestrutura",
  "Investimentos"
];

const SUBCATEGORIAS_VARIAVEIS = [
  "Matéria-prima",
  "Logística",
  "Produção", 
  "Materiais"
];

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

export default function Custos() {
  const { custosFixos, isLoading: loadingFixos, adicionarCustoFixo, atualizarCustoFixo, excluirCustoFixo } = useSupabaseCustosFixos();
  const { custosVariaveis, isLoading: loadingVariaveis, adicionarCustoVariavel, atualizarCustoVariavel, excluirCustoVariavel } = useSupabaseCustosVariaveis();
  const { faturamentoMensal, disponivel: faturamentoDisponivel, isLoading: loadingFaturamento } = useFaturamentoPrevisto();
  const { clientes } = useClienteStore();

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

  // Calculate real percentages from PDV projection data
  const calcularPercentuaisReais = () => {
    if (!clientes.length || !faturamentoDisponivel) {
      return { impostoReal: 0, logisticaReal: 0, totalImpostoReal: 0, totalLogisticaReal: 0 };
    }

    const clientesAtivos = clientes.filter(
      c => c.statusCliente === 'Ativo' && c.categoriasHabilitadas && c.categoriasHabilitadas.length > 0
    );

    let totalImposto = 0;
    let totalLogistica = 0;

    clientesAtivos.forEach(cliente => {
      // Calculate weekly volume
      const giroSemanal = cliente.periodicidadePadrao > 0 
        ? Math.round(cliente.quantidadePadrao / cliente.periodicidadePadrao * 7)
        : 0;
      
      // Mock price calculation based on category (this should match the PDV projection logic)
      const precoMedio = 4.50; // This should be calculated based on client categories
      const faturamentoSemanal = giroSemanal * precoMedio;
      
      // Calculate monthly values (weekly * 4)
      const faturamentoMensal = faturamentoSemanal * 4;
      
      // Calculate taxes (4% of revenue for clients that emit NF)
      if (cliente.emiteNotaFiscal) {
        const impostoCliente = faturamentoMensal * 0.04;
        totalImposto += impostoCliente;
      }
      
      // Calculate logistics cost based on client logistics type
      let percentualLogistico = 0;
      if (cliente.tipoLogistica === 'Distribuição') {
        percentualLogistico = 0.08; // 8% for distribution
      } else if (cliente.tipoLogistica === 'Própria') {
        percentualLogistico = 0.03; // 3% for own logistics
      } else {
        percentualLogistico = 0.05; // 5% for others
      }
      
      const custoLogisticoCliente = faturamentoMensal * percentualLogistico;
      totalLogistica += custoLogisticoCliente;
    });

    const impostoReal = faturamentoMensal > 0 ? (totalImposto / faturamentoMensal) * 100 : 0;
    const logisticaReal = faturamentoMensal > 0 ? (totalLogistica / faturamentoMensal) * 100 : 0;

    return { 
      impostoReal, 
      logisticaReal, 
      totalImpostoReal: totalImposto,
      totalLogisticaReal: totalLogistica
    };
  };

  const { impostoReal, logisticaReal, totalImpostoReal, totalLogisticaReal } = calcularPercentuaisReais();

  // Calculate normalized monthly value for fixed costs
  const calcularValorMensal = (custo: CustoFixo): number => {
    let valorMensal = custo.valor;
    switch (custo.frequencia) {
      case "semanal": valorMensal *= 4.33; break;
      case "trimestral": valorMensal /= 3; break;
      case "semestral": valorMensal /= 6; break;
      case "anual": valorMensal /= 12; break;
    }
    return valorMensal;
  };

  // Calculate totals
  const totalFixo = custosFixos.reduce((total, custo) => total + calcularValorMensal(custo), 0);
  
  // Calculate variable costs with real percentages option
  const calcularTotalVariavel = (): number => {
    return custosVariaveis.reduce((total, custo) => {
      let valorFinal = custo.valor || 0;
      
      // Use real values if toggle is on and it's tax or logistics
      if (usarPercentualReal && faturamentoDisponivel) {
        if (custo.nome.toLowerCase().includes('imposto')) {
          valorFinal += totalImpostoReal;
        } else if (custo.nome.toLowerCase().includes('logistic') || custo.subcategoria === 'Logística') {
          valorFinal += totalLogisticaReal;
        } else {
          // For other variable costs, use the standard percentage calculation
          const percentualPart = (faturamentoMensal * custo.percentual_faturamento) / 100;
          valorFinal += percentualPart;
        }
      } else {
        // Standard calculation with configured percentages
        const percentualPart = faturamentoDisponivel 
          ? (faturamentoMensal * custo.percentual_faturamento) / 100
          : 0;
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
        percentualAUsar = impostoReal;
      } else if (custo.nome.toLowerCase().includes('logistic') || custo.subcategoria === 'Logística') {
        percentualAUsar = logisticaReal;
      }
    }
    
    return total + percentualAUsar;
  }, 0);

  // Calculate inputs cost from client projections
  const calcularCustoInsumos = (): number => {
    if (!clientes.length) return 0;
    
    const clientesAtivos = clientes.filter(
      c => c.statusCliente === 'Ativo' && c.contabilizarGiroMedio
    );
    
    // Mock calculation based on client volume and average input cost
    // Future: integrate with real input cost calculation from recipes
    const custoMedioInsumosPorUnidade = 2.10; // Average input cost per unit
    const volumeMensalTotal = clientesAtivos.reduce((total, cliente) => {
      const volumeSemanal = cliente.quantidadePadrao * (7 / cliente.periodicidadePadrao);
      return total + (volumeSemanal * 4.33); // Convert to monthly
    }, 0);
    
    return volumeMensalTotal * custoMedioInsumosPorUnidade;
  };

  const totalCustoInsumos = calcularCustoInsumos();
  
  // Calculate total cost (fixed + variable + inputs)
  const custoTotal = totalFixo + totalVariavelComValorFixo + totalCustoInsumos;

  // Filter costs based on activeTab and searchTerm
  const filteredCustosFixos = custosFixos.filter(custo => {
    const matchesSearch = custo.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (custo.subcategoria && custo.subcategoria.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const filteredCustosVariaveis = custosVariaveis.filter(custo => {
    const matchesSearch = custo.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (custo.subcategoria && custo.subcategoria.toLowerCase().includes(searchTerm.toLowerCase()));
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

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const isLoading = loadingFixos || loadingVariaveis;

  const getSubcategoriasList = () => {
    return novoCusto.tipoCusto === "fixo" ? SUBCATEGORIAS_FIXAS : SUBCATEGORIAS_VARIAVEIS;
  };

  // Calculate variable cost display value with real percentage option
  const calcularValorVariavelDisplay = (custo: CustoVariavel): number => {
    let valorFinal = custo.valor || 0;
    
    if (usarPercentualReal && faturamentoDisponivel) {
      if (custo.nome.toLowerCase().includes('imposto')) {
        valorFinal += totalImpostoReal;
      } else if (custo.nome.toLowerCase().includes('logistic') || custo.subcategoria === 'Logística') {
        valorFinal += totalLogisticaReal;
      } else {
        const percentualPart = (faturamentoMensal * custo.percentual_faturamento) / 100;
        valorFinal += percentualPart;
      }
    } else {
      const percentualPart = faturamentoDisponivel 
        ? (faturamentoMensal * custo.percentual_faturamento) / 100
        : 0;
      valorFinal += percentualPart;
    }
    
    return valorFinal;
  };

  // Get real percentage for display
  const getPercentualReal = (custo: CustoVariavel): number | null => {
    if (!faturamentoDisponivel) return null;
    
    if (custo.nome.toLowerCase().includes('imposto')) {
      return impostoReal;
    } else if (custo.nome.toLowerCase().includes('logistic') || custo.subcategoria === 'Logística') {
      return logisticaReal;
    }
    
    return null;
  };

  // Get percentage being used for calculation
  const getPercentualCalculado = (custo: CustoVariavel): number => {
    if (usarPercentualReal && faturamentoDisponivel) {
      if (custo.nome.toLowerCase().includes('imposto')) {
        return impostoReal;
      } else if (custo.nome.toLowerCase().includes('logistic') || custo.subcategoria === 'Logística') {
        return logisticaReal;
      }
    }
    return custo.percentual_faturamento;
  };

  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Custos"
        description="Gerencie todos os custos da operação"
      />

      {/* Warning about projected revenue */}
      {!faturamentoDisponivel && (
        <Card className="border-amber-200 bg-amber-50 mt-6">
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
        </Card>
      )}

      <div className="flex justify-between items-center mb-6 mt-6">
        <div className="flex gap-4">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar custos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Custo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editandoId ? "Editar Custo" : "Adicionar Novo Custo"}</DialogTitle>
              <DialogDescription>
                Preencha os detalhes do custo abaixo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nome" className="text-sm font-medium">Nome *</label>
                  <Input
                    id="nome"
                    placeholder="Nome do custo"
                    value={novoCusto.nome}
                    onChange={(e) => setNovoCusto({...novoCusto, nome: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="tipoCusto" className="text-sm font-medium">Tipo de Custo *</label>
                  <Select
                    value={novoCusto.tipoCusto}
                    onValueChange={(value) => setNovoCusto({
                      ...novoCusto, 
                      tipoCusto: value as TipoCusto,
                      subcategoria: "", // Reset subcategoria quando muda o tipo
                      valor: 0,
                      percentual_faturamento: 0
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixo">Custo Fixo</SelectItem>
                      <SelectItem value="variavel">Custo Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="subcategoria" className="text-sm font-medium">Subcategoria *</label>
                  <Select
                    value={novoCusto.subcategoria}
                    onValueChange={(value) => setNovoCusto({...novoCusto, subcategoria: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSubcategoriasList().map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="frequencia" className="text-sm font-medium">Frequência</label>
                  <Select
                    value={novoCusto.frequencia}
                    onValueChange={(value) => setNovoCusto({...novoCusto, frequencia: value as Frequencia})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                      {novoCusto.tipoCusto === "variavel" && (
                        <SelectItem value="por-producao">Por Produção</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {novoCusto.tipoCusto === "fixo" ? (
                <div>
                  <label htmlFor="valor" className="text-sm font-medium">Valor</label>
                  <Input
                    id="valor"
                    type="number"
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    value={novoCusto.valor || ""}
                    onChange={(e) => {
                      const valorStr = e.target.value;
                      const valor = valorStr === "" ? 0 : parseFloat(valorStr);
                      setNovoCusto({ ...novoCusto, valor });
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="valor" className="text-sm font-medium">Valor Fixo (opcional)</label>
                    <Input
                      id="valor"
                      type="number"
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      value={novoCusto.valor || ""}
                      onChange={(e) => {
                        const valorStr = e.target.value;
                        const valor = valorStr === "" ? 0 : parseFloat(valorStr);
                        setNovoCusto({ ...novoCusto, valor });
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="percentual" className="text-sm font-medium">% do Faturamento</label>
                    <Input
                      id="percentual"
                      type="number"
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      value={novoCusto.percentual_faturamento || ""}
                      onChange={(e) => {
                        const valorStr = e.target.value;
                        const percentual = valorStr === "" ? 0 : parseFloat(valorStr);
                        setNovoCusto({ ...novoCusto, percentual_faturamento: percentual });
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="observacoes" className="text-sm font-medium">Observações</label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais"
                  rows={3}
                  value={novoCusto.observacoes}
                  onChange={(e) => setNovoCusto({...novoCusto, observacoes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvar}
                disabled={!isFormValid()}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo expandidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Custos Fixos (mensal)</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {formatCurrency(totalFixo)}
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Custos Variáveis (mensal)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <span className="text-2xl font-bold">
              {formatCurrency(totalVariavelComValorFixo)}
            </span>
            <span className="text-sm text-muted-foreground flex items-center mt-1">
              <Percent className="h-3 w-3 mr-1" />
              {totalPercentualVariavel.toFixed(2)}% do faturamento previsto
            </span>
            {faturamentoDisponivel && (
              <span className="text-xs text-muted-foreground mt-1">
                Base: {formatCurrency(faturamentoMensal)}
              </span>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo de Insumos (mensal)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <span className="text-2xl font-bold">
              {formatCurrency(totalCustoInsumos)}
            </span>
            <span className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {totalCustoInsumos === 0 ? "Sem dados disponíveis" : "Baseado na projeção por PDV"}
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total (mensal)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <span className="text-2xl font-bold">
              {formatCurrency(custoTotal)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Fixos + Variáveis + Insumos
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subcategorias</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-2xl font-bold">
              {new Set([...custosFixos.map(c => c.subcategoria), ...custosVariaveis.map(c => c.subcategoria)]).size}
            </span>
            <div className="flex gap-2">
              <Badge variant="outline">{custosFixos.length} fixos</Badge>
              <Badge variant="outline">{custosVariaveis.length} variáveis</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Custos Fixos e Variáveis */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "fixos" | "variaveis")}>
        <TabsList className="mb-4">
          <TabsTrigger value="fixos">Custos Fixos</TabsTrigger>
          <TabsTrigger value="variaveis">Custos Variáveis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fixos">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Custos Fixos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Nome</TableHead>
                      <TableHead>Subcategoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustosFixos.map((custo) => (
                      <TableRow key={custo.id}>
                        <TableCell className="font-medium">{custo.nome}</TableCell>
                        <TableCell>{custo.subcategoria}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(custo.valor)}
                        </TableCell>
                        <TableCell>{getFrequenciaLabel(custo.frequencia)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={custo.observacoes}>
                          {custo.observacoes}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => editarCusto(custo, "fixo")}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => excluirCustoHandler(custo.id, "fixo")}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCustosFixos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          Nenhum custo fixo encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>Total Mensal</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totalFixo)}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variaveis">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Custos Variáveis</CardTitle>
              
              {/* Toggle for real percentages */}
              <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 rounded-lg">
                <Switch
                  id="usar-percentual-real"
                  checked={usarPercentualReal}
                  onCheckedChange={setUsarPercentualReal}
                />
                <div className="flex flex-col">
                  <label 
                    htmlFor="usar-percentual-real" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    Usar % Real de Imposto e Logística
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Calcula valores baseados nos dados reais da Projeção Detalhada por Cliente
                  </span>
                  {usarPercentualReal && faturamentoDisponivel && (
                    <div className="text-xs text-blue-600 mt-1">
                      <div>• Imposto Real: {formatCurrency(totalImpostoReal)} ({impostoReal.toFixed(2)}%)</div>
                      <div>• Logística Real: {formatCurrency(totalLogisticaReal)} ({logisticaReal.toFixed(2)}%)</div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Nome</TableHead>
                      <TableHead>Subcategoria</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">Valor Fixo</TableHead>
                      <TableHead className="text-right">% Configurado</TableHead>
                      <TableHead className="text-right">% Usado</TableHead>
                      <TableHead className="text-right">% Real</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustosVariaveis.map((custo) => {
                      const percentualReal = getPercentualReal(custo);
                      const percentualUsado = getPercentualCalculado(custo);
                      const isUsingRealData = usarPercentualReal && percentualReal !== null;
                      
                      return (
                        <TableRow key={custo.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {custo.nome}
                              {isUsingRealData && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  Real
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{custo.subcategoria}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col">
                              <span className={isUsingRealData ? "font-semibold text-blue-600" : ""}>
                                {formatCurrency(calcularValorVariavelDisplay(custo))}
                              </span>
                              {isUsingRealData && (
                                <span className="text-xs text-blue-500">Fonte: Projeção PDV</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(custo.valor || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="flex items-center justify-end">
                              <Percent className="h-3 w-3 mr-1" />
                              {custo.percentual_faturamento.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="flex items-center justify-end">
                              <Percent className="h-3 w-3 mr-1" />
                              <span className={isUsingRealData ? "font-semibold text-blue-600" : ""}>
                                {percentualUsado.toFixed(2)}%
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {percentualReal !== null ? (
                              <span className="flex items-center justify-end">
                                <Percent className="h-3 w-3 mr-1" />
                                <span className="text-blue-600">
                                  {percentualReal.toFixed(2)}%
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>{getFrequenciaLabel(custo.frequencia)}</TableCell>
                          <TableCell className="max-w-xs truncate" title={custo.observacoes}>
                            {custo.observacoes}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => editarCusto(custo, "variavel")}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => excluirCustoVariavel(custo.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredCustosVariaveis.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                          Nenhum custo variável encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col">
                          <span className={usarPercentualReal ? "font-semibold text-blue-600" : ""}>
                            {formatCurrency(totalVariavelComValorFixo)}
                          </span>
                          {usarPercentualReal && (
                            <span className="text-xs text-blue-500">Com dados reais</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(custosVariaveis.reduce((total, custo) => total + (custo.valor || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end">
                          <Percent className="h-3 w-3 mr-1" />
                          {custosVariaveis.reduce((total, custo) => total + custo.percentual_faturamento, 0).toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end">
                          <Percent className="h-3 w-3 mr-1" />
                          <span className={usarPercentualReal ? "font-semibold text-blue-600" : ""}>
                            {totalPercentualVariavel.toFixed(2)}%
                          </span>
                        </span>
                      </TableCell>
                      <TableCell colSpan={4}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
