
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useSupabaseSubcategoriasCustos, SubcategoriaCusto } from '@/hooks/useSupabaseSubcategoriasCustos';
import SubcategoriaModal from '../SubcategoriaModal';
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

export default function CustosTab() {
  const {
    subcategorias,
    loading,
    criarSubcategoria,
    editarSubcategoria,
    deletarSubcategoria
  } = useSupabaseSubcategoriasCustos();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubcategoria, setEditingSubcategoria] = useState<SubcategoriaCusto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subcategoriaToDelete, setSubcategoriaToDelete] = useState<SubcategoriaCusto | null>(null);

  const handleNewSubcategoria = () => {
    setEditingSubcategoria(null);
    setModalOpen(true);
  };

  const handleEditSubcategoria = (subcategoria: SubcategoriaCusto) => {
    setEditingSubcategoria(subcategoria);
    setModalOpen(true);
  };

  const handleDeleteSubcategoria = (subcategoria: SubcategoriaCusto) => {
    setSubcategoriaToDelete(subcategoria);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (subcategoriaToDelete) {
      await deletarSubcategoria(subcategoriaToDelete.id);
      setDeleteDialogOpen(false);
      setSubcategoriaToDelete(null);
    }
  };

  const handleSave = async (nome: string, tipo: 'fixo' | 'variavel') => {
    if (editingSubcategoria) {
      return await editarSubcategoria(editingSubcategoria.id, nome, tipo);
    } else {
      return await criarSubcategoria(nome, tipo);
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    return tipo === 'fixo' ? 'default' : 'secondary';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando subcategorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Subcategorias de Custos</CardTitle>
          <Button onClick={handleNewSubcategoria}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Subcategoria
          </Button>
        </CardHeader>
        <CardContent>
          {subcategorias.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma subcategoria cadastrada</p>
              <Button 
                onClick={handleNewSubcategoria} 
                variant="outline" 
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira subcategoria
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Subcategoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategorias.map((subcategoria) => (
                  <TableRow key={subcategoria.id}>
                    <TableCell className="font-medium">
                      {subcategoria.nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTipoBadgeVariant(subcategoria.tipo)}>
                        {subcategoria.tipo === 'fixo' ? 'Fixo' : 'Variável'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSubcategoria(subcategoria)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSubcategoria(subcategoria)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <SubcategoriaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        subcategoria={editingSubcategoria}
        title={editingSubcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a subcategoria "{subcategoriaToDelete?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
