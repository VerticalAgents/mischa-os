
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMovimentacoesEstoqueProdutos } from "@/hooks/useMovimentacoesEstoqueProdutos";
import { useMovimentacoesEstoqueInsumos } from "@/hooks/useMovimentacoesEstoqueInsumos";

interface MovimentacaoEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  tipoItem: 'produto' | 'insumo';
  onSuccess?: () => void;
}

export default function MovimentacaoEstoqueModal({
  isOpen,
  onClose,
  itemId,
  itemNome,
  tipoItem,
  onSuccess
}: MovimentacaoEstoqueModalProps) {
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  const { adicionarMovimentacao: adicionarMovimentacaoProduto } = useMovimentacoesEstoqueProdutos();
  const { adicionarMovimentacao: adicionarMovimentacaoInsumo } = useMovimentacoesEstoqueInsumos();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantidade || parseFloat(quantidade) <= 0) {
      return;
    }

    setLoading(true);

    const movimentacao = {
      tipo,
      quantidade: parseFloat(quantidade),
      data_movimentacao: new Date().toISOString(),
      observacao: observacao || undefined,
      ...(tipoItem === 'produto' 
        ? { produto_id: itemId } 
        : { insumo_id: itemId }
      )
    };

    const sucesso = tipoItem === 'produto' 
      ? await adicionarMovimentacaoProduto(movimentacao as any)
      : await adicionarMovimentacaoInsumo(movimentacao as any);

    if (sucesso) {
      setTipo('entrada');
      setQuantidade('');
      setObservacao('');
      onSuccess?.();
      onClose();
    }

    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação - {itemNome}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Movimentação</Label>
            <Select value={tipo} onValueChange={(value: 'entrada' | 'saida' | 'ajuste') => setTipo(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Digite a quantidade"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observações sobre a movimentação"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !quantidade}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
