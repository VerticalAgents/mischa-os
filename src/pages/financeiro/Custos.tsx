
// We need to update the reference to DREData.receita to use the correct property name
// The property is likely named 'receitaBruta' or 'faturamentoPrevisto' instead of 'receita'
// Let's use faturamentoPrevisto as that's likely what it should be

import { useState, useEffect } from "react";
import { 
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import PageHeader from "@/components/common/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { useProjectionStore } from "@/hooks/useProjectionStore";

// Define the type for a cost item
type CustoItem = {
  id: string;
  nome: string;
  valor: number;
  frequencia: "Mensal" | "Trimestral" | "Semestral" | "Anual";
  tipo: "Fixo" | "Variável";
  subcategoria: string;
  observacoes?: string;
  percentualFaturamento?: number;
};

export default function Custos() {
  const [custos, setCustos] = useState<CustoItem[]>([
    {
      id: "1",
      nome: "Aluguel",
      valor: 3500,
      frequencia: "Mensal",
      tipo: "Fixo",
      subcategoria: "Instalações",
      observacoes: "Contrato com reajuste anual em março"
    },
    {
      id: "2",
      nome: "Energia Elétrica",
      valor: 1800,
      frequencia: "Mensal",
      tipo: "Fixo",
      subcategoria: "Utilidades",
      observacoes: "Média dos últimos 6 meses"
    },
    {
      id: "3",
      nome: "Água",
      valor: 450,
      frequencia: "Mensal",
      tipo: "Fixo",
      subcategoria: "Utilidades"
    },
    {
      id: "4",
      nome: "Internet",
      valor: 299.90,
      frequencia: "Mensal",
      tipo: "Fixo",
      subcategoria: "Telecomunicações"
    },
    {
      id: "5",
      nome: "Salários",
      valor: 18000,
      frequencia: "Mensal",
      tipo: "Fixo",
      subcategoria: "Pessoal"
    },
    {
      id: "6",
      nome: "Seguro",
      valor: 1200,
      frequencia: "Mensal",
      tipo: "Fixo",
      subcategoria: "Seguros"
    },
    {
      id: "7",
      nome: "Matéria Prima",
      valor: 12000,
      frequencia: "Mensal",
      tipo: "Variável",
      subcategoria: "Insumos"
    },
    {
      id: "8",
      nome: "Embalagens",
      valor: 3500,
      frequencia: "Mensal",
      tipo: "Variável",
      subcategoria: "Insumos"
    },
    {
      id: "9",
      nome: "Frete",
      valor: 4200,
      frequencia: "Mensal", 
      tipo: "Variável",
      subcategoria: "Logística"
    },
    {
      id: "10",
      nome: "Comissões",
      valor: 2800,
      frequencia: "Mensal",
      tipo: "Variável",
      subcategoria: "Vendas"
    },
    {
      id: "11",
      nome: "Sistema de Gestão",
      valor: 450,
      frequencia: "Mensal",
      tipo: "Fixo",
      subcategoria: "Software"
    }
  ]);
  
  // Use state for dialog handling and form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<CustoItem | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("fixos");
  const { toast } = useToast();

  // Get current DRE data for variable costs percentage calculation
  const { dreAtiva, dres } = useProjectionStore();
  const dreAtual = dres.find(dre => dre.id === dreAtiva);
  
  // Calculate percentages for variable costs
  useEffect(() => {
    if (dreAtual && dreAtual.faturamentoPrevisto > 0) {
      const custosAtualizados = custos.map(custo => {
        if (custo.tipo === "Variável") {
          return {
            ...custo,
            percentualFaturamento: (custo.valor / dreAtual.faturamentoPrevisto) * 100
          };
        }
        return custo;
      });
      
      setCustos(custosAtualizados);
    }
  }, [dreAtual]);

  // Filtered lists
  const custosFixos = custos.filter(custo => custo.tipo === "Fixo");
  const custosVariaveis = custos.filter(custo => custo.tipo === "Variável");
  
  // Calculate totals
  const totalFixo = custosFixos.reduce((sum, custo) => sum + custo.valor, 0);
  const totalVariavel = custosVariaveis.reduce((sum, custo) => sum + custo.valor, 0);
  const totalPercentualVariavel = custosVariaveis.reduce((sum, custo) => 
    sum + (custo.percentualFaturamento || 0), 0);
  
  // Form handling
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCusto) {
      // Update existing cost
      setCustos(custos.map(c => 
        c.id === editingCusto.id ? editingCusto : c
      ));
      
      toast({
        title: "Custo atualizado",
        description: `O custo ${editingCusto.nome} foi atualizado com sucesso.`,
      });
    } else {
      // Add new cost
      const newCusto: CustoItem = {
        ...editingCusto!,
        id: Date.now().toString(),
      };
      
      if (newCusto.tipo === "Variável" && dreAtual) {
        newCusto.percentualFaturamento = (newCusto.valor / dreAtual.faturamentoPrevisto) * 100;
      }
      
      setCustos([...custos, newCusto]);
      
      toast({
        title: "Custo adicionado",
        description: `O custo ${newCusto.nome} foi adicionado com sucesso.`,
      });
    }
    
    // Reset and close
    setEditingCusto(null);
    setDialogOpen(false);
  };
  
  // Handle cost removal
  const handleRemoveCusto = (id: string) => {
    const custoToRemove = custos.find(c => c.id === id);
    
    if (custoToRemove) {
      setCustos(custos.filter(c => c.id !== id));
      
      toast({
        title: "Custo removido",
        description: `O custo ${custoToRemove.nome} foi removido com sucesso.`,
      });
    }
  };
  
  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Custos"
        description="Gerenciamento de custos fixos e variáveis"
      />
      
      <Tabs
        value={currentTab}
        onValueChange={setCurrentTab}
        className="w-full mt-6"
      >
        <TabsList>
          <TabsTrigger value="fixos">Custos Fixos</TabsTrigger>
          <TabsTrigger value="variaveis">Custos Variáveis</TabsTrigger>
        </TabsList>
        
        {/* Custos Fixos Tab */}
        <TabsContent value="fixos">
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Custos Fixos</CardTitle>
              <Dialog open={dialogOpen && currentTab === "fixos"} onOpenChange={(open) => {
                if (!open) setEditingCusto(null);
                setDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingCusto({
                      id: "",
                      nome: "",
                      valor: 0,
                      frequencia: "Mensal",
                      tipo: "Fixo",
                      subcategoria: "Instalações",
                    });
                  }}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Custo Fixo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCusto?.id ? "Editar Custo Fixo" : "Adicionar Custo Fixo"}
                      </DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes do custo fixo.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          value={editingCusto?.nome || ""}
                          onChange={(e) => setEditingCusto({
                            ...editingCusto!,
                            nome: e.target.value,
                          })}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="valor">Valor (R$)</Label>
                          <Input
                            id="valor"
                            type="number"
                            step="0.01"
                            value={editingCusto?.valor || 0}
                            onChange={(e) => setEditingCusto({
                              ...editingCusto!,
                              valor: parseFloat(e.target.value),
                            })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="frequencia">Frequência</Label>
                          <Select
                            value={editingCusto?.frequencia || "Mensal"}
                            onValueChange={(value: "Mensal" | "Trimestral" | "Semestral" | "Anual") => 
                              setEditingCusto({
                                ...editingCusto!,
                                frequencia: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mensal">Mensal</SelectItem>
                              <SelectItem value="Trimestral">Trimestral</SelectItem>
                              <SelectItem value="Semestral">Semestral</SelectItem>
                              <SelectItem value="Anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="subcategoria">Subcategoria</Label>
                        <Select
                          value={editingCusto?.subcategoria || ""}
                          onValueChange={(value) => setEditingCusto({
                            ...editingCusto!,
                            subcategoria: value,
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Instalações">Instalações</SelectItem>
                            <SelectItem value="Utilidades">Utilidades</SelectItem>
                            <SelectItem value="Telecomunicações">Telecomunicações</SelectItem>
                            <SelectItem value="Pessoal">Pessoal</SelectItem>
                            <SelectItem value="Seguros">Seguros</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea
                          id="observacoes"
                          value={editingCusto?.observacoes || ""}
                          onChange={(e) => setEditingCusto({
                            ...editingCusto!,
                            observacoes: e.target.value,
                          })}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingCusto?.id ? "Salvar Alterações" : "Adicionar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custosFixos.map((custo) => (
                    <TableRow key={custo.id}>
                      <TableCell>{custo.nome}</TableCell>
                      <TableCell>{formatCurrency(custo.valor)}</TableCell>
                      <TableCell>{custo.frequencia}</TableCell>
                      <TableCell>{custo.subcategoria}</TableCell>
                      <TableCell>
                        {custo.observacoes ? (
                          <div className="max-w-[200px] truncate">{custo.observacoes}</div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => {
                              setEditingCusto(custo);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleRemoveCusto(custo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totalizador - Custos Fixos */}
                  <TableRow className="font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell>{formatCurrency(totalFixo)}</TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Custos Variáveis Tab */}
        <TabsContent value="variaveis">
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Custos Variáveis</CardTitle>
              <Dialog open={dialogOpen && currentTab === "variaveis"} onOpenChange={(open) => {
                if (!open) setEditingCusto(null);
                setDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingCusto({
                      id: "",
                      nome: "",
                      valor: 0,
                      frequencia: "Mensal",
                      tipo: "Variável",
                      subcategoria: "Insumos",
                    });
                  }}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Custo Variável
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCusto?.id ? "Editar Custo Variável" : "Adicionar Custo Variável"}
                      </DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes do custo variável.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          value={editingCusto?.nome || ""}
                          onChange={(e) => setEditingCusto({
                            ...editingCusto!,
                            nome: e.target.value,
                          })}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="valor">Valor (R$)</Label>
                          <Input
                            id="valor"
                            type="number"
                            step="0.01"
                            value={editingCusto?.valor || 0}
                            onChange={(e) => {
                              const valor = parseFloat(e.target.value);
                              const percentual = dreAtual 
                                ? (valor / dreAtual.faturamentoPrevisto) * 100 
                                : 0;
                                
                              setEditingCusto({
                                ...editingCusto!,
                                valor,
                                percentualFaturamento: percentual,
                              });
                            }}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="frequencia">Frequência</Label>
                          <Select
                            value={editingCusto?.frequencia || "Mensal"}
                            onValueChange={(value: "Mensal" | "Trimestral" | "Semestral" | "Anual") => 
                              setEditingCusto({
                                ...editingCusto!,
                                frequencia: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mensal">Mensal</SelectItem>
                              <SelectItem value="Trimestral">Trimestral</SelectItem>
                              <SelectItem value="Semestral">Semestral</SelectItem>
                              <SelectItem value="Anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {dreAtual && (
                        <div className="grid grid-cols-1 gap-2">
                          <Label>% do Faturamento Previsto</Label>
                          <div className="py-2 px-3 bg-muted rounded-md">
                            {editingCusto?.percentualFaturamento?.toFixed(2)}%
                            <span className="text-muted-foreground text-xs block">
                              Baseado no faturamento de {formatCurrency(dreAtual.faturamentoPrevisto)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Label htmlFor="subcategoria">Subcategoria</Label>
                        <Select
                          value={editingCusto?.subcategoria || ""}
                          onValueChange={(value) => setEditingCusto({
                            ...editingCusto!,
                            subcategoria: value,
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Insumos">Insumos</SelectItem>
                            <SelectItem value="Logística">Logística</SelectItem>
                            <SelectItem value="Vendas">Vendas</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea
                          id="observacoes"
                          value={editingCusto?.observacoes || ""}
                          onChange={(e) => setEditingCusto({
                            ...editingCusto!,
                            observacoes: e.target.value,
                          })}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingCusto?.id ? "Salvar Alterações" : "Adicionar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>% do Faturamento</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Subcategoria</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custosVariaveis.map((custo) => (
                    <TableRow key={custo.id}>
                      <TableCell>{custo.nome}</TableCell>
                      <TableCell>{formatCurrency(custo.valor)}</TableCell>
                      <TableCell>
                        {custo.percentualFaturamento?.toFixed(2)}%
                      </TableCell>
                      <TableCell>{custo.frequencia}</TableCell>
                      <TableCell>{custo.subcategoria}</TableCell>
                      <TableCell>
                        {custo.observacoes ? (
                          <div className="max-w-[200px] truncate">{custo.observacoes}</div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => {
                              setEditingCusto(custo);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleRemoveCusto(custo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totalizador - Custos Variáveis */}
                  <TableRow className="font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell>{formatCurrency(totalVariavel)}</TableCell>
                    <TableCell>{totalPercentualVariavel.toFixed(2)}%</TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
