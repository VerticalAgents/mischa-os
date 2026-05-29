import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, FileText, Sparkles, AlertTriangle, Download, ExternalLink } from 'lucide-react';
import { useListaComprasAutomatica } from '@/hooks/useListaComprasAutomatica';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COBERTURAS = [7, 14, 30] as const;

export default function NecessidadeInsumosTab() {
  const [cobertura, setCobertura] = useState<number>(7);
  const [margem, setMargem] = useState<number>(0);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { linhas, totalCompra, loading, coberturaUsada, margemUsada, produtosIgnorados, gerar } = useListaComprasAutomatica();

  const fmtMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtQtd = (v: number, dec = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  // Converte g→kg e ml→L para exibição mais limpa.
  const fmtMedida = (valor: number, unidade: string) => {
    const u = (unidade || '').toLowerCase();
    if (u === 'g') return `${fmtQtd(valor / 1000, 3)} kg`;
    if (u === 'ml') return `${fmtQtd(valor / 1000, 3)} L`;
    return `${fmtQtd(valor, 2)} ${unidade}`;
  };

  const linhasVisiveis = useMemo(
    () => mostrarTodos ? linhas : linhas.filter(l => l.aComprar > 0),
    [linhas, mostrarTodos]
  );

  const handleGerar = async () => {
    await gerar(cobertura, margem);
    toast({
      title: 'Lista gerada',
      description: `Cobertura ${cobertura}d${margem > 0 ? ` +${margem}% de margem` : ''}.`,
    });
  };

  const handleExportarPDF = () => {
    if (linhas.length === 0) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const dataStr = format(new Date(), 'dd/MM/yyyy HH:mm');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista de Compras', 40, 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110);
    doc.text(`Gerado em ${dataStr}`, 40, 68);

    const infoLinha = `Cobertura: ${coberturaUsada} dias  ·  Margem de segurança: ${margemUsada}%  ·  Total estimado: ${fmtMoeda(totalCompra)}`;
    doc.text(infoLinha, 40, 84);

    autoTable(doc, {
      startY: 100,
      head: [['Insumo', 'Consumo/sem.', 'Estoque', 'Necessário', 'A comprar', 'Custo']],
      body: linhasVisiveis.map(l => [
        l.nome,
        fmtMedida(l.consumoMedioSemanal, l.unidade),
        fmtMedida(l.estoqueAtual, l.unidade),
        fmtMedida(l.necessario, l.unidade),
        fmtMedida(l.aComprar, l.unidade),
        l.custoTotal > 0 ? fmtMoeda(l.custoTotal) : '-',
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [209, 25, 58], textColor: 255 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      margin: { left: 40, right: 40 },
    });

    // Usa <a target="_blank"> ao invés de window.open para evitar bloqueio
    // de pop-up (Brave/Chrome com bloqueadores agressivos).
    // Renderiza dentro de um modal com iframe (não depende de pop-up,
    // funciona no Brave/Chrome mesmo com bloqueadores agressivos).
    const blob = doc.output('blob');
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  const handleFecharPdf = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  const handleAbrirNovaAba = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBaixar = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `lista-compras-${format(new Date(), 'ddMMyyyy-HHmm')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Margem de segurança (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={margem}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isNaN(v)) return setMargem(0);
                    setMargem(Math.max(0, Math.min(100, v)));
                  }}
                  className="w-28 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>
            </div>

            <div className="ml-auto flex gap-2">
              <Button onClick={handleGerar} disabled={loading} className="gap-2">
                <Sparkles className="h-4 w-4" />
                {loading ? 'Gerando...' : 'Gerar lista'}
              </Button>
              {linhas.length > 0 && (
                <Button variant="outline" onClick={handleExportarPDF} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Abrir PDF
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
                {linhasVisiveis.length} {linhasVisiveis.length === 1 ? 'item' : 'itens'} · cobertura {coberturaUsada} dias{margemUsada > 0 ? ` · +${margemUsada}% margem` : ''}
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
                        {fmtMedida(l.consumoMedioSemanal, l.unidade)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmtMedida(l.estoqueAtual, l.unidade)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtMedida(l.necessario, l.unidade)}
                      </TableCell>
                      <TableCell className="text-right">
                        {l.aComprar > 0 ? (
                          <Badge variant="destructive">
                            {fmtMedida(l.aComprar, l.unidade)}
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
