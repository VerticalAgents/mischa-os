
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMovimentacoesEstoqueProdutos } from "@/hooks/useMovimentacoesEstoqueProdutos";
import { useMovimentacoesEstoqueInsumos } from "@/hooks/useMovimentacoesEstoqueInsumos";
import { toast } from "@/hooks/use-toast";

interface BaixaEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  tipoItem: 'produto' | 'insumo';
  saldoAtual: number;
  onSuccess?: () => void;
}

export default function BaixaEstoqueModal({
  isOpen,
  onClose,
  itemId,
  itemNome,
  tipoItem,
  saldoAtual,
  onSuccess
}: BaixaEstoqueModalProps) {
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  const { adicionarMovimentacao: adicionarMovimentacaoProduto } = useMovimentacoesEstoqueProdutos();
  const { adicionarMovimentacao: adicionarMovimentacaoInsumo } = useMovimentacoesEstoqueInsumos();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const qtd = parseFloat(quantidade);
    if (!quantidade || qtd <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Informe uma quantidade maior que zero",
        variant: "destructive"
      });
      return;
    }

    if (qtd > saldoAtual) {
      toast({
        title: "Quantidade inválida",
        description: `Quantidade solicitada (${qtd}) é maior que o saldo disponível (${saldoAtual})`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const movimentacao = {
      tipo: 'saida' as const,
      quantidade: qtd,
      data_movimentacao: new Date().toISOString(),
      observacao: observacao || `Baixa de estoque - ${qtd} unidades`,
      ...(tipoItem === 'produto' 
        ? { produto_id: itemId } 
        : { insumo_id: itemId }
      )
    };

    try {
      const sucesso = tipoItem === 'produto' 
        ? await adicionarMovimentacaoProduto(movimentacao as any)
        : await adicionarMovimentacaoInsumo(movimentacao as any);

      if (sucesso) {
        setQuantidade('');
        setObservacao('');
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao registrar baixa:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Baixa de Estoque - {itemNome}</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Saldo atual: <span className="font-semibold text-foreground">{saldoAtual}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade para Baixa *</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Digite a quantidade"
              min="0"
              max={saldoAtual}
              step="0.001"
              required
            />
            <p className="text-xs text-muted-foreground">
              Máximo disponível: {saldoAtual}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Motivo da Baixa</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Produto vencido, avariado, uso interno..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !quantidade || parseFloat(quantidade) <= 0}
              variant="destructive"
            >
              {loading ? "Processando..." : "Confirmar Baixa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
