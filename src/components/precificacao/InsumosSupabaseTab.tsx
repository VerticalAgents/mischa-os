
import { useState } from "react";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
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
import { Plus, Pencil, Trash } from "lucide-react";

const insumoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.enum(["Matéria Prima", "Embalagem", "Outros"]),
  volume_bruto: z.number().min(0.01, "Volume deve ser maior que zero"),
  unidade_medida: z.enum(["g", "kg", "ml", "l", "un", "pct"]),
  custo_medio: z.number().min(0.01, "Custo deve ser maior que zero"),
});

type InsumoFormValues = z.infer<typeof insumoSchema>;

export default function InsumosSupabaseTab() {
  const { insumos, loading, adicionarInsumo, atualizarInsumo, removerInsumo } = useSupabaseInsumos();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<string | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<"Matéria Prima" | "Embalagem" | "Outros" | "Todas">("Todas");
  
  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      nome: "",
      categoria: "Matéria Prima",
      volume_bruto: 0,
      unidade_medida: "g",
      custo_medio: 0,
    }
  });

  const openNewInsumoDialog = () => {
    form.reset({
      nome: "",
      categoria: "Matéria Prima",
      volume_bruto: 0,
      unidade_medida: "g",
      custo_medio: 0,
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
    
    if (editingInsumo) {
      sucesso = await atualizarInsumo(editingInsumo, values);
    } else {
      sucesso = await adicionarInsumo(values);
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

  // Filtrar insumos por categoria
  const filteredInsumos = filterCategoria === "Todas"
    ? insumos
    : insumos.filter(insumo => insumo.categoria === filterCategoria);

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
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Nenhum insumo encontrado
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
