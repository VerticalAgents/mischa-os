
import { useState, useEffect } from "react";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  PackageCheck,
  AlertTriangle,
  Boxes,
  Edit3,
  Search,
} from "lucide-react";

const ajusteEstoqueSchema = z.object({
  estoque_atual: z.number().min(0, "Estoque não pode ser negativo"),
});

type AjusteEstoqueFormValues = z.infer<typeof ajusteEstoqueSchema>;

export default function EstoqueProdutosTab() {
  const { produtos, loading, carregarProdutos, atualizarProduto } = useSupabaseProdutos();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAjusteOpen, setIsAjusteOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);

  const form = useForm<AjusteEstoqueFormValues>({
    resolver: zodResolver(ajusteEstoqueSchema),
    defaultValues: {
      estoque_atual: 0,
    },
  });

  // Filtrar produtos por termo de busca
  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos para os cards
  const totalProdutos = produtos.length;
  const produtosEmEstoque = produtos.filter(p => (p.estoque_atual || 0) > 0).length;
  const produtosBaixoEstoque = produtos.filter(p => (p.estoque_atual || 0) <= 5 && (p.estoque_atual || 0) > 0).length;

  const abrirAjusteEstoque = (produto: any) => {
    setProdutoSelecionado(produto);
    form.reset({
      estoque_atual: produto.estoque_atual || 0,
    });
    setIsAjusteOpen(true);
  };

  const onSubmitAjuste = async (values: AjusteEstoqueFormValues) => {
    if (!produtoSelecionado) return;

    try {
      const { error } = await supabase
        .from('produtos_finais')
        .update({ estoque_atual: values.estoque_atual })
        .eq('id', produtoSelecionado.id);

      if (error) {
        toast({
          title: "Erro ao ajustar estoque",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Estoque atualizado",
        description: `Estoque do produto ${produtoSelecionado.nome} atualizado com sucesso`
      });

      setIsAjusteOpen(false);
      carregarProdutos(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao atualizar o estoque",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Estoque de Produtos Acabados</h2>
          <p className="text-muted-foreground">
            Controle do estoque de produtos finais
          </p>
        </div>
      </div>

      {/* Cards informativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProdutos}</div>
            <p className="text-xs text-muted-foreground">produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              Produtos em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{produtosEmEstoque}</div>
            <p className="text-xs text-muted-foreground">com unidades disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Produtos com Baixo Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{produtosBaixoEstoque}</div>
            <p className="text-xs text-muted-foreground">5 unidades ou menos</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabela de produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>
            Gerencie o estoque dos seus produtos acabados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Produto</TableHead>
                <TableHead>Peso Unitário</TableHead>
                <TableHead className="text-center">Estoque Atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : produtosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                produtosFiltrados.map((produto) => {
                  const estoqueAtual = produto.estoque_atual || 0;
                  const isBaixoEstoque = estoqueAtual <= 5 && estoqueAtual > 0;
                  const semEstoque = estoqueAtual === 0;

                  return (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{produto.nome}</div>
                          {produto.descricao && (
                            <div className="text-sm text-muted-foreground">
                              {produto.descricao}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {produto.peso_unitario ? `${produto.peso_unitario}g` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            semEstoque
                              ? "destructive"
                              : isBaixoEstoque
                              ? "secondary"
                              : "default"
                          }
                          className={
                            semEstoque
                              ? "bg-red-100 text-red-800 border-red-200"
                              : isBaixoEstoque
                              ? "bg-orange-100 text-orange-800 border-orange-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }
                        >
                          {estoqueAtual} unidades
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirAjusteEstoque(produto)}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Ajustar Estoque
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Ajuste de Estoque */}
      <Dialog open={isAjusteOpen} onOpenChange={setIsAjusteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Ajuste o estoque atual do produto "{produtoSelecionado?.nome}"
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAjuste)} className="space-y-4">
              <FormField
                control={form.control}
                name="estoque_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Ex: 100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAjusteOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
