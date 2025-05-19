
import { useState } from "react";
import { useCategoriaStore } from "@/hooks/useCategoriaStore";
import { ProdutoCategoria, ProdutoSubcategoria } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash, ChevronDown, ChevronUp } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";

// Schemas for form validation
const categoriaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional()
});

const subcategoriaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório")
});

type CategoriaFormValues = z.infer<typeof categoriaSchema>;
type SubcategoriaFormValues = z.infer<typeof subcategoriaSchema>;

export default function CategoriasProdutoTab() {
  const { 
    categorias, 
    adicionarCategoria, 
    atualizarCategoria, 
    removerCategoria,
    adicionarSubcategoria,
    atualizarSubcategoria,
    removerSubcategoria,
    categoriaTemProdutos,
    subcategoriaTemProdutos
  } = useCategoriaStore();
  
  const { toast } = useToast();
  
  // State for dialogs
  const [isCategoriaDialogOpen, setIsCategoriaDialogOpen] = useState(false);
  const [isSubcategoriaDialogOpen, setIsSubcategoriaDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  // State for editing
  const [editingCategoria, setEditingCategoria] = useState<ProdutoCategoria | null>(null);
  const [editingSubcategoria, setEditingSubcategoria] = useState<ProdutoSubcategoria | null>(null);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  
  // State for confirmation dialog
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  
  // State for expanded categories
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  
  // Forms
  const categoriaForm = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
      descricao: ""
    }
  });
  
  const subcategoriaForm = useForm<SubcategoriaFormValues>({
    resolver: zodResolver(subcategoriaSchema),
    defaultValues: {
      nome: ""
    }
  });
  
  // Handlers
  const handleCreateCategoria = (data: CategoriaFormValues) => {
    if (editingCategoria) {
      // Show confirmation dialog for editing
      setConfirmTitle("Confirmar Alteração");
      setConfirmDescription("Deseja realmente alterar o nome desta categoria? Isso impactará todos os produtos vinculados.");
      setConfirmAction(() => () => {
        atualizarCategoria(editingCategoria.id, data.nome, data.descricao);
        setIsCategoriaDialogOpen(false);
        setEditingCategoria(null);
        toast({
          title: "Categoria atualizada",
          description: `A categoria "${data.nome}" foi atualizada com sucesso.`
        });
      });
      setIsConfirmDialogOpen(true);
    } else {
      adicionarCategoria(data.nome, data.descricao);
      setIsCategoriaDialogOpen(false);
      toast({
        title: "Categoria criada",
        description: `A categoria "${data.nome}" foi criada com sucesso.`
      });
    }
  };
  
  const handleCreateSubcategoria = (data: SubcategoriaFormValues) => {
    if (selectedCategoriaId === null) return;
    
    if (editingSubcategoria) {
      // Show confirmation dialog for editing
      setConfirmTitle("Confirmar Alteração");
      setConfirmDescription("Deseja realmente alterar o nome desta subcategoria? Isso impactará todos os produtos vinculados.");
      setConfirmAction(() => () => {
        atualizarSubcategoria(editingSubcategoria.id, selectedCategoriaId, data.nome);
        setIsSubcategoriaDialogOpen(false);
        setEditingSubcategoria(null);
        toast({
          title: "Subcategoria atualizada",
          description: `A subcategoria "${data.nome}" foi atualizada com sucesso.`
        });
      });
      setIsConfirmDialogOpen(true);
    } else {
      adicionarSubcategoria(selectedCategoriaId, data.nome);
      setIsSubcategoriaDialogOpen(false);
      toast({
        title: "Subcategoria criada",
        description: `A subcategoria "${data.nome}" foi criada com sucesso.`
      });
    }
  };
  
  const handleDeleteCategoria = (categoria: ProdutoCategoria) => {
    if (categoriaTemProdutos(categoria.id)) {
      setAlertMessage("Esta categoria contém produtos ativos. Mova ou exclua os produtos antes de remover a categoria.");
      setIsAlertDialogOpen(true);
      return;
    }
    
    setConfirmTitle("Confirmar Exclusão");
    setConfirmDescription(`Deseja realmente excluir a categoria "${categoria.nome}"?`);
    setConfirmAction(() => () => {
      const success = removerCategoria(categoria.id);
      if (success) {
        toast({
          title: "Categoria removida",
          description: `A categoria "${categoria.nome}" foi removida com sucesso.`
        });
      }
    });
    setIsConfirmDialogOpen(true);
  };
  
  const handleDeleteSubcategoria = (categoriaId: number, subcategoria: ProdutoSubcategoria) => {
    if (subcategoriaTemProdutos(subcategoria.id)) {
      setAlertMessage("Esta subcategoria contém produtos ativos. Mova ou exclua os produtos antes de remover a subcategoria.");
      setIsAlertDialogOpen(true);
      return;
    }
    
    setConfirmTitle("Confirmar Exclusão");
    setConfirmDescription(`Deseja realmente excluir a subcategoria "${subcategoria.nome}"?`);
    setConfirmAction(() => () => {
      const success = removerSubcategoria(categoriaId, subcategoria.id);
      if (success) {
        toast({
          title: "Subcategoria removida",
          description: `A subcategoria "${subcategoria.nome}" foi removida com sucesso.`
        });
      }
    });
    setIsConfirmDialogOpen(true);
  };
  
  const toggleCategoryExpansion = (id: number) => {
    setExpandedCategories(prev => 
      prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };
  
  // Dialog opening handlers
  const openNewCategoriaDialog = () => {
    categoriaForm.reset({ nome: "", descricao: "" });
    setEditingCategoria(null);
    setIsCategoriaDialogOpen(true);
  };
  
  const openEditCategoriaDialog = (categoria: ProdutoCategoria) => {
    categoriaForm.reset({ 
      nome: categoria.nome, 
      descricao: categoria.descricao 
    });
    setEditingCategoria(categoria);
    setIsCategoriaDialogOpen(true);
  };
  
  const openNewSubcategoriaDialog = (categoriaId: number) => {
    subcategoriaForm.reset({ nome: "" });
    setEditingSubcategoria(null);
    setSelectedCategoriaId(categoriaId);
    setIsSubcategoriaDialogOpen(true);
  };
  
  const openEditSubcategoriaDialog = (categoriaId: number, subcategoria: ProdutoSubcategoria) => {
    subcategoriaForm.reset({ nome: subcategoria.nome });
    setEditingSubcategoria(subcategoria);
    setSelectedCategoriaId(categoriaId);
    setIsSubcategoriaDialogOpen(true);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Categorias de Produtos</h2>
          <p className="text-muted-foreground">Organize seus produtos em categorias e subcategorias</p>
        </div>
        <Button onClick={openNewCategoriaDialog}>
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>
      
      <div className="space-y-4">
        {categorias.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Nenhuma categoria cadastrada.</p>
            <Button className="mt-4" onClick={openNewCategoriaDialog}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Categoria
            </Button>
          </div>
        ) : (
          categorias.map(categoria => (
            <Card key={categoria.id} className="w-full">
              <CardHeader className="cursor-pointer" onClick={() => toggleCategoryExpansion(categoria.id)}>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{categoria.nome}</CardTitle>
                    {categoria.descricao && (
                      <CardDescription>{categoria.descricao}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCategoriaDialog(categoria);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategoria(categoria);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    {expandedCategories.includes(categoria.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {expandedCategories.includes(categoria.id) && (
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Subcategorias</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNewSubcategoriaDialog(categoria.id)}
                      >
                        <Plus className="mr-2 h-3 w-3" /> Adicionar
                      </Button>
                    </div>
                    
                    {categoria.subcategorias.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Nenhuma subcategoria cadastrada.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {categoria.subcategorias.map(subcategoria => (
                          <div
                            key={subcategoria.id}
                            className="flex justify-between items-center p-2 rounded-md border"
                          >
                            <span>{subcategoria.nome}</span>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditSubcategoriaDialog(categoria.id, subcategoria)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteSubcategoria(categoria.id, subcategoria)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
      
      {/* Dialog for creating/editing categoria */}
      <Dialog open={isCategoriaDialogOpen} onOpenChange={setIsCategoriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {editingCategoria
                ? 'Edite os detalhes da categoria de produtos'
                : 'Crie uma nova categoria para organizar seus produtos'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...categoriaForm}>
            <form onSubmit={categoriaForm.handleSubmit(handleCreateCategoria)} className="space-y-4">
              <FormField
                control={categoriaForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Doces, Food Service" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoriaForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Breve descrição da categoria" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCategoriaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategoria ? 'Salvar Alterações' : 'Criar Categoria'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for creating/editing subcategoria */}
      <Dialog open={isSubcategoriaDialogOpen} onOpenChange={setIsSubcategoriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
            </DialogTitle>
            <DialogDescription>
              {editingSubcategoria
                ? 'Edite os detalhes da subcategoria de produtos'
                : 'Crie uma nova subcategoria para organizar seus produtos'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...subcategoriaForm}>
            <form onSubmit={subcategoriaForm.handleSubmit(handleCreateSubcategoria)} className="space-y-4">
              <FormField
                control={subcategoriaForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Subcategoria</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Brownie 38g, Kits" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSubcategoriaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSubcategoria ? 'Salvar Alterações' : 'Criar Subcategoria'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation dialog for edits */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              confirmAction();
              setIsConfirmDialogOpen(false);
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Alert dialog for blocked actions */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ação Bloqueada</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAlertDialogOpen(false)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
