import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Printer, ClipboardCheck } from "lucide-react";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { useEstoqueComExpedicao } from "@/hooks/useEstoqueComExpedicao";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useMovimentacoesEstoqueInsumos } from "@/hooks/useMovimentacoesEstoqueInsumos";
import { gerarFolhaAuditoria } from "@/utils/auditoriaEstoquePrint";

function converterParaKg(valor: number, unidade: string): number | null {
  const u = (unidade || "").toLowerCase();
  if (u === "kg") return valor;
  if (u === "g") return valor / 1000;
  return null;
}

export default function AuditoriaEstoqueTab() {
  const { insumos } = useSupabaseInsumos();
  const { obterSaldoInsumo } = useMovimentacoesEstoqueInsumos();
  const { produtos } = useEstoqueComExpedicao();
  const { categorias } = useSupabaseCategoriasProduto();

  const [incluirInsumos, setIncluirInsumos] = useState(true);
  const [incluirProdutos, setIncluirProdutos] = useState(true);
  const [saldosInsumos, setSaldosInsumos] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const novos: Record<string, number> = {};
      for (const i of insumos) {
        try {
          novos[i.id] = await obterSaldoInsumo(i.id);
        } catch {
          novos[i.id] = i.estoque_atual ?? 0;
        }
      }
      if (!cancelado) setSaldosInsumos(novos);
    })();
    return () => { cancelado = true; };
  }, [insumos, obterSaldoInsumo]);

  const categoriaPorId = useMemo(() => {
    const map = new Map<number, string>();
    categorias.forEach((c: any) => map.set(c.id, c.nome));
    return map;
  }, [categorias]);

  const linhasInsumos = useMemo(() => insumos.map((i) => {
    const saldo = saldosInsumos[i.id] ?? i.estoque_atual ?? 0;
    return {
      nome: i.nome,
      categoria: i.categoria || "Sem categoria",
      estoqueSistema: saldo,
      unidade: i.unidade_medida,
      estoqueEmKg: converterParaKg(saldo, i.unidade_medida),
    };
  }), [insumos, saldosInsumos]);

  const linhasProdutos = useMemo(() => produtos
    .filter((p) => p.ativo)
    .map((p) => ({
      nome: p.nome,
      categoria: p.categoria_id ? (categoriaPorId.get(p.categoria_id) || "Sem categoria") : "Sem categoria",
      estoqueSistema: Number(p.saldoReal) || 0,
    })),
  [produtos, categoriaPorId]);

  const handleImprimir = () => {
    gerarFolhaAuditoria({
      insumos: linhasInsumos,
      produtos: linhasProdutos,
      incluirInsumos,
      incluirProdutos,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Contagem de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Imprima a folha de auditoria, conte fisicamente os insumos (em kg) e produtos prontos (em unidades),
            marque os itens que precisam de compra e use os ajustes de estoque do sistema para conciliar.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch id="incluir-insumos" checked={incluirInsumos} onCheckedChange={setIncluirInsumos} />
              <Label htmlFor="incluir-insumos">Incluir insumos ({linhasInsumos.length})</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="incluir-produtos" checked={incluirProdutos} onCheckedChange={setIncluirProdutos} />
              <Label htmlFor="incluir-produtos">Incluir produtos prontos ({linhasProdutos.length})</Label>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleImprimir}
              disabled={!incluirInsumos && !incluirProdutos}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir folha de auditoria
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Imprima a folha com os saldos atuais do sistema.</p>
          <p>2. Realize a contagem física: insumos em <strong>kg</strong>, produtos prontos em <strong>unidades</strong>.</p>
          <p>3. Marque o checkbox <strong>"Comprar?"</strong> para os itens que precisam reposição.</p>
          <p>4. Ajuste as divergências usando as movimentações de estoque nas abas <em>Insumos</em> e <em>Produtos</em>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
