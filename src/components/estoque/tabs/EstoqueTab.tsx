
import { useState } from "react";
import { useInsumosStore } from "@/hooks/useInsumosStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CategoriaInsumo } from "@/types/insumos";
import { FileDown, PackagePlus, ArrowUp, ArrowDown, History, Pencil, Trash } from "lucide-react";

// Define form schemas
const insumoFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.enum(["Matéria Prima", "Embalagem", "Outros"]),
  volumeBruto: z.number().positive("Volume deve ser positivo"),
  unidadeMedida: z.enum(["g", "kg", "ml", "l", "un", "pct"]),
  custoMedio: z.number().positive("Custo deve ser positivo"),
  estoqueAtual: z.number().min(0, "Estoque não pode ser negativo"),
  estoqueMinimo: z.number().min(0, "Estoque mínimo não pode ser negativo")
});

const movimentacaoFormSchema = z.object({
  tipo: z.enum(["entrada", "saida"]),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
  observacao: z.string().min(3, "Informe uma justificativa para a movimentação")
});

type InsumoFormValues = z.infer<typeof insumoFormSchema>;
type MovimentacaoFormValues = z.infer<typeof movimentacaoFormSchema>;

export default function EstoqueTab() {
  const { insumos, adicionarInsumo, atualizarInsumo, removerInsumo, registrarMovimentacao, obterMovimentacoesInsumo } = useInsumosStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<CategoriaInsumo | "Todas">("Todas");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMovimentacaoOpen, setIsMovimentacaoOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<number | null>(null);
  const [selectedInsumo, setSelectedInsumo] = useState<number | null>(null);
  
  // Formulário de insumo
  const insumoForm = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoFormSchema),
    defaultValues: {
      nome: "",
      categoria: "Matéria Prima",
      volumeBruto: 0,
      unidadeMedida: "g",
      custoMedio: 0,
      estoqueAtual: 0,
      estoqueMinimo: 0
    }
  });
  
  // Formulário de movimentação
  const movimentacaoForm = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(movimentacaoFormSchema),
    defaultValues: {
      tipo: "entrada",
      quantidade: 0,
      observacao: ""
    }
  });
  
  // Filtragem de insumos
  const filteredInsumos = insumos
    .filter(insumo => insumo.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(insumo => filterCategoria === "Todas" || insumo.categoria === filterCategoria);
  
  // Contadores para os cards
  const totalInsumos = insumos.length;
  const insumosAbaixoMinimo = insumos.filter(i => 
    (i.estoqueAtual !== undefined && i.estoqueMinimo !== undefined) && 
    i.estoqueAtual < i.estoqueMinimo
  ).length;
  
  // Handlers
  const openNewInsumoForm = () => {
    insumoForm.reset({
      nome: "",
      categoria: "Matéria Prima",
      volumeBruto: 0,
      unidadeMedida: "g",
      custoMedio: 0,
      estoqueAtual: 0,
      estoqueMinimo: 0
    });
    setEditingInsumo(null);
    setIsFormOpen(true);
  };
  
  const openEditInsumoForm = (insumo: any) => {
    insumoForm.reset({
      nome: insumo.nome,
      categoria: insumo.categoria,
      volumeBruto: insumo.volumeBruto,
      unidadeMedida: insumo.unidadeMedida,
      custoMedio: insumo.custoMedio,
      estoqueAtual: insumo.estoqueAtual || 0,
      estoqueMinimo: insumo.estoqueMinimo || 0
    });
    setEditingInsumo(insumo.id);
    setIsFormOpen(true);
  };
  
  const openMovimentacaoForm = (insumo: any) => {
    movimentacaoForm.reset({
      tipo: "entrada",
      quantidade: 0,
      observacao: ""
    });
    setSelectedInsumo(insumo.id);
    setIsMovimentacaoOpen(true);
  };
  
  const openHistorico = (insumo: any) => {
    setSelectedInsumo(insumo.id);
    setIsHistoricoOpen(true);
  };
  
  const handleDeleteInsumo = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este insumo?")) {
      removerInsumo(id);
    }
  };
  
  const onSubmitInsumo = (values: InsumoFormValues) => {
    if (editingInsumo) {
      atualizarInsumo(editingInsumo, values);
    } else {
      adicionarInsumo({
        nome: values.nome,
        categoria: values.categoria,
        volumeBruto: values.volumeBruto,
        unidadeMedida: values.unidadeMedida,
        custoMedio: values.custoMedio,
        estoqueAtual: values.estoqueAtual,
        estoqueMinimo: values.estoqueMinimo
      });
    }
    setIsFormOpen(false);
  };
  
  const onSubmitMovimentacao = (values: MovimentacaoFormValues) => {
    if (selectedInsumo) {
      const insumoSelecionado = insumos.find(i => i.id === selectedInsumo);
      
      if (insumoSelecionado) {
        // Verificar se tem estoque suficiente para saída
        if (values.tipo === "saida" && (insumoSelecionado.estoqueAtual || 0) < values.quantidade) {
          toast({ 
            title: "Erro na movimentação", 
            description: "Quantidade insuficiente em estoque para esta saída",
            variant: "destructive"
          });
          return;
        }
        
        registrarMovimentacao({
          insumoId: selectedInsumo,
          tipo: values.tipo,
          quantidade: values.quantidade,
          usuario: "Usuário Atual", // Idealmente, pegaria o usuário logado
          observacao: values.observacao
        });
        
        setIsMovimentacaoOpen(false);
        toast({
          title: "Movimentação registrada",
          description: `${values.tipo === "entrada" ? "Entrada" : "Saída"} de ${values.quantidade} ${insumoSelecionado.unidadeMedida} registrada com sucesso!`
        });
      }
    }
  };
  
  // Exportar para CSV
  const exportarCSV = () => {
    const headers = ["ID", "Nome", "Categoria", "Estoque Atual", "Estoque Mínimo", "Unidade", "Custo Médio", "Última Entrada"];
    
    const linhas = filteredInsumos.map(insumo => [
      insumo.id,
      insumo.nome,
      insumo.categoria,
      insumo.estoqueAtual || 0,
      insumo.estoqueMinimo || 0,
      insumo.unidadeMedida,
      insumo.custoMedio.toFixed(2),
      insumo.ultimaEntrada ? format(new Date(insumo.ultimaEntrada), "dd/MM/yyyy") : "N/A"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...linhas.map(l => l.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `estoque_insumos_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Visão Geral do Estoque de Insumos</h2>
          <p className="text-muted-foreground">Gerencie seus insumos, monitore níveis de estoque e registre movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportarCSV} variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={openNewInsumoForm}>
            <PackagePlus className="mr-2 h-4 w-4" /> Novo Insumo
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
            <CardTitle className="text-sm font-medium">Insumos com Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{insumosAbaixoMinimo}</div>
            <p className="text-xs text-muted-foreground">insumos abaixo do estoque mínimo</p>
          </CardContent>
        </Card>
        
        <Card className="sm:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Input
                placeholder="Buscar insumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button 
                  size="sm"
                  variant={filterCategoria === "Todas" ? "default" : "outline"} 
                  onClick={() => setFilterCategoria("Todas")}
                >
                  Todos
                </Button>
                <Button 
                  size="sm"
                  variant={filterCategoria === "Matéria Prima" ? "default" : "outline"} 
                  onClick={() => setFilterCategoria("Matéria Prima")}
                >
                  Matéria Prima
                </Button>
                <Button 
                  size="sm"
                  variant={filterCategoria === "Embalagem" ? "default" : "outline"} 
                  onClick={() => setFilterCategoria("Embalagem")}
                >
                  Embalagem
                </Button>
                <Button 
                  size="sm"
                  variant={filterCategoria === "Outros" ? "default" : "outline"} 
                  onClick={() => setFilterCategoria("Outros")}
                >
                  Outros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Insumos</CardTitle>
          <CardDescription>Gerencie o estoque de insumos, registre entradas e saídas manuais</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Un. Medida</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="text-right">Estoque Mínimo</TableHead>
                <TableHead className="text-right">Custo Médio (R$)</TableHead>
                <TableHead>Última Entrada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInsumos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Nenhum insumo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredInsumos.map(insumo => {
                  const isLowStock = 
                    insumo.estoqueAtual !== undefined && 
                    insumo.estoqueMinimo !== undefined &&
                    insumo.estoqueAtual < insumo.estoqueMinimo;
                    
                  return (
                    <TableRow key={insumo.id}>
                      <TableCell className="font-medium">{insumo.nome}</TableCell>
                      <TableCell>{insumo.categoria}</TableCell>
                      <TableCell>{insumo.unidadeMedida}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                          {insumo.estoqueAtual || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{insumo.estoqueMinimo || 0}</TableCell>
                      <TableCell className="text-right">
                        {insumo.custoMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </TableCell>
                      <TableCell>
                        {insumo.ultimaEntrada 
                          ? format(new Date(insumo.ultimaEntrada), "dd/MM/yyyy")
                          : "N/A"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button size="icon" variant="outline" title="Entrada manual" onClick={() => {
                            movimentacaoForm.setValue("tipo", "entrada");
                            openMovimentacaoForm(insumo);
                          }}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" title="Saída manual" onClick={() => {
                            movimentacaoForm.setValue("tipo", "saida");
                            openMovimentacaoForm(insumo);
                          }}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" title="Histórico" onClick={() => openHistorico(insumo)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" title="Editar" onClick={() => openEditInsumoForm(insumo)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" title="Excluir" onClick={() => handleDeleteInsumo(insumo.id)}>
                            <Trash className="h-4 w-4" />
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
      
      {/* Dialog de Formulário de Insumo */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingInsumo ? "Editar Insumo" : "Novo Insumo"}</DialogTitle>
            <DialogDescription>
              {editingInsumo 
                ? "Atualize as informações do insumo selecionado."
                : "Adicione um novo insumo ao sistema."
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
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do insumo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
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
                          <option value="g">Gramas (g)</option>
                          <option value="kg">Kilos (kg)</option>
                          <option value="ml">Mililitros (ml)</option>
                          <option value="l">Litros (l)</option>
                          <option value="un">Unidades (un)</option>
                          <option value="pct">Pacotes (pct)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={insumoForm.control}
                  name="volumeBruto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume Bruto</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0.01" 
                          step="0.01"
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
                  name="custoMedio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Médio (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0.01"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={insumoForm.control}
                  name="estoqueAtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Atual</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          step="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={insumoForm.control}
                  name="estoqueMinimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          step="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                  {editingInsumo ? "Salvar Alterações" : "Cadastrar Insumo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Movimentação */}
      <Dialog open={isMovimentacaoOpen} onOpenChange={setIsMovimentacaoOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {movimentacaoForm.getValues().tipo === "entrada" ? "Entrada Manual" : "Saída Manual"}
            </DialogTitle>
            <DialogDescription>
              {movimentacaoForm.getValues().tipo === "entrada" 
                ? "Registre a entrada de itens no estoque."
                : "Registre a saída de itens do estoque."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...movimentacaoForm}>
            <form onSubmit={movimentacaoForm.handleSubmit(onSubmitMovimentacao)} className="space-y-4">
              {selectedInsumo && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">{insumos.find(i => i.id === selectedInsumo)?.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Estoque atual: {insumos.find(i => i.id === selectedInsumo)?.estoqueAtual || 0} {insumos.find(i => i.id === selectedInsumo)?.unidadeMedida}
                  </p>
                </div>
              )}
              
              <FormField
                control={movimentacaoForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimentação</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant={field.value === "entrada" ? "default" : "outline"}
                          onClick={() => movimentacaoForm.setValue("tipo", "entrada")}
                          className="flex-1"
                        >
                          <ArrowUp className="mr-2 h-4 w-4" /> Entrada
                        </Button>
                        <Button 
                          type="button" 
                          variant={field.value === "saida" ? "default" : "outline"}
                          onClick={() => movimentacaoForm.setValue("tipo", "saida")}
                          className="flex-1"
                        >
                          <ArrowDown className="mr-2 h-4 w-4" /> Saída
                        </Button>
                      </div>
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
                        min="0.01"
                        step="0.01" 
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
                    <FormLabel>Justificativa / Observação</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Informe o motivo da movimentação" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsMovimentacaoOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Confirmar {movimentacaoForm.getValues().tipo === "entrada" ? "Entrada" : "Saída"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Histórico */}
      <Dialog open={isHistoricoOpen} onOpenChange={setIsHistoricoOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Histórico de Movimentações</DialogTitle>
            <DialogDescription>
              {selectedInsumo && (
                <span>
                  Histórico do insumo: <strong>{insumos.find(i => i.id === selectedInsumo)?.nome}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInsumo && (
            <div className="max-h-96 overflow-y-auto">
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
                  {obterMovimentacoesInsumo(selectedInsumo).length > 0 ? (
                    obterMovimentacoesInsumo(selectedInsumo)
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .map(mov => (
                        <TableRow key={mov.id}>
                          <TableCell>
                            {format(new Date(mov.data), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                mov.tipo === "entrada"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{mov.quantidade}</TableCell>
                          <TableCell>{mov.usuario}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {mov.observacao}
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        Nenhuma movimentação registrada para este insumo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
