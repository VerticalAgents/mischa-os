import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Loader2, AlertTriangle, Plus } from "lucide-react";
import { useMotivosBonificacao } from "@/hooks/useMotivosBonificacao";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

export interface BonificacaoPendente {
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  motivo_id?: number;
  motivo_nome: string;
}

interface BonificacoesPendentesEditorProps {
  value: BonificacaoPendente[];
  onChange: (bonificacoes: BonificacaoPendente[]) => void;
}

export default function BonificacoesPendentesEditor({ value, onChange }: BonificacoesPendentesEditorProps) {
  const { motivos, loading: loadingMotivos } = useMotivosBonificacao();
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();

  const produtosAtivos = produtos.filter((p) => p.ativo);
  const bonificacoes = value ?? [];

  const atualizar = (index: number, patch: Partial<BonificacaoPendente>) => {
    onChange(bonificacoes.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const handleProdutoChange = (index: number, produtoId: string) => {
    const produto = produtos.find((p) => p.id === produtoId);
    if (produto) atualizar(index, { produto_id: produto.id, produto_nome: produto.nome });
  };

  const handleMotivoChange = (index: number, motivoId: string) => {
    const motivo = motivos.find((m) => m.id === Number(motivoId));
    if (motivo) atualizar(index, { motivo_id: motivo.id, motivo_nome: motivo.nome });
  };

  const handleQuantidadeChange = (index: number, raw: string) => {
    const n = Number(raw);
    atualizar(index, { quantidade: Number.isFinite(n) && n > 0 ? n : 1 });
  };

  const adicionar = () => {
    onChange([...bonificacoes, { produto_nome: "", quantidade: 1, motivo_nome: "" }]);
  };

  const remover = (index: number) => {
    onChange(bonificacoes.filter((_, i) => i !== index));
  };

  if (loadingProdutos || loadingMotivos) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando opções...
      </div>
    );
  }

  if (produtosAtivos.length === 0 || motivos.length === 0) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          {produtosAtivos.length === 0 && "Nenhum produto ativo encontrado. "}
          {motivos.length === 0 && "Nenhum motivo de bonificação configurado."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {bonificacoes.map((bonif, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
        >
          <div className="space-y-2 flex-1 min-w-0">
            <Label htmlFor={`bonif-produto-${index}`}>Produto</Label>
            <Select
              value={bonif.produto_id ?? undefined}
              onValueChange={(v) => handleProdutoChange(index, v)}
            >
              <SelectTrigger id={`bonif-produto-${index}`}>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {produtosAtivos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full sm:w-56">
            <Label htmlFor={`bonif-motivo-${index}`}>Motivo (opcional)</Label>
            <Select
              value={bonif.motivo_id?.toString() ?? undefined}
              onValueChange={(v) => handleMotivoChange(index, v)}
            >
              <SelectTrigger id={`bonif-motivo-${index}`}>
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivos.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full sm:w-24">
            <Label htmlFor={`bonif-qtd-${index}`}>Quantidade</Label>
            <Input
              id={`bonif-qtd-${index}`}
              type="number"
              min={1}
              value={bonif.quantidade || 1}
              onChange={(e) => handleQuantidadeChange(index, e.target.value)}
            />
          </div>

          <div className="flex justify-end sm:block">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => remover(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={adicionar}
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Bonificação
      </Button>
    </div>
  );
}