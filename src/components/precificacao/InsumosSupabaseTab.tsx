import { useState } from "react";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
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
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Pencil, Trash, Search, RefreshCw } from "lucide-react";

const insumoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.enum(["Matéria Prima", "Embalagem", "Outros"]),
  volume_bruto: z.number().min(0.01, "Volume deve ser maior que zero"),
  unidade_medida: z.enum(["g", "kg", "ml", "l", "un", "pct"]),
  custo_medio: z.number().min(0.01, "Custo deve ser maior que zero"),
});

type InsumoFormValues = z.infer<typeof insumoSchema>;

export default function InsumosSupabaseTab() {
  const { insumos, loading, adicionarInsumo, atualizarInsumo, removerInsumo, refresh, refreshing } = useSupabaseInsumos();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<string | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<"Matéria Prima" | "Embalagem" | "Outros" | "Todas">("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  
  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      nome: "",
      categoria: "Matéria Prima",
      volume_bruto: 1,
      unidade_medida: "g",
      custo_medio: 0.01,
    }
  });

  const openNewInsumoDialog = () => {
    form.reset({
      nome: "",
      categoria: "Matéria Prima",
      volume_bruto: 1,
      unidade_medida: "g",
      custo_medio: 0.01,
    });
    setEditingInsumo(null);
    setIsDialogOpen(true);
  };

  const openEditInsumoDialog = (insumo: any) => {
    form.reset({
      nome: insumo.nome,
      categoria: insumo.categoria,
      volume_bruto: insumo.volume_bruto,
      unidade_medida: insumo.unidade_medida,
      custo_medio: insumo.custo_medio,
    });
    setEditingInsumo(insumo.id);
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: InsumoFormValues) => {
    let sucesso = false;
    
    const insumoData = {
      nome: values.nome,
      categoria: values.categoria,
      volume_bruto: values.volume_bruto,
      unidade_medida: values.unidade_medida,
      custo_medio: values.custo_medio,
    };
    
    if (editingInsumo) {
      sucesso = await atualizarInsumo(editingInsumo, insumoData);
    } else {
      sucesso = await adicionarInsumo(insumoData);
    }
    
    if (sucesso) {
      setIsDialogOpen(false);
      form.reset();
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover o insumo "${nome}"?`)) {
      await removerInsumo(id);
    }
  };

  // Filtrar insumos por categoria e termo de busca
  const filteredInsumos = insumos.filter(insumo => {
    const matchesCategory = filterCategoria === "Todas" || insumo.categoria === filterCategoria;
    const matchesSearch = insumo.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calcular métricas
  const metricas = {
    totalInsumos: insumos.length,
    materiasPrimas: insumos.filter(i => i.categoria === "Matéria Prima").length,
    embalagens: insumos.filter(i => i.categoria === "Embalagem").length,
    outros: insumos.filter(i => i.categoria === "Outros").length,
  };

  const handleRefresh = () => {
    if (refresh) {
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle>Insumos</CardTitle>
                <CardDescription>Gerenciamento de matérias-primas e embalagens</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {refresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              )}
              <Button onClick={openNewInsumoDialog} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Insumo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtro de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Filtrar insumos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Métricas rápidas */}
            {!loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{metricas.totalInsumos}</div>
                    <p className="text-xs text-muted-foreground">Total de Insumos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{metricas.materiasPrimas}</div>
                    <p className="text-xs text-muted-foreground">Matérias-Primas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{metricas.embalagens}</div>
                    <p className="text-xs text-muted-foreground">Embalagens</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">{metricas.outros}</div>
                    <p className="text-xs text-muted-foreground">Outros</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filtros por categoria */}
            <div className="flex gap-2">
              <Button 
                variant={filterCategoria === "Todas" ? "default" : "outline"} 
                onClick={() => setFilterCategoria("Todas")}
                size="sm"
              >
                Todos
              </Button>
              <Button 
                variant={filterCategoria === "Matéria Prima" ? "default" : "outline"} 
                onClick={() => setFilterCategoria("Matéria Prima")}
                size="sm"
              >
                Matéria Prima
              </Button>
              <Button 
                variant={filterCategoria === "Embalagem" ? "default" : "outline"} 
                onClick={() => setFilterCategoria("Embalagem")}
                size="sm"
              >
                Embalagem
              </Button>
              <Button 
                variant={filterCategoria === "Outros" ? "default" : "outline"} 
                onClick={() => setFilterCategoria("Outros")}
                size="sm"
              >
                Outros
              </Button>
            </div>

            {/* Tabela de Insumos */}
            <div className="w-full overflow-x-auto">
              <div className="rounded-md border min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Nome</TableHead>
                      <TableHead className="min-w-[120px]">Categoria</TableHead>
                      <TableHead className="text-right min-w-[120px]">Volume Bruto</TableHead>
                      <TableHead className="min-w-[100px]">Un. Med.</TableHead>
                      <TableHead className="text-right min-w-[120px]">Custo Médio (R$)</TableHead>
                      <TableHead className="text-right min-w-[120px]">Custo Unitário (R$)</TableHead>
                      <TableHead className="text-right min-w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Carregando insumos...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredInsumos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          {searchTerm ? `Nenhum insumo encontrado para "${searchTerm}"` : "Nenhum insumo encontrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInsumos.map(insumo => {
                        const custoUnitario = insumo.volume_bruto > 0 ? insumo.custo_medio / insumo.volume_bruto : 0;
                        return (
                          <TableRow key={insumo.id}>
                            <TableCell className="font-medium">{insumo.nome}</TableCell>
                            <TableCell>{insumo.categoria}</TableCell>
                            <TableCell className="text-right">{insumo.volume_bruto}</TableCell>
                            <TableCell>{insumo.unidade_medida}</TableCell>
                            <TableCell className="text-right">
                              R$ {insumo.custo_medio.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {custoUnitario.toFixed(4)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => openEditInsumoDialog(insumo)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(insumo.id, insumo.nome)}>
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog para Novo/Editar Insumo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}</DialogTitle>
            <DialogDescription>
              {editingInsumo 
                ? 'Edite os dados do insumo existente.'
                : 'Adicione um novo insumo ao sistema.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="volume_bruto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume Bruto</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unidade_medida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="g">Gramas (g)</SelectItem>
                          <SelectItem value="kg">Kilos (kg)</SelectItem>
                          <SelectItem value="ml">Mililitros (ml)</SelectItem>
                          <SelectItem value="l">Litros (l)</SelectItem>
                          <SelectItem value="un">Unidades (un)</SelectItem>
                          <SelectItem value="pct">Pacotes (pct)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="custo_medio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Médio (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingInsumo ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
