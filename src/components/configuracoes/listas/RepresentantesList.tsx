
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
import { Representante } from "@/types";

export default function RepresentantesList() {
  const { representantes, adicionarRepresentante, atualizarRepresentante, removerRepresentante } = useConfigStore();
  const [editingItem, setEditingItem] = useState<Representante | null>(null);
  const [newItem, setNewItem] = useState<Omit<Representante, "id">>({
    nome: "",
    email: "",
    telefone: "",
    ativo: true
  });

  // Reset form for new item
  const handleNewItem = () => {
    setEditingItem(null);
    setNewItem({
      nome: "",
      email: "",
      telefone: "",
      ativo: true
    });
  };

  // Set item for editing
  const handleEditItem = (item: Representante) => {
    setEditingItem(item);
    setNewItem({
      nome: item.nome,
      email: item.email || "",
      telefone: item.telefone || "",
      ativo: item.ativo
    });
  };

  // Handle save (add or update)
  const handleSave = (close: () => void) => {
    if (!newItem.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do representante é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (editingItem) {
      atualizarRepresentante(editingItem.id, newItem);
      toast({
        title: "Representante atualizado",
        description: `${newItem.nome} foi atualizado com sucesso`
      });
    } else {
      adicionarRepresentante(newItem);
      toast({
        title: "Representante adicionado",
        description: `${newItem.nome} foi adicionado com sucesso`
      });
    }
    
    close();
  };

  // Handle delete with confirmation
  const handleDelete = (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"?`)) {
      removerRepresentante(id);
      toast({
        title: "Representante removido",
        description: `${nome} foi removido com sucesso`
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Representantes Comerciais</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={handleNewItem} className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Representante" : "Novo Representante"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Altere os dados do representante comercial"
                  : "Adicione um novo representante comercial"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Nome do representante"
                  value={newItem.nome}
                  onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newItem.email}
                  onChange={(e) => setNewItem({...newItem, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={newItem.telefone}
                  onChange={(e) => setNewItem({...newItem, telefone: e.target.value})}
                />
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
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {representantes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  Nenhum representante cadastrado
                </TableCell>
              </TableRow>
            ) : (
              representantes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.email || '-'}</TableCell>
                  <TableCell>{item.telefone || '-'}</TableCell>
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
                          <DialogTitle>Editar Representante</DialogTitle>
                          <DialogDescription>
                            Altere os dados do representante comercial
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input
                              id="nome"
                              placeholder="Nome do representante"
                              value={newItem.nome}
                              onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="email@exemplo.com"
                              value={newItem.email}
                              onChange={(e) => setNewItem({...newItem, email: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="telefone">Telefone</Label>
                            <Input
                              id="telefone"
                              placeholder="(00) 00000-0000"
                              value={newItem.telefone}
                              onChange={(e) => setNewItem({...newItem, telefone: e.target.value})}
                            />
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
