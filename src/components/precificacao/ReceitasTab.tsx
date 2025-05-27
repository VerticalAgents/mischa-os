
import { useState } from "react";
import { useSupabaseReceitas } from "@/hooks/useSupabaseReceitas";
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

const receitaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  rendimento: z.number().positive("Rendimento deve ser positivo"),
  unidade_rendimento: z.string().min(1, "Unidade é obrigatória"),
});

const itemSchema = z.object({
  insumo_id: z.string().min(1, "Insumo é obrigatório"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
});

type ReceitaFormValues = z.infer<typeof receitaSchema>;
type ItemFormValues = z.infer<typeof itemSchema>;

export default function ReceitasTab() {
  const { receitas, loading, adicionarReceita, adicionarItemReceita, removerItemReceita, removerReceita } = useSupabaseReceitas();
  const { insumos } = useSupabaseInsumos();
  
  const [isReceitaDialogOpen, setIsReceitaDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedReceita, setSelectedReceita] = useState<string | null>(null);
  
  const receitaForm = useForm<ReceitaFormValues>({
    resolver: zodResolver(receitaSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      rendimento: 1,
      unidade_rendimento: "unidades",
    }
  });

  const itemForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      insumo_id: "",
      quantidade: 0,
    }
  });

  const onSubmitReceita = async (values: ReceitaFormValues) => {
    const sucesso = await adicionarReceita(values);
    if (sucesso) {
      setIsReceitaDialogOpen(false);
      receitaForm.reset();
    }
  };

  const onSubmitItem = async (values: ItemFormValues) => {
    if (!selectedReceita) return;
    
    const sucesso = await adicionarItemReceita(selectedReceita, values.insumo_id, values.quantidade);
    if (sucesso) {
      setIsItemDialogOpen(false);
      itemForm.reset();
    }
  };

  const handleDeleteReceita = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover a receita "${nome}"?`)) {
      await removerReceita(id);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Tem certeza que deseja remover este item da receita?")) {
      await removerItemReceita(itemId);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Receitas Base</h2>
          <p className="text-muted-foreground">Gerenciamento de receitas base para produtos</p>
        </div>
        <Button onClick={() => setIsReceitaDialogOpen(true)} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" /> Nova Receita
        </Button>
      </div>

      <div className="space-y-6">
        {receitas.map(receita => (
          <div key={receita.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{receita.nome}</h3>
                {receita.descricao && (
                  <p className="text-muted-foreground text-sm">{receita.descricao}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Rendimento: {receita.rendimento} {receita.unidade_rendimento}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedReceita(receita.id);
                    setIsItemDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Item
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteReceita(receita.id, receita.nome)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium">Peso Total:</span> {receita.peso_total.toFixed(2)}g
              </div>
              <div>
                <span className="font-medium">Custo Total:</span> R$ {receita.custo_total.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Custo Unitário:</span> R$ {receita.custo_unitario.toFixed(4)}
              </div>
            </div>

            {receita.itens.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Custo Item</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receita.itens.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.insumo.nome}</TableCell>
                      <TableCell className="text-right">
                        {item.quantidade} {item.insumo.unidade_medida}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {item.custo_item.toFixed(4)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ))}

        {receitas.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma receita cadastrada. Clique em "Nova Receita" para começar.
          </div>
        )}
      </div>

      {/* Dialog para Nova Receita */}
      <Dialog open={isReceitaDialogOpen} onOpenChange={setIsReceitaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Receita Base</DialogTitle>
            <DialogDescription>
              Crie uma nova receita base que poderá ser usada em produtos.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...receitaForm}>
            <form onSubmit={receitaForm.handleSubmit(onSubmitReceita)} className="space-y-4">
              <FormField
                control={receitaForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Receita</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Massa base chocolate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={receitaForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da receita" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={receitaForm.control}
                  name="rendimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rendimento</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0.01" 
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
                  control={receitaForm.control}
                  name="unidade_rendimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: unidades, kg, litros" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsReceitaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Receita</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Item */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Insumo à Receita</DialogTitle>
            <DialogDescription>
              Selecione um insumo e defina a quantidade necessária.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="insumo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insumo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um insumo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {insumos.map(insumo => (
                          <SelectItem key={insumo.id} value={insumo.id}>
                            {insumo.nome} ({insumo.unidade_medida})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
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
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Item</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
