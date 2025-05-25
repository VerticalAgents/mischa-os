
import { useState } from "react";
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
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash } from "lucide-react";
import { useConfigStore } from "@/hooks/useConfigStore";
import { TipoLogistica } from "@/types";

export default function TiposLogisticaList() {
  const { tiposLogistica, adicionarTipoLogistica, atualizarTipoLogistica, removerTipoLogistica } = useConfigStore();
  const [editingItem, setEditingItem] = useState<TipoLogistica | null>(null);
  const [newItem, setNewItem] = useState<Omit<TipoLogistica, "id">>({
    nome: "",
    percentualLogistico: 0,
    ativo: true
  });

  // Reset form for new item
  const handleNewItem = () => {
    setEditingItem(null);
    setNewItem({
      nome: "",
      percentualLogistico: 0,
      ativo: true
    });
  };

  // Set item for editing
  const handleEditItem = (item: TipoLogistica) => {
    setEditingItem(item);
    setNewItem({
      nome: item.nome,
      percentualLogistico: item.percentualLogistico,
      ativo: item.ativo
    });
  };

  // Handle save (add or update)
  const handleSave = (close: () => void) => {
    if (!newItem.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do tipo de logística é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (editingItem) {
      atualizarTipoLogistica(editingItem.id, newItem);
      toast({
        title: "Tipo de logística atualizado",
        description: `${newItem.nome} foi atualizado com sucesso`
      });
    } else {
      adicionarTipoLogistica(newItem);
      toast({
        title: "Tipo de logística adicionado",
        description: `${newItem.nome} foi adicionado com sucesso`
      });
    }
    
    close();
  };

  // Handle delete with confirmation
  const handleDelete = (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"?`)) {
      removerTipoLogistica(id);
      toast({
        title: "Tipo de logística removido",
        description: `${nome} foi removido com sucesso`
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tipos de Logística</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={handleNewItem} className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Tipo de Logística" : "Novo Tipo de Logística"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Altere os dados do tipo de logística"
                  : "Adicione um novo tipo de logística"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Nome do tipo de logística"
                  value={newItem.nome}
                  onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentualLogistico">Percentual Logístico (%)</Label>
                <Input
                  id="percentualLogistico"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.percentualLogistico}
                  onChange={(e) => setNewItem({...newItem, percentualLogistico: parseFloat(e.target.value) || 0})}
                />
                <p className="text-sm text-muted-foreground">
                  Percentual aplicado ao custo logístico na DRE
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={newItem.ativo}
                  onCheckedChange={(checked) => setNewItem({...newItem, ativo: checked})}
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={(e) => {
                  const close = () => (e.target as HTMLButtonElement).click();
                  handleSave(close);
                }}>
                  Salvar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
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
            {tiposLogistica.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  Nenhum tipo de logística cadastrado
                </TableCell>
              </TableRow>
            ) : (
              tiposLogistica.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.percentualLogistico.toFixed(2)}%</TableCell>
                  <TableCell>{item.ativo ? 'Ativo' : 'Inativo'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Tipo de Logística</DialogTitle>
                          <DialogDescription>
                            Altere os dados do tipo de logística
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input
                              id="nome"
                              placeholder="Nome do tipo de logística"
                              value={newItem.nome}
                              onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="percentualLogistico">Percentual Logístico (%)</Label>
                            <Input
                              id="percentualLogistico"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={newItem.percentualLogistico}
                              onChange={(e) => setNewItem({...newItem, percentualLogistico: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-sm text-muted-foreground">
                              Percentual aplicado ao custo logístico na DRE
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="ativo"
                              checked={newItem.ativo}
                              onCheckedChange={(checked) => setNewItem({...newItem, ativo: checked})}
                            />
                            <Label htmlFor="ativo">Ativo</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button onClick={(e) => {
                              const close = () => (e.target as HTMLButtonElement).click();
                              handleSave(close);
                            }}>
                              Salvar
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(item.id, item.nome)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
