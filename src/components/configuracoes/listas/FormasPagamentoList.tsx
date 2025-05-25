
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
import { FormaPagamentoItem } from "@/types";

export default function FormasPagamentoList() {
  const { formasPagamento, adicionarFormaPagamento, atualizarFormaPagamento, removerFormaPagamento } = useConfigStore();
  const [editingItem, setEditingItem] = useState<FormaPagamentoItem | null>(null);
  const [newItem, setNewItem] = useState<Omit<FormaPagamentoItem, "id">>({
    nome: "Boleto",
    ativo: true
  });

  // Reset form for new item
  const handleNewItem = () => {
    setEditingItem(null);
    setNewItem({
      nome: "Boleto",
      ativo: true
    });
  };

  // Set item for editing
  const handleEditItem = (item: FormaPagamentoItem) => {
    setEditingItem(item);
    setNewItem({
      nome: item.nome,
      ativo: item.ativo
    });
  };

  // Handle save (add or update)
  const handleSave = (close: () => void) => {
    if (editingItem) {
      atualizarFormaPagamento(editingItem.id, newItem);
      toast({
        title: "Forma de pagamento atualizada",
        description: `${newItem.nome} foi atualizada com sucesso`
      });
    } else {
      adicionarFormaPagamento(newItem);
      toast({
        title: "Forma de pagamento adicionada",
        description: `${newItem.nome} foi adicionada com sucesso`
      });
    }
    
    close();
  };

  // Handle delete with confirmation
  const handleDelete = (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"?`)) {
      removerFormaPagamento(id);
      toast({
        title: "Forma de pagamento removida",
        description: `${nome} foi removida com sucesso`
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Formas de Pagamento</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={handleNewItem} className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Altere os dados da forma de pagamento"
                  : "Adicione uma nova forma de pagamento"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <select
                  id="nome"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newItem.nome}
                  onChange={(e) => setNewItem({...newItem, nome: e.target.value as any})}
                >
                  <option value="Boleto">Boleto</option>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formasPagamento.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  Nenhuma forma de pagamento cadastrada
                </TableCell>
              </TableRow>
            ) : (
              formasPagamento.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
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
                          <DialogTitle>Editar Forma de Pagamento</DialogTitle>
                          <DialogDescription>
                            Altere os dados da forma de pagamento
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="nome">Nome</Label>
                            <select
                              id="nome"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={newItem.nome}
                              onChange={(e) => setNewItem({...newItem, nome: e.target.value as any})}
                            >
                              <option value="Boleto">Boleto</option>
                              <option value="PIX">PIX</option>
                              <option value="Dinheiro">Dinheiro</option>
                            </select>
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
