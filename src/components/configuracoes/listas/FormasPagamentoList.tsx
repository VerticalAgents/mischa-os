import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useConfigStore } from "@/hooks/useConfigStore";
import { FormaPagamento } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FormasPagamentoList() {
  const { toast } = useToast();
  const { formasPagamento, atualizarFormaPagamento, removerFormaPagamento } = useConfigStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [currentFormaPagamento, setCurrentFormaPagamento] = useState<FormaPagamento>({
    id: 0,
    nome: "",
    descricao: "",
    ativo: true,
  });
  const [novoItem, setNovoItem] = useState<Omit<FormaPagamento, "id">>({
    nome: `Nova Forma ${formasPagamento.length + 1}`,
    descricao: "",
    ativo: true,
  });

  const filteredFormasPagamento = formasPagamento.filter((formaPagamento) =>
    formaPagamento.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    useConfigStore.getState().adicionarFormaPagamento({
      nome: `Nova Forma ${formasPagamento.length + 1}`,
      descricao: "", // Add an empty string for descricao
      ativo: true
    });
    
    setNovoItem({
      nome: `Nova Forma ${formasPagamento.length + 1}`,
      descricao: "", // Add an empty string for descricao
      ativo: true
    });
    
    toast({
      title: "Forma de pagamento adicionada",
      description: "Nova forma de pagamento adicionada com sucesso.",
    });
  };

  const handleDuplicate = (item: FormaPagamento) => {
    useConfigStore.getState().adicionarFormaPagamento({
      nome: `${item.nome} (cópia)`,
      descricao: item.descricao || "", // Use existing descricao or empty string
      ativo: item.ativo
    });
    
    toast({
      title: "Forma de pagamento duplicada",
      description: "Forma de pagamento duplicada com sucesso.",
    });
  };

  const handleEdit = (formaPagamento: FormaPagamento) => {
    setCurrentFormaPagamento(formaPagamento);
    setOpen(true);
  };

  const handleSave = () => {
    atualizarFormaPagamento(currentFormaPagamento.id, currentFormaPagamento);
    setOpen(false);
    toast({
      title: "Forma de pagamento atualizada",
      description: "Forma de pagamento atualizada com sucesso.",
    });
  };

  const handleDelete = (id: number) => {
    removerFormaPagamento(id);
    toast({
      title: "Forma de pagamento removida",
      description: "Forma de pagamento removida com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Formas de Pagamento</h2>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar forma de pagamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredFormasPagamento.map((formaPagamento) => (
            <TableRow key={formaPagamento.id}>
              <TableCell>{formaPagamento.nome}</TableCell>
              <TableCell>{formaPagamento.descricao}</TableCell>
              <TableCell>{formaPagamento.ativo ? "Sim" : "Não"}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(formaPagamento)}
                >
                  Duplicar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(formaPagamento)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(formaPagamento.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={() => setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Forma de Pagamento</DialogTitle>
            <DialogDescription>
              Atualize os campos abaixo para editar a forma de pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Nome
              </label>
              <Input
                id="name"
                value={currentFormaPagamento.nome}
                onChange={(e) =>
                  setCurrentFormaPagamento({ ...currentFormaPagamento, nome: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right">
                Descrição
              </label>
              <Input
                id="description"
                value={currentFormaPagamento.descricao || ""}
                onChange={(e) =>
                  setCurrentFormaPagamento({ ...currentFormaPagamento, descricao: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="active" className="text-right">
                Ativo
              </label>
              <input
                type="checkbox"
                id="active"
                checked={currentFormaPagamento.ativo}
                onChange={(e) =>
                  setCurrentFormaPagamento({ ...currentFormaPagamento, ativo: e.target.checked })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
