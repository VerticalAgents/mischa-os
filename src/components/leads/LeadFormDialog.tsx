import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lead, LeadStatus, ORIGENS } from "@/types/lead";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useSupabaseCategoriasEstabelecimento } from "@/hooks/useSupabaseCategoriasEstabelecimento";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSave: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export default function LeadFormDialog({ open, onOpenChange, lead, onSave }: LeadFormDialogProps) {
  const { representantes } = useSupabaseRepresentantes();
  const { categorias } = useSupabaseCategoriasEstabelecimento();
  
  const [formData, setFormData] = useState({
    nome: '',
    cnpjCpf: '',
    enderecoEntrega: '',
    linkGoogleMaps: '',
    contatoNome: '',
    contatoTelefone: '',
    contatoEmail: '',
    origem: '',
    status: 'cadastrado' as LeadStatus,
    representanteId: undefined as number | undefined,
    categoriaEstabelecimentoId: undefined as number | undefined,
    quantidadeEstimada: 0,
    periodicidadeEstimada: 7,
    observacoes: '',
    dataVisita: '',
    dataContatoWhatsApp: '',
    dataResposta: '',
    motivoPerda: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && lead) {
      setFormData({
        nome: lead.nome,
        cnpjCpf: lead.cnpjCpf || '',
        enderecoEntrega: lead.enderecoEntrega || '',
        linkGoogleMaps: lead.linkGoogleMaps || '',
        contatoNome: lead.contatoNome || '',
        contatoTelefone: lead.contatoTelefone || '',
        contatoEmail: lead.contatoEmail || '',
        origem: lead.origem,
        status: lead.status,
        representanteId: lead.representanteId,
        categoriaEstabelecimentoId: lead.categoriaEstabelecimentoId,
        quantidadeEstimada: lead.quantidadeEstimada || 0,
        periodicidadeEstimada: lead.periodicidadeEstimada || 7,
        observacoes: lead.observacoes || '',
        dataVisita: lead.dataVisita || '',
        dataContatoWhatsApp: lead.dataContatoWhatsApp || '',
        dataResposta: lead.dataResposta || '',
        motivoPerda: lead.motivoPerda || ''
      });
    } else if (open && !lead) {
      setFormData({
        nome: '',
        cnpjCpf: '',
        enderecoEntrega: '',
        linkGoogleMaps: '',
        contatoNome: '',
        contatoTelefone: '',
        contatoEmail: '',
        origem: '',
        status: 'cadastrado',
        representanteId: undefined,
        categoriaEstabelecimentoId: undefined,
        quantidadeEstimada: 0,
        periodicidadeEstimada: 7,
        observacoes: '',
        dataVisita: '',
        dataContatoWhatsApp: '',
        dataResposta: '',
        motivoPerda: ''
      });
    }
  }, [open, lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.origem) {
      return;
    }

    if (formData.status.startsWith('perdido_') && !formData.motivoPerda) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? 'Atualize os dados do lead' : 'Preencha os dados do novo lead'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome do Estabelecimento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
                  <Input
                    id="cnpjCpf"
                    value={formData.cnpjCpf}
                    onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enderecoEntrega">Endereço</Label>
                <Input
                  id="enderecoEntrega"
                  value={formData.enderecoEntrega}
                  onChange={(e) => setFormData({ ...formData, enderecoEntrega: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkGoogleMaps">Link do Google Maps</Label>
                <Input
                  id="linkGoogleMaps"
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={formData.linkGoogleMaps}
                  onChange={(e) => setFormData({ ...formData, linkGoogleMaps: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contatoNome">Nome do Contato</Label>
                  <Input
                    id="contatoNome"
                    value={formData.contatoNome}
                    onChange={(e) => setFormData({ ...formData, contatoNome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contatoTelefone">
                    Telefone/WhatsApp
                  </Label>
                  <Input
                    id="contatoTelefone"
                    value={formData.contatoTelefone}
                    onChange={(e) => setFormData({ ...formData, contatoTelefone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contatoEmail">Email</Label>
                  <Input
                    id="contatoEmail"
                    type="email"
                    value={formData.contatoEmail}
                    onChange={(e) => setFormData({ ...formData, contatoEmail: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Comerciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origem">
                    Origem <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.origem} onValueChange={(value) => setFormData({ ...formData, origem: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIGENS.map((origem) => (
                        <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: LeadStatus) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cadastrado">Cadastrado</SelectItem>
                      <SelectItem value="visitado">Visitado</SelectItem>
                      <SelectItem value="followup_wpp_pendente">WhatsApp Pendente</SelectItem>
                      <SelectItem value="followup_wpp_tentativa">WhatsApp Enviado</SelectItem>
                      <SelectItem value="followup_wpp_negociacao">Negociando (WhatsApp)</SelectItem>
                      <SelectItem value="followup_presencial_pendente">Retorno Pendente</SelectItem>
                      <SelectItem value="followup_presencial_tentativa">Revisitado</SelectItem>
                      <SelectItem value="followup_presencial_negociacao">Negociando (Presencial)</SelectItem>
                      <SelectItem value="efetivado_imediato">Fechado na Hora</SelectItem>
                      <SelectItem value="efetivado_wpp">Fechado WhatsApp</SelectItem>
                      <SelectItem value="efetivado_presencial">Fechado Presencial</SelectItem>
                      <SelectItem value="perdido_imediato">Perdido Imediato</SelectItem>
                      <SelectItem value="perdido_wpp">Perdido WhatsApp</SelectItem>
                      <SelectItem value="perdido_presencial">Perdido Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="representante">Representante</Label>
                  <Select 
                    value={formData.representanteId?.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, representanteId: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um representante" />
                    </SelectTrigger>
                    <SelectContent>
                      {representantes.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id.toString()}>{rep.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoriaEstabelecimento">Categoria do Estabelecimento</Label>
                  <Select 
                    value={formData.categoriaEstabelecimentoId?.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, categoriaEstabelecimentoId: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidadeEstimada">Quantidade Estimada</Label>
                  <Input
                    id="quantidadeEstimada"
                    type="number"
                    min="0"
                    value={formData.quantidadeEstimada}
                    onChange={(e) => setFormData({ ...formData, quantidadeEstimada: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodicidadeEstimada">Periodicidade Estimada (dias)</Label>
                  <Input
                    id="periodicidadeEstimada"
                    type="number"
                    min="1"
                    value={formData.periodicidadeEstimada}
                    onChange={(e) => setFormData({ ...formData, periodicidadeEstimada: parseInt(e.target.value) || 7 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações e Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataVisita">Data da Visita</Label>
                  <Input
                    id="dataVisita"
                    type="datetime-local"
                    value={formData.dataVisita}
                    onChange={(e) => setFormData({ ...formData, dataVisita: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataContatoWhatsApp">Data Contato WhatsApp</Label>
                  <Input
                    id="dataContatoWhatsApp"
                    type="datetime-local"
                    value={formData.dataContatoWhatsApp}
                    onChange={(e) => setFormData({ ...formData, dataContatoWhatsApp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataResposta">Data da Resposta</Label>
                  <Input
                    id="dataResposta"
                    type="datetime-local"
                    value={formData.dataResposta}
                    onChange={(e) => setFormData({ ...formData, dataResposta: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              {formData.status.startsWith('perdido_') && (
                <div className="space-y-2">
                  <Label htmlFor="motivoPerda">
                    Motivo da Perda <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="motivoPerda"
                    rows={2}
                    value={formData.motivoPerda}
                    onChange={(e) => setFormData({ ...formData, motivoPerda: e.target.value })}
                    required={formData.status.startsWith('perdido_')}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
