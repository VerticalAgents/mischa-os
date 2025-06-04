
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
import { Plus, Edit, Trash2, Search, Percent } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useProjectionStore } from "@/hooks/useProjectionStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
type CategoriaCusto = "fixo" | "variavel";
type Frequencia = "mensal" | "semanal" | "trimestral" | "semestral" | "anual" | "por-producao";

interface Custo {
  id: string;
  nome: string;
  categoria: CategoriaCusto;
  subcategoria?: string;
  valor: number;
  frequencia: Frequencia;
  observacoes?: string;
}

export default function Custos() {
  const [custos, setCustos] = useState<Custo[]>([]);
  const [novoCusto, setNovoCusto] = useState<Partial<Custo>>({
    categoria: "fixo",
    frequencia: "mensal"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaCusto | "todos">("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fixos" | "variaveis">("fixos");
  
  // Get active DRE for percentage calculation
  const { getActiveScenario } = useProjectionStore();
  const activeDRE = getActiveScenario();
  const faturamentoPrevisto = activeDRE?.totalRevenue || 0;

  // Initialize custos with mock data
  useEffect(() => {
    const mockData: Custo[] = [
      {
        id: "1",
        nome: "Aluguel",
        categoria: "fixo",
        subcategoria: "Instalações",
        valor: 3500,
        frequencia: "mensal",
        observacoes: "Contrato reajustado em janeiro"
      },
      {
        id: "2",
        nome: "Energia Elétrica",
        categoria: "fixo",
        subcategoria: "Utilidades",
        valor: 1200,
        frequencia: "mensal",
        observacoes: "Média dos últimos 6 meses"
      },
      {
        id: "3",
        nome: "Farinha de Trigo",
        categoria: "variavel",
        subcategoria: "Matéria-prima",
        valor: 4.50,
        frequencia: "por-producao",
        observacoes: "Preço por kg"
      },
      {
        id: "4",
        nome: "Marketing Digital",
        categoria: "fixo",
        subcategoria: "Marketing",
        valor: 1500,
        frequencia: "mensal"
      },
      {
        id: "5",
        nome: "Manutenção Equipamentos",
        categoria: "fixo",
        subcategoria: "Manutenção",
        valor: 800,
        frequencia: "trimestral"
      },
      {
        id: "6",
        nome: "Embalagens",
        categoria: "variavel",
        subcategoria: "Materiais",
        valor: 2500,
        frequencia: "mensal",
        observacoes: "Custo estimado com base na produção atual"
      },
      {
        id: "7", 
        nome: "Entregas",
        categoria: "variavel",
        subcategoria: "Logística",
        valor: 4200,
        frequencia: "mensal",
        observacoes: "Serviço terceirizado de entregas"
      },
      {
        id: "8",
        nome: "Matéria-prima Geral",
        categoria: "variavel",
        subcategoria: "Produção",
        valor: 12000,
        frequencia: "mensal",
        observacoes: "Todas as matérias-primas exceto farinha"
      }
    ];
    
    setCustos(mockData);
  }, []);

  // Filter custos based on activeTab and searchTerm
  const filteredCustos = custos.filter(custo => {
    const matchesSearch = custo.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (custo.subcategoria && custo.subcategoria.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategoria = categoriaFilter === "todos" || custo.categoria === categoriaFilter;
    const matchesTab = (activeTab === "fixos" && custo.categoria === "fixo") || 
                      (activeTab === "variaveis" && custo.categoria === "variavel");
    
    return matchesSearch && matchesCategoria && matchesTab;
  });

  // Calculate percentage of revenue for variable costs
  const calcularPorcentagemFaturamento = (valor: number): number => {
    if (!faturamentoPrevisto || faturamentoPrevisto === 0) return 0;
    return (valor / faturamentoPrevisto) * 100;
  };

  // Calculate normalized monthly value for fixed costs
  const calcularValorMensal = (custo: Custo): number => {
    let valorMensal = custo.valor;
    switch (custo.frequencia) {
      case "semanal": valorMensal *= 4.33; break;
      case "trimestral": valorMensal /= 3; break;
      case "semestral": valorMensal /= 6; break;
      case "anual": valorMensal /= 12; break;
      case "por-producao": return 0; // Skip for production-based costs
    }
    return valorMensal;
  };

  // Calculate totals
  const totalFixo = custos
    .filter(custo => custo.categoria === "fixo")
    .reduce((total, custo) => total + calcularValorMensal(custo), 0);
  
  const totalVariavel = custos
    .filter(custo => custo.categoria === "variavel")
    .reduce((total, custo) => {
      if (custo.frequencia === "por-producao") return total;
      return total + custo.valor;
    }, 0);
  
  const totalPercentualVariavel = custos
    .filter(custo => custo.categoria === "variavel")
    .reduce((total, custo) => {
      if (custo.frequencia === "por-producao") return total;
      return total + calcularPorcentagemFaturamento(custo.valor);
    }, 0);

  const handleSalvar = () => {
    if (editandoId) {
      setCustos(prev => prev.map(custo => 
        custo.id === editandoId ? {...novoCusto, id: editandoId} as Custo : custo
      ));
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      setCustos(prev => [...prev, {...novoCusto, id} as Custo]);
    }
    setDialogOpen(false);
    setNovoCusto({ categoria: "fixo", frequencia: "mensal" });
    setEditandoId(null);
  };

  const editarCusto = (custo: Custo) => {
    setNovoCusto({ ...custo });
    setEditandoId(custo.id);
    setDialogOpen(true);
  };

  const excluirCusto = (id: string) => {
    setCustos(prev => prev.filter(custo => custo.id !== id));
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

  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Custos"
        description="Gerencie todos os custos da operação"
      />

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
          <Select
            value={categoriaFilter}
            onValueChange={(value) => setCategoriaFilter(value as CategoriaCusto | "todos")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="fixo">Fixos</SelectItem>
              <SelectItem value="variavel">Variáveis</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                  <label htmlFor="categoria" className="text-sm font-medium">Categoria</label>
                  <Select
                    value={novoCusto.categoria}
                    onValueChange={(value) => setNovoCusto({...novoCusto, categoria: value as CategoriaCusto})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixo">Fixo</SelectItem>
                      <SelectItem value="variavel">Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="subcategoria" className="text-sm font-medium">Subcategoria</label>
                  <Input
                    id="subcategoria"
                    placeholder="Subcategoria (opcional)"
                    value={novoCusto.subcategoria || ""}
                    onChange={(e) => setNovoCusto({...novoCusto, subcategoria: e.target.value})}
                  />
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
                      <SelectItem value="por-producao">Por Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {novoCusto.categoria === "variavel" && (
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Percentual do Faturamento</label>
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Percent className="h-3 w-3 mr-1" />
                      {(novoCusto.valor ? calcularPorcentagemFaturamento(novoCusto.valor) : 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Baseado no faturamento previsto atual: {formatCurrency(faturamentoPrevisto)}
                  </div>
                </div>
              )}
              
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
              {formatCurrency(totalVariavel)}
            </span>
            <span className="text-sm text-muted-foreground flex items-center mt-1">
              <Percent className="h-3 w-3 mr-1" />
              {totalPercentualVariavel.toFixed(2)}% do faturamento previsto
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subcategorias</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-2xl font-bold">{new Set(custos.filter(c => c.subcategoria).map(c => c.subcategoria)).size}</span>
            <div className="flex gap-2">
              <Badge variant="outline">{custos.filter(c => c.categoria === "fixo").length} fixos</Badge>
              <Badge variant="outline">{custos.filter(c => c.categoria === "variavel").length} variáveis</Badge>
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
                  {filteredCustos.filter(c => c.categoria === "fixo").map((custo) => (
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
                          <Button variant="ghost" size="icon" onClick={() => excluirCusto(custo.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCustos.filter(c => c.categoria === "fixo").length === 0 && (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variaveis">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Custos Variáveis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
                  {filteredCustos.filter(c => c.categoria === "variavel").map((custo) => (
                    <TableRow key={custo.id}>
                      <TableCell className="font-medium">{custo.nome}</TableCell>
                      <TableCell>{custo.subcategoria}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(custo.valor)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end">
                          <Percent className="h-3 w-3 mr-1" />
                          {calcularPorcentagemFaturamento(custo.valor).toFixed(2)}%
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
                          <Button variant="ghost" size="icon" onClick={() => excluirCusto(custo.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCustos.filter(c => c.categoria === "variavel").length === 0 && (
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
                      {formatCurrency(totalVariavel)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
