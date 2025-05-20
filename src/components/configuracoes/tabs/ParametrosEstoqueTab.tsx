
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInsumoStore } from "@/hooks/useInsumoStore";
import { CategoriaInsumo } from "@/types";

// Schema for form validation
const categoriaSchema = z.object({
  nome: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres" }),
});

export default function ParametrosEstoqueTab() {
  const { insumos, categoriasPersonalizadas, adicionarCategoria, editarCategoria, removerCategoria } = useInsumoStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string, nome: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const form = useForm<z.infer<typeof categoriaSchema>>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
    },
  });

  const onSubmit = (values: z.infer<typeof categoriaSchema>) => {
    if (editingCategory) {
      editarCategoria(editingCategory.id, values.nome);
      toast({
        title: "Categoria atualizada",
        description: `A categoria foi atualizada para "${values.nome}"`,
      });
    } else {
      adicionarCategoria(values.nome);
      toast({
        title: "Categoria adicionada",
        description: `Nova categoria "${values.nome}" foi adicionada com sucesso`,
      });
    }
    
    setDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const openAddDialog = () => {
    form.reset();
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const openEditDialog = (id: string, nome: string) => {
    form.reset({ nome });
    setEditingCategory({ id, nome });
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!categoryToDelete) return;
    
    removerCategoria(categoryToDelete);
    toast({
      title: "Categoria removida",
      description: "A categoria foi removida com sucesso",
    });
    
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  // Check if a category is in use
  const isCategoryInUse = (categoria: string): boolean => {
    return insumos.some(insumo => insumo.categoria === categoria);
  };

  // Count items in a category
  const countItemsInCategory = (categoria: string): number => {
    return insumos.filter(insumo => insumo.categoria === categoria).length;
  };

  // Standard categories that can't be edited
  const standardCategories: CategoriaInsumo[] = ["Matéria Prima", "Embalagem", "Outros"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorias de Materiais</CardTitle>
        <CardDescription>
          Gerencie as categorias de materiais utilizadas no estoque e precificação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Categorias Disponíveis</h3>
            <p className="text-sm text-muted-foreground">
              Essas categorias serão utilizadas no cadastro de insumos e receitas
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Categoria</TableHead>
              <TableHead>Itens Vinculados</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Standard categories */}
            {standardCategories.map((categoria) => (
              <TableRow key={categoria}>
                <TableCell className="font-medium">{categoria}</TableCell>
                <TableCell>{countItemsInCategory(categoria)}</TableCell>
                <TableCell>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Padrão
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" disabled className="opacity-50">
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {/* Custom categories */}
            {categoriasPersonalizadas.map((categoria) => {
              const inUse = isCategoryInUse(categoria.nome);
              const itemCount = countItemsInCategory(categoria.nome);
              
              return (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
                  <TableCell>{itemCount}</TableCell>
                  <TableCell>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      Personalizada
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(categoria.id, categoria.nome)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDeleteDialog(categoria.id)}
                        disabled={inUse}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {categoriasPersonalizadas.length === 0 && standardCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Nenhuma categoria encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Dialog for adding/editing categories */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? "Atualize os detalhes da categoria selecionada"
                : "Adicione uma nova categoria para classificar seus materiais"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Materiais de Limpeza" {...field} />
                    </FormControl>
                    <FormDescription>
                      O nome da categoria será exibido nos formulários de cadastro
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editingCategory && isCategoryInUse(editingCategory.nome) && (
                <Alert className="bg-amber-50 text-amber-800">
                  <AlertDescription>
                    Esta categoria possui {countItemsInCategory(editingCategory.nome)} item(ns) vinculado(s). 
                    A alteração afetará todos os itens vinculados.
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategory ? "Salvar Alterações" : "Adicionar Categoria"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
