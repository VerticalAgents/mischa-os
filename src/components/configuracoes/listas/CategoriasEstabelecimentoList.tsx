
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { useSupabaseCategoriasEstabelecimento } from "@/hooks/useSupabaseCategoriasEstabelecimento";

export default function CategoriasEstabelecimentoList() {
  const { 
    categorias, 
    loading, 
    adicionarCategoria, 
    atualizarCategoria, 
    removerCategoria 
  } = useSupabaseCategoriasEstabelecimento();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({ nome: "", descricao: "" });
    setEditingItem(null);
  };

  const handleAdd = async () => {
    if (!formData.nome.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await adicionarCategoria({
        nome: formData.nome,
        descricao: formData.descricao
      });
      
      if (success) {
        resetForm();
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.nome.trim() || !editingItem) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await atualizarCategoria(editingItem.id, {
        nome: formData.nome,
        descricao: formData.descricao
      });
      
      if (success) {
        resetForm();
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error('Erro ao editar categoria:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja remover esta categoria de estabelecimento?")) {
      await removerCategoria(id);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome || "",
      descricao: item.descricao || ""
    });
    setIsEditModalOpen(true);
  };

  const closeAddModal = () => {
    resetForm();
    setIsAddModalOpen(false);
  };

  const closeEditModal = () => {
    resetForm();
    setIsEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando categorias de estabelecimento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Categorias de Estabelecimento</h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Categoria de Estabelecimento</DialogTitle>
              <DialogDescription>
                Adicione uma nova categoria de estabelecimento ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Padaria"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da categoria"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAddModal} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!formData.nome.trim() || isSubmitting}>
                {isSubmitting ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categorias.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                Nenhuma categoria encontrada
              </TableCell>
            </TableRow>
          ) : (
            categorias.map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell className="font-medium">{categoria.nome}</TableCell>
                <TableCell>{categoria.descricao || "-"}</TableCell>
                <TableCell>
                  <Badge variant={categoria.ativo ? "default" : "secondary"}>
                    {categoria.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(categoria)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(categoria.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria de Estabelecimento</DialogTitle>
            <DialogDescription>
              Edite as informações da categoria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Padaria"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da categoria"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={!formData.nome.trim() || isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
