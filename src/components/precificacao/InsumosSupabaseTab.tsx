
import { useState } from "react";
import { useSupabaseInsumos, InsumoSupabase } from "@/hooks/useSupabaseInsumos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger, 
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Pencil, Trash } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.enum(["Matéria Prima", "Embalagem", "Outros"]),
  volume_bruto: z.number().positive("Volume deve ser positivo"),
  unidade_medida: z.enum(["g", "kg", "ml", "l", "un", "pct"]),
  custo_medio: z.number().positive("Custo deve ser positivo"),
  estoque_atual: z.number().min(0, "Estoque não pode ser negativo").optional(),
  estoque_minimo: z.number().min(0, "Estoque mínimo não pode ser negativo").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function InsumosSupabaseTab() {
  const { 
    insumos, 
    loading, 
    adicionarInsumo, 
    atualizarInsumo, 
    removerInsumo, 
    calcularCustoUnitario 
  } = useSupabaseInsumos();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<InsumoSupabase | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<"Todas" | "Matéria Prima" | "Embalagem" | "Outros">("Todas");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      categoria: "Matéria Prima",
      volume_bruto: 0,
      unidade_medida: "g",
      custo_medio: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
    }
  });
  
  const filteredInsumos = filterCategoria === "Todas"
    ? insumos
    : insumos.filter(insumo => insumo.categoria === filterCategoria);
  
  const openNewInsumoDialog = () => {
    form.reset({
      nome: "",
      categoria: "Matéria Prima",
      volume_bruto: 0,
      unidade_medida: "g",
      custo_medio: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
    });
    setEditingInsumo(null);
    setIsDialogOpen(true);
  };
  
  const openEditInsumoDialog = (insumo: InsumoSupabase) => {
    form.reset({
      nome: insumo.nome,
      categoria: insumo.categoria,
      volume_bruto: insumo.volume_bruto,
      unidade_medida: insumo.unidade_medida,
      custo_medio: insumo.custo_medio,
      estoque_atual: insumo.estoque_atual || 0,
      estoque_minimo: insumo.estoque_minimo || 0,
    });
    setEditingInsumo(insumo);
    setIsDialogOpen(true);
  };
  
  const onSubmit = async (values: FormValues) => {
    if (editingInsumo) {
      const sucesso = await atualizarInsumo(editingInsumo.id, values);
      if (sucesso) {
        setIsDialogOpen(false);
      }
    } else {
      const sucesso = await adicionarInsumo(values);
      if (sucesso) {
        setIsDialogOpen(false);
      }
    }
  };
  
  const handleDelete = async (insumo: InsumoSupabase) => {
    if (confirm(`Tem certeza que deseja remover o insumo "${insumo.nome}"?`)) {
      await removerInsumo(insumo.id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Insumos</h2>
          <p className="text-muted-foreground">Gerenciamento de matérias-primas e embalagens</p>
        </div>
        <Button onClick={openNewInsumoDialog} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" /> Novo Insumo
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button 
            variant={filterCategoria === "Todas" ? "default" : "outline"} 
            onClick={() => setFilterCategoria("Todas")}
          >
            Todos
          </Button>
          <Button 
            variant={filterCategoria === "Matéria Prima" ? "default" : "outline"} 
            onClick={() => setFilterCategoria("Matéria Prima")}
          >
            Matéria Prima
          </Button>
          <Button 
            variant={filterCategoria === "Embalagem" ? "default" : "outline"} 
            onClick={() => setFilterCategoria("Embalagem")}
          >
            Embalagem
          </Button>
          <Button 
            variant={filterCategoria === "Outros" ? "default" : "outline"} 
            onClick={() => setFilterCategoria("Outros")}
          >
            Outros
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Volume Bruto</TableHead>
              <TableHead>Un. Med.</TableHead>
              <TableHead className="text-right">Custo Médio (R$)</TableHead>
              <TableHead className="text-right">Custo Unitário (R$)</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Carregando insumos...
                </TableCell>
              </TableRow>
            ) : filteredInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Nenhum insumo encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredInsumos.map(insumo => (
                <TableRow key={insumo.id}>
                  <TableCell className="font-medium">{insumo.nome}</TableCell>
                  <TableCell>{insumo.categoria}</TableCell>
                  <TableCell className="text-right">{insumo.volume_bruto}</TableCell>
                  <TableCell>{insumo.unidade_medida}</TableCell>
                  <TableCell className="text-right">
                    {insumo.custo_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {calcularCustoUnitario(insumo).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {insumo.estoque_atual || 0} / {insumo.estoque_minimo || 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEditInsumoDialog(insumo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(insumo)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
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
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
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
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
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
              
              <div className="grid grid-cols-2 gap-4">
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
                  name="estoque_minimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
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
              </div>
              
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
