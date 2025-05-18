
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash } from "lucide-react";
import { useConfigStore } from "@/hooks/useConfigStore";
import { CategoriaEstabelecimento } from "@/types";

export default function CategoriasEstabelecimentoList() {
  const { categoriasEstabelecimento, adicionarCategoria, atualizarCategoria, removerCategoria } = useConfigStore();
  const [editingItem, setEditingItem] = useState<CategoriaEstabelecimento | null>(null);
  const [newItem, setNewItem] = useState<Omit<CategoriaEstabelecimento, "id">>({
    nome: "",
    descricao: "",
    ativo: true
  });

  // Reset form for new item
  const handleNewItem = () => {
    setEditingItem(null);
    setNewItem({
      nome: "",
      descricao: "",
      ativo: true
    });
  };

  // Set item for editing
  const handleEditItem = (item: CategoriaEstabelecimento) => {
    setEditingItem(item);
    setNewItem({
      nome: item.nome,
      descricao: item.descricao || "",
      ativo: item.ativo
    });
  };

  // Handle save (add or update)
  const handleSave = (close: () => void) => {
    if (!newItem.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (editingItem) {
      atualizarCategoria(editingItem.id, newItem);
      toast({
        title: "Categoria atualizada",
        description: `${newItem.nome} foi atualizada com sucesso`
      });
    } else {
      adicionarCategoria(newItem);
      toast({
        title: "Categoria adicionada",
        description: `${newItem.nome} foi adicionada com sucesso`
      });
    }
    
    close();
  };

  // Handle delete with confirmation
  const handleDelete = (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"?`)) {
      removerCategoria(id);
      toast({
        title: "Categoria removida",
        description: `${nome} foi removida com sucesso`
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Categorias de Estabelecimento</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={handleNewItem} className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Altere os dados da categoria de estabelecimento"
                  : "Adicione uma nova categoria de estabelecimento"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Nome da categoria"
                  value={newItem.nome}
                  onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição da categoria"
                  value={newItem.descricao}
                  onChange={(e) => setNewItem({...newItem, descricao: e.target.value})}
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
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriasEstabelecimento.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  Nenhuma categoria cadastrada
                </TableCell>
              </TableRow>
            ) : (
              categoriasEstabelecimento.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.descricao || '-'}</TableCell>
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
                          <DialogTitle>Editar Categoria</DialogTitle>
                          <DialogDescription>
                            Altere os dados da categoria de estabelecimento
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input
                              id="nome"
                              placeholder="Nome da categoria"
                              value={newItem.nome}
                              onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="descricao">Descrição</Label>
                            <Textarea
                              id="descricao"
                              placeholder="Descrição da categoria"
                              value={newItem.descricao}
                              onChange={(e) => setNewItem({...newItem, descricao: e.target.value})}
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
