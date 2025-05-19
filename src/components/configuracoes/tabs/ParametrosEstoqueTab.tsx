import { useState, useEffect } from "react";
import { useConfigStore } from "@/hooks/useConfigStore";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  CategoriaInsumoParam
} from "@/types";

export default function ParametrosEstoqueTab() {
  const { toast } = useToast();
  const {
    categoriasInsumo,
    adicionarCategoriaInsumo,
    atualizarCategoriaInsumo,
    removerCategoriaInsumo,
  } = useConfigStore();
  const [open, setOpen] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState<{
    id?: number;
    nome: string;
    descricao: string;
    ativo: boolean;
  }>({ nome: "", descricao: "", ativo: true });

  const handleAddNew = () => {
    setCurrentCategoria({ nome: "", descricao: "", ativo: true });
    setOpen(true);
  };

  const handleEdit = (categoria: CategoriaInsumoParam) => {
    setCurrentCategoria({
      id: categoria.id,
      nome: categoria.nome,
      descricao: categoria.descricao || "",
      ativo: categoria.ativo
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    removerCategoriaInsumo(id);
    toast({
      title: "Categoria de Insumo Removida",
      description: "Categoria de insumo removida com sucesso.",
    });
  };

  const handleSave = () => {
    if (!currentCategoria.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (currentCategoria.id) {
      atualizarCategoriaInsumo(currentCategoria.id, {
        nome: currentCategoria.nome,
        descricao: currentCategoria.descricao,
        ativo: currentCategoria.ativo,
      });
      toast({
        title: "Categoria de Insumo Atualizada",
        description: "Categoria de insumo atualizada com sucesso.",
      });
    } else {
      adicionarCategoriaInsumo({
        nome: currentCategoria.nome,
        descricao: currentCategoria.descricao,
        ativo: currentCategoria.ativo,
      });
      toast({
        title: "Categoria de Insumo Adicionada",
        description: "Categoria de insumo adicionada com sucesso.",
      });
    }
    setOpen(false);
  };

  const renderCategoriasInsumo = () => {
    return categoriasInsumo.map((categoria) => {
      // Cast to CategoriaInsumoParam to access quantidadeItensVinculados
      const categoriaParams = categoria as CategoriaInsumoParam;
      
      return (
        <div key={categoria.id} className="flex justify-between items-center border-b py-3 last:border-b-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{categoria.nome}</span>
              {categoriaParams.quantidadeItensVinculados && categoriaParams.quantidadeItensVinculados > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {categoriaParams.quantidadeItensVinculados} item(ns)
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{categoria.descricao}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(categoria)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(categoria.id)}
              disabled={categoriaParams.quantidadeItensVinculados && categoriaParams.quantidadeItensVinculados > 0}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Categorias de Insumo</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Categoria
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categoriasInsumo.map((categoria) => (
            <TableRow key={categoria.id}>
              <TableCell className="font-medium">{categoria.nome}</TableCell>
              <TableCell>{categoria.descricao}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(categoria as CategoriaInsumoParam)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(categoria.id)}
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
            <DialogTitle>
              {currentCategoria.id
                ? "Editar Categoria de Insumo"
                : "Adicionar Categoria de Insumo"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para{" "}
              {currentCategoria.id ? "editar" : "criar"} a categoria de insumo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                type="text"
                id="name"
                value={currentCategoria.nome}
                onChange={(e) =>
                  setCurrentCategoria({ ...currentCategoria, nome: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={currentCategoria.descricao}
                onChange={(e) =>
                  setCurrentCategoria({
                    ...currentCategoria,
                    descricao: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Ativo
              </Label>
              <Switch
                id="active"
                checked={currentCategoria.ativo}
                onCheckedChange={(checked) =>
                  setCurrentCategoria({ ...currentCategoria, ativo: checked })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <Button type="submit" onClick={handleSave}>
            Salvar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
