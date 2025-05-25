
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash, Shield } from "lucide-react";
import { useCategoriaStore } from "@/hooks/useCategoriaStore";

export default function CategoriasProdutoTab() {
  const { 
    categorias, 
    adicionarCategoria, 
    atualizarCategoria, 
    removerCategoria,
    adicionarSubcategoria,
    atualizarSubcategoria,
    removerSubcategoria,
    categoriaEhProtegida,
    categoriaTemProdutos,
    subcategoriaTemProdutos
  } = useCategoriaStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubcategoriaDialogOpen, setIsSubcategoriaDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<any>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'categoria' | 'subcategoria'>('categoria');
  
  const [formData, setFormData] = useState({
    nome: "",
    descricao: ""
  });

  const [subcategoriaFormData, setSubcategoriaFormData] = useState({
    nome: ""
  });

  const handleOpenDialog = (categoria: any = null) => {
    setSelectedCategoria(categoria);
    setFormData({
      nome: categoria?.nome || "",
      descricao: categoria?.descricao || ""
    });
    setIsDialogOpen(true);
  };

  const handleSaveCategoria = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    if (selectedCategoria) {
      atualizarCategoria(selectedCategoria.id, formData.nome, formData.descricao);
      toast.success("Categoria atualizada com sucesso");
    } else {
      adicionarCategoria(formData.nome, formData.descricao);
      toast.success("Categoria criada com sucesso");
    }

    setIsDialogOpen(false);
    setSelectedCategoria(null);
    setFormData({ nome: "", descricao: "" });
  };

  const handleOpenSubcategoriaDialog = (categoria: any, subcategoria: any = null) => {
    setSelectedCategoria(categoria);
    setSelectedSubcategoria(subcategoria);
    setSubcategoriaFormData({
      nome: subcategoria?.nome || ""
    });
    setIsSubcategoriaDialogOpen(true);
  };

  const handleSaveSubcategoria = () => {
    if (!subcategoriaFormData.nome.trim()) {
      toast.error("Nome da subcategoria é obrigatório");
      return;
    }

    if (selectedSubcategoria) {
      atualizarSubcategoria(selectedSubcategoria.id, selectedCategoria.id, subcategoriaFormData.nome);
      toast.success("Subcategoria atualizada com sucesso");
    } else {
      adicionarSubcategoria(selectedCategoria.id, subcategoriaFormData.nome);
      toast.success("Subcategoria criada com sucesso");
    }

    setIsSubcategoriaDialogOpen(false);
    setSelectedCategoria(null);
    setSelectedSubcategoria(null);
    setSubcategoriaFormData({ nome: "" });
  };

  const handleDeleteClick = (item: any, type: 'categoria' | 'subcategoria') => {
    setItemToDelete(item);
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteType === 'categoria') {
      if (categoriaEhProtegida(itemToDelete.id)) {
        toast.error("Esta categoria é protegida e não pode ser excluída");
        setIsDeleteDialogOpen(false);
        return;
      }

      const sucesso = removerCategoria(itemToDelete.id);
      if (sucesso) {
        toast.success("Categoria removida com sucesso");
      } else {
        toast.error("Não é possível remover uma categoria que possui produtos");
      }
    } else {
      const sucesso = removerSubcategoria(selectedCategoria.id, itemToDelete.id);
      if (sucesso) {
        toast.success("Subcategoria removida com sucesso");
      } else {
        toast.error("Não é possível remover uma subcategoria que possui produtos");
      }
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias de Produto</CardTitle>
              <CardDescription>
                Gerencie as categorias e subcategorias dos produtos
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categorias.map((categoria) => (
              <div key={categoria.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{categoria.nome}</h3>
                    {categoriaEhProtegida(categoria.id) && (
                      <Shield className="h-4 w-4 text-blue-600" title="Categoria protegida" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSubcategoriaDialog(categoria)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Subcategoria
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(categoria)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!categoriaEhProtegida(categoria.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(categoria, 'categoria')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {categoria.descricao && (
                  <p className="text-sm text-muted-foreground mb-4">{categoria.descricao}</p>
                )}

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subcategoria</TableHead>
                        <TableHead className="text-right">Produtos</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoria.subcategorias.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                            Nenhuma subcategoria cadastrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        categoria.subcategorias.map((subcategoria) => (
                          <TableRow key={subcategoria.id}>
                            <TableCell className="font-medium">{subcategoria.nome}</TableCell>
                            <TableCell className="text-right">{subcategoria.quantidadeProdutos}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenSubcategoriaDialog(categoria, subcategoria)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedCategoria(categoria);
                                    handleDeleteClick(subcategoria, 'subcategoria');
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Categoria */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategoria ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {selectedCategoria 
                ? "Edite as informações da categoria"
                : "Adicione uma nova categoria de produto"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da categoria"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategoria}>
              {selectedCategoria ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Subcategoria */}
      <Dialog open={isSubcategoriaDialogOpen} onOpenChange={setIsSubcategoriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSubcategoria ? "Editar Subcategoria" : "Nova Subcategoria"}
            </DialogTitle>
            <DialogDescription>
              {selectedSubcategoria
                ? "Edite as informações da subcategoria"
                : `Adicione uma nova subcategoria em "${selectedCategoria?.nome}"`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome-sub">Nome</Label>
              <Input
                id="nome-sub"
                value={subcategoriaFormData.nome}
                onChange={(e) => setSubcategoriaFormData({ ...subcategoriaFormData, nome: e.target.value })}
                placeholder="Nome da subcategoria"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubcategoriaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSubcategoria}>
              {selectedSubcategoria ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'categoria' 
                ? `Tem certeza que deseja excluir a categoria "${itemToDelete?.nome}"?`
                : `Tem certeza que deseja excluir a subcategoria "${itemToDelete?.nome}"?`
              }
              {deleteType === 'categoria' && categoriaEhProtegida(itemToDelete?.id) && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Shield className="h-4 w-4" />
                    Esta categoria é protegida e não pode ser excluída.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteType === 'categoria' && categoriaEhProtegida(itemToDelete?.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
