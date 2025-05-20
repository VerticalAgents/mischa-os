
import { useState } from "react";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useReceitaStore } from "@/hooks/useReceitaStore";
import { useInsumoStore } from "@/hooks/useInsumoStore";
import { useCategoriaStore } from "@/hooks/useCategoriaStore";
import { Produto, ComponenteProduto, TipoComponente, ProdutoCategoria, ProdutoSubcategoria } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash, ChevronDown, ChevronUp, Filter } from "lucide-react";

// Schema for creating a new produto
const novoProdutoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  unidadesProducao: z.number().positive("Número de unidades deve ser positivo"),
  categoriaId: z.number().min(1, "Categoria é obrigatória"),
  subcategoriaId: z.number().min(1, "Subcategoria é obrigatória"),
});

// Schema for adding a component to a produto, with strict typing for tipo
const componenteSchema = z.object({
  tipo: z.enum(["Receita", "Insumo"] as const),
  idItem: z.number().positive("Selecione um item válido"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
});

// Schema for filtering products
const filtroSchema = z.object({
  categoriaId: z.number().optional(),
  subcategoriaId: z.number().optional(),
});

type NovoProdutoValues = z.infer<typeof novoProdutoSchema>;
type ComponenteValues = z.infer<typeof componenteSchema>;
type FiltroValues = z.infer<typeof filtroSchema>;

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
  const { categorias, getSubcategoriasByCategoriaId } = useCategoriaStore();
  
  const receitas = getAllReceitas();
  const insumos = getAllInsumos();
  const [isProdutoDialogOpen, setIsProdutoDialogOpen] = useState(false);
  const [isComponenteDialogOpen, setIsComponenteDialogOpen] = useState(false);
  const [isFiltroDialogOpen, setIsFiltroDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [expandedProduto, setExpandedProduto] = useState<number | null>(null);
  const [editingComponente, setEditingComponente] = useState<ComponenteProduto | null>(null);
  const [componenteTipo, setComponenteTipo] = useState<TipoComponente>("Receita");
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState(false);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  
  // Form for new produto
  const produtoForm = useForm<NovoProdutoValues>({
    resolver: zodResolver(novoProdutoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      unidadesProducao: 0,
      categoriaId: 0,
      subcategoriaId: 0,
    },
  });
  
  // Form for adding component with proper typing
  const componenteForm = useForm<ComponenteValues>({
    resolver: zodResolver(componenteSchema),
    defaultValues: {
      tipo: "Receita",
      idItem: 0,
      quantidade: 0,
    },
  });
  
  // Form for filtering products
  const filtroForm = useForm<FiltroValues>({
    resolver: zodResolver(filtroSchema),
    defaultValues: {
      categoriaId: undefined,
      subcategoriaId: undefined,
    },
  });
  
  // Watch for category changes to update subcategory options
  const watchCategoriaId = produtoForm.watch("categoriaId");
  
  // Get subcategories based on selected category
  const subcategorias = watchCategoriaId 
    ? getSubcategoriasByCategoriaId(watchCategoriaId)
    : [];
  
  // Get filtered products or all products
  const produtosExibidos = filtroAtivo ? produtosFiltrados : produtos;

  const handleCreateProduto = (data: NovoProdutoValues) => {
    const produtoId = selectedProduto?.id;
    
    if (produtoId) {
      // Update existing product
      atualizarProduto(produtoId, {
        nome: data.nome,
        descricao: data.descricao,
        unidadesProducao: data.unidadesProducao,
        categoriaId: data.categoriaId,
        subcategoriaId: data.subcategoriaId,
      });
    } else {
      // Create new product
      adicionarProduto(data.nome, data.descricao, data.unidadesProducao);
      
      // Get the latest product (the one we just added) and update its category
      const produtos = useProdutoStore.getState().produtos;
      const novoProduto = produtos[produtos.length - 1];
      
      atualizarProduto(novoProduto.id, {
        categoriaId: data.categoriaId,
        subcategoriaId: data.subcategoriaId,
      });
    }
    
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
  
  const handleApplyFiltro = (data: FiltroValues) => {
    // Apply filters
    let filtrados = [...produtos];
    
    if (data.categoriaId) {
      filtrados = filtrados.filter(p => p.categoriaId === data.categoriaId);
      
      if (data.subcategoriaId) {
        filtrados = filtrados.filter(p => p.subcategoriaId === data.subcategoriaId);
      }
    }
    
    setProdutosFiltrados(filtrados);
    setFiltroAtivo(data.categoriaId !== undefined);
    setIsFiltroDialogOpen(false);
  };
  
  const handleLimparFiltro = () => {
    filtroForm.reset({
      categoriaId: undefined,
      subcategoriaId: undefined,
    });
    setProdutosFiltrados([]);
    setFiltroAtivo(false);
    setIsFiltroDialogOpen(false);
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

  // Find the category and subcategory names for a product
  const getCategoryNames = (produto: Produto) => {
    const categoria = categorias.find(c => c.id === produto.categoriaId);
    const subcategoria = categoria?.subcategorias.find(s => s.id === produto.subcategoriaId);
    
    return {
      categoriaNome: categoria?.nome || "Sem categoria",
      subcategoriaNome: subcategoria?.nome || "Sem subcategoria"
    };
  };

  // Watch for category changes in the filter form to update subcategory options
  const watchFiltroCategoriaId = filtroForm.watch("categoriaId");
  
  // Get subcategories for filter based on selected category
  const filtroSubcategorias = watchFiltroCategoriaId 
    ? getSubcategoriasByCategoriaId(watchFiltroCategoriaId)
    : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Produtos</h2>
          <p className="text-muted-foreground">Gerenciamento de produtos finais</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsFiltroDialogOpen(true)}
            className={filtroAtivo ? "bg-muted" : ""}
          >
            <Filter className="mr-2 h-4 w-4" /> Filtrar
          </Button>
          <Button onClick={() => {
            produtoForm.reset({ 
              nome: "", 
              descricao: "", 
              unidadesProducao: 0,
              categoriaId: 0,
              subcategoriaId: 0,
            });
            setSelectedProduto(null);
            setIsProdutoDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </div>
      
      {produtosExibidos.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            {filtroAtivo 
              ? "Nenhum produto corresponde aos filtros selecionados."
              : "Nenhum produto cadastrado."
            }
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {filtroAtivo && (
              <Button variant="outline" onClick={handleLimparFiltro}>
                Limpar Filtros
              </Button>
            )}
            <Button onClick={() => setIsProdutoDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filtroAtivo && (
            <div className="bg-muted p-2 rounded-md flex justify-between items-center mb-4">
              <span className="text-sm">
                Filtrando produtos: {produtosExibidos.length} resultados
              </span>
              <Button variant="ghost" size="sm" onClick={handleLimparFiltro}>
                Limpar Filtros
              </Button>
            </div>
          )}
          
          {produtosExibidos.map(produto => {
            const { categoriaNome, subcategoriaNome } = getCategoryNames(produto);
            
            return (
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
                    <div className="flex flex-wrap gap-x-4 text-sm mt-1">
                      <span className="text-primary">{categoriaNome}</span>
                      <span>»</span>
                      <span>{subcategoriaNome}</span>
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
                              categoriaId: produto.categoriaId || 0,
                              subcategoriaId: produto.subcategoriaId || 0,
                            });
                            setSelectedProduto(produto);
                            setIsProdutoDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Editar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                        <div>
                          <span className="text-muted-foreground text-sm">Categoria:</span>
                          <div className="font-medium">{categoriaNome} » {subcategoriaNome}</div>
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
            );
          })}
        </div>
      )}
      
      {/* Dialog for creating/editing produto */}
      <Dialog open={isProdutoDialogOpen} onOpenChange={setIsProdutoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              {selectedProduto 
                ? 'Edite as informações do produto.'
                : 'Defina as informações básicas do produto.'
              }
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
                name="categoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        produtoForm.setValue("subcategoriaId", 0);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={produtoForm.control}
                name="subcategoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={!watchCategoriaId || subcategorias.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !watchCategoriaId 
                              ? "Selecione uma categoria primeiro" 
                              : subcategorias.length === 0 
                                ? "Nenhuma subcategoria disponível" 
                                : "Selecione uma subcategoria"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subcategorias.map((subcategoria) => (
                          <SelectItem key={subcategoria.id} value={subcategoria.id.toString()}>
                            {subcategoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  {selectedProduto ? 'Salvar Alterações' : 'Criar Produto'}
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
                            const value = e.target.value as TipoComponente;
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
      
      {/* Dialog for filtering products */}
      <Dialog open={isFiltroDialogOpen} onOpenChange={setIsFiltroDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar Produtos</DialogTitle>
            <DialogDescription>
              Filtre os produtos por categoria e subcategoria
            </DialogDescription>
          </DialogHeader>
          
          <Form {...filtroForm}>
            <form onSubmit={filtroForm.handleSubmit(handleApplyFiltro)} className="space-y-4">
              <FormField
                control={filtroForm.control}
                name="categoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        filtroForm.setValue("subcategoriaId", undefined);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={filtroForm.control}
                name="subcategoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={!watchFiltroCategoriaId || filtroSubcategorias.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !watchFiltroCategoriaId 
                              ? "Selecione uma categoria primeiro" 
                              : filtroSubcategorias.length === 0 
                                ? "Nenhuma subcategoria disponível" 
                                : "Selecione uma subcategoria"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filtroSubcategorias.map((subcategoria) => (
                          <SelectItem key={subcategoria.id} value={subcategoria.id.toString()}>
                            {subcategoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleLimparFiltro}>
                  Limpar Filtros
                </Button>
                <Button type="submit">
                  Aplicar Filtros
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
