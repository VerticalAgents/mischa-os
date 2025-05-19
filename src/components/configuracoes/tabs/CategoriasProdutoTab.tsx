
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCategoriasProdutoStore } from "@/hooks/useCategoriasProdutoStore";
import { Plus, Pencil, Trash, ChevronRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CategoriasProdutoTab() {
  const { toast } = useToast();
  const { 
    categorias, 
    adicionarCategoria, 
    atualizarCategoria, 
    removerCategoria,
    adicionarSubcategoria,
    atualizarSubcategoria,
    removerSubcategoria,
    existemProdutosVinculadosCategoria,
    existemProdutosVinculadosSubcategoria
  } = useCategoriasProdutoStore();
  
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [isEditingCategoria, setIsEditingCategoria] = useState(false);
  const [isEditingSubcategoria, setIsEditingSubcategoria] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subcategoriaDialogOpen, setSubcategoriaDialogOpen] = useState(false);
  
  // Alert dialogs for confirmation
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    action: () => void;
  }>({ message: "", action: () => {} });
  
  // Form states
  const [categoriaForm, setCategoriaForm] = useState({
    id: 0,
    nome: "",
    descricao: ""
  });
  
  const [subcategoriaForm, setSubcategoriaForm] = useState({
    id: 0,
    nome: "",
    descricao: "",
    idCategoria: 0
  });
  
  const resetCategoriaForm = () => {
    setCategoriaForm({
      id: 0,
      nome: "",
      descricao: ""
    });
    setIsEditingCategoria(false);
  };
  
  const resetSubcategoriaForm = () => {
    setSubcategoriaForm({
      id: 0,
      nome: "",
      descricao: "",
      idCategoria: selectedCategoria || 0
    });
    setIsEditingSubcategoria(false);
  };
  
  const handleOpenCategoriaDialog = (isEditing: boolean = false, categoriaId?: number) => {
    if (isEditing && categoriaId) {
      const categoria = categorias.find(c => c.id === categoriaId);
      if (categoria) {
        setCategoriaForm({
          id: categoria.id,
          nome: categoria.nome,
          descricao: categoria.descricao || ""
        });
        setIsEditingCategoria(true);
      }
    } else {
      resetCategoriaForm();
    }
    setDialogOpen(true);
  };
  
  const handleOpenSubcategoriaDialog = (isEditing: boolean = false, subcategoriaId?: number) => {
    if (!selectedCategoria) return;
    
    if (isEditing && subcategoriaId) {
      const categoria = categorias.find(c => c.id === selectedCategoria);
      if (categoria) {
        const subcategoria = categoria.subcategorias.find(s => s.id === subcategoriaId);
        if (subcategoria) {
          setSubcategoriaForm({
            id: subcategoria.id,
            nome: subcategoria.nome,
            descricao: subcategoria.descricao || "",
            idCategoria: selectedCategoria
          });
          setIsEditingSubcategoria(true);
        }
      }
    } else {
      setSubcategoriaForm({
        id: 0,
        nome: "",
        descricao: "",
        idCategoria: selectedCategoria
      });
      setIsEditingSubcategoria(false);
    }
    setSubcategoriaDialogOpen(true);
  };
  
  const handleSaveCategoria = () => {
    if (!categoriaForm.nome.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    
    if (isEditingCategoria) {
      // Verificação de alteração de nome para categorias com produtos
      if (existemProdutosVinculadosCategoria(categoriaForm.id)) {
        setConfirmAction({
          message: "Essa alteração mudará o nome para todos os produtos vinculados. Deseja continuar?",
          action: () => {
            atualizarCategoria(categoriaForm.id, categoriaForm.nome, categoriaForm.descricao);
            setDialogOpen(false);
            resetCategoriaForm();
            toast({
              description: "Categoria atualizada com sucesso."
            });
          }
        });
        setConfirmDialogOpen(true);
        return;
      }
      
      atualizarCategoria(categoriaForm.id, categoriaForm.nome, categoriaForm.descricao);
      toast({
        description: "Categoria atualizada com sucesso."
      });
    } else {
      adicionarCategoria(categoriaForm.nome, categoriaForm.descricao);
      toast({
        description: "Categoria criada com sucesso."
      });
    }
    setDialogOpen(false);
    resetCategoriaForm();
  };
  
  const handleSaveSubcategoria = () => {
    if (!subcategoriaForm.nome.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da subcategoria é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    
    if (isEditingSubcategoria) {
      // Verificação de alteração de nome para subcategorias com produtos
      if (existemProdutosVinculadosSubcategoria(subcategoriaForm.idCategoria, subcategoriaForm.id)) {
        setConfirmAction({
          message: "Essa alteração mudará o nome para todos os produtos vinculados. Deseja continuar?",
          action: () => {
            atualizarSubcategoria(
              subcategoriaForm.id, 
              subcategoriaForm.idCategoria, 
              subcategoriaForm.nome, 
              subcategoriaForm.descricao
            );
            setSubcategoriaDialogOpen(false);
            resetSubcategoriaForm();
            toast({
              description: "Subcategoria atualizada com sucesso."
            });
          }
        });
        setConfirmDialogOpen(true);
        return;
      }
      
      atualizarSubcategoria(
        subcategoriaForm.id, 
        subcategoriaForm.idCategoria, 
        subcategoriaForm.nome, 
        subcategoriaForm.descricao
      );
      toast({
        description: "Subcategoria atualizada com sucesso."
      });
    } else {
      adicionarSubcategoria(subcategoriaForm.idCategoria, subcategoriaForm.nome, subcategoriaForm.descricao);
      toast({
        description: "Subcategoria criada com sucesso."
      });
    }
    setSubcategoriaDialogOpen(false);
    resetSubcategoriaForm();
  };
  
  const handleRemoveCategoria = (id: number) => {
    if (existemProdutosVinculadosCategoria(id)) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir categorias que possuem produtos vinculados.",
        variant: "destructive"
      });
      return;
    }
    
    const removido = removerCategoria(id);
    if (removido) {
      if (selectedCategoria === id) {
        setSelectedCategoria(null);
      }
      toast({
        description: "Categoria removida com sucesso."
      });
    } else {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover esta categoria.",
        variant: "destructive"
      });
    }
  };
  
  const handleRemoveSubcategoria = (idCategoria: number, id: number) => {
    if (existemProdutosVinculadosSubcategoria(idCategoria, id)) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir subcategorias que possuem produtos vinculados.",
        variant: "destructive"
      });
      return;
    }
    
    const removido = removerSubcategoria(idCategoria, id);
    if (removido) {
      toast({
        description: "Subcategoria removida com sucesso."
      });
    } else {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover esta subcategoria.",
        variant: "destructive"
      });
    }
  };
  
  const getSelectedCategoria = () => {
    return selectedCategoria ? categorias.find(c => c.id === selectedCategoria) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Categorias de Produtos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as categorias e subcategorias de produtos
          </p>
        </div>
        <Button onClick={() => handleOpenCategoriaDialog(false)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Categorias */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>Selecione uma categoria para ver suas subcategorias</CardDescription>
          </CardHeader>
          <CardContent>
            {categorias.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Nenhuma categoria cadastrada.
              </p>
            ) : (
              <div className="space-y-1">
                {categorias.map(categoria => (
                  <div 
                    key={categoria.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted ${
                      selectedCategoria === categoria.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedCategoria(categoria.id)}
                  >
                    <div className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-2" />
                      <span>{categoria.nome}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCategoriaDialog(true, categoria.id);
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
                          handleRemoveCategoria(categoria.id);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Lista de Subcategorias */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {selectedCategoria 
                  ? `Subcategorias de ${getSelectedCategoria()?.nome}`
                  : 'Subcategorias'
                }
              </CardTitle>
              <CardDescription>
                {selectedCategoria
                  ? 'Gerencie as subcategorias desta categoria'
                  : 'Selecione uma categoria para gerenciar suas subcategorias'
                }
              </CardDescription>
            </div>
            {selectedCategoria && (
              <Button 
                onClick={() => handleOpenSubcategoriaDialog(false)}
                disabled={!selectedCategoria}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Subcategoria
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedCategoria ? (
              <p className="text-center py-4 text-muted-foreground">
                Selecione uma categoria para ver suas subcategorias.
              </p>
            ) : getSelectedCategoria()?.subcategorias.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Esta categoria não possui subcategorias.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSelectedCategoria()?.subcategorias.map(subcategoria => (
                    <TableRow key={subcategoria.id}>
                      <TableCell className="font-medium">{subcategoria.nome}</TableCell>
                      <TableCell>{subcategoria.descricao || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenSubcategoriaDialog(true, subcategoria.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => handleRemoveSubcategoria(selectedCategoria, subcategoria.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog de Categoria */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingCategoria ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogDescription>
              {isEditingCategoria 
                ? 'Edite os dados da categoria selecionada.'
                : 'Preencha os dados para criar uma nova categoria.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="categoria-nome" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="categoria-nome"
                value={categoriaForm.nome}
                onChange={(e) => setCategoriaForm({...categoriaForm, nome: e.target.value})}
                placeholder="Ex: Doces"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="categoria-descricao" className="text-sm font-medium">
                Descrição (opcional)
              </label>
              <Textarea
                id="categoria-descricao"
                value={categoriaForm.descricao}
                onChange={(e) => setCategoriaForm({...categoriaForm, descricao: e.target.value})}
                placeholder="Descrição breve da categoria"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategoria}>
              {isEditingCategoria ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Subcategoria */}
      <Dialog open={subcategoriaDialogOpen} onOpenChange={setSubcategoriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingSubcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}</DialogTitle>
            <DialogDescription>
              {isEditingSubcategoria 
                ? 'Edite os dados da subcategoria selecionada.'
                : 'Preencha os dados para criar uma nova subcategoria.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subcategoria-nome" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="subcategoria-nome"
                value={subcategoriaForm.nome}
                onChange={(e) => setSubcategoriaForm({...subcategoriaForm, nome: e.target.value})}
                placeholder="Ex: Brownies"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="subcategoria-descricao" className="text-sm font-medium">
                Descrição (opcional)
              </label>
              <Textarea
                id="subcategoria-descricao"
                value={subcategoriaForm.descricao}
                onChange={(e) => setSubcategoriaForm({...subcategoriaForm, descricao: e.target.value})}
                placeholder="Descrição breve da subcategoria"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubcategoriaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSubcategoria}>
              {isEditingSubcategoria ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alert Dialog de confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                confirmAction.action();
                setConfirmDialogOpen(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
