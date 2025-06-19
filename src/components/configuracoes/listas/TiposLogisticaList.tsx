
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useSupabaseTiposLogistica } from "@/hooks/useSupabaseTiposLogistica";

export default function TiposLogisticaList() {
  const { 
    tiposLogistica, 
    loading, 
    adicionarTipoLogistica, 
    atualizarTipoLogistica, 
    removerTipoLogistica 
  } = useSupabaseTiposLogistica();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    percentual_logistico: 0
  });

  const handleAdd = async () => {
    if (!formData.nome.trim()) return;
    
    const success = await adicionarTipoLogistica(formData);
    if (success) {
      setFormData({ nome: "", percentual_logistico: 0 });
      setIsAddModalOpen(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.nome.trim() || !editingItem) return;
    
    const success = await atualizarTipoLogistica(editingItem.id, formData);
    if (success) {
      setFormData({ nome: "", percentual_logistico: 0 });
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja remover este tipo de logística?")) {
      await removerTipoLogistica(id);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      percentual_logistico: item.percentual_logistico || 0
    });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return <div>Carregando tipos de logística...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tipos de Logística</h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Tipo de Logística</DialogTitle>
              <DialogDescription>
                Adicione um novo tipo de logística ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Própria"
                />
              </div>
              <div>
                <Label htmlFor="percentual">Percentual Logístico (%)</Label>
                <Input
                  id="percentual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.percentual_logistico}
                  onChange={(e) => setFormData({ ...formData, percentual_logistico: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
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
            <TableHead>Percentual Logístico (%)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiposLogistica.map((tipo) => (
            <TableRow key={tipo.id}>
              <TableCell className="font-medium">{tipo.nome}</TableCell>
              <TableCell>{tipo.percentual_logistico.toFixed(2)}%</TableCell>
              <TableCell>
                <Badge variant={tipo.ativo ? "default" : "secondary"}>
                  {tipo.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(tipo)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tipo.id)}
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
            <DialogTitle>Editar Tipo de Logística</DialogTitle>
            <DialogDescription>
              Edite as informações do tipo de logística
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Própria"
              />
            </div>
            <div>
              <Label htmlFor="edit-percentual">Percentual Logístico (%)</Label>
              <Input
                id="edit-percentual"
                type="number"
                min="0"
                step="0.01"
                value={formData.percentual_logistico}
                onChange={(e) => setFormData({ ...formData, percentual_logistico: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
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
