
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
  const [selectedTipo, setSelectedTipo] = useState<'fixo' | 'variavel'>('fixo');

  // Separate subcategories by type
  const subcategoriasFixas = subcategorias.filter(sub => sub.tipo === 'fixo');
  const subcategoriasVariaveis = subcategorias.filter(sub => sub.tipo === 'variavel');

  const handleNewSubcategoria = (tipo: 'fixo' | 'variavel') => {
    setSelectedTipo(tipo);
    setEditingSubcategoria(null);
    setModalOpen(true);
  };

  const handleEditSubcategoria = (subcategoria: SubcategoriaCusto) => {
    setSelectedTipo(subcategoria.tipo);
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

  const renderSubcategoryTable = (subcategoriasList: SubcategoriaCusto[], tipo: 'fixo' | 'variavel') => {
    if (subcategoriasList.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Nenhuma subcategoria de custo {tipo === 'fixo' ? 'fixo' : 'variável'} cadastrada
          </p>
          <Button 
            onClick={() => handleNewSubcategoria(tipo)} 
            variant="outline" 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar primeira subcategoria
          </Button>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome da Subcategoria</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subcategoriasList.map((subcategoria) => (
            <TableRow key={subcategoria.id}>
              <TableCell className="font-medium">
                {subcategoria.nome}
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
    );
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
      {/* Subcategorias de Custos Fixos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Subcategorias de Custos Fixos
              <Badge variant="secondary" className="ml-2">
                {subcategoriasFixas.length} {subcategoriasFixas.length === 1 ? 'item' : 'itens'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Subcategorias para classificação de custos fixos (aluguel, salários, etc.)
            </p>
          </div>
          <Button onClick={() => handleNewSubcategoria('fixo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Subcategoria Fixa
          </Button>
        </CardHeader>
        <CardContent>
          {renderSubcategoryTable(subcategoriasFixas, 'fixo')}
        </CardContent>
      </Card>

      {/* Subcategorias de Custos Variáveis */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Subcategorias de Custos Variáveis
              <Badge variant="secondary" className="ml-2">
                {subcategoriasVariaveis.length} {subcategoriasVariaveis.length === 1 ? 'item' : 'itens'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Subcategorias para classificação de custos variáveis (impostos, comissões, etc.)
            </p>
          </div>
          <Button onClick={() => handleNewSubcategoria('variavel')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Subcategoria Variável
          </Button>
        </CardHeader>
        <CardContent>
          {renderSubcategoryTable(subcategoriasVariaveis, 'variavel')}
        </CardContent>
      </Card>

      <SubcategoriaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        subcategoria={editingSubcategoria}
        tipoFixo={selectedTipo}
        title={editingSubcategoria ? 'Editar Subcategoria' : `Nova Subcategoria ${selectedTipo === 'fixo' ? 'Fixa' : 'Variável'}`}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a subcategoria "{subcategoriaToDelete?.nome}"? 
              Esta ação não pode ser desfeita e pode afetar custos já cadastrados.
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
