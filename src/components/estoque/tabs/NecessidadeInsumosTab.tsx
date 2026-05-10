import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, FileSpreadsheet, Sparkles, AlertTriangle } from 'lucide-react';
import { useListaComprasAutomatica } from '@/hooks/useListaComprasAutomatica';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const COBERTURAS = [7, 14, 30] as const;

export default function NecessidadeInsumosTab() {
  const [cobertura, setCobertura] = useState<number>(7);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const { linhas, totalCompra, loading, coberturaUsada, produtosIgnorados, gerar } = useListaComprasAutomatica();

  const fmtMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtQtd = (v: number, dec = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const linhasVisiveis = useMemo(
    () => mostrarTodos ? linhas : linhas.filter(l => l.aComprar > 0),
    [linhas, mostrarTodos]
  );

  const handleGerar = async () => {
    await gerar(cobertura);
    toast({ title: 'Lista gerada', description: `Cobertura para ${cobertura} dias calculada.` });
  };

  const handleExportar = () => {
    if (linhas.length === 0) return;
    const dados = linhasVisiveis.map(l => ({
      Insumo: l.nome,
      Unidade: l.unidade,
      'Consumo médio/dia': Number(l.consumoMedioDia.toFixed(3)),
      'Estoque atual': Number(l.estoqueAtual.toFixed(3)),
      [`Necessário (${coberturaUsada}d)`]: Number(l.necessario.toFixed(3)),
      'A comprar': Number(l.aComprar.toFixed(3)),
      'Custo unitário': l.custoMedio,
      'Custo total': l.custoTotal,
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista de Compras');
    XLSX.writeFile(wb, `lista-compras-${coberturaUsada}d-${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Lista de Compras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Baseado nas entregas confirmadas dos últimos 28 dias, convertidas em insumos via receitas.
          </p>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Cobertura desejada</Label>
              <div className="inline-flex rounded-md border bg-background p-1">
                {COBERTURAS.map(d => (
                  <button
                    key={d}
                    onClick={() => setCobertura(d)}
                    className={`px-4 py-1.5 text-sm rounded transition-colors ${
                      cobertura === d
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {d} dias
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-auto flex gap-2">
              <Button onClick={handleGerar} disabled={loading} className="gap-2">
                <Sparkles className="h-4 w-4" />
                {loading ? 'Gerando...' : 'Gerar lista'}
              </Button>
              {linhas.length > 0 && (
                <Button variant="outline" onClick={handleExportar} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {linhas.length > 0 && (
        <>
          {produtosIgnorados.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20">
              <CardContent className="p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {produtosIgnorados.length} {produtosIgnorados.length === 1 ? 'produto ignorado' : 'produtos ignorados'} no cálculo
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Sem receita ou rendimento configurado. Cadastre em PCP &gt; Rendimentos para incluir.
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {produtosIgnorados.map(p => (
                      <li key={p.produtoId}>
                        • <span className="font-medium text-foreground">{p.nome}</span> — {p.unidades} un vendidas
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 flex flex-wrap items-center gap-6">
              <div>
                <div className="text-2xl font-bold">{fmtMoeda(totalCompra)}</div>
                <p className="text-xs text-muted-foreground">Total estimado da compra</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Switch id="mostrar-todos" checked={mostrarTodos} onCheckedChange={setMostrarTodos} />
                <Label htmlFor="mostrar-todos" className="text-sm">Mostrar itens já cobertos</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {linhasVisiveis.length} {linhasVisiveis.length === 1 ? 'item' : 'itens'} · cobertura {coberturaUsada} dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead className="text-right">Consumo/semana</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Necessário</TableHead>
                    <TableHead className="text-right">A comprar</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhasVisiveis.map(l => (
                    <TableRow key={l.insumoId}>
                      <TableCell className="font-medium">{l.nome}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmtQtd(l.consumoMedioSemanal, 2)} {l.unidade}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmtQtd(l.estoqueAtual, 2)} {l.unidade}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtQtd(l.necessario, 2)} {l.unidade}
                      </TableCell>
                      <TableCell className="text-right">
                        {l.aComprar > 0 ? (
                          <Badge variant="destructive">
                            {fmtQtd(l.aComprar, 2)} {l.unidade}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {l.custoTotal > 0 ? fmtMoeda(l.custoTotal) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {linhas.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Escolha a cobertura desejada e clique em <strong>Gerar lista</strong>.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
