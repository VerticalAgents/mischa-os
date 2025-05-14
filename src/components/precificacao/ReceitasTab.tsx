
import { useState } from "react";
import { useReceitaStore } from "@/hooks/useReceitaStore";
import { useInsumoStore } from "@/hooks/useInsumoStore";
import { ReceitaBase, ItemReceita, Insumo } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash, ChevronDown, ChevronUp } from "lucide-react";

// Schema for creating a new receita
const novaReceitaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
});

// Schema for adding an item to a receita
const itemReceitaSchema = z.object({
  idInsumo: z.number().positive("Selecione um insumo"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
});

type NovaReceitaValues = z.infer<typeof novaReceitaSchema>;
type ItemReceitaValues = z.infer<typeof itemReceitaSchema>;

export default function ReceitasTab() {
  const { receitas, adicionarReceita, adicionarItemReceita, atualizarItemReceita, removerItemReceita, removerReceita } = useReceitaStore();
  const { getAllInsumos } = useInsumoStore();
  const insumos = getAllInsumos();
  
  const [isReceitaDialogOpen, setIsReceitaDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedReceita, setSelectedReceita] = useState<ReceitaBase | null>(null);
  const [expandedReceita, setExpandedReceita] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ItemReceita | null>(null);
  
  // Form for new receita
  const receitaForm = useForm<NovaReceitaValues>({
    resolver: zodResolver(novaReceitaSchema),
    defaultValues: {
      nome: "",
    },
  });
  
  // Form for adding/editing item
  const itemForm = useForm<ItemReceitaValues>({
    resolver: zodResolver(itemReceitaSchema),
    defaultValues: {
      idInsumo: 0,
      quantidade: 0,
    },
  });
  
  const handleCreateReceita = (data: NovaReceitaValues) => {
    adicionarReceita(data.nome);
    setIsReceitaDialogOpen(false);
  };
  
  const handleAddItem = (data: ItemReceitaValues) => {
    if (selectedReceita) {
      if (editingItem) {
        atualizarItemReceita(selectedReceita.id, editingItem.id, data.quantidade);
      } else {
        adicionarItemReceita(selectedReceita.id, data.idInsumo, data.quantidade);
      }
      setIsItemDialogOpen(false);
    }
  };
  
  const openAddItemDialog = (receita: ReceitaBase) => {
    itemForm.reset({
      idInsumo: insumos.length > 0 ? insumos[0].id : 0,
      quantidade: 0,
    });
    setSelectedReceita(receita);
    setEditingItem(null);
    setIsItemDialogOpen(true);
  };
  
  const openEditItemDialog = (receita: ReceitaBase, item: ItemReceita) => {
    const insumo = insumos.find(i => i.id === item.idInsumo);
    if (insumo) {
      itemForm.reset({
        idInsumo: item.idInsumo,
        quantidade: item.quantidade,
      });
      setSelectedReceita(receita);
      setEditingItem(item);
      setIsItemDialogOpen(true);
    }
  };
  
  const handleRemoveItem = (receita: ReceitaBase, item: ItemReceita) => {
    if (confirm(`Tem certeza que deseja remover ${item.insumo?.nome || 'este item'} da receita?`)) {
      removerItemReceita(receita.id, item.id);
    }
  };
  
  const handleDeleteReceita = (receita: ReceitaBase) => {
    if (confirm(`Tem certeza que deseja remover a receita "${receita.nome}"?`)) {
      removerReceita(receita.id);
      if (expandedReceita === receita.id) {
        setExpandedReceita(null);
      }
    }
  };
  
  const toggleReceitaExpansion = (id: number) => {
    setExpandedReceita(expandedReceita === id ? null : id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Receitas Base</h2>
          <p className="text-muted-foreground">Gerenciamento de receitas base para a produção</p>
        </div>
        <Button onClick={() => {
          receitaForm.reset({ nome: "" });
          setIsReceitaDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Receita Base
        </Button>
      </div>
      
      {receitas.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Nenhuma receita cadastrada.</p>
          <Button className="mt-4" onClick={() => setIsReceitaDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Receita
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {receitas.map(receita => (
            <Card key={receita.id} className="w-full">
              <CardHeader className="cursor-pointer pb-4" onClick={() => toggleReceitaExpansion(receita.id)}>
                <div className="flex justify-between items-center">
                  <CardTitle>{receita.nome}</CardTitle>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon">
                      {expandedReceita === receita.id ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <CardDescription>
                    Peso total: {receita.pesoTotal}g • Custo total: R$ {receita.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </CardDescription>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddItemDialog(receita);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReceita(receita);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedReceita === receita.id && (
                <CardContent className="pt-4 border-t">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Insumo</TableHead>
                          <TableHead className="text-right">Quantidade (g/un)</TableHead>
                          <TableHead className="text-right">Custo (R$)</TableHead>
                          <TableHead className="w-[80px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receita.itensReceita.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              Nenhum insumo adicionado à receita
                            </TableCell>
                          </TableRow>
                        ) : (
                          receita.itensReceita.map(item => {
                            const insumo = insumos.find(i => i.id === item.idInsumo);
                            return (
                              <TableRow key={item.id}>
                                <TableCell>{insumo?.nome || "Insumo não encontrado"}</TableCell>
                                <TableCell className="text-right">{item.quantidade} {insumo?.unidadeMedida}</TableCell>
                                <TableCell className="text-right">
                                  {item.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 justify-end">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => openEditItemDialog(receita, item)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleRemoveItem(receita, item)}
                                    >
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
                </CardContent>
              )}
              {expandedReceita === receita.id && receita.itensReceita.length > 0 && (
                <CardFooter className="flex justify-end pt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openAddItemDialog(receita)}
                  >
                    Adicionar Insumo
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Dialog for creating new receita */}
      <Dialog open={isReceitaDialogOpen} onOpenChange={setIsReceitaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Receita Base</DialogTitle>
            <DialogDescription>
              Crie uma nova receita base para utilizar na produção.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...receitaForm}>
            <form onSubmit={receitaForm.handleSubmit(handleCreateReceita)} className="space-y-4">
              <FormField
                control={receitaForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Receita</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Brownie Tradicional" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsReceitaDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Criar Receita</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding/editing item to receita */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Insumo' : 'Adicionar Insumo'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Editar quantidade do insumo na receita "${selectedReceita?.nome}"`
                : `Adicionar insumo à receita "${selectedReceita?.nome}"`
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleAddItem)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="idInsumo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insumo</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        {...field}
                        value={field.value}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                        disabled={!!editingItem}
                      >
                        <option value="0" disabled>Selecione um insumo</option>
                        {insumos.map(insumo => (
                          <option key={insumo.id} value={insumo.id}>
                            {insumo.nome} ({insumo.unidadeMedida})
                          </option>
                        ))}
                      </select>
                    </FormControl>
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
                        min="0"
                        step="1"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
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
                <Button type="submit">
                  {editingItem ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
