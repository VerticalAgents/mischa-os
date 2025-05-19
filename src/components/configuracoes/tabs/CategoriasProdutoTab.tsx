import { useState, useEffect } from "react";
import { useProdutoCategoriaStore } from "@/hooks/useProdutoCategoriaStore";
import { useProdutoSubcategoriaStore } from "@/hooks/useProdutoSubcategoriaStore";
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
import { ProdutoCategoria, ProdutoSubcategoria } from "@/types";
import { useToast } from "@/hooks/use-toast";
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

export default function CategoriasProdutoTab() {
  const { categorias, adicionarCategoria, atualizarCategoria, removerCategoria } = useProdutoCategoriaStore();
  const { subcategorias, adicionarSubcategoria, atualizarSubcategoria, removerSubcategoria } = useProdutoSubcategoriaStore();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState<ProdutoCategoria>({
    id: 0,
    nome: "",
    descricao: "",
    ativo: true,
    subcategorias: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [newSubcategoria, setNewSubcategoria] = useState("");
  const [editingSubcategoriaId, setEditingSubcategoriaId] = useState<number | null>(null);
  const [editedSubcategoriaName, setEditedSubcategoriaName] = useState("");

  const filteredCategorias = categorias.filter((categoria) =>
    categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setCurrentCategoria({
      id: 0,
      nome: "",
      descricao: "",
      ativo: true,
      subcategorias: [],
    });
    setOpen(true);
  };

  const handleEditCategoria = (categoria: ProdutoCategoria) => {
    setCurrentCategoria({
      id: categoria.id,
      nome: categoria.nome,
      descricao: categoria.descricao || "",
      ativo: categoria.ativo,
      subcategorias: categoria.subcategorias,
    });
    setOpen(true);
  };

  const handleSaveCategoria = () => {
    if (!currentCategoria.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (currentCategoria.id === 0) {
      adicionarCategoria({
        nome: currentCategoria.nome,
        descricao: currentCategoria.descricao,
        ativo: currentCategoria.ativo,
        subcategorias: [],
      });
      toast({
        title: "Categoria adicionada",
        description: "Categoria adicionada com sucesso.",
      });
    } else {
      atualizarCategoria(currentCategoria.id, {
        nome: currentCategoria.nome,
        descricao: currentCategoria.descricao,
        ativo: currentCategoria.ativo,
        subcategorias: currentCategoria.subcategorias,
      });
      toast({
        title: "Categoria atualizada",
        description: "Categoria atualizada com sucesso.",
      });
    }

    setOpen(false);
  };

  const handleDeleteCategoria = (categoriaId: number) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    if (categoria && categoria.subcategorias && categoria.subcategorias.length > 0) {
      toast({
        title: "Erro",
        description: "Não é possível excluir uma categoria com subcategorias vinculadas.",
        variant: "destructive",
      });
      return;
    }

    removerCategoria(categoriaId);
    toast({
      title: "Categoria excluída",
      description: "Categoria excluída com sucesso.",
    });
  };

  const handleAddSubcategoria = (categoriaId: number) => {
    if (!newSubcategoria.trim()) {
      toast({
        title: "Erro",
        description: "O nome da subcategoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    adicionarSubcategoria({
      categoriaId: categoriaId,
      nome: newSubcategoria,
      ativo: true,
    });

    const categoria = categorias.find((c) => c.id === categoriaId);
    if (categoria) {
      atualizarCategoria(categoriaId, {
        ...categoria,
        subcategorias: [...categoria.subcategorias, {
          id: subcategorias.length + 1,
          categoriaId: categoriaId,
          nome: newSubcategoria,
          ativo: true,
        }],
      });
    }

    setNewSubcategoria("");
    toast({
      title: "Subcategoria adicionada",
      description: "Subcategoria adicionada com sucesso.",
    });
  };

  const handleEditSubcategoria = (subcategoria: ProdutoSubcategoria) => {
    setEditingSubcategoriaId(subcategoria.id);
    setEditedSubcategoriaName(subcategoria.nome);
  };

  const handleUpdateSubcategoria = (subcategoriaId: number) => {
    if (!editedSubcategoriaName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da subcategoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    atualizarSubcategoria(subcategoriaId, {
      nome: editedSubcategoriaName,
      ativo: true,
    });

    setEditingSubcategoriaId(null);
    setEditedSubcategoriaName("");
    toast({
      title: "Subcategoria atualizada",
      description: "Subcategoria atualizada com sucesso.",
    });
  };

  const handleDeleteSubcategoria = (subcategoriaId: number, categoriaId: number) => {
    removerSubcategoria(subcategoriaId);

    const categoria = categorias.find((c) => c.id === categoriaId);
    if (categoria) {
      atualizarCategoria(categoriaId, {
        ...categoria,
        subcategorias: categoria.subcategorias.filter((sub) => sub.id !== subcategoriaId),
      });
    }

    toast({
      title: "Subcategoria excluída",
      description: "Subcategoria excluída com sucesso.",
    });
  };

  const renderCategorias = () => {
    return filteredCategorias.map((categoria) => (
      <div key={categoria.id} className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">{categoria.nome}</h3>
            <p className="text-sm text-muted-foreground">{categoria.descricao || ""}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEditCategoria(categoria)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategoria(categoria.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium">Subcategorias</h4>
          <div className="flex items-center space-x-2 mt-2">
            <Input
              type="text"
              placeholder="Nova subcategoria"
              value={newSubcategoria}
              onChange={(e) => setNewSubcategoria(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => handleAddSubcategoria(categoria.id)}>Adicionar</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subcategorias
                .filter((subcategoria) => subcategoria.categoriaId === categoria.id)
                .map((subcategoria) => (
                  <TableRow key={subcategoria.id}>
                    <TableCell>
                      {editingSubcategoriaId === subcategoria.id ? (
                        <Input
                          type="text"
                          value={editedSubcategoriaName}
                          onChange={(e) => setEditedSubcategoriaName(e.target.value)}
                        />
                      ) : (
                        subcategoria.nome
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingSubcategoriaId === subcategoria.id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUpdateSubcategoria(subcategoria.id)}
                          >
                            Salvar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingSubcategoriaId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSubcategoria(subcategoria)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubcategoria(subcategoria.id, categoria.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Categorias de Produto</h2>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova categoria
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border rounded-md border">
        {filteredCategorias.length > 0 ? (
          renderCategorias()
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma categoria encontrada.
          </div>
        )}
      </div>

      {/* Modal para Adicionar/Editar Categoria */}
      <Dialog open={open} onOpenChange={() => setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentCategoria.id === 0 ? "Nova Categoria" : "Editar Categoria"}</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {currentCategoria.id === 0 ? "criar" : "editar"} a categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={currentCategoria.nome}
                onChange={(e) => setCurrentCategoria({ ...currentCategoria, nome: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descricao" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="descricao"
                value={currentCategoria.descricao || ""}
                onChange={(e) => setCurrentCategoria({ ...currentCategoria, descricao: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ativo" className="text-right">
                Ativo
              </Label>
              <Switch
                id="ativo"
                checked={currentCategoria.ativo}
                onCheckedChange={(checked) => setCurrentCategoria({ ...currentCategoria, ativo: checked })}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveCategoria}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
