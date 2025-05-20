
import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useCategoriaStore } from "@/hooks/useCategoriaStore";
import { Produto, ComponenteProduto, TipoComponente } from "@/types";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { ReceitasModal } from "./modals/ReceitasModal";
import { InsumosModal } from "./modals/InsumosModal";

const formSchema = z.object({
  nome: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  descricao: z.string().optional(),
  categoriaId: z.number().min(1, {
    message: "Categoria é obrigatória.",
  }),
  subcategoriaId: z.number().min(1, {
    message: "Subcategoria é obrigatória.",
  }),
  ativo: z.boolean().default(true),
  componentes: z.array(
    z.object({
      id: z.number(),
      nome: z.string(),
      tipo: z.enum(["Insumo", "Receita", "Outro"]),
      quantidade: z.number(),
      idItem: z.number().optional(),
      custo: z.number().optional(),
    })
  ),
});

export default function ProdutosTab() {
  const { toast } = useToast();
  const {
    produtos,
    adicionarProduto,
    atualizarProduto,
    removerProduto,
    adicionarComponenteReceita,
    adicionarComponenteInsumo,
    atualizarComponente,
    removerComponente,
  } = useProdutoStore();
  const { categorias, getSubcategoriasByCategoriaId } = useCategoriaStore();
  const [open, setOpen] = useState(false);
  const [currentProduto, setCurrentProduto] = useState<Produto | null>(null);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(
    null
  );
  const [openReceitasModal, setOpenReceitasModal] = useState(false);
  const [openInsumosModal, setOpenInsumosModal] = useState(false);
  const [selectedComponente, setSelectedComponente] =
    useState<ComponenteProduto | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      categoriaId: 0,
      subcategoriaId: 0,
      ativo: true,
      componentes: [],
    },
  });

  useEffect(() => {
    if (currentProduto) {
      setSelectedCategoriaId(currentProduto.categoriaId);
      form.reset({
        nome: currentProduto.nome,
        descricao: currentProduto.descricao,
        categoriaId: currentProduto.categoriaId,
        subcategoriaId: currentProduto.subcategoriaId,
        ativo: currentProduto.ativo,
        componentes: currentProduto.componentes,
      });
    } else {
      setSelectedCategoriaId(null);
      form.reset({
        nome: "",
        descricao: "",
        categoriaId: 0,
        subcategoriaId: 0,
        ativo: true,
        componentes: [],
      });
    }
  }, [currentProduto, form]);

  const handleAddNew = () => {
    setCurrentProduto(null);
    setOpen(true);
  };

  const handleEdit = (produto: Produto) => {
    setCurrentProduto(produto);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    removerProduto(id);
    toast({
      title: "Produto Removido",
      description: "Produto removido com sucesso.",
    });
  };

  const handleSave = (values: z.infer<typeof formSchema>) => {
    if (currentProduto) {
      atualizarProduto(currentProduto.id, values);
      toast({
        title: "Produto Atualizado",
        description: "Produto atualizado com sucesso.",
      });
    } else {
      adicionarProduto({
        ...values,
      });
      toast({
        title: "Produto Adicionado",
        description: "Produto adicionado com sucesso.",
      });
    }
    setOpen(false);
  };

  const handleCategoriaChange = (value: string) => {
    const categoriaId = parseInt(value);
    setSelectedCategoriaId(categoriaId);
    form.setValue("subcategoriaId", 0);
  };

  const handleDeleteComponente = useCallback(
    (componenteId: number) => {
      if (currentProduto) {
        removerComponente(currentProduto.id, componenteId);
        toast({
          title: "Componente Removido",
          description: "Componente removido com sucesso.",
        });
      }
    },
    [currentProduto, removerComponente, toast]
  );

  const handleOpenReceitasModal = (componente: ComponenteProduto | null) => {
    setSelectedComponente(componente);
    setOpenReceitasModal(true);
  };

  const handleOpenInsumosModal = (componente: ComponenteProduto | null) => {
    setSelectedComponente(componente);
    setOpenInsumosModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Produtos</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Subcategoria</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto) => (
            <TableRow key={produto.id}>
              <TableCell className="font-medium">{produto.nome}</TableCell>
              <TableCell>
                {categorias.find((c) => c.id === produto.categoriaId)?.nome}
              </TableCell>
              <TableCell>
                {
                  getSubcategoriasByCategoriaId(produto.categoriaId).find(
                    (s) => s.id === produto.subcategoriaId
                  )?.nome
                }
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(produto)}
                  className="mr-2"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(produto.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentProduto ? "Editar Produto" : "Adicionar Produto"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para{" "}
              {currentProduto ? "editar" : "criar"} o produto.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="grid gap-4 py-4"
            >
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Nome do produto"
                  {...form.register("nome")}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  className="col-span-3"
                  {...form.register("descricao")}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria" className="text-right">
                  Categoria
                </Label>
                <Select
                  onValueChange={(value) => handleCategoriaChange(value)}
                  defaultValue={
                    currentProduto ? currentProduto.categoriaId.toString() : ""
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem
                        key={categoria.id}
                        value={categoria.id.toString()}
                      >
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subcategoria" className="text-right">
                  Subcategoria
                </Label>
                <Select
                  defaultValue={
                    currentProduto ? currentProduto.subcategoriaId.toString() : ""
                  }
                  onValueChange={(value) =>
                    form.setValue("subcategoriaId", parseInt(value))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubcategoriasByCategoriaId(
                      selectedCategoriaId || 0
                    ).map((subcategoria) => (
                      <SelectItem
                        key={subcategoria.id}
                        value={subcategoria.id.toString()}
                      >
                        {subcategoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Ativo
                </Label>
                <Switch
                  id="active"
                  defaultChecked={currentProduto ? currentProduto.ativo : true}
                  {...form.register("ativo")}
                  className="col-span-3"
                />
              </div>

              <div>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle>Componentes</CardTitle>
                    <CardDescription>
                      Adicione os componentes do produto.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {form.getValues("componentes").map((componente, index) => (
                      <div
                        key={componente.id}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {componente.nome} ({componente.quantidade})
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              componente.tipo === "Receita"
                                ? handleOpenReceitasModal(componente)
                                : handleOpenInsumosModal(componente)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteComponente(componente.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenReceitasModal(null)}
                      >
                        Adicionar Receita
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenInsumosModal(null)}
                      >
                        Adicionar Insumo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button type="submit">Salvar</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ReceitasModal
        open={openReceitasModal}
        setOpen={setOpenReceitasModal}
        produtoId={currentProduto?.id}
        componente={selectedComponente}
      />

      <InsumosModal
        open={openInsumosModal}
        setOpen={setOpenInsumosModal}
        produtoId={currentProduto?.id}
        componente={selectedComponente}
      />
    </div>
  );
}
