
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { useSupabaseReceitas } from "@/hooks/useSupabaseReceitas";
import { useSupabaseProdutos, ProdutoCompleto } from "@/hooks/useSupabaseProdutos";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const editarProdutoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  categoria_id: z.number().min(1, "Categoria é obrigatória"),
  unidades_producao: z.number().min(1, "Unidades de produção deve ser maior que zero"),
  peso_unitario: z.number().min(0, "Peso unitário deve ser maior ou igual a zero").optional(),
  preco_venda: z.number().min(0, "Preço de venda deve ser maior ou igual a zero").optional(),
});

const componenteProdutoSchema = z.object({
  tipo: z.enum(['receita', 'insumo']),
  item_id: z.string().min(1, "Selecione um item"),
  quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
});

type EditarProdutoFormValues = z.infer<typeof editarProdutoSchema>;
type ComponenteProdutoFormValues = z.infer<typeof componenteProdutoSchema>;

interface EditarProdutoModalProps {
  produto: ProdutoCompleto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditarProdutoModal({
  produto,
  isOpen,
  onClose,
  onSuccess,
}: EditarProdutoModalProps) {
  const { insumos } = useSupabaseInsumos();
  const { receitas } = useSupabaseReceitas();
  const { adicionarComponenteProduto, removerComponenteProduto } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();
  const [isAdicionandoComponente, setIsAdicionandoComponente] = useState(false);

  const produtoForm = useForm<EditarProdutoFormValues>({
    resolver: zodResolver(editarProdutoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      categoria_id: 0,
      unidades_producao: 1,
      peso_unitario: 0,
      preco_venda: 0,
    },
  });

  const componenteForm = useForm<ComponenteProdutoFormValues>({
    resolver: zodResolver(componenteProdutoSchema),
    defaultValues: {
      tipo: 'receita',
      item_id: "",
      quantidade: 0,
    },
  });

  useEffect(() => {
    if (produto) {
      produtoForm.reset({
        nome: produto.nome,
        descricao: produto.descricao || "",
        categoria_id: produto.categoria_id || 0,
        unidades_producao: produto.unidades_producao,
        peso_unitario: produto.peso_unitario || 0,
        preco_venda: produto.preco_venda || 0,
      });
    }
  }, [produto, produtoForm]);

  const onSubmitProduto = async (values: EditarProdutoFormValues) => {
    if (!produto) return;

    try {
      const { error } = await supabase
        .from('produtos_finais')
        .update(values)
        .eq('id', produto.id);

      if (error) {
        toast({
          title: "Erro ao atualizar produto",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Produto atualizado",
        description: "Produto atualizado com sucesso"
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
    }
  };

  const onSubmitComponente = async (values: ComponenteProdutoFormValues) => {
    if (!produto) return;

    const success = await adicionarComponenteProduto(
      produto.id,
      values.item_id,
      values.tipo,
      values.quantidade
    );

    if (success) {
      componenteForm.reset({
        tipo: 'receita',
        item_id: "",
        quantidade: 0,
      });
      setIsAdicionandoComponente(false);
      onSuccess();
    }
  };

  const handleRemoverComponente = async (componenteId: string) => {
    const success = await removerComponenteProduto(componenteId);
    if (success) {
      onSuccess();
    }
  };

  const getItensDisponiveis = (tipo: 'receita' | 'insumo') => {
    return tipo === 'receita' ? receitas : insumos;
  };

  // Verificar se produto e componentes existem antes de renderizar
  if (!produto) {
    return null;
  }

  const componentes = produto.componentes || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Edite os dados do produto e seus componentes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário do Produto */}
          <Form {...produtoForm}>
            <form onSubmit={produtoForm.handleSubmit(onSubmitProduto)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={produtoForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={produtoForm.control}
                  name="categoria_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria do Produto</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))} 
                        value={field.value > 0 ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.id.toString()}>
                              {categoria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={produtoForm.control}
                  name="unidades_producao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidades por Produção</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Ex: 12"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={produtoForm.control}
                  name="peso_unitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso Unitário (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Ex: 50"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={produtoForm.control}
                name="preco_venda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 25.90"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={produtoForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Atualizar Produto
              </Button>
            </form>
          </Form>

          {/* Lista de Componentes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold">Componentes</h4>
              <Button
                size="sm"
                onClick={() => setIsAdicionandoComponente(true)}
                disabled={isAdicionandoComponente}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Componente
              </Button>
            </div>

            {/* Formulário para adicionar componente */}
            {isAdicionandoComponente && (
              <Form {...componenteForm}>
                <form onSubmit={componenteForm.handleSubmit(onSubmitComponente)} className="space-y-4 p-4 border rounded">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={componenteForm.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo do componente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="receita">Receita Base</SelectItem>
                              <SelectItem value="insumo">Insumo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={componenteForm.control}
                      name="item_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getItensDisponiveis(componenteForm.watch('tipo')).map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={componenteForm.control}
                      name="quantidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Ex: 1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Adicionar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAdicionandoComponente(false);
                        componenteForm.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Tabela de componentes */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {componentes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      Nenhum componente adicionado
                    </TableCell>
                  </TableRow>
                ) : (
                  componentes.map((componente) => (
                    <TableRow key={componente.id}>
                      <TableCell className="capitalize">{componente.tipo}</TableCell>
                      <TableCell>{componente.nome_item}</TableCell>
                      <TableCell>{componente.quantidade}</TableCell>
                      <TableCell>R$ {componente.custo_item.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoverComponente(componente.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
