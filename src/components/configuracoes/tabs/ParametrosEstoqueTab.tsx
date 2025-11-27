
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseCategoriasInsumo, CategoriaInsumoSupabase } from "@/hooks/useSupabaseCategoriasInsumo";

// Schema for form validation
const categoriaSchema = z.object({
  nome: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres" }),
});

export default function ParametrosEstoqueTab() {
  const { 
    categorias, 
    loading,
    adicionarCategoria, 
    editarCategoria, 
    removerCategoria,
    getCategoriasPadrao,
    getCategoriasPersonalizadas
  } = useSupabaseCategoriasInsumo();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoriaInsumoSupabase | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoriaInsumoSupabase | null>(null);

  const form = useForm<z.infer<typeof categoriaSchema>>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof categoriaSchema>) => {
    if (editingCategory) {
      await editarCategoria(editingCategory.id, values.nome);
    } else {
      await adicionarCategoria(values.nome);
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

  const openEditDialog = (categoria: CategoriaInsumoSupabase) => {
    form.reset({ nome: categoria.nome });
    setEditingCategory(categoria);
    setDialogOpen(true);
  };

  const openDeleteDialog = (categoria: CategoriaInsumoSupabase) => {
    setCategoryToDelete(categoria);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    await removerCategoria(categoryToDelete.id);
    
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const categoriasPadrao = getCategoriasPadrao();
  const categoriasPersonalizadas = getCategoriasPersonalizadas();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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

        {categorias.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Nenhuma categoria cadastrada.</p>
            <Button className="mt-4" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Categoria
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Standard categories */}
              {categoriasPadrao.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
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
              {categoriasPersonalizadas.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
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
                        onClick={() => openEditDialog(categoria)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDeleteDialog(categoria)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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

              {editingCategory && (
                <Alert className="bg-amber-50 text-amber-800">
                  <AlertDescription>
                    A alteração do nome afetará a exibição em todos os insumos vinculados.
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
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.nome}"? Esta ação não pode ser desfeita.
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
