
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { useProjectionStore } from "@/hooks/useProjectionStore";
import { formatCurrency } from "@/lib/utils";
import { Edit, Plus, Trash } from "lucide-react";

type TipoCusto = "Fixo" | "Variável";
type FrequenciaCusto = "Mensal" | "Trimestral" | "Semestral" | "Anual" | "Eventual";
type TabelaCusto = "fixos" | "variaveis";

interface Custo {
  id: string;
  nome: string;
  valor: number;
  tipo: TipoCusto;
  frequencia: FrequenciaCusto;
  subcategoria: string;
  observacoes?: string;
}

const custosMock: Custo[] = [
  { 
    id: "1", 
    nome: "Aluguel", 
    valor: 3500, 
    tipo: "Fixo", 
    frequencia: "Mensal", 
    subcategoria: "Instalações",
    observacoes: "Contrato com reajuste anual" 
  },
  { 
    id: "2", 
    nome: "Energia elétrica", 
    valor: 1200, 
    tipo: "Variável", 
    frequencia: "Mensal", 
    subcategoria: "Utilidades",
  },
  { 
    id: "3", 
    nome: "Água", 
    valor: 450, 
    tipo: "Variável", 
    frequencia: "Mensal", 
    subcategoria: "Utilidades",
  },
  { 
    id: "4", 
    nome: "Internet e Telefone", 
    valor: 350, 
    tipo: "Fixo", 
    frequencia: "Mensal", 
    subcategoria: "Tecnologia",
  },
  { 
    id: "5", 
    nome: "Salários", 
    valor: 15000, 
    tipo: "Fixo", 
    frequencia: "Mensal", 
    subcategoria: "Pessoal",
  },
  { 
    id: "6", 
    nome: "FGTS e Encargos", 
    valor: 4500, 
    tipo: "Fixo", 
    frequencia: "Mensal", 
    subcategoria: "Pessoal",
  },
  { 
    id: "7", 
    nome: "Matéria-prima", 
    valor: 12000, 
    tipo: "Variável", 
    frequencia: "Mensal", 
    subcategoria: "Produção",
  },
  { 
    id: "8", 
    nome: "Embalagens", 
    valor: 2500, 
    tipo: "Variável", 
    frequencia: "Mensal", 
    subcategoria: "Produção",
  },
  { 
    id: "9", 
    nome: "Entregas", 
    valor: 4200, 
    tipo: "Variável", 
    frequencia: "Mensal", 
    subcategoria: "Logística",
  },
  { 
    id: "10", 
    nome: "Manutenção de Equipamentos", 
    valor: 800, 
    tipo: "Fixo", 
    frequencia: "Trimestral", 
    subcategoria: "Manutenção",
  },
  { 
    id: "11", 
    nome: "Contador", 
    valor: 1200, 
    tipo: "Fixo", 
    frequencia: "Mensal", 
    subcategoria: "Serviços",
  },
  { 
    id: "12", 
    nome: "Softwares e Licenças", 
    valor: 600, 
    tipo: "Fixo", 
    frequencia: "Mensal", 
    subcategoria: "Tecnologia",
  },
  { 
    id: "13", 
    nome: "Seguro", 
    valor: 2400, 
    tipo: "Fixo", 
    frequencia: "Anual", 
    subcategoria: "Seguros",
  }
];

const subcategorias = [
  "Instalações",
  "Utilidades",
  "Tecnologia",
  "Pessoal",
  "Produção",
  "Logística",
  "Manutenção",
  "Seguros",
  "Serviços",
  "Impostos",
  "Outros"
];

export default function Custos() {
  const { toast } = useToast();
  const [custos, setCustos] = useState<Custo[]>([]);
  const [tabela, setTabela] = useState<TabelaCusto>("fixos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novoCusto, setNovoCusto] = useState<Partial<Custo>>({
    tipo: "Fixo",
    frequencia: "Mensal"
  });
  const { baseDRE } = useProjectionStore();
  
  useEffect(() => {
    // Load mock data or from API
    setCustos(custosMock);
  }, []);
  
  const faturamentoPrevisto = baseDRE?.receita || 85000; // Fallback to 85k if no DRE
  
  const handleSalvarCusto = () => {
    if (!novoCusto.nome || !novoCusto.valor) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha nome e valor do custo.",
        variant: "destructive"
      });
      return;
    }
    
    if (editingId) {
      setCustos(prev => prev.map(custo => 
        custo.id === editingId ? { ...custo, ...novoCusto } as Custo : custo
      ));
      
      toast({
        title: "Custo atualizado",
        description: `O custo ${novoCusto.nome} foi atualizado com sucesso.`
      });
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      setCustos(prev => [...prev, { 
        id: newId, 
        ...novoCusto 
      } as Custo]);
      
      toast({
        title: "Custo adicionado",
        description: `O custo ${novoCusto.nome} foi adicionado com sucesso.`
      });
    }
    
    setDialogOpen(false);
    setNovoCusto({
      tipo: "Fixo",
      frequencia: "Mensal"
    });
    setEditingId(null);
  };
  
  const handleEditarCusto = (custo: Custo) => {
    setNovoCusto(custo);
    setEditingId(custo.id);
    setDialogOpen(true);
  };
  
  const handleExcluirCusto = (id: string) => {
    const custoParaExcluir = custos.find(c => c.id === id);
    
    setCustos(prev => prev.filter(custo => custo.id !== id));
    
    toast({
      title: "Custo excluído",
      description: `O custo ${custoParaExcluir?.nome} foi excluído com sucesso.`
    });
  };

  // Filter custos by type
  const custosFixos = custos.filter(c => c.tipo === "Fixo");
  const custosVariaveis = custos.filter(c => c.tipo === "Variável");
  
  // Calculate totals
  const totalCustosFixos = custosFixos.reduce((acc, custo) => acc + custo.valor, 0);
  const totalCustosVariaveis = custosVariaveis.reduce((acc, custo) => acc + custo.valor, 0);
  
  // Calculate percentages of revenue for variable costs
  const totalPercentageRevenue = custosVariaveis.reduce((acc, custo) => 
    acc + (custo.valor / faturamentoPrevisto * 100), 0);

  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader 
        title="Custos" 
        description="Gerencie custos fixos e variáveis da operação" 
      />

      <Tabs value={tabela} onValueChange={(value) => setTabela(value as TabelaCusto)} className="w-full mt-6">
        <TabsList className="grid w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="fixos">Custos Fixos</TabsTrigger>
          <TabsTrigger value="variaveis">Custos Variáveis</TabsTrigger>
        </TabsList>
        
        <div className="flex justify-end mb-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Custo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Custo" : "Adicionar Custo"}</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={novoCusto.nome || ""}
                    onChange={(e) => setNovoCusto({...novoCusto, nome: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      type="number"
                      value={novoCusto.valor || ""}
                      onChange={(e) => setNovoCusto({...novoCusto, valor: parseFloat(e.target.value)})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select 
                      value={novoCusto.tipo} 
                      onValueChange={(value) => setNovoCusto({...novoCusto, tipo: value as TipoCusto})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixo">Fixo</SelectItem>
                        <SelectItem value="Variável">Variável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="frequencia">Frequência</Label>
                    <Select 
                      value={novoCusto.frequencia} 
                      onValueChange={(value) => setNovoCusto({...novoCusto, frequencia: value as FrequenciaCusto})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Semestral">Semestral</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                        <SelectItem value="Eventual">Eventual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="subcategoria">Subcategoria</Label>
                    <Select 
                      value={novoCusto.subcategoria} 
                      onValueChange={(value) => setNovoCusto({...novoCusto, subcategoria: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategorias.map(subcat => (
                          <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={novoCusto.observacoes || ""}
                    onChange={(e) => setNovoCusto({...novoCusto, observacoes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSalvarCusto}>
                  {editingId ? "Salvar Alterações" : "Adicionar Custo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <TabsContent value="fixos">
          <Card>
            <CardHeader>
              <CardTitle>Custos Fixos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Subcategoria</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custosFixos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum custo fixo cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    custosFixos.map(custo => (
                      <TableRow key={custo.id}>
                        <TableCell className="font-medium">{custo.nome}</TableCell>
                        <TableCell>{formatCurrency(custo.valor)}</TableCell>
                        <TableCell>{custo.frequencia}</TableCell>
                        <TableCell>{custo.subcategoria}</TableCell>
                        <TableCell className="max-w-xs truncate">{custo.observacoes || "-"}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditarCusto(custo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleExcluirCusto(custo.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableCaption>
                  <div className="flex justify-end font-medium text-base">
                    Total: {formatCurrency(totalCustosFixos)}
                  </div>
                </TableCaption>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="variaveis">
          <Card>
            <CardHeader>
              <CardTitle>Custos Variáveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                O percentual é calculado com base no faturamento previsto atual de {formatCurrency(faturamentoPrevisto)}.
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>% do Faturamento</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Subcategoria</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custosVariaveis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum custo variável cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    custosVariaveis.map(custo => (
                      <TableRow key={custo.id}>
                        <TableCell className="font-medium">{custo.nome}</TableCell>
                        <TableCell>{formatCurrency(custo.valor)}</TableCell>
                        <TableCell>
                          {(custo.valor / faturamentoPrevisto * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>{custo.frequencia}</TableCell>
                        <TableCell>{custo.subcategoria}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditarCusto(custo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleExcluirCusto(custo.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableCaption>
                  <div className="flex justify-end font-medium text-base">
                    <div className="mr-8">
                      Total: {formatCurrency(totalCustosVariaveis)}
                    </div>
                    <div>
                      {totalPercentageRevenue.toFixed(1)}% do faturamento
                    </div>
                  </div>
                </TableCaption>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
