import { useState } from 'react';
import { useInsumosPL, InsumoPL } from '@/hooks/usePrivateLabel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowDownToLine, ArrowUpFromLine, Trash2, Pencil } from 'lucide-react';

const UNIDADES = ['g', 'kg', 'ml', 'l', 'un', 'pct'];
const CATEGORIAS = ['Matéria Prima', 'Embalagem', 'Outros'];

function InsumoForm({ insumo, onSave, onCancel }: {
  insumo?: InsumoPL | null;
  onSave: (p: Partial<InsumoPL>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<InsumoPL>>({
    nome: insumo?.nome || '',
    categoria: insumo?.categoria || 'Matéria Prima',
    unidade_medida: insumo?.unidade_medida || 'g',
    volume_bruto: insumo?.volume_bruto || 0,
    estoque_minimo: insumo?.estoque_minimo || 0,
    observacoes: insumo?.observacoes || '',
    ativo: insumo?.ativo ?? true,
  });
  return (
    <div className="space-y-3">
      <div>
        <Label>Nome *</Label>
        <Input value={form.nome || ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Açúcar Refinado (marca X)" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Categoria</Label>
          <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Unidade</Label>
          <Select value={form.unidade_medida} onValueChange={v => setForm(f => ({ ...f, unidade_medida: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Estoque mínimo</Label>
        <Input type="number" value={form.estoque_minimo || 0} onChange={e => setForm(f => ({ ...f, estoque_minimo: parseFloat(e.target.value) || 0 }))} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(form)} disabled={!form.nome}>Salvar</Button>
      </DialogFooter>
    </div>
  );
}

function MovDialog({ insumo, tipo, onSubmit, onClose }: {
  insumo: InsumoPL;
  tipo: 'entrada' | 'saida' | 'ajuste';
  onSubmit: (qtd: number, obs: string) => Promise<void>;
  onClose: () => void;
}) {
  const [qtd, setQtd] = useState(0);
  const [obs, setObs] = useState('');
  const label = tipo === 'entrada' ? 'Entrada (cliente enviou)' : tipo === 'saida' ? 'Saída (ajuste)' : 'Ajuste';
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{label} — {insumo.nome}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Quantidade ({insumo.unidade_medida})</Label>
            <Input type="number" value={qtd} onChange={e => setQtd(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Observação</Label>
            <Input value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: NF 12345 recebida em 06/07" />
          </div>
          <div className="text-sm text-muted-foreground">Estoque atual: <strong>{insumo.estoque_atual} {insumo.unidade_medida}</strong></div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={async () => { await onSubmit(qtd, obs); onClose(); }} disabled={qtd <= 0}>Confirmar</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InsumosPLTab({ clienteIndustrialId }: { clienteIndustrialId: string | null }) {
  const { insumos, loading, criar, atualizar, remover, registrarMovimentacao } = useInsumosPL(clienteIndustrialId);
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<InsumoPL | null>(null);
  const [mov, setMov] = useState<{ insumo: InsumoPL; tipo: 'entrada' | 'saida' | 'ajuste' } | null>(null);

  if (!clienteIndustrialId) {
    return <p className="text-sm text-muted-foreground">Selecione um cliente industrial acima.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Insumos consignados</h2>
          <p className="text-sm text-muted-foreground">Insumos enviados pelo cliente. Custo zero pra você — estoque separado.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo insumo</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo insumo consignado</DialogTitle></DialogHeader>
            <InsumoForm onCancel={() => setOpenNew(false)} onSave={async (p) => { const r = await criar(p); if (r) setOpenNew(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Estoque atual</TableHead>
                <TableHead className="text-right">Estoque mín</TableHead>
                <TableHead>Última entrada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!loading && insumos.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum insumo cadastrado.</TableCell></TableRow>
              )}
              {insumos.map(i => {
                const abaixoMin = i.estoque_minimo > 0 && i.estoque_atual < i.estoque_minimo;
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nome}</TableCell>
                    <TableCell><Badge variant="secondary">{i.categoria}</Badge></TableCell>
                    <TableCell className="text-right">
                      <span className={abaixoMin ? 'text-destructive font-semibold' : ''}>
                        {Number(i.estoque_atual).toLocaleString('pt-BR')} {i.unidade_medida}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{i.estoque_minimo} {i.unidade_medida}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {i.ultima_entrada ? new Date(i.ultima_entrada).toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setMov({ insumo: i, tipo: 'entrada' })}>
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setMov({ insumo: i, tipo: 'saida' })}>
                          <ArrowUpFromLine className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm('Remover insumo?')) remover(i.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar insumo</DialogTitle></DialogHeader>
          {editing && <InsumoForm insumo={editing} onCancel={() => setEditing(null)} onSave={async (p) => { const ok = await atualizar(editing.id, p); if (ok) setEditing(null); }} />}
        </DialogContent>
      </Dialog>

      {mov && (
        <MovDialog
          insumo={mov.insumo}
          tipo={mov.tipo}
          onClose={() => setMov(null)}
          onSubmit={async (qtd, obs) => { await registrarMovimentacao(mov.insumo.id, mov.tipo, qtd, obs); }}
        />
      )}
    </div>
  );
}