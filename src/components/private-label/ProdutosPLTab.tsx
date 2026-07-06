import { useState } from 'react';
import { useProdutosPL, ProdutoPL, useReceitaPL, useInsumosPL } from '@/hooks/usePrivateLabel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, ChefHat } from 'lucide-react';

const UNIDADES = ['g', 'kg', 'ml', 'l', 'un'];

function ProdutoForm({ produto, onSave, onCancel }: {
  produto?: ProdutoPL | null;
  onSave: (p: Partial<ProdutoPL>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<ProdutoPL>>({
    nome: produto?.nome || '',
    descricao: produto?.descricao || '',
    peso_unitario: produto?.peso_unitario || 0,
    unidades_producao: produto?.unidades_producao || 1,
    estoque_minimo: produto?.estoque_minimo || 0,
    ativo: produto?.ativo ?? true,
  });
  return (
    <div className="space-y-3">
      <div>
        <Label>Nome do SKU *</Label>
        <Input value={form.nome || ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Brownie Marca X 40g" />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={form.descricao || ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Peso unitário (g)</Label>
          <Input type="number" value={form.peso_unitario || 0} onChange={e => setForm(f => ({ ...f, peso_unitario: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div>
          <Label>Unidades por batelada</Label>
          <Input type="number" value={form.unidades_producao || 1} onChange={e => setForm(f => ({ ...f, unidades_producao: parseInt(e.target.value) || 1 }))} />
        </div>
        <div>
          <Label>Estoque mínimo</Label>
          <Input type="number" value={form.estoque_minimo || 0} onChange={e => setForm(f => ({ ...f, estoque_minimo: parseFloat(e.target.value) || 0 }))} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(form)} disabled={!form.nome}>Salvar</Button>
      </DialogFooter>
    </div>
  );
}

function ReceitaDialog({ produto, clienteIndustrialId, onClose }: {
  produto: ProdutoPL;
  clienteIndustrialId: string;
  onClose: () => void;
}) {
  const { itens, adicionarItem, removerItem } = useReceitaPL(produto.id);
  const { insumos } = useInsumosPL(clienteIndustrialId);
  const [insumoId, setInsumoId] = useState('');
  const [qtd, setQtd] = useState(0);
  const [un, setUn] = useState('g');

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Ficha técnica — {produto.nome}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Para produzir <strong>{produto.unidades_producao}</strong> unidade(s), consumir:
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map(it => (
                <TableRow key={it.id}>
                  <TableCell>{it.insumo?.nome || '—'}</TableCell>
                  <TableCell className="text-right">{it.quantidade}</TableCell>
                  <TableCell>{it.unidade_medida}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => removerItem(it.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {itens.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum insumo na ficha ainda.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Adicionar insumo</p>
              <div className="grid grid-cols-[1fr_120px_100px_auto] gap-2 items-end">
                <div>
                  <Label>Insumo</Label>
                  <Select value={insumoId} onValueChange={setInsumoId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{insumos.map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input type="number" value={qtd} onChange={e => setQtd(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Select value={un} onValueChange={setUn}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button
                  disabled={!insumoId || qtd <= 0}
                  onClick={async () => { const ok = await adicionarItem(insumoId, qtd, un); if (ok) { setInsumoId(''); setQtd(0); } }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProdutosPLTab({ clienteIndustrialId }: { clienteIndustrialId: string | null }) {
  const { produtos, loading, criar, atualizar, remover } = useProdutosPL(clienteIndustrialId);
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<ProdutoPL | null>(null);
  const [receita, setReceita] = useState<ProdutoPL | null>(null);

  if (!clienteIndustrialId) {
    return <p className="text-sm text-muted-foreground">Selecione um cliente industrial acima.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Produtos private-label</h2>
          <p className="text-sm text-muted-foreground">SKUs fabricados pra marca do cliente, com ficha técnica apontando pros insumos consignados.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo produto</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo produto private-label</DialogTitle></DialogHeader>
            <ProdutoForm onCancel={() => setOpenNew(false)} onSave={async (p) => { const r = await criar(p); if (r) setOpenNew(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Peso</TableHead>
                <TableHead className="text-right">Un./batelada</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!loading && produtos.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum produto cadastrado.</TableCell></TableRow>
              )}
              {produtos.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-right">{p.peso_unitario ? `${p.peso_unitario} g` : '—'}</TableCell>
                  <TableCell className="text-right">{p.unidades_producao}</TableCell>
                  <TableCell className="text-right">{Number(p.estoque_atual).toLocaleString('pt-BR')} un</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setReceita(p)}>
                        <ChefHat className="h-3.5 w-3.5 mr-1" />Ficha
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm('Remover produto?')) remover(p.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar produto</DialogTitle></DialogHeader>
          {editing && <ProdutoForm produto={editing} onCancel={() => setEditing(null)} onSave={async (p) => { const ok = await atualizar(editing.id, p); if (ok) setEditing(null); }} />}
        </DialogContent>
      </Dialog>

      {receita && <ReceitaDialog produto={receita} clienteIndustrialId={clienteIndustrialId} onClose={() => setReceita(null)} />}
    </div>
  );
}