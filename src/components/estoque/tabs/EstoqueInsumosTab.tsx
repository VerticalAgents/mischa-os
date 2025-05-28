
import { useState, useEffect } from "react";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
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
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Settings,
  Edit,
} from "lucide-react";

const movimentacaoSchema = z.object({
  quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  observacao: z.string().optional(),
});

const configurarEstoqueSchema = z.object({
  estoque_minimo: z.number().min(0, "Estoque mínimo deve ser maior ou igual a zero"),
  estoque_ideal: z.number().min(0, "Estoque ideal deve ser maior ou igual a zero"),
});

const editarInsumoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  volume_bruto: z.number().min(0.01, "Volume bruto deve ser maior que zero"),
  unidade_medida: z.string().min(1, "Unidade de medida é obrigatória"),
  custo_medio: z.number().min(0.01, "Custo médio deve ser maior que zero"),
});

type MovimentacaoFormValues = z.infer<typeof movimentacaoSchema>;
type ConfigurarEstoqueFormValues = z.infer<typeof configurarEstoqueSchema>;
type EditarInsumoFormValues = z.infer<typeof editarInsumoSchema>;

export default function EstoqueInsumosTab() {
  const { insumos, loading, carregarInsumos, atualizarInsumo } = useSupabaseInsumos();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("Todas");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isMovimentacaoOpen, setIsMovimentacaoOpen] = useState(false);
  const [isConfigurarEstoqueOpen, setIsConfigurarEstoqueOpen] = useState(false);
  const [isEditarInsumoOpen, setIsEditarInsumoOpen] = useState(false);
  const [insumoSelecionado, setInsumoSelecionado] = useState<any>(null);

  const movimentacaoForm = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: {
      quantidade: 0,
      observacao: "",
    },
  });

  const configurarEstoqueForm = useForm<ConfigurarEstoqueFormValues>({
    resolver: zodResolver(configurarEstoqueSchema),
    defaultValues: {
      estoque_minimo: 0,
      estoque_ideal: 0,
    },
  });

  const editarInsumoForm = useForm<EditarInsumoFormValues>({
    resolver: zodResolver(editarInsumoSchema),
    defaultValues: {
      nome: "",
      categoria: "",
      volume_bruto: 0,
      unidade_medida: "",
      custo_medio: 0,
    },
  });

  // Filtrar e ordenar insumos
  const insumosFiltrados = insumos
    .filter((insumo) =>
      insumo.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((insumo) =>
      categoriaFilter === "Todas" ? true : insumo.categoria === categoriaFilter
    )
    .sort((a, b) => {
      const estoqueA = a.estoque_atual || 0;
      const estoqueB = b.estoque_atual || 0;
      return sortOrder === "asc" ? estoqueA - estoqueB : estoqueB - estoqueA;
    });

  const totalInsumos = insumos.length;
  const estoqueCritico = insumos.filter(
    (i) => (i.estoque_atual || 0) < (i.estoque_minimo || 0)
  ).length;
  const valorTotalEstoque = insumos.reduce((total, insumo) => {
    const custoUnitario = insumo.volume_bruto > 0 ? insumo.custo_medio / insumo.volume_bruto : 0;
    return total + (insumo.estoque_atual || 0) * custoUnitario;
  }, 0);

  const abrirMovimentacao = (insumo: any) => {
    setInsumoSelecionado(insumo);
    movimentacaoForm.reset({
      quantidade: 0,
      observacao: "",
    });
    setIsMovimentacaoOpen(true);
  };

  const abrirConfigurarEstoque = (insumo: any) => {
    setInsumoSelecionado(insumo);
    configurarEstoqueForm.reset({
      estoque_minimo: insumo.estoque_minimo || 0,
      estoque_ideal: insumo.estoque_ideal || 0,
    });
    setIsConfigurarEstoqueOpen(true);
  };

  const abrirEditarInsumo = (insumo: any) => {
    setInsumoSelecionado(insumo);
    editarInsumoForm.reset({
      nome: insumo.nome,
      categoria: insumo.categoria,
      volume_bruto: insumo.volume_bruto,
      unidade_medida: insumo.unidade_medida,
      custo_medio: insumo.custo_medio,
    });
    setIsEditarInsumoOpen(true);
  };

  const onSubmitMovimentacao = async (values: MovimentacaoFormValues) => {
    if (!insumoSelecionado) return;

    try {
      // Registrar movimentação
      const { error: movError } = await supabase
        .from('movimentacoes_estoque_insumos')
        .insert({
          insumo_id: insumoSelecionado.id,
          tipo: 'entrada',
          quantidade: values.quantidade,
          observacao: values.observacao,
        });

      if (movError) {
        toast({
          title: "Erro ao registrar movimentação",
          description: movError.message,
          variant: "destructive"
        });
        return;
      }

      // Atualizar estoque atual
      const novoEstoque = (insumoSelecionado.estoque_atual || 0) + values.quantidade;
      const { error: updateError } = await supabase
        .from('insumos')
        .update({ 
          estoque_atual: novoEstoque,
          ultima_entrada: new Date().toISOString()
        })
        .eq('id', insumoSelecionado.id);

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
        description: `Entrada de ${values.quantidade} ${insumoSelecionado.unidade_medida} registrada com sucesso`
      });

      setIsMovimentacaoOpen(false);
      carregarInsumos();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao registrar a movimentação",
        variant: "destructive"
      });
    }
  };

  const onSubmitConfigurarEstoque = async (values: ConfigurarEstoqueFormValues) => {
    if (!insumoSelecionado) return;

    const success = await atualizarInsumo(insumoSelecionado.id, {
      estoque_minimo: values.estoque_minimo,
      estoque_ideal: values.estoque_ideal,
    });

    if (success) {
      setIsConfigurarEstoqueOpen(false);
      toast({
        title: "Estoque configurado",
        description: "Configurações de estoque atualizadas com sucesso"
      });
    }
  };

  const onSubmitEditarInsumo = async (values: EditarInsumoFormValues) => {
    if (!insumoSelecionado) return;

    const success = await atualizarInsumo(insumoSelecionado.id, values);

    if (success) {
      setIsEditarInsumoOpen(true);
      toast({
        title: "Insumo atualizado",
        description: "Dados do insumo atualizados com sucesso"
      });
    }
  };

  const getEstoqueStatus = (insumo: any) => {
    const atual = insumo.estoque_atual || 0;
    const minimo = insumo.estoque_minimo || 0;
    const ideal = insumo.estoque_ideal || 0;

    if (atual < minimo) return "critico";
    if (atual < ideal) return "baixo";
    return "bom";
  };

  const getEstoqueColor = (status: string) => {
    switch (status) {
      case "critico":
        return "bg-red-100 text-red-800 border-red-200";
      case "baixo":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Estoque de Insumos</h2>
          <p className="text-muted-foreground">
            Controle do estoque de matérias-primas e embalagens
          </p>
        </div>
      </div>

      {/* Cards informativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total de Insumos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInsumos}</div>
            <p className="text-xs text-muted-foreground">insumos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Estoque Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{estoqueCritico}</div>
            <p className="text-xs text-muted-foreground">abaixo do estoque mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {valorTotalEstoque.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">valor total em estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles de filtro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar insumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categoriaFilter === "Todas" ? "default" : "outline"}
            onClick={() => setCategoriaFilter("Todas")}
          >
            Todas
          </Button>
          <Button
            size="sm"
            variant={categoriaFilter === "Matéria Prima" ? "default" : "outline"}
            onClick={() => setCategoriaFilter("Matéria Prima")}
          >
            Matéria Prima
          </Button>
          <Button
            size="sm"
            variant={categoriaFilter === "Embalagem" ? "default" : "outline"}
            onClick={() => setCategoriaFilter("Embalagem")}
          >
            Embalagem
          </Button>
          <Button
            size="sm"
            variant={categoriaFilter === "Outros" ? "default" : "outline"}
            onClick={() => setCategoriaFilter("Outros")}
          >
            Outros
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            Estoque{" "}
            {sortOrder === "asc" ? (
              <TrendingUp className="ml-1 h-4 w-4" />
            ) : (
              <TrendingDown className="ml-1 h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Tabela de insumos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Insumos</CardTitle>
          <CardDescription>
            Gerencie o estoque dos seus insumos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Volume Bruto</TableHead>
                <TableHead>Un. Med.</TableHead>
                <TableHead className="text-right">Custo Médio (R$)</TableHead>
                <TableHead className="text-center">Estoque Atual</TableHead>
                <TableHead className="text-center">Est. Mínimo</TableHead>
                <TableHead className="text-center">Est. Ideal</TableHead>
                <TableHead>Última Entrada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : insumosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Nenhum insumo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                insumosFiltrados.map((insumo) => {
                  const status = getEstoqueStatus(insumo);
                  const estoqueAtual = insumo.estoque_atual || 0;

                  return (
                    <TableRow key={insumo.id}>
                      <TableCell className="font-medium">{insumo.nome}</TableCell>
                      <TableCell>{insumo.categoria}</TableCell>
                      <TableCell>{insumo.volume_bruto}</TableCell>
                      <TableCell>{insumo.unidade_medida}</TableCell>
                      <TableCell className="text-right">
                        R$ {insumo.custo_medio.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={getEstoqueColor(status)}
                        >
                          {estoqueAtual}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {insumo.estoque_minimo || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {insumo.estoque_ideal || 0}
                      </TableCell>
                      <TableCell>
                        {insumo.ultima_entrada
                          ? format(new Date(insumo.ultima_entrada), "dd/MM/yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirEditarInsumo(insumo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirConfigurarEstoque(insumo)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirMovimentacao(insumo)}
                          >
                            <Plus className="h-4 w-4" />
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

      {/* Modal de Movimentação */}
      <Dialog open={isMovimentacaoOpen} onOpenChange={setIsMovimentacaoOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Entrada Manual de Estoque</DialogTitle>
            <DialogDescription>
              Registre uma entrada manual para "{insumoSelecionado?.nome}"
            </DialogDescription>
          </DialogHeader>
          <Form {...movimentacaoForm}>
            <form onSubmit={movimentacaoForm.handleSubmit(onSubmitMovimentacao)} className="space-y-4">
              <FormField
                control={movimentacaoForm.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantidade ({insumoSelecionado?.unidade_medida})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={movimentacaoForm.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Compra do fornecedor X..."
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
                  onClick={() => setIsMovimentacaoOpen(false)}
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
              Configure os níveis de estoque para "{insumoSelecionado?.nome}"
            </DialogDescription>
          </DialogHeader>
          <Form {...configurarEstoqueForm}>
            <form onSubmit={configurarEstoqueForm.handleSubmit(onSubmitConfigurarEstoque)} className="space-y-4">
              <FormField
                control={configurarEstoqueForm.control}
                name="estoque_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
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
                control={configurarEstoqueForm.control}
                name="estoque_ideal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Ideal</FormLabel>
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

      {/* Modal de Editar Insumo */}
      <Dialog open={isEditarInsumoOpen} onOpenChange={setIsEditarInsumoOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Insumo</DialogTitle>
            <DialogDescription>
              Edite os dados do insumo "{insumoSelecionado?.nome}"
            </DialogDescription>
          </DialogHeader>
          <Form {...editarInsumoForm}>
            <form onSubmit={editarInsumoForm.handleSubmit(onSubmitEditarInsumo)} className="space-y-4">
              <FormField
                control={editarInsumoForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do insumo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editarInsumoForm.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Matéria Prima">Matéria Prima</SelectItem>
                        <SelectItem value="Embalagem">Embalagem</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editarInsumoForm.control}
                name="volume_bruto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume Bruto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 1000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editarInsumoForm.control}
                name="unidade_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="g">g (gramas)</SelectItem>
                        <SelectItem value="kg">kg (quilogramas)</SelectItem>
                        <SelectItem value="ml">ml (mililitros)</SelectItem>
                        <SelectItem value="l">l (litros)</SelectItem>
                        <SelectItem value="un">un (unidades)</SelectItem>
                        <SelectItem value="pct">pct (pacotes)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editarInsumoForm.control}
                name="custo_medio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Médio (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 10.50"
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
                  onClick={() => setIsEditarInsumoOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
