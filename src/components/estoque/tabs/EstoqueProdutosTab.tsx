
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
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Settings,
} from "lucide-react";

const ajusteEstoqueSchema = z.object({
  estoque_atual: z.number().min(0, "Estoque não pode ser negativo"),
});

const entradaManualSchema = z.object({
  quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  observacao: z.string().optional(),
});

const configurarEstoqueSchema = z.object({
  estoque_minimo: z.number().min(0, "Estoque mínimo deve ser maior ou igual a zero"),
  estoque_ideal: z.number().min(0, "Estoque ideal deve ser maior ou igual a zero"),
});

type AjusteEstoqueFormValues = z.infer<typeof ajusteEstoqueSchema>;
type EntradaManualFormValues = z.infer<typeof entradaManualSchema>;
type ConfigurarEstoqueFormValues = z.infer<typeof configurarEstoqueSchema>;

export default function EstoqueProdutosTab() {
  const { produtos, loading, carregarProdutos, atualizarProduto } = useSupabaseProdutos();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAjusteOpen, setIsAjusteOpen] = useState(false);
  const [isEntradaManualOpen, setIsEntradaManualOpen] = useState(false);
  const [isConfigurarEstoqueOpen, setIsConfigurarEstoqueOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);

  const ajusteForm = useForm<AjusteEstoqueFormValues>({
    resolver: zodResolver(ajusteEstoqueSchema),
    defaultValues: {
      estoque_atual: 0,
    },
  });

  const entradaForm = useForm<EntradaManualFormValues>({
    resolver: zodResolver(entradaManualSchema),
    defaultValues: {
      quantidade: 0,
      observacao: "",
    },
  });

  const configurarForm = useForm<ConfigurarEstoqueFormValues>({
    resolver: zodResolver(configurarEstoqueSchema),
    defaultValues: {
      estoque_minimo: 0,
      estoque_ideal: 0,
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
    ajusteForm.reset({
      estoque_atual: produto.estoque_atual || 0,
    });
    setIsAjusteOpen(true);
  };

  const abrirEntradaManual = (produto: any) => {
    setProdutoSelecionado(produto);
    entradaForm.reset({
      quantidade: 0,
      observacao: "",
    });
    setIsEntradaManualOpen(true);
  };

  const abrirConfigurarEstoque = (produto: any) => {
    setProdutoSelecionado(produto);
    configurarForm.reset({
      estoque_minimo: produto.estoque_minimo || 0,
      estoque_ideal: produto.estoque_ideal || 0,
    });
    setIsConfigurarEstoqueOpen(true);
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
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao atualizar o estoque",
        variant: "destructive"
      });
    }
  };

  const onSubmitEntradaManual = async (values: EntradaManualFormValues) => {
    if (!produtoSelecionado) return;

    try {
      // Registrar movimentação de entrada
      const { error: movError } = await supabase
        .from('movimentacoes_estoque_produtos')
        .insert({
          produto_id: produtoSelecionado.id,
          tipo: 'entrada',
          quantidade: values.quantidade,
          observacao: values.observacao,
        });

      if (movError) {
        toast({
          title: "Erro ao registrar entrada",
          description: movError.message,
          variant: "destructive"
        });
        return;
      }

      // Atualizar estoque atual
      const novoEstoque = (produtoSelecionado.estoque_atual || 0) + values.quantidade;
      const { error: updateError } = await supabase
        .from('produtos_finais')
        .update({ estoque_atual: novoEstoque })
        .eq('id', produtoSelecionado.id);

      if (updateError) {
        toast({
          title: "Erro ao atualizar estoque",
          description: updateError.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Entrada registrada",
        description: `Entrada de ${values.quantidade} unidades registrada com sucesso`
      });

      setIsEntradaManualOpen(false);
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao registrar a entrada",
        variant: "destructive"
      });
    }
  };

  const onSubmitConfigurarEstoque = async (values: ConfigurarEstoqueFormValues) => {
    if (!produtoSelecionado) return;

    try {
      const { error } = await supabase
        .from('produtos_finais')
        .update({
          estoque_minimo: values.estoque_minimo,
          estoque_ideal: values.estoque_ideal,
        })
        .eq('id', produtoSelecionado.id);

      if (error) {
        toast({
          title: "Erro ao configurar estoque",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Estoque configurado",
        description: "Configurações de estoque atualizadas com sucesso"
      });

      setIsConfigurarEstoqueOpen(false);
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao configurar estoque:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao configurar o estoque",
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
                <TableHead className="text-center">Est. Mínimo</TableHead>
                <TableHead className="text-center">Est. Ideal</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : produtosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                produtosFiltrados.map((produto) => {
                  const estoqueAtual = produto.estoque_atual || 0;
                  const estoqueMinimo = produto.estoque_minimo || 0;
                  const isBaixoEstoque = estoqueAtual <= estoqueMinimo && estoqueAtual > 0;
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
                      <TableCell className="text-center">
                        {produto.estoque_minimo || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {produto.estoque_ideal || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirConfigurarEstoque(produto)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirEntradaManual(produto)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirAjusteEstoque(produto)}
                          >
                            <Edit3 className="h-4 w-4" />
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
          <Form {...ajusteForm}>
            <form onSubmit={ajusteForm.handleSubmit(onSubmitAjuste)} className="space-y-4">
              <FormField
                control={ajusteForm.control}
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

      {/* Modal de Entrada Manual */}
      <Dialog open={isEntradaManualOpen} onOpenChange={setIsEntradaManualOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Entrada Manual de Estoque</DialogTitle>
            <DialogDescription>
              Registre uma entrada manual para "{produtoSelecionado?.nome}"
            </DialogDescription>
          </DialogHeader>
          <Form {...entradaForm}>
            <form onSubmit={entradaForm.handleSubmit(onSubmitEntradaManual)} className="space-y-4">
              <FormField
                control={entradaForm.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade (unidades)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Ex: 50"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={entradaForm.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Produção do dia 15/01..."
                        {...field}
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
                  onClick={() => setIsEntradaManualOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Registrar Entrada</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurar Estoque */}
      <Dialog open={isConfigurarEstoqueOpen} onOpenChange={setIsConfigurarEstoqueOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configurar Estoque</DialogTitle>
            <DialogDescription>
              Configure os níveis de estoque para "{produtoSelecionado?.nome}"
            </DialogDescription>
          </DialogHeader>
          <Form {...configurarForm}>
            <form onSubmit={configurarForm.handleSubmit(onSubmitConfigurarEstoque)} className="space-y-4">
              <FormField
                control={configurarForm.control}
                name="estoque_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Ex: 10"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={configurarForm.control}
                name="estoque_ideal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Ideal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Ex: 50"
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
                  onClick={() => setIsConfigurarEstoqueOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Configurações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
