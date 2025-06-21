
import { useState } from "react";
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
import { Plus, Edit, Trash2, Search, Percent, AlertTriangle, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseCustosFixos, CustoFixo } from "@/hooks/useSupabaseCustosFixos";
import { useSupabaseCustosVariaveis, CustoVariavel } from "@/hooks/useSupabaseCustosVariaveis";
import { useFaturamentoPrevisto } from "@/hooks/useFaturamentoPrevisto";

// Subcategorias predefinidas
const SUBCATEGORIAS_FIXAS = [
  "Instalações",
  "Utilidades", 
  "Marketing",
  "Manutenção",
  "RH"
];

const SUBCATEGORIAS_VARIAVEIS = [
  "Matéria-prima",
  "Logística",
  "Produção", 
  "Embalagens"
];

type Frequencia = "mensal" | "semanal" | "trimestral" | "semestral" | "anual" | "por-producao";

export default function Custos() {
  const { custosFixos, isLoading: loadingFixos, adicionarCustoFixo, atualizarCustoFixo, excluirCustoFixo } = useSupabaseCustosFixos();
  const { custosVariaveis, isLoading: loadingVariaveis, adicionarCustoVariavel, atualizarCustoVariavel, excluirCustoVariavel } = useSupabaseCustosVariaveis();
  const { faturamentoMensal, disponivel: faturamentoDisponivel, isLoading: loadingFaturamento } = useFaturamentoPrevisto();

  const [novoCusto, setNovoCusto] = useState<Partial<CustoFixo & CustoVariavel>>({
    categoria: "fixo",
    frequencia: "mensal"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<"fixo" | "variavel" | "todos">("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fixos" | "variaveis">("fixos");

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
  
  // Calculate variable costs based on projected monthly revenue
  const totalPercentualVariavel = custosVariaveis.reduce((total, custo) => {
    if (custo.frequencia === "por-producao") return total;
    return total + custo.percentual_faturamento;
  }, 0);

  const totalVariavelCalculado = faturamentoDisponivel 
    ? (faturamentoMensal * totalPercentualVariavel) / 100
    : 0;

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

  const handleSalvar = async () => {
    try {
      if (activeTab === "fixos") {
        const custoFixoData = {
          nome: novoCusto.nome!,
          subcategoria: novoCusto.subcategoria!,
          valor: novoCusto.valor!,
          frequencia: novoCusto.frequencia as CustoFixo['frequencia'],
          observacoes: novoCusto.observacoes
        };

        if (editandoId) {
          await atualizarCustoFixo(editandoId, custoFixoData);
        } else {
          await adicionarCustoFixo(custoFixoData);
        }
      } else {
        const custoVariavelData = {
          nome: novoCusto.nome!,
          subcategoria: novoCusto.subcategoria!,
          valor: novoCusto.valor!,
          frequencia: novoCusto.frequencia as CustoVariavel['frequencia'],
          percentual_faturamento: novoCusto.percentual_faturamento || 0,
          observacoes: novoCusto.observacoes
        };

        if (editandoId) {
          await atualizarCustoVariavel(editandoId, custoVariavelData);
        } else {
          await adicionarCustoVariavel(custoVariavelData);
        }
      }

      setDialogOpen(false);
      setNovoCusto({ categoria: "fixo", frequencia: "mensal" });
      setEditandoId(null);
    } catch (error) {
      console.error('Erro ao salvar custo:', error);
    }
  };

  const editarCusto = (custo: CustoFixo | CustoVariavel) => {
    setNovoCusto({ ...custo, categoria: activeTab === "fixos" ? "fixo" : "variavel" });
    setEditandoId(custo.id);
    setDialogOpen(true);
  };

  const excluirCustoHandler = async (id: string) => {
    try {
      if (activeTab === "fixos") {
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
              Os cálculos de custos variáveis requerem dados da aba "Gestão Financeira > Projeção de Resultados por PDV". 
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
              setNovoCusto({ categoria: activeTab === "fixos" ? "fixo" : "variavel", frequencia: "mensal" });
              setEditandoId(null);
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
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="nome" className="text-sm font-medium">Nome</label>
                <Input
                  id="nome"
                  placeholder="Nome do custo"
                  value={novoCusto.nome || ""}
                  onChange={(e) => setNovoCusto({...novoCusto, nome: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="subcategoria" className="text-sm font-medium">Subcategoria</label>
                  <Select
                    value={novoCusto.subcategoria}
                    onValueChange={(value) => setNovoCusto({...novoCusto, subcategoria: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(activeTab === "fixos" ? SUBCATEGORIAS_FIXAS : SUBCATEGORIAS_VARIAVEIS).map(sub => (
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
                      {activeTab === "variaveis" && (
                        <SelectItem value="por-producao">Por Produção</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                      const valor = valorStr === "" ? undefined : parseFloat(valorStr);
                      setNovoCusto({ ...novoCusto, valor });
                    }}
                  />
                </div>
                {activeTab === "variaveis" && (
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
                        const percentual = valorStr === "" ? undefined : parseFloat(valorStr);
                        setNovoCusto({ ...novoCusto, percentual_faturamento: percentual });
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="observacoes" className="text-sm font-medium">Observações</label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais"
                  rows={3}
                  value={novoCusto.observacoes || ""}
                  onChange={(e) => setNovoCusto({...novoCusto, observacoes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              {formatCurrency(totalVariavelCalculado)}
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
                            <Button variant="ghost" size="icon" onClick={() => editarCusto(custo)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => excluirCustoHandler(custo.id)}>
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
                      <TableHead className="text-right">% do Faturamento</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustosVariaveis.map((custo) => (
                      <TableRow key={custo.id}>
                        <TableCell className="font-medium">{custo.nome}</TableCell>
                        <TableCell>{custo.subcategoria}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(custo.valor)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end">
                            <Percent className="h-3 w-3 mr-1" />
                            {custo.percentual_faturamento.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>{getFrequenciaLabel(custo.frequencia)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={custo.observacoes}>
                          {custo.observacoes}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => editarCusto(custo)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => excluirCustoVariavel(custo.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCustosVariaveis.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          Nenhum custo variável encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totalVariavelCalculado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end">
                          <Percent className="h-3 w-3 mr-1" />
                          {totalPercentualVariavel.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
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
