import { useState } from "react";
import { useInsumosStore } from "@/hooks/useInsumosStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CategoriaInsumo, Insumo, UnidadeMedida } from "@/types/insumos";
import { Edit, FilePlus, Trash, Plus, ArrowUp, ArrowDown, Search, FileDown } from "lucide-react";

// Form schemas
const insumoFormSchema = z.object({
  nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
  categoria: z.enum(["Matéria Prima", "Embalagem", "Outros"] as const),
  volumeBruto: z.coerce.number().min(0.01, "O volume bruto deve ser maior que zero"),
  unidadeMedida: z.enum(["g", "kg", "ml", "l", "un", "pct"] as const),
  custoMedio: z.coerce.number().min(0, "O custo não pode ser negativo"),
  estoqueMinimo: z.coerce.number().min(0, "O estoque mínimo não pode ser negativo").optional(),
  estoqueAtual: z.coerce.number().min(0, "O estoque atual não pode ser negativo").optional(),
});

const movimentacaoFormSchema = z.object({
  insumoId: z.number(),
  tipo: z.enum(["entrada", "saida"] as const),
  quantidade: z.coerce.number().min(0.01, "A quantidade deve ser maior que zero"),
  observacao: z.string().optional(),
});

type InsumoFormValues = z.infer<typeof insumoFormSchema>;
type MovimentacaoFormValues = z.infer<typeof movimentacaoFormSchema>;

export default function EstoqueTab() {
  const { insumos, adicionarInsumo, atualizarInsumo, removerInsumo, registrarMovimentacao } = useInsumosStore();
  
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaInsumo | "Todos">("Todos");
  const [isNovoInsumoOpen, setIsNovoInsumoOpen] = useState(false);
  const [isMovimentacaoOpen, setIsMovimentacaoOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  
  // Forms
  const insumoForm = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoFormSchema),
    defaultValues: {
      nome: "",
      categoria: "Matéria Prima",
      volumeBruto: 0,
      unidadeMedida: "kg",
      custoMedio: 0,
      estoqueMinimo: 0,
      estoqueAtual: 0
    }
  });
  
  const movimentacaoForm = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(movimentacaoFormSchema),
    defaultValues: {
      insumoId: 0,
      tipo: "entrada",
      quantidade: 0,
      observacao: ""
    }
  });
  
  // Filtrar insumos
  const insumosFiltrados = insumos.filter(insumo => {
    const matchesSearch = insumo.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filtroCategoria === "Todos" || insumo.categoria === filtroCategoria;
    return matchesSearch && matchesCategoria;
  });
  
  // Contadores para cards
  const totalInsumos = insumos.length;
  const insumosBaixoEstoque = insumos.filter(i => 
    i.estoqueAtual !== undefined && 
    i.estoqueMinimo !== undefined && 
    i.estoqueAtual < i.estoqueMinimo
  ).length;
  
  // Handlers
  const openNewInsumoForm = () => {
    insumoForm.reset({
      nome: "",
      categoria: "Matéria Prima",
      volumeBruto: 0,
      unidadeMedida: "kg",
      custoMedio: 0,
      estoqueMinimo: 0,
      estoqueAtual: 0
    });
    setEditingInsumo(null);
    setIsNovoInsumoOpen(true);
  };
  
  const openEditInsumoForm = (insumo: Insumo) => {
    insumoForm.reset({
      nome: insumo.nome,
      categoria: insumo.categoria,
      volumeBruto: insumo.volumeBruto,
      unidadeMedida: insumo.unidadeMedida,
      custoMedio: insumo.custoMedio,
      estoqueMinimo: insumo.estoqueMinimo || 0,
      estoqueAtual: insumo.estoqueAtual || 0
    });
    setEditingInsumo(insumo);
    setIsNovoInsumoOpen(true);
  };
  
  const openMovimentacaoForm = (insumo: Insumo) => {
    movimentacaoForm.reset({
      insumoId: insumo.id,
      tipo: "entrada",
      quantidade: 0,
      observacao: ""
    });
    setSelectedInsumo(insumo);
    setIsMovimentacaoOpen(true);
  };
  
  const handleDeleteInsumo = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este insumo? Esta ação é irreversível.")) {
      removerInsumo(id);
    }
  };
  
  const onSubmitInsumo = (values: InsumoFormValues) => {
    // Fix: make sure all required fields are present when adding a new insumo
    if (editingInsumo) {
      atualizarInsumo(editingInsumo.id, values);
    } else {
      adicionarInsumo({
        nome: values.nome,
        categoria: values.categoria,
        volumeBruto: values.volumeBruto,
        unidadeMedida: values.unidadeMedida,
        custoMedio: values.custoMedio,
        estoqueMinimo: values.estoqueMinimo,
        estoqueAtual: values.estoqueAtual
      });
    }
    setIsNovoInsumoOpen(false);
  };
  
  const onSubmitMovimentacao = (values: MovimentacaoFormValues) => {
    registrarMovimentacao({
      insumoId: values.insumoId,
      tipo: values.tipo,
      quantidade: values.quantidade,
      usuario: "Usuário Atual", // Idealmente seria pego do contexto de autenticação
      observacao: values.observacao
    });
    setIsMovimentacaoOpen(false);
  };
  
  // Exportar para CSV
  const exportarCSV = () => {
    const headers = [
      "ID", "Nome", "Categoria", "Estoque Atual", "Unidade", 
      "Estoque Mínimo", "Custo Médio (R$)", "Última Entrada"
    ];
    
    const linhas = insumosFiltrados.map(insumo => [
      insumo.id,
      insumo.nome,
      insumo.categoria,
      insumo.estoqueAtual || 0,
      insumo.unidadeMedida,
      insumo.estoqueMinimo || 0,
      insumo.custoMedio.toFixed(2),
      insumo.ultimaEntrada ? format(new Date(insumo.ultimaEntrada), "dd/MM/yyyy") : "N/A"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...linhas.map(linha => linha.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `estoque_insumos_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Estoque de Insumos</h2>
          <p className="text-muted-foreground">
            Acompanhe a quantidade, custo e movimentação dos seus insumos
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Insumos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInsumos}</div>
            <p className="text-xs text-muted-foreground">insumos diferentes no sistema</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Insumos em Baixo Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{insumosBaixoEstoque}</div>
            <p className="text-xs text-muted-foreground">insumos abaixo do estoque mínimo</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Calculado com base no custo médio de cada insumo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {insumos.reduce((total, insumo) => {
                return total + (insumo.estoqueAtual || 0) * insumo.custoMedio;
              }, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm"
            variant={filtroCategoria === "Todos" ? "default" : "outline"} 
            onClick={() => setFiltroCategoria("Todos")}
          >
            Todos
          </Button>
          <Button 
            size="sm"
            variant={filtroCategoria === "Matéria Prima" ? "default" : "outline"} 
            onClick={() => setFiltroCategoria("Matéria Prima")}
          >
            Matéria Prima
          </Button>
          <Button 
            size="sm"
            variant={filtroCategoria === "Embalagem" ? "default" : "outline"} 
            onClick={() => setFiltroCategoria("Embalagem")}
          >
            Embalagem
          </Button>
          <Button 
            size="sm"
            variant={filtroCategoria === "Outros" ? "default" : "outline"} 
            onClick={() => setFiltroCategoria("Outros")}
          >
            Outros
          </Button>
        </div>
      </div>
      
      {/* Lista de Insumos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Insumos</CardTitle>
          <CardDescription>
            Visualize e gerencie os insumos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Estoque Mínimo</TableHead>
                <TableHead className="text-right">Custo Médio (R$)</TableHead>
                <TableHead>Última Entrada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Nenhum insumo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                insumosFiltrados.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell>{insumo.id}</TableCell>
                    <TableCell className="font-medium">{insumo.nome}</TableCell>
                    <TableCell>{insumo.categoria}</TableCell>
                    <TableCell className="text-right">
                      {insumo.estoqueAtual !== undefined ? insumo.estoqueAtual : "N/A"}
                    </TableCell>
                    <TableCell>{insumo.unidadeMedida}</TableCell>
                    <TableCell className="text-right">
                      {insumo.estoqueMinimo !== undefined ? insumo.estoqueMinimo : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      {insumo.custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {insumo.ultimaEntrada ? format(new Date(insumo.ultimaEntrada), "dd/MM/yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditInsumoForm(insumo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openMovimentacaoForm(insumo)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteInsumo(insumo.id)}
                        >
                          <Trash className="h-4 w-4" />
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
      
      {/* Dialog Novo Insumo */}
      <Dialog open={isNovoInsumoOpen} onOpenChange={setIsNovoInsumoOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingInsumo ? "Editar Insumo" : "Novo Insumo"}</DialogTitle>
            <DialogDescription>
              {editingInsumo
                ? "Atualize as informações do insumo."
                : "Adicione um novo insumo ao seu estoque."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...insumoForm}>
            <form onSubmit={insumoForm.handleSubmit(onSubmitInsumo)} className="space-y-4">
              <FormField
                control={insumoForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Insumo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Açúcar Refinado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={insumoForm.control}
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
                  control={insumoForm.control}
                  name="volumeBruto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume Bruto</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 1000" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={insumoForm.control}
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
              
              <FormField
                control={insumoForm.control}
                name="custoMedio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Médio (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 25.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={insumoForm.control}
                  name="estoqueMinimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Opcional" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={insumoForm.control}
                  name="estoqueAtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Atual</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Opcional" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNovoInsumoOpen(false)}>
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
      
      {/* Dialog Movimentação de Estoque */}
      <Dialog open={isMovimentacaoOpen} onOpenChange={setIsMovimentacaoOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              Registre uma entrada ou saída de insumo no estoque.
            </DialogDescription>
          </DialogHeader>
          
          {selectedInsumo && (
            <Form {...movimentacaoForm}>
              <form onSubmit={movimentacaoForm.handleSubmit(onSubmitMovimentacao)} className="space-y-4">
                <p className="text-sm">
                  Insumo selecionado: <strong>{selectedInsumo.nome}</strong>
                </p>
                
                <FormField
                  control={movimentacaoForm.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Movimentação</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="entrada">Entrada</option>
                          <option value="saida">Saída</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={movimentacaoForm.control}
                  name="quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 100" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                        <Input placeholder="Ex: Ajuste de estoque, Doação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <input 
                  type="hidden" 
                  {...movimentacaoForm.register("insumoId")} 
                  value={selectedInsumo.id} 
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsMovimentacaoOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Registrar Movimentação
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
