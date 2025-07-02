import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { useSupabaseReceitas, ReceitaCompleta } from "@/hooks/useSupabaseReceitas";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const editarReceitaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  rendimento: z.number().min(0.01, "Rendimento deve ser maior que zero"),
  unidade_rendimento: z.string().min(1, "Unidade de rendimento é obrigatória"),
});

const itemReceitaSchema = z.object({
  insumo_id: z.string().min(1, "Selecione um insumo"),
  quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
});

type EditarReceitaFormValues = z.infer<typeof editarReceitaSchema>;
type ItemReceitaFormValues = z.infer<typeof itemReceitaSchema>;

interface EditarReceitaModalProps {
  receita: ReceitaCompleta | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditarReceitaModal({
  receita,
  isOpen,
  onClose,
  onSuccess,
}: EditarReceitaModalProps) {
  const { insumos } = useSupabaseInsumos();
  const { adicionarItemReceita, removerItemReceita } = useSupabaseReceitas();
  const [isAdicionandoItem, setIsAdicionandoItem] = useState(false);
  const [editandoItem, setEditandoItem] = useState<string | null>(null);
  const [quantidadeEdicao, setQuantidadeEdicao] = useState<number>(0);

  const receitaForm = useForm<EditarReceitaFormValues>({
    resolver: zodResolver(editarReceitaSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      rendimento: 0,
      unidade_rendimento: "",
    },
  });

  const itemForm = useForm<ItemReceitaFormValues>({
    resolver: zodResolver(itemReceitaSchema),
    defaultValues: {
      insumo_id: "",
      quantidade: 0,
    },
  });

  useEffect(() => {
    if (receita) {
      receitaForm.reset({
        nome: receita.nome,
        descricao: receita.descricao || "",
        rendimento: receita.rendimento,
        unidade_rendimento: receita.unidade_rendimento,
      });
    }
  }, [receita, receitaForm]);

  const onSubmitReceita = async (values: EditarReceitaFormValues) => {
    if (!receita) return;

    try {
      const { error } = await supabase
        .from('receitas_base')
        .update(values)
        .eq('id', receita.id);

      if (error) {
        toast({
          title: "Erro ao atualizar receita",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Receita atualizada",
        description: "Receita atualizada com sucesso"
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar receita:', error);
    }
  };

  const onSubmitItem = async (values: ItemReceitaFormValues) => {
    if (!receita) return;

    const success = await adicionarItemReceita(
      receita.id,
      values.insumo_id,
      values.quantidade
    );

    if (success) {
      itemForm.reset({
        insumo_id: "",
        quantidade: 0,
      });
      setIsAdicionandoItem(false);
      onSuccess();
    }
  };

  const handleRemoverItem = async (itemId: string) => {
    const success = await removerItemReceita(itemId);
    if (success) {
      onSuccess();
    }
  };

  const iniciarEdicaoItem = (itemId: string, quantidadeAtual: number) => {
    setEditandoItem(itemId);
    setQuantidadeEdicao(quantidadeAtual);
  };

  const cancelarEdicaoItem = () => {
    setEditandoItem(null);
    setQuantidadeEdicao(0);
  };

  const salvarEdicaoItem = async (itemId: string) => {
    if (quantidadeEdicao <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Atualizando item:', itemId, 'Nova quantidade:', quantidadeEdicao);
      
      const { error } = await supabase
        .from('itens_receita')
        .update({ quantidade: quantidadeEdicao })
        .eq('id', itemId);

      if (error) {
        console.error('Erro ao atualizar quantidade:', error);
        toast({
          title: "Erro ao atualizar quantidade",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Quantidade atualizada com sucesso');
      
      toast({
        title: "Quantidade atualizada",
        description: "Quantidade do ingrediente atualizada com sucesso"
      });
      
      setEditandoItem(null);
      setQuantidadeEdicao(0);
      onSuccess();
    } catch (error) {
      console.error('Erro inesperado ao atualizar quantidade:', error);
      toast({
        title: "Erro ao atualizar quantidade",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  };

  const getInsumoInfo = (insumoId: string) => {
    const insumo = insumos.find(i => i.id === insumoId);
    return {
      nome: insumo?.nome || "Insumo não encontrado",
      unidade_medida: insumo?.unidade_medida || "",
      custo_medio: insumo?.custo_medio || 0,
      volume_bruto: insumo?.volume_bruto || 1
    };
  };

  // Função para calcular o custo unitário correto
  const calcularCustoUnitario = (insumoId: string) => {
    const insumoInfo = getInsumoInfo(insumoId);
    // Custo unitário = custo do pacote ÷ volume bruto do pacote
    return insumoInfo.volume_bruto > 0 ? insumoInfo.custo_medio / insumoInfo.volume_bruto : 0;
  };

  // Função para calcular o custo do item na receita
  const calcularCustoItem = (insumoId: string, quantidade: number) => {
    const custoUnitario = calcularCustoUnitario(insumoId);
    // Custo do item = quantidade utilizada × custo unitário
    return custoUnitario * quantidade;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Receita</DialogTitle>
          <DialogDescription>
            Edite os dados da receita e seus ingredientes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário da Receita */}
          <Form {...receitaForm}>
            <form onSubmit={receitaForm.handleSubmit(onSubmitReceita)} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={receitaForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Receita</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da receita" {...field} />
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
                      <FormLabel>Unidade de Rendimento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: kg, unidades, porções" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={receitaForm.control}
                name="rendimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rendimento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 2.5"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
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
                      <Textarea placeholder="Descrição da receita" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Atualizar Receita
              </Button>
            </form>
          </Form>

          {/* Lista de Ingredientes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold">Ingredientes</h4>
              <Button
                size="sm"
                onClick={() => setIsAdicionandoItem(true)}
                disabled={isAdicionandoItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Ingrediente
              </Button>
            </div>

            {/* Formulário para adicionar item */}
            {isAdicionandoItem && (
              <Form {...itemForm}>
                <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4 p-4 border rounded">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="insumo_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insumo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um insumo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {insumos.map((insumo) => (
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
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Adicionar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAdicionandoItem(false);
                        itemForm.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Tabela de ingredientes */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Custo Unit.</TableHead>
                  <TableHead>Custo Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receita?.itens.map((item) => {
                  const insumoInfo = getInsumoInfo(item.insumo_id);
                  const custoUnitario = calcularCustoUnitario(item.insumo_id);
                  const quantidadeAtual = editandoItem === item.id ? quantidadeEdicao : item.quantidade;
                  const custoTotalItem = calcularCustoItem(item.insumo_id, quantidadeAtual);
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{insumoInfo.nome}</TableCell>
                      <TableCell>
                        {editandoItem === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={quantidadeEdicao}
                              onChange={(e) => setQuantidadeEdicao(Number(e.target.value))}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">
                              {insumoInfo.unidade_medida}
                            </span>
                          </div>
                        ) : (
                          <span>
                            {item.quantidade} {insumoInfo.unidade_medida}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>R$ {custoUnitario.toFixed(4)}</TableCell>
                      <TableCell>R$ {custoTotalItem.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {editandoItem === item.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => salvarEdicaoItem(item.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelarEdicaoItem}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => iniciarEdicaoItem(item.id, item.quantidade)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoverItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Resumo de custos */}
            {receita && receita.itens.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Custo Total da Receita:</span>
                    <div className="text-lg font-semibold">
                      R$ {receita.itens.reduce((total, item) => {
                        const quantidade = editandoItem === item.id ? quantidadeEdicao : item.quantidade;
                        return total + calcularCustoItem(item.insumo_id, quantidade);
                      }, 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Custo por {receita.unidade_rendimento}:</span>
                    <div className="text-lg font-semibold">
                      R$ {receita.rendimento > 0 ? (receita.itens.reduce((total, item) => {
                        const quantidade = editandoItem === item.id ? quantidadeEdicao : item.quantidade;
                        return total + calcularCustoItem(item.insumo_id, quantidade);
                      }, 0) / receita.rendimento).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
