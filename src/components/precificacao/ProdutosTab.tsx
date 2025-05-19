
import { useState } from "react";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useReceitaStore } from "@/hooks/useReceitaStore";
import { useInsumoStore } from "@/hooks/useInsumoStore";
import { useCategoriasProdutoStore } from "@/hooks/useCategoriasProdutoStore";
import { Produto, ComponenteProduto, TipoComponente, ClassificacaoProduto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash, ChevronDown, ChevronUp } from "lucide-react";

// Extended schema for creating a new produto with classification and categories
const novoProdutoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  unidadesProducao: z.number().positive("Número de unidades deve ser positivo"),
  classificacao: z.enum(["Food Service", "Personalizado", "Outros"] as const),
  idCategoria: z.number().optional(),
  idSubcategoria: z.number().optional(),
});

// Schema for adding a component to a produto, with strict typing for tipo
const componenteSchema = z.object({
  tipo: z.enum(["Receita", "Insumo"] as const),
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
  const { categorias } = useCategoriasProdutoStore();
  
  const receitas = getAllReceitas();
  const insumos = getAllInsumos();
  const [isProdutoDialogOpen, setIsProdutoDialogOpen] = useState(false);
  const [isComponenteDialogOpen, setIsComponenteDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [expandedProduto, setExpandedProduto] = useState<number | null>(null);
  const [editingComponente, setEditingComponente] = useState<ComponenteProduto | null>(null);
  const [componenteTipo, setComponenteTipo] = useState<TipoComponente>("Receita");
  const [activeTab, setActiveTab] = useState<string>("foodservice");
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [selectedSubcategorias, setSelectedSubcategorias] = useState<number[]>([]);
  
  // Form for new produto
  const produtoForm = useForm<NovoProdutoValues>({
    resolver: zodResolver(novoProdutoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      unidadesProducao: 0,
      classificacao: "Food Service",
      idCategoria: undefined,
      idSubcategoria: undefined,
    },
  });
  
  // Watch for category changes to update subcategories
  const watchCategoria = produtoForm.watch("idCategoria");
  
  // Form for adding component with proper typing
  const componenteForm = useForm<ComponenteValues>({
    resolver: zodResolver(componenteSchema),
    defaultValues: {
      tipo: "Receita",
      idItem: 0,
      quantidade: 0,
    },
  });
  
  // Filter products by classification (for tabs)
  const produtosFoodService = produtos.filter(p => p.classificacao === "Food Service");
  const produtosPersonalizados = produtos.filter(p => p.classificacao === "Personalizado");
  const produtosOutros = produtos.filter(p => p.classificacao === "Outros");
  
  // Get subcategories for selected category
  const getSubcategorias = (categoriaId?: number) => {
    if (!categoriaId) return [];
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.subcategorias : [];
  };
  
  const handleCreateProduto = (data: NovoProdutoValues) => {
    const novoProduto = {
      nome: data.nome,
      descricao: data.descricao || '',
      unidadesProducao: data.unidadesProducao,
      classificacao: data.classificacao,
      idCategoria: data.idCategoria,
      idSubcategoria: data.idSubcategoria
    };
    
    adicionarProduto(novoProduto.nome, novoProduto.descricao, novoProduto.unidadesProducao);
    
    // Need to update the newly created product with classification and categories
    const lastProduct = produtos[produtos.length - 1];
    if (lastProduct) {
      atualizarProduto(lastProduct.id, {
        classificacao: novoProduto.classificacao,
        idCategoria: novoProduto.idCategoria,
        idSubcategoria: novoProduto.idSubcategoria
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

  // Get product category name
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Não categorizado";
    const category = categorias.find(c => c.id === categoryId);
    return category ? category.nome : "Não categorizado";
  };
  
  // Get product subcategory name
  const getSubcategoryName = (categoryId?: number, subcategoryId?: number) => {
    if (!categoryId || !subcategoryId) return "";
    const category = categorias.find(c => c.id === categoryId);
    if (!category) return "";
    
    const subcategory = category.subcategorias.find(s => s.id === subcategoryId);
    return subcategory ? subcategory.nome : "";
  };
  
  // Render products list
  const renderProductsList = (productsList: Produto[]) => {
    if (productsList.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Nenhum produto cadastrado nesta categoria.</p>
          <Button className="mt-4" onClick={() => {
            produtoForm.reset({
              nome: "",
              descricao: "",
              unidadesProducao: 0,
              classificacao: activeTab === "foodservice" ? "Food Service" : 
                            activeTab === "personalizados" ? "Personalizado" : "Outros",
              idCategoria: undefined,
              idSubcategoria: undefined,
            });
            setIsProdutoDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {productsList.map(produto => (
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
                  <span>Custo unitário: R$ {produto.custoUnitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span>•</span>
                  <span>
                    Categoria: {getCategoryName(produto.idCategoria)}
                    {produto.idSubcategoria && ` / ${getSubcategoryName(produto.idCategoria, produto.idSubcategoria)}`}
                  </span>
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
                          unidadesProducao: produto.unidadesProducao || 0,
                          classificacao: produto.classificacao,
                          idCategoria: produto.idCategoria,
                          idSubcategoria: produto.idSubcategoria,
                        });
                        setSelectedProduto(produto);
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
                        R$ {produto.custoTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              {componente.custo?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Produtos</h2>
          <p className="text-muted-foreground">Gerenciamento de produtos finais</p>
        </div>
        <Button onClick={() => {
          produtoForm.reset({
            nome: "",
            descricao: "",
            unidadesProducao: 0,
            classificacao: activeTab === "foodservice" ? "Food Service" : 
                         activeTab === "personalizados" ? "Personalizado" : "Outros",
            idCategoria: undefined,
            idSubcategoria: undefined,
          });
          setIsProdutoDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>
      
      <Tabs 
        defaultValue="foodservice" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="foodservice">Food Service</TabsTrigger>
          <TabsTrigger value="personalizados">Personalizados</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>
        
        <TabsContent value="foodservice">
          {renderProductsList(produtosFoodService)}
        </TabsContent>
        
        <TabsContent value="personalizados">
          {renderProductsList(produtosPersonalizados)}
        </TabsContent>
        
        <TabsContent value="outros">
          {renderProductsList(produtosOutros)}
        </TabsContent>
      </Tabs>
      
      {/* Dialog for creating/editing produto */}
      <Dialog open={isProdutoDialogOpen} onOpenChange={setIsProdutoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
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
              
              <FormField
                control={produtoForm.control}
                name="classificacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classificação</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a classificação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Food Service">Food Service</SelectItem>
                        <SelectItem value="Personalizado">Personalizado</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={produtoForm.control}
                name="idCategoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        // Reset subcategory when category changes
                        produtoForm.setValue("idSubcategoria", undefined);
                      }}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem 
                            key={categoria.id} 
                            value={categoria.id.toString()}
                          >
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {watchCategoria && (
                <FormField
                  control={produtoForm.control}
                  name="idSubcategoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoria</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getSubcategorias(watchCategoria).map((subcategoria) => (
                            <SelectItem 
                              key={subcategoria.id} 
                              value={subcategoria.id.toString()}
                            >
                              {subcategoria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
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
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value as TipoComponente);
                          setComponenteTipo(value as TipoComponente);
                          // Reset the item ID when changing type
                          const defaultId = value === "Receita" 
                            ? (receitas.length > 0 ? receitas[0].id : 0)
                            : (insumos.length > 0 ? insumos[0].id : 0);
                          componenteForm.setValue("idItem", defaultId);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Receita">Receita Base</SelectItem>
                          <SelectItem value="Insumo">Insumo (Embalagem)</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              componenteTipo === "Receita" ? "Selecione uma receita" : "Selecione um insumo"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {componenteTipo === "Receita" 
                            ? receitas.map(receita => (
                                <SelectItem key={receita.id} value={receita.id.toString()}>
                                  {receita.nome} ({receita.pesoTotal}g)
                                </SelectItem>
                              ))
                            : insumos
                                .filter(insumo => insumo.categoria === "Embalagem")
                                .map(insumo => (
                                  <SelectItem key={insumo.id} value={insumo.id.toString()}>
                                    {insumo.nome}
                                  </SelectItem>
                                ))
                          }
                        </SelectContent>
                      </Select>
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
