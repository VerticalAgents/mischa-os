
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
import { useSupabaseRotasEntrega } from "@/hooks/useSupabaseRotasEntrega";

export default function RotasEntregaList() {
  const { 
    rotasEntrega, 
    loading, 
    adicionarRotaEntrega, 
    atualizarRotaEntrega, 
    removerRotaEntrega 
  } = useSupabaseRotasEntrega();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: ""
  });

  const handleAdd = async () => {
    if (!formData.nome.trim()) return;
    
    const success = await adicionarRotaEntrega(formData);
    if (success) {
      setFormData({ nome: "", descricao: "" });
      setIsAddModalOpen(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.nome.trim() || !editingItem) return;
    
    const success = await atualizarRotaEntrega(editingItem.id, formData);
    if (success) {
      setFormData({ nome: "", descricao: "" });
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja remover esta rota de entrega?")) {
      await removerRotaEntrega(id);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      descricao: item.descricao || ""
    });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return <div>Carregando rotas de entrega...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Rotas de Entrega</h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Rota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Rota de Entrega</DialogTitle>
              <DialogDescription>
                Adicione uma nova rota de entrega ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Zona Norte"
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da rota de entrega"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd}>Adicionar</Button>
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
          {rotasEntrega.map((rota) => (
            <TableRow key={rota.id}>
              <TableCell className="font-medium">{rota.nome}</TableCell>
              <TableCell>{rota.descricao || "-"}</TableCell>
              <TableCell>
                <Badge variant={rota.ativo ? "default" : "secondary"}>
                  {rota.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(rota)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(rota.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rota de Entrega</DialogTitle>
            <DialogDescription>
              Edite as informações da rota de entrega
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Zona Norte"
              />
            </div>
            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da rota de entrega"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
