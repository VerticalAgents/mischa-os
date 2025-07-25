
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HistoricoEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: any;
}

interface ItemEntrega {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export const HistoricoEditModal = ({ open, onOpenChange, registro }: HistoricoEditModalProps) => {
  const { user } = useAuth();
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retorno'>('entrega');
  const [itensEntrega, setItensEntrega] = useState<ItemEntrega[]>([]);
  const [tipoPedido, setTipoPedido] = useState<'Padrão' | 'Alterado'>('Padrão');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { editarRegistro, excluirRegistro } = useHistoricoEntregasStore();
  const { obterProporcoesParaPedido } = useSupabaseProporoesPadrao();
  const { produtos } = useProdutoStore();

  useEffect(() => {
    if (open && registro) {
      setQuantidade(registro.quantidade?.toString() || "");
      setObservacao(registro.observacao || "");
      setDataEntrega(format(new Date(registro.data), "yyyy-MM-dd'T'HH:mm"));
      setTipoEntrega(registro.tipo);
      
      // Determinar se é pedido padrão ou alterado baseado nos itens
      const temItensPersonalizados = registro.itens && Array.isArray(registro.itens) && registro.itens.length > 0;
      setTipoPedido(temItensPersonalizados ? 'Alterado' : 'Padrão');
      
      // Configurar itens baseado no tipo
      if (temItensPersonalizados) {
        setItensEntrega(registro.itens.map((item: any) => ({
          produto_id: item.produto_id || '',
          produto_nome: item.produto_nome || item.nome || '',
          quantidade: item.quantidade || 0
        })));
      } else {
        // Para pedidos padrão, calcular proporções
        calcularProporcoesParaPadrao(registro.quantidade || 0);
      }
    }
  }, [open, registro]);

  const calcularProporcoesParaPadrao = async (quantidadeTotal: number) => {
    try {
      const proporcoes = await obterProporcoesParaPedido(quantidadeTotal);
      setItensEntrega(proporcoes.map(p => ({
        produto_id: p.produto_id,
        produto_nome: p.produto_nome,
        quantidade: p.quantidade
      })));
    } catch (error) {
      console.error('Erro ao calcular proporções:', error);
      setItensEntrega([]);
    }
  };

  const handleTipoPedidoChange = (novoTipo: 'Padrão' | 'Alterado') => {
    setTipoPedido(novoTipo);
    
    if (novoTipo === 'Padrão') {
      const qtdTotal = parseInt(quantidade) || 0;
      calcularProporcoesParaPadrao(qtdTotal);
    } else {
      // Para alterado, manter itens atuais ou inicializar com um item vazio
      if (itensEntrega.length === 0) {
        setItensEntrega([{ produto_id: '', produto_nome: '', quantidade: 0 }]);
      }
    }
  };

  const handleQuantidadeChange = (novaQuantidade: string) => {
    setQuantidade(novaQuantidade);
    
    // Se é pedido padrão, recalcular proporções
    if (tipoPedido === 'Padrão') {
      const qtdTotal = parseInt(novaQuantidade) || 0;
      calcularProporcoesParaPadrao(qtdTotal);
    }
  };

  const adicionarItem = () => {
    const novosItens: ItemEntrega[] = [...itensEntrega, { produto_id: '', produto_nome: '', quantidade: 0 }];
    setItensEntrega(novosItens);
  };

  const removerItem = (index: number) => {
    const novosItens: ItemEntrega[] = itensEntrega.filter((_, i) => i !== index);
    setItensEntrega(novosItens);
  };

  const atualizarItem = (index: number, campo: keyof ItemEntrega, valor: any) => {
    const novosItens: ItemEntrega[] = [...itensEntrega];
    
    if (campo === 'produto_id') {
      const produto = produtos.find(p => p.id.toString() === valor);
      novosItens[index].produto_id = valor;
      novosItens[index].produto_nome = produto?.nome || '';
    } else {
      novosItens[index][campo] = valor;
    }
    
    setItensEntrega(novosItens);
    
    // Se é pedido alterado, recalcular quantidade total
    if (tipoPedido === 'Alterado') {
      const novaQuantidadeTotal = novosItens.reduce((total, item) => total + (item.quantidade || 0), 0);
      setQuantidade(novaQuantidadeTotal.toString());
    }
  };

  const handleSalvar = async () => {
    if (!user) {
      toast.error("É necessário estar logado para editar registros");
      return;
    }

    if (!quantidade || parseInt(quantidade) <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (!dataEntrega) {
      toast.error("Data da entrega é obrigatória");
      return;
    }

    // Validar itens para pedidos alterados
    if (tipoPedido === 'Alterado') {
      const itensValidos = itensEntrega.filter(item => item.produto_id && item.quantidade > 0);
      if (itensValidos.length === 0) {
        toast.error("Pelo menos um item deve ser selecionado para pedidos alterados");
        return;
      }
    }

    try {
      const dadosParaAtualizar = {
        quantidade: parseInt(quantidade),
        observacao: observacao.trim() || null,
        data: new Date(dataEntrega),
        tipo: tipoEntrega,
        itens: tipoPedido === 'Alterado' ? itensEntrega.filter(item => item.produto_id && item.quantidade > 0) : []
      };

      await editarRegistro(registro.id, dadosParaAtualizar);
      
      onOpenChange(false);
      toast.success("Registro editado com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar alterações");
    }
  };

  const handleExcluir = async () => {
    if (!user) {
      toast.error("É necessário estar logado para excluir registros");
      return;
    }

    try {
      await excluirRegistro(registro.id);
      onOpenChange(false);
      setShowDeleteDialog(false);
      toast.success("Registro excluído com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir registro");
    }
  };

  const handleClose = () => {
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  if (!registro) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Registro de {registro.tipo === 'entrega' ? 'Entrega' : 'Retorno'}
            </DialogTitle>
          </DialogHeader>
          
          {!user ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Você precisa estar logado para editar registros.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Cliente:</span>
                  <p>{registro.cliente_nome}</p>
                </div>
                <div>
                  <span className="font-medium">Data Original:</span>
                  <p>{format(new Date(registro.data), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="dataEntrega">Data da Entrega</Label>
                <Input
                  id="dataEntrega"
                  type="datetime-local"
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="tipoEntrega">Tipo</Label>
                <Select value={tipoEntrega} onValueChange={(value: 'entrega' | 'retorno') => setTipoEntrega(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrega">Entrega</SelectItem>
                    <SelectItem value="retorno">Retorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipoPedido">Tipo de Pedido</Label>
                <Select value={tipoPedido} onValueChange={(value: 'Padrão' | 'Alterado') => handleTipoPedidoChange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Padrão">Padrão (proporções automáticas)</SelectItem>
                    <SelectItem value="Alterado">Alterado (itens personalizados)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantidade">Quantidade Total (unidades)</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={quantidade}
                  onChange={(e) => handleQuantidadeChange(e.target.value)}
                  min="1"
                  disabled={tipoPedido === 'Alterado'}
                />
                {tipoPedido === 'Alterado' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Quantidade calculada automaticamente baseada nos itens
                  </p>
                )}
              </div>

              <div>
                <Label>Itens da Entrega</Label>
                <div className="space-y-2 mt-2">
                  {itensEntrega.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select
                        value={item.produto_id}
                        onValueChange={(value) => atualizarItem(index, 'produto_id', value)}
                        disabled={tipoPedido === 'Padrão'}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos.map(produto => (
                            <SelectItem key={produto.id} value={produto.id.toString()}>
                              {produto.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        type="number"
                        value={item.quantidade.toString()}
                        onChange={(e) => atualizarItem(index, 'quantidade', parseInt(e.target.value) || 0)}
                        className="w-20"
                        min="0"
                        disabled={tipoPedido === 'Padrão'}
                      />
                      
                      {tipoPedido === 'Alterado' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removerItem(index)}
                          disabled={itensEntrega.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {tipoPedido === 'Alterado' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={adicionarItem}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  )}
                </div>
                
                {tipoPedido === 'Padrão' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Quantidades calculadas automaticamente baseadas nas proporções configuradas
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Adicione uma observação sobre a edição..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
                <Button onClick={handleSalvar} className="flex-1">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O registro de {registro.tipo === 'entrega' ? 'entrega' : 'retorno'} será 
              permanentemente removido do sistema e isso afetará os cálculos de giro.
              <br /><br />
              <strong>Cliente:</strong> {registro.cliente_nome}<br />
              <strong>Data:</strong> {format(new Date(registro.data), "dd/MM/yyyy HH:mm")}<br />
              <strong>Quantidade:</strong> {registro.quantidade} unidades
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-red-600 hover:bg-red-700">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
