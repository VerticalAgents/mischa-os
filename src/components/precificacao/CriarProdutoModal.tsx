
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseSubcategoriasProduto } from "@/hooks/useSupabaseSubcategoriasProduto";

const criarProdutoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  categoria_id: z.number().min(1, "Categoria é obrigatória"),
  subcategoria_nome: z.string().optional(),
  unidades_producao: z.number().min(1, "Unidades de produção deve ser maior que zero"),
  peso_unitario: z.number().min(0, "Peso unitário deve ser maior ou igual a zero").optional(),
  preco_venda: z.number().min(0, "Preço de venda deve ser maior ou igual a zero").optional(),
});

type CriarProdutoFormValues = z.infer<typeof criarProdutoSchema>;

interface CriarProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CriarProdutoModal({
  isOpen,
  onClose,
  onSuccess,
}: CriarProdutoModalProps) {
  const { adicionarProduto } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();
  const { subcategorias, adicionarSubcategoria, getSubcategoriasPorCategoria } = useSupabaseSubcategoriasProduto();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CriarProdutoFormValues>({
    resolver: zodResolver(criarProdutoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      categoria_id: 0,
      subcategoria_nome: "",
      unidades_producao: 1,
      peso_unitario: 0,
      preco_venda: 0,
    },
  });

  const categoriaIdWatch = form.watch('categoria_id');

  const onSubmit = async (values: CriarProdutoFormValues) => {
    setIsLoading(true);
    try {
      let subcategoria_id = undefined;

      // Se uma subcategoria foi especificada, criar ou usar existente
      if (values.subcategoria_nome && values.subcategoria_nome.trim()) {
        // Verificar se já existe uma subcategoria com esse nome para a categoria
        const subcategoriasExistentes = getSubcategoriasPorCategoria(values.categoria_id);
        const subcategoriaExistente = subcategoriasExistentes.find(
          sub => sub.nome.toLowerCase() === values.subcategoria_nome!.toLowerCase()
        );

        if (subcategoriaExistente) {
          subcategoria_id = subcategoriaExistente.id;
        } else {
          // Criar nova subcategoria
          const novaSubcategoria = await adicionarSubcategoria({
            nome: values.subcategoria_nome.trim(),
            categoria_id: values.categoria_id
          });
          if (novaSubcategoria) {
            subcategoria_id = novaSubcategoria.id;
          }
        }
      }

      const produto = await adicionarProduto({
        nome: values.nome,
        descricao: values.descricao || "",
        categoria_id: values.categoria_id,
        subcategoria_id,
        unidades_producao: values.unidades_producao,
        peso_unitario: values.peso_unitario || 0,
        preco_venda: values.preco_venda || 0,
        ativo: true,
        estoque_atual: 0
      });

      if (produto) {
        form.reset();
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: "Erro ao criar produto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Produto</DialogTitle>
          <DialogDescription>
            Crie um novo produto e associe-o a uma categoria e subcategoria
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
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

            <FormField
              control={form.control}
              name="subcategoria_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategoria (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o nome da subcategoria ou deixe em branco" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  {categoriaIdWatch > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Subcategorias existentes: {getSubcategoriasPorCategoria(categoriaIdWatch)
                        .map(sub => sub.nome).join(', ') || 'Nenhuma'}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
              control={form.control}
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
              control={form.control}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Produto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
