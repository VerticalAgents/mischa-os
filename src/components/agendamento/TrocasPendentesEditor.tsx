import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Loader2, AlertTriangle, Plus } from "lucide-react";
import { useMotivosTroca } from "@/hooks/useMotivosTroca";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

export interface TrocaPendente {
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  motivo_id?: number;
  motivo_nome: string;
}

interface TrocasPendentesEditorProps {
  value: TrocaPendente[];
  onChange: (trocas: TrocaPendente[]) => void;
}

export default function TrocasPendentesEditor({ value, onChange }: TrocasPendentesEditorProps) {
  const { motivos, loading: loadingMotivos } = useMotivosTroca();
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();

  const produtosAtivos = produtos.filter((p) => p.ativo);
  const trocas = value ?? [];

  const atualizarTroca = (index: number, patch: Partial<TrocaPendente>) => {
    const novas = trocas.map((t, i) => (i === index ? { ...t, ...patch } : t));
    onChange(novas);
  };

  const handleProdutoChange = (index: number, produtoId: string) => {
    const produto = produtos.find((p) => p.id === produtoId);
    if (produto) {
      atualizarTroca(index, { produto_id: produto.id, produto_nome: produto.nome });
    }
  };

  const handleMotivoChange = (index: number, motivoId: string) => {
    const motivo = motivos.find((m) => m.id === Number(motivoId));
    if (motivo) {
      atualizarTroca(index, { motivo_id: motivo.id, motivo_nome: motivo.nome });
    }
  };

  const handleQuantidadeChange = (index: number, raw: string) => {
    const n = Number(raw);
    atualizarTroca(index, { quantidade: Number.isFinite(n) && n > 0 ? n : 1 });
  };

  const adicionarTroca = () => {
    onChange([...trocas, { produto_nome: "", quantidade: 1, motivo_nome: "" }]);
  };

  const removerTroca = (index: number) => {
    onChange(trocas.filter((_, i) => i !== index));
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
          {motivos.length === 0 && "Nenhum motivo de troca configurado."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {trocas.map((troca, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
        >
          <div className="space-y-2 flex-1 min-w-0">
            <Label htmlFor={`troca-produto-${index}`}>Produto</Label>
            <Select
              value={troca.produto_id ?? undefined}
              onValueChange={(v) => handleProdutoChange(index, v)}
            >
              <SelectTrigger id={`troca-produto-${index}`}>
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

          <div className="space-y-2 w-full sm:w-24">
            <Label htmlFor={`troca-qtd-${index}`}>Quantidade</Label>
            <Input
              id={`troca-qtd-${index}`}
              type="number"
              min={1}
              value={troca.quantidade || 1}
              onChange={(e) => handleQuantidadeChange(index, e.target.value)}
            />
          </div>

          <div className="space-y-2 w-full sm:w-56">
            <Label htmlFor={`troca-motivo-${index}`}>Motivo (opcional)</Label>
            <Select
              value={troca.motivo_id?.toString() ?? undefined}
              onValueChange={(v) => handleMotivoChange(index, v)}
            >
              <SelectTrigger id={`troca-motivo-${index}`}>
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

          <div className="flex justify-end sm:block">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => removerTroca(index)}
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
        onClick={adicionarTroca}
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Troca
      </Button>
    </div>
  );
}
