
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Lead {
  id: number;
  nome: string;
  empresa: string;
  telefone: string;
  email: string;
  endereco: string;
  status: string;
  fonte: string;
  dataContato: Date;
  observacoes: string;
  valorEstimado?: number;
  probabilidade: number;
  proximaAcao?: string;
  dataProximaAcao?: Date;
  objecoes?: string;
  responsavel?: string;
  amostrasEntregues?: boolean;
  representanteId?: number;
  rotaEntregaId?: number;
  cidadeRegiao?: string;
  segmentoMercado?: string;
  numeroFuncionarios?: number;
  faturamentoAnual?: number;
  concorrenciaAtual?: string;
  dataPrimeiroContato?: Date;
  ultimaInteracao?: Date;
  proximoFollowUp?: Date;
}

interface LeadModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

export default function LeadModal({ lead, open, onClose, onSave }: LeadModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Lead>>(lead || {});

  const handleSave = () => {
    if (!formData.nome || !formData.empresa) {
      toast({
        title: "Erro",
        description: "Nome e empresa são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    onSave(formData as Lead);
    onClose();

    toast({
      title: "Lead atualizado",
      description: "As informações foram salvas com sucesso."
    });
  };

  const updateField = (field: keyof Lead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          <DialogDescription>
            Gerencie todas as informações do prospect
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Contato*</Label>
                  <Input
                    id="nome"
                    value={formData.nome || ""}
                    onChange={(e) => updateField('nome', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="empresa">Empresa*</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa || ""}
                    onChange={(e) => updateField('empresa', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ""}
                    onChange={(e) => updateField('telefone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco || ""}
                  onChange={(e) => updateField('endereco', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidadeRegiao">Cidade/Região</Label>
                  <Input
                    id="cidadeRegiao"
                    value={formData.cidadeRegiao || ""}
                    onChange={(e) => updateField('cidadeRegiao', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="segmentoMercado">Segmento de Mercado</Label>
                  <Select
                    value={formData.segmentoMercado || ""}
                    onValueChange={(value) => updateField('segmentoMercado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="padaria">Padaria</SelectItem>
                      <SelectItem value="cafeteria">Cafeteria</SelectItem>
                      <SelectItem value="restaurante">Restaurante</SelectItem>
                      <SelectItem value="mercado">Mercado</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Comerciais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Comerciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || ""}
                    onValueChange={(value) => updateField('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Contato Inicial">Contato Inicial</SelectItem>
                      <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                      <SelectItem value="Negociação">Negociação</SelectItem>
                      <SelectItem value="Fechado">Fechado</SelectItem>
                      <SelectItem value="Perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fonte">Fonte do Lead</Label>
                  <Select
                    value={formData.fonte || ""}
                    onValueChange={(value) => updateField('fonte', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="Google Ads">Google Ads</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Visita presencial">Visita presencial</SelectItem>
                      <SelectItem value="Site">Site</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valorEstimado">Valor Estimado (R$)</Label>
                  <Input
                    id="valorEstimado"
                    type="number"
                    value={formData.valorEstimado || ""}
                    onChange={(e) => updateField('valorEstimado', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="probabilidade">Probabilidade (%)</Label>
                  <Input
                    id="probabilidade"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probabilidade || 20}
                    onChange={(e) => updateField('probabilidade', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel || ""}
                    onChange={(e) => updateField('responsavel', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="representanteId">Representante Comercial</Label>
                  <Select
                    value={formData.representanteId?.toString() || ""}
                    onValueChange={(value) => updateField('representanteId', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o representante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">João Silva</SelectItem>
                      <SelectItem value="2">Maria Santos</SelectItem>
                      <SelectItem value="3">Pedro Oliveira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rotaEntregaId">Rota de Entrega</Label>
                  <Select
                    value={formData.rotaEntregaId?.toString() || ""}
                    onValueChange={(value) => updateField('rotaEntregaId', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a rota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Centro</SelectItem>
                      <SelectItem value="2">Zona Norte</SelectItem>
                      <SelectItem value="3">Zona Sul</SelectItem>
                      <SelectItem value="4">Zona Leste</SelectItem>
                      <SelectItem value="5">Zona Oeste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Checkbox
                    id="amostrasEntregues"
                    checked={formData.amostrasEntregues || false}
                    onCheckedChange={(checked) => updateField('amostrasEntregues', checked)}
                  />
                  <Label htmlFor="amostrasEntregues">Amostras de produto entregues</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroFuncionarios">Número de Funcionários</Label>
                  <Input
                    id="numeroFuncionarios"
                    type="number"
                    value={formData.numeroFuncionarios || ""}
                    onChange={(e) => updateField('numeroFuncionarios', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="faturamentoAnual">Faturamento Anual (R$)</Label>
                  <Input
                    id="faturamentoAnual"
                    type="number"
                    value={formData.faturamentoAnual || ""}
                    onChange={(e) => updateField('faturamentoAnual', Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="concorrenciaAtual">Fornecedor Atual</Label>
                <Input
                  id="concorrenciaAtual"
                  value={formData.concorrenciaAtual || ""}
                  onChange={(e) => updateField('concorrenciaAtual', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Observações e Objeções */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações e Objeções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="objecoes">Objeções</Label>
                <Textarea
                  id="objecoes"
                  value={formData.objecoes || ""}
                  onChange={(e) => updateField('objecoes', e.target.value)}
                  placeholder="Anote as objeções apresentadas pelo prospect..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes || ""}
                  onChange={(e) => updateField('observacoes', e.target.value)}
                  placeholder="Observações adicionais sobre o lead..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="proximaAcao">Próxima Ação</Label>
                <Input
                  id="proximaAcao"
                  value={formData.proximaAcao || ""}
                  onChange={(e) => updateField('proximaAcao', e.target.value)}
                  placeholder="Ex: Ligar para agendar reunião..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
