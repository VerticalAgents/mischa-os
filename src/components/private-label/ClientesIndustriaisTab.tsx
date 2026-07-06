import { useState } from 'react';
import { useClientesIndustriais, ClienteIndustrial } from '@/hooks/usePrivateLabel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Factory } from 'lucide-react';

function ClienteForm({ cliente, onSave, onCancel }: {
  cliente?: ClienteIndustrial | null;
  onSave: (payload: Partial<ClienteIndustrial>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<ClienteIndustrial>>({
    nome: cliente?.nome || '',
    cnpj: cliente?.cnpj || '',
    contato_nome: cliente?.contato_nome || '',
    contato_email: cliente?.contato_email || '',
    contato_telefone: cliente?.contato_telefone || '',
    endereco: cliente?.endereco || '',
    preco_industrializacao_unitario: cliente?.preco_industrializacao_unitario || 0,
    observacoes: cliente?.observacoes || '',
    ativo: cliente?.ativo ?? true,
  });

  return (
    <div className="space-y-3">
      <div>
        <Label>Nome / Razão Social *</Label>
        <Input value={form.nome || ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>CNPJ</Label>
          <Input value={form.cnpj || ''} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
        </div>
        <div>
          <Label>Preço por unidade industrializada (R$)</Label>
          <Input type="number" step="0.01" value={form.preco_industrializacao_unitario || 0}
            onChange={e => setForm(f => ({ ...f, preco_industrializacao_unitario: parseFloat(e.target.value) || 0 }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Contato (nome)</Label>
          <Input value={form.contato_nome || ''} onChange={e => setForm(f => ({ ...f, contato_nome: e.target.value }))} />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input value={form.contato_telefone || ''} onChange={e => setForm(f => ({ ...f, contato_telefone: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={form.contato_email || ''} onChange={e => setForm(f => ({ ...f, contato_email: e.target.value }))} />
      </div>
      <div>
        <Label>Endereço</Label>
        <Input value={form.endereco || ''} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} />
      </div>
      <div>
        <Label>Observações</Label>
        <Textarea value={form.observacoes || ''} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(form)} disabled={!form.nome}>Salvar</Button>
      </DialogFooter>
    </div>
  );
}

export default function ClientesIndustriaisTab() {
  const { clientes, loading, criar, atualizar, remover } = useClientesIndustriais();
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<ClienteIndustrial | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Clientes Industriais</h2>
          <p className="text-sm text-muted-foreground">Parceiros private-label que enviam insumos e coletam produção terceirizada.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo cliente industrial</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Novo cliente industrial</DialogTitle></DialogHeader>
            <ClienteForm
              onCancel={() => setOpenNew(false)}
              onSave={async (p) => { const r = await criar(p); if (r) setOpenNew(false); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientes.map(c => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">{c.nome}</CardTitle>
                  {c.cnpj && <p className="text-xs text-muted-foreground">{c.cnpj}</p>}
                </div>
              </div>
              <Badge variant={c.ativo ? 'default' : 'secondary'}>{c.ativo ? 'Ativo' : 'Inativo'}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {c.contato_nome && <p><span className="text-muted-foreground">Contato: </span>{c.contato_nome}</p>}
              {c.contato_telefone && <p><span className="text-muted-foreground">Tel: </span>{c.contato_telefone}</p>}
              <p><span className="text-muted-foreground">Preço/unidade: </span>R$ {Number(c.preco_industrializacao_unitario).toFixed(2)}</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm('Remover este cliente industrial? Vai apagar insumos, produtos e histórico dele.')) remover(c.id); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && clientes.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2">Nenhum cliente industrial cadastrado ainda.</p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar cliente industrial</DialogTitle></DialogHeader>
          {editing && (
            <ClienteForm
              cliente={editing}
              onCancel={() => setEditing(null)}
              onSave={async (p) => { const ok = await atualizar(editing.id, p); if (ok) setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}