import { useState } from "react";
import { useInsumosStore } from "@/hooks/useInsumosStore";
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
import { format } from "date-fns";
import {
  Insumo,
  CategoriaInsumo,
  UnidadeMedida,
  MovimentacaoEstoque,
} from "@/types/insumos";
import {
  FileDown,
  FilePlus,
  Pencil,
  PackagePlus,
  Search,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// Form schema for creating/updating insumos
const formSchema = z.object({
  nome: z.string().min(3, {
    message: "Nome deve ter no mínimo 3 caracteres.",
  }),
  categoria: z.enum(["Matéria Prima", "Embalagem", "Outros"], {
    required_error: "Selecione uma categoria.",
  }),
  volumeBruto: z.number({
    required_error: "Volume bruto é obrigatório.",
    invalid_type_error: "Volume bruto deve ser um número.",
  }).min(0.01, {
    message: "Volume bruto deve ser maior que zero.",
  }),
  unidadeMedida: z.enum(["g", "kg", "ml", "l", "un", "pct"], {
    required_error: "Selecione uma unidade de medida.",
  }),
  custoMedio: z.number({
    required_error: "Custo médio é obrigatório.",
    invalid_type_error: "Custo médio deve ser um número.",
  }).min(0.01, {
    message: "Custo médio deve ser maior que zero.",
  }),
  estoqueMinimo: z.number({
    required_error: "Estoque mínimo é obrigatório.",
    invalid_type_error: "Estoque mínimo deve ser um número.",
  }).min(0, {
    message: "Estoque mínimo não pode ser negativo.",
  }),
});

type InsumoFormValues = z.infer<typeof formSchema>;

export default function EstoqueTab() {
  const {
    insumos,
    adicionarInsumo,
    atualizarInsumo,
    removerInsumo,
    obterEstoqueAtual,
    obterMovimentacoesInsumo,
  } = useInsumosStore();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] =
    useState<CategoriaInsumo | "Todas">("Todas");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMovimentacoesOpen, setIsMovimentacoesOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<number | null>(null);
  const [selectedInsumo, setSelectedInsumo] = useState<number | null>(null);

  // Form hook
  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      categoria: "Matéria Prima",
      volumeBruto: 1,
      unidadeMedida: "g",
      custoMedio: 1,
      estoqueMinimo: 0,
    },
  });

  // Filtragem e ordenação dos insumos
  const insumosFiltrados = insumos
    .filter((insumo) =>
      insumo.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((insumo) =>
      categoriaFilter === "Todas" ? true : insumo.categoria === categoriaFilter
    )
    .sort((a, b) => {
      const estoqueA = a.estoqueAtual || 0;
      const estoqueB = b.estoqueAtual || 0;
      return sortOrder === "asc" ? estoqueA - estoqueB : estoqueB - estoqueA;
    });

  // Contadores para os cards
  const totalInsumos = insumos.length;
  const insumosEmEstoqueCritico = insumos.filter(
    (i) => (i.estoqueAtual || 0) <= (i.estoqueMinimo || 0)
  ).length;
  const valorTotalEstoque = insumos.reduce(
    (total, i) => total + (i.estoqueAtual || 0) * i.custoMedio,
    0
  );

  // Handlers
  const openNewInsumoForm = () => {
    form.reset({
      nome: "",
      categoria: "Matéria Prima",
      volumeBruto: 1,
      unidadeMedida: "g",
      custoMedio: 1,
      estoqueMinimo: 0,
    });
    setEditingInsumo(null);
    setIsFormOpen(true);
  };

  const openEditInsumoForm = (insumo: Insumo) => {
    form.reset({
      nome: insumo.nome,
      categoria: insumo.categoria,
      volumeBruto: insumo.volumeBruto,
      unidadeMedida: insumo.unidadeMedida,
      custoMedio: insumo.custoMedio,
      estoqueMinimo: insumo.estoqueMinimo || 0,
    });
    setEditingInsumo(insumo.id);
    setIsFormOpen(true);
  };

  const openMovimentacoes = (insumo: Insumo) => {
    setSelectedInsumo(insumo.id);
    setIsMovimentacoesOpen(true);
  };

  const handleRemoveInsumo = (id: number) => {
    if (confirm("Tem certeza que deseja remover este insumo?")) {
      removerInsumo(id);
    }
  };

  const onSubmit = (data: InsumoFormValues) => {
    if (editingInsumo) {
      atualizarInsumo(editingInsumo, {
        nome: data.nome,
        categoria: data.categoria,
        volumeBruto: data.volumeBruto,
        unidadeMedida: data.unidadeMedida,
        custoMedio: data.custoMedio,
        estoqueMinimo: data.estoqueMinimo,
      });
    } else {
      adicionarInsumo({
        nome: data.nome,
        categoria: data.categoria,
        volumeBruto: data.volumeBruto,
        unidadeMedida: data.unidadeMedida,
        custoMedio: data.custoMedio,
        estoqueMinimo: data.estoqueMinimo,
      });
    }
    setIsFormOpen(false);
  };

  const exportarCSV = () => {
    const headers = [
      "ID",
      "Nome",
      "Categoria",
      "Volume Bruto",
      "Unidade Medida",
      "Custo Médio",
      "Estoque Atual",
      "Estoque Mínimo",
      "Última Entrada",
    ];

    const linhas = insumosFiltrados.map((insumo) => [
      insumo.id,
      insumo.nome,
      insumo.categoria,
      insumo.volumeBruto,
      insumo.unidadeMedida,
      insumo.custoMedio.toFixed(2),
      insumo.estoqueAtual || 0,
      insumo.estoqueMinimo || 0,
      insumo.ultimaEntrada
        ? format(new Date(insumo.ultimaEntrada), "dd/MM/yyyy")
        : "N/A",
    ]);

    const csvContent = [headers.join(","), ...linhas.map((l) => l.join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `insumos_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Just fixing the search input rendering with icon
  // Only showing the relevant parts that need fixing
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Gestão de Insumos</h2>
          <p className="text-muted-foreground">
            Acompanhe e gerencie seus insumos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportarCSV} variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={openNewInsumoForm}>
            <FilePlus className="mr-2 h-4 w-4" /> Novo Insumo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Insumos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInsumos}</div>
            <p className="text-xs text-muted-foreground">insumos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {insumosEmEstoqueCritico}
            </div>
            <p className="text-xs text-muted-foreground">
              insumos abaixo do estoque mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {valorTotalEstoque.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              valor total de todos os insumos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
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

      {/* Lista de Insumos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Insumos</CardTitle>
          <CardDescription>
            Gerencie seus insumos e acompanhe o estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Volume Bruto</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Custo Médio (R$)</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="text-right">Estoque Mínimo</TableHead>
                <TableHead>Última Entrada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Nenhum insumo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                insumosFiltrados.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell>{insumo.id}</TableCell>
                    <TableCell className="font-medium">{insumo.nome}</TableCell>
                    <TableCell>{insumo.categoria}</TableCell>
                    <TableCell>{insumo.volumeBruto}</TableCell>
                    <TableCell>{insumo.unidadeMedida}</TableCell>
                    <TableCell className="text-right">
                      {insumo.custoMedio.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {obterEstoqueAtual(insumo.id)}
                    </TableCell>
                    <TableCell className="text-right">{insumo.estoqueMinimo}</TableCell>
                    <TableCell>
                      {insumo.ultimaEntrada
                        ? format(new Date(insumo.ultimaEntrada), "dd/MM/yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMovimentacoes(insumo)}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Movimentações
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditInsumoForm(insumo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveInsumo(insumo.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form de Insumo */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingInsumo ? "Editar Insumo" : "Novo Insumo"}</DialogTitle>
            <DialogDescription>
              {editingInsumo
                ? "Atualize os detalhes do insumo existente."
                : "Crie um novo insumo para controlar seu estoque."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Insumo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Chocolate em pó" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="Matéria Prima">Matéria Prima</option>
                        <option value="Embalagem">Embalagem</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="volumeBruto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume Bruto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 1000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unidadeMedida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="un">un</option>
                          <option value="pct">pct</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="custoMedio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Médio (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 25.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estoqueMinimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingInsumo ? "Salvar Alterações" : "Criar Insumo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Movimentações */}
      <Dialog open={isMovimentacoesOpen} onOpenChange={setIsMovimentacoesOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Movimentações de Estoque</DialogTitle>
            <DialogDescription>
              Histórico de entradas e saídas do insumo
            </DialogDescription>
          </DialogHeader>

          {selectedInsumo && (
            <>
              {(() => {
                const insumo = insumos.find((i) => i.id === selectedInsumo);
                if (!insumo) return null;

                const movimentacoes = obterMovimentacoesInsumo(selectedInsumo);

                return (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">
                        {insumo.nome} ({insumo.unidadeMedida})
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Estoque atual: {obterEstoqueAtual(insumo.id)}
                      </p>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Observação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movimentacoes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              Nenhuma movimentação encontrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          movimentacoes.map((mov) => (
                            <TableRow key={mov.id}>
                              <TableCell>
                                {format(new Date(mov.data), "dd/MM/yyyy HH:mm")}
                              </TableCell>
                              <TableCell>
                                {mov.tipo === "entrada" ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Entrada</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Saída</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{mov.quantidade}</TableCell>
                              <TableCell>{mov.usuario}</TableCell>
                              <TableCell>{mov.observacao}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </>
                );
              })()}
            </>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsMovimentacoesOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
