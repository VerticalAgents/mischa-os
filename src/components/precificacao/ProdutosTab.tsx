
import { useState } from "react";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useReceitaStore } from "@/hooks/useReceitaStore";
import { useInsumoStore } from "@/hooks/useInsumoStore";
import { Produto, ComponenteProduto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash, ChevronDown, ChevronUp } from "lucide-react";

// Schema for creating a new produto
const novoProdutoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  unidadesProducao: z.number().positive("Número de unidades deve ser positivo"),
});

// Schema for adding a component to a produto
const componenteSchema = z.object({
  tipo: z.enum(["Receita", "Insumo"]),
  idItem: z.number().positive("Selecione um item válido"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
});

type NovoProdutoValues = z.infer<typeof novoProdutoSchema>;
type ComponenteValues = z.infer<typeof componenteSchema>;

export default function ProdutosTab() {
  const { 
    produtos, 
    adicionarProduto, 
    adicionarComponenteReceita, 
    adicionarComponenteInsumo, 
    atualizarComponente,
    removerComponente, 
    atualizarProduto, 
    removerProduto 
  } = useProdutoStore();
  const { getAllReceitas } = useReceitaStore();
  const { getAllInsumos } = useInsumoStore();
  
  const receitas = getAllReceitas();
  const insumos = getAllInsumos();
  const [isProdutoDialogOpen, setIsProdutoDialogOpen] = useState(false);
  const [isComponenteDialogOpen, setIsComponenteDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [expandedProduto, setExpandedProduto] = useState<number | null>(null);
  const [editingComponente, setEditingComponente] = useState<ComponenteProduto | null>(null);
  const [componenteTipo, setComponenteTipo] = useState<"Receita" | "Insumo">("Receita");
  
  // Form for new produto
  const produtoForm = useForm<NovoProdutoValues>({
    resolver: zodResolver(novoProdutoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      unidadesProducao: 0,
    },
  });
  
  // Form for adding component
  const componenteForm = useForm<ComponenteValues>({
    resolver: zodResolver(componenteSchema),
    defaultValues: {
      tipo: "Receita",
      idItem: 0,
      quantidade: 0,
    },
  });
  
  const handleCreateProduto = (data: NovoProdutoValues) => {
    adicionarProduto(data.nome, data.descricao, data.unidadesProducao);
    setIsProdutoDialogOpen(false);
  };
  
  const handleAddComponente = (data: ComponenteValues) => {
    if (selectedProduto) {
      if (editingComponente) {
        atualizarComponente(selectedProduto.id, editingComponente.id, data.quantidade);
      } else {
        if (data.tipo === "Receita") {
          adicionarComponenteReceita(selectedProduto.id, data.idItem, data.quantidade);
        } else {
          adicionarComponenteInsumo(selectedProduto.id, data.idItem, data.quantidade);
        }
      }
      setIsComponenteDialogOpen(false);
    }
  };
  
  const openAddComponenteDialog = (produto: Produto) => {
    componenteForm.reset({
      tipo: "Receita",
      idItem: receitas.length > 0 ? receitas[0].id : 0,
      quantidade: 0,
    });
    setSelectedProduto(produto);
    setEditingComponente(null);
    setComponenteTipo("Receita");
    setIsComponenteDialogOpen(true);
  };
  
  const openEditComponenteDialog = (produto: Produto, componente: ComponenteProduto) => {
    componenteForm.reset({
      tipo: componente.tipo,
      idItem: componente.idItem,
      quantidade: componente.quantidade,
    });
    setSelectedProduto(produto);
    setEditingComponente(componente);
    setComponenteTipo(componente.tipo);
    setIsComponenteDialogOpen(true);
  };
  
  const handleRemoveComponente = (produto: Produto, componente: ComponenteProduto) => {
    if (confirm(`Tem certeza que deseja remover ${componente.nome} do produto?`)) {
      removerComponente(produto.id, componente.id);
    }
  };
  
  const handleDeleteProduto = (produto: Produto) => {
    if (confirm(`Tem certeza que deseja remover o produto "${produto.nome}"?`)) {
      removerProduto(produto.id);
      if (expandedProduto === produto.id) {
        setExpandedProduto(null);
      }
    }
  };
  
  const toggleProdutoExpansion = (id: number) => {
    setExpandedProduto(expandedProduto === id ? null : id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Produtos</h2>
          <p className="text-muted-foreground">Gerenciamento de produtos finais</p>
        </div>
        <Button onClick={() => {
          produtoForm.reset({ nome: "", descricao: "", unidadesProducao: 0 });
          setIsProdutoDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>
      
      {produtos.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
          <Button className="mt-4" onClick={() => setIsProdutoDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {produtos.map(produto => (
            <Card key={produto.id} className="w-full">
              <CardHeader className="cursor-pointer pb-4" onClick={() => toggleProdutoExpansion(produto.id)}>
                <div className="flex justify-between items-center">
                  <CardTitle>{produto.nome}</CardTitle>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon">
                      {expandedProduto === produto.id ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {produto.descricao && <div className="text-sm mb-1">{produto.descricao}</div>}
                  <div className="flex flex-wrap gap-x-4 text-sm">
                    <span>Unidades: {produto.unidadesProducao}</span>
                    <span>•</span>
                    <span>Peso unitário: {produto.pesoUnitario}g</span>
                    <span>•</span>
                    <span>Custo unitário: R$ {produto.custoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </CardDescription>
                <div className="flex justify-end items-center mt-2">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddComponenteDialog(produto);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduto(produto);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedProduto === produto.id && (
                <CardContent className="pt-4 border-t">
                  <div className="mb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-medium">Detalhes do Produto</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          produtoForm.reset({
                            nome: produto.nome,
                            descricao: produto.descricao,
                            unidadesProducao: produto.unidadesProducao,
                          });
                          setIsProdutoDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <span className="text-muted-foreground text-sm">Unidades de Produção:</span>
                        <div className="font-medium">{produto.unidadesProducao}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Peso Unitário:</span>
                        <div className="font-medium">{produto.pesoUnitario}g</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Custo Total:</span>
                        <div className="font-medium">
                          R$ {produto.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="font-medium mb-2">Componentes</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Custo (R$)</TableHead>
                          <TableHead className="w-[80px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produto.componentes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              Nenhum componente adicionado ao produto
                            </TableCell>
                          </TableRow>
                        ) : (
                          produto.componentes.map(componente => (
                            <TableRow key={componente.id}>
                              <TableCell>{componente.tipo}</TableCell>
                              <TableCell>{componente.nome}</TableCell>
                              <TableCell className="text-right">{componente.quantidade} {componente.tipo === "Receita" ? "g" : "un"}</TableCell>
                              <TableCell className="text-right">
                                {componente.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => openEditComponenteDialog(produto, componente)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRemoveComponente(produto, componente)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
              {expandedProduto === produto.id && (
                <CardFooter className="flex justify-end pt-0">
                  <Button 
                    variant="outline" 
                    onClick={() => openAddComponenteDialog(produto)}
                  >
                    Adicionar Componente
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Dialog for creating/editing produto */}
      <Dialog open={isProdutoDialogOpen} onOpenChange={setIsProdutoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Produto</DialogTitle>
            <DialogDescription>
              Defina as informações básicas do produto.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...produtoForm}>
            <form onSubmit={produtoForm.handleSubmit(handleCreateProduto)} className="space-y-4">
              <FormField
                control={produtoForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Brownie Individual" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={produtoForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Descrição breve do produto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={produtoForm.control}
                name="unidadesProducao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidades de Produção</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsProdutoDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding/editing componente */}
      <Dialog open={isComponenteDialogOpen} onOpenChange={setIsComponenteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingComponente ? 'Editar Componente' : 'Adicionar Componente'}
            </DialogTitle>
            <DialogDescription>
              {editingComponente
                ? `Editar quantidade do componente no produto "${selectedProduto?.nome}"`
                : `Adicionar componente ao produto "${selectedProduto?.nome}"`
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...componenteForm}>
            <form onSubmit={componenteForm.handleSubmit(handleAddComponente)} className="space-y-4">
              {!editingComponente && (
                <FormField
                  control={componenteForm.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Componente</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          {...field}
                          onChange={e => {
                            const value = e.target.value as "Receita" | "Insumo";
                            field.onChange(value);
                            setComponenteTipo(value);
                            // Resetar o ID do item ao trocar o tipo
                            const defaultId = value === "Receita" 
                              ? (receitas.length > 0 ? receitas[0].id : 0)
                              : (insumos.length > 0 ? insumos[0].id : 0);
                            componenteForm.setValue("idItem", defaultId);
                          }}
                        >
                          <option value="Receita">Receita Base</option>
                          <option value="Insumo">Insumo (Embalagem)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {!editingComponente && (
                <FormField
                  control={componenteForm.control}
                  name="idItem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{componenteTipo === "Receita" ? "Receita" : "Insumo"}</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          {...field}
                          value={field.value}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        >
                          <option value="0" disabled>
                            {componenteTipo === "Receita" ? "Selecione uma receita" : "Selecione um insumo"}
                          </option>
                          {componenteTipo === "Receita" 
                            ? receitas.map(receita => (
                                <option key={receita.id} value={receita.id}>
                                  {receita.nome} ({receita.pesoTotal}g)
                                </option>
                              ))
                            : insumos
                                .filter(insumo => insumo.categoria === "Embalagem")
                                .map(insumo => (
                                  <option key={insumo.id} value={insumo.id}>
                                    {insumo.nome}
                                  </option>
                                ))
                          }
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={componenteForm.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade {editingComponente ? editingComponente.tipo === "Receita" ? "(g)" : "(un)" : componenteTipo === "Receita" ? "(g)" : "(un)"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsComponenteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingComponente ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
