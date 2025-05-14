
import { useState } from "react";
import { useInsumoStore } from "@/hooks/useInsumoStore";
import { Insumo, CategoriaInsumo, UnidadeMedida } from "@/types";
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
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Pencil, Trash } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.enum(["Matéria Prima", "Embalagem"]),
  volumeBruto: z.number().positive("Volume deve ser positivo"),
  unidadeMedida: z.enum(["g", "un"]),
  custoMedio: z.number().positive("Custo deve ser positivo"),
});

type FormValues = z.infer<typeof formSchema>;

export default function InsumosTab() {
  const { insumos, adicionarInsumo, atualizarInsumo, removerInsumo } = useInsumoStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<CategoriaInsumo | "Todas">("Todas");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      categoria: "Matéria Prima",
      volumeBruto: 0,
      unidadeMedida: "g",
      custoMedio: 0,
    }
  });
  
  const openNewInsumoDialog = () => {
    form.reset({
      nome: "",
      categoria: "Matéria Prima",
      volumeBruto: 0,
      unidadeMedida: "g",
      custoMedio: 0,
    });
    setEditingInsumo(null);
    setIsDialogOpen(true);
  };
  
  const openEditInsumoDialog = (insumo: Insumo) => {
    form.reset({
      nome: insumo.nome,
      categoria: insumo.categoria,
      volumeBruto: insumo.volumeBruto,
      unidadeMedida: insumo.unidadeMedida,
      custoMedio: insumo.custoMedio,
    });
    setEditingInsumo(insumo);
    setIsDialogOpen(true);
  };
  
  const onSubmit = (values: FormValues) => {
    if (editingInsumo) {
      atualizarInsumo(editingInsumo.id, values);
    } else {
      adicionarInsumo(values);
    }
    setIsDialogOpen(false);
  };
  
  const handleDelete = (insumo: Insumo) => {
    if (confirm(`Tem certeza que deseja remover o insumo "${insumo.nome}"?`)) {
      removerInsumo(insumo.id);
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
        <Button onClick={openNewInsumoDialog}>
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
            {filteredInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Nenhum insumo encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredInsumos.map(insumo => (
                <TableRow key={insumo.id}>
                  <TableCell className="font-medium">{insumo.nome}</TableCell>
                  <TableCell>{insumo.categoria}</TableCell>
                  <TableCell className="text-right">{insumo.volumeBruto}</TableCell>
                  <TableCell>{insumo.unidadeMedida}</TableCell>
                  <TableCell className="text-right">
                    {insumo.custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {insumo.custoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
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
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="volumeBruto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume Bruto</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
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
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          {...field}
                        >
                          <option value="g">Gramas (g)</option>
                          <option value="un">Unidades (un)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="custoMedio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Médio (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
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
