
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMovimentacoesEstoqueProdutos } from "@/hooks/useMovimentacoesEstoqueProdutos";
import { useMovimentacoesEstoqueInsumos } from "@/hooks/useMovimentacoesEstoqueInsumos";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { MovTipo } from "@/types/estoque";

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
  const [tipo, setTipo] = useState<MovTipo>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [quantidadePacotes, setQuantidadePacotes] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [modoEntrada, setModoEntrada] = useState<'quantidade' | 'pacotes'>('quantidade');
  const [saldoAtual, setSaldoAtual] = useState(0);

  const { adicionarMovimentacao: adicionarMovimentacaoProduto } = useMovimentacoesEstoqueProdutos();
  const { adicionarMovimentacao: adicionarMovimentacaoInsumo, obterSaldoInsumo } = useMovimentacoesEstoqueInsumos();
  const { insumos } = useSupabaseInsumos();

  // Buscar dados do insumo específico
  const insumoAtual = tipoItem === 'insumo' ? insumos.find(i => i.id === itemId) : null;

  useEffect(() => {
    if (isOpen && tipoItem === 'insumo') {
      carregarSaldoAtual();
    }
  }, [isOpen, itemId, tipoItem]);

  useEffect(() => {
    // Calcular quantidade automaticamente quando em modo pacotes
    if (modoEntrada === 'pacotes' && quantidadePacotes && insumoAtual) {
      const qtdCalculada = parseFloat(quantidadePacotes) * insumoAtual.volume_bruto;
      setQuantidade(qtdCalculada.toString());
    }
  }, [quantidadePacotes, modoEntrada, insumoAtual]);

  const carregarSaldoAtual = async () => {
    if (tipoItem === 'insumo') {
      const saldo = await obterSaldoInsumo(itemId);
      setSaldoAtual(saldo);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantidade || parseFloat(quantidade) <= 0) {
      return;
    }

    setLoading(true);

    let quantidadeFinal = parseFloat(quantidade);
    let tipoMovimentacao = tipo;

    // Lógica especial para ajuste
    if (tipo === 'ajuste') {
      const diferenca = quantidadeFinal - saldoAtual;
      
      if (diferenca > 0) {
        // Quantidade final é maior que atual, fazer entrada
        quantidadeFinal = diferenca;
        tipoMovimentacao = 'entrada';
      } else if (diferenca < 0) {
        // Quantidade final é menor que atual, fazer saída
        quantidadeFinal = Math.abs(diferenca);
        tipoMovimentacao = 'saida';
      } else {
        // Não há diferença, não fazer nada
        setLoading(false);
        onSuccess?.();
        onClose();
        return;
      }
    }

    const movimentacao = {
      tipo: tipoMovimentacao,
      quantidade: quantidadeFinal,
      data_movimentacao: new Date().toISOString(),
      observacao: tipo === 'ajuste' 
        ? `Ajuste de estoque para ${quantidade} ${insumoAtual?.unidade_medida || 'unidades'}${observacao ? ' | ' + observacao : ''}`
        : observacao || undefined,
      ...(tipoItem === 'produto' 
        ? { produto_id: itemId } 
        : { insumo_id: itemId }
      )
    };

    const sucesso = tipoItem === 'produto' 
      ? await adicionarMovimentacaoProduto(movimentacao as any)
      : await adicionarMovimentacaoInsumo(movimentacao as any);

    if (sucesso) {
      resetForm();
      onSuccess?.();
      onClose();
    }

    setLoading(false);
  };

  const resetForm = () => {
    setTipo('entrada');
    setQuantidade('');
    setQuantidadePacotes('');
    setObservacao('');
    setModoEntrada('quantidade');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação - {itemNome}</DialogTitle>
        </DialogHeader>

        {tipoItem === 'insumo' && insumoAtual && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informações do Insumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Categoria:</span>
                <Badge variant="outline">{insumoAtual.categoria}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Volume por pacote:</span>
                <span className="text-sm font-medium">{insumoAtual.volume_bruto} {insumoAtual.unidade_medida}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Saldo atual:</span>
                <span className="text-sm font-medium">{saldoAtual.toFixed(3)} {insumoAtual.unidade_medida}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Movimentação</Label>
            <Select value={tipo} onValueChange={(value: MovTipo) => setTipo(value)}>
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

          {tipoItem === 'insumo' && insumoAtual && tipo !== 'ajuste' && (
            <div className="space-y-2">
              <Label>Modo de Entrada</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={modoEntrada === 'quantidade' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setModoEntrada('quantidade')}
                >
                  Por Quantidade
                </Button>
                <Button
                  type="button"
                  variant={modoEntrada === 'pacotes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setModoEntrada('pacotes')}
                >
                  Por Pacotes
                </Button>
              </div>
            </div>
          )}

          {tipoItem === 'insumo' && insumoAtual && modoEntrada === 'pacotes' && tipo !== 'ajuste' && (
            <div className="space-y-2">
              <Label htmlFor="quantidadePacotes">Quantidade de Pacotes</Label>
              <Input
                id="quantidadePacotes"
                type="number"
                value={quantidadePacotes}
                onChange={(e) => setQuantidadePacotes(e.target.value)}
                placeholder="Digite a quantidade de pacotes"
                min="0"
                step="1"
              />
              {quantidadePacotes && (
                <p className="text-sm text-muted-foreground">
                  = {(parseFloat(quantidadePacotes) * insumoAtual.volume_bruto).toFixed(3)} {insumoAtual.unidade_medida}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantidade">
              {tipo === 'ajuste' ? `Quantidade Final (${insumoAtual?.unidade_medida || 'unidades'})` : 'Quantidade'}
            </Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder={tipo === 'ajuste' ? `Estoque final desejado` : "Digite a quantidade"}
              min="0"
              step="0.001"
              required
              disabled={modoEntrada === 'pacotes' && tipo !== 'ajuste'}
            />
            {tipo === 'ajuste' && quantidade && (
              <p className="text-sm text-muted-foreground">
                {parseFloat(quantidade) > saldoAtual 
                  ? `Entrada de ${(parseFloat(quantidade) - saldoAtual).toFixed(3)} ${insumoAtual?.unidade_medida || 'unidades'}`
                  : parseFloat(quantidade) < saldoAtual
                    ? `Saída de ${(saldoAtual - parseFloat(quantidade)).toFixed(3)} ${insumoAtual?.unidade_medida || 'unidades'}`
                    : 'Sem alteração no estoque'
                }
              </p>
            )}
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
