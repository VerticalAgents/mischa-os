import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  User,
  Calendar,
  Star,
  UserCheck
} from "lucide-react";

// Tipos para o funil de leads
type StatusLead = 'Novo' | 'Contato Inicial' | 'Proposta Enviada' | 'Negociação' | 'Fechado' | 'Perdido';

interface Lead {
  id: number;
  nome: string;
  empresa: string;
  telefone: string;
  email: string;
  endereco: string;
  status: StatusLead;
  fonte: string;
  dataContato: Date;
  observacoes: string;
  valorEstimado?: number;
  probabilidade: number;
  proximaAcao?: string;
  dataProximaAcao?: Date;
}

export default function FunilLeads() {
  const { adicionarCliente } = useClienteStore();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 1,
      nome: "Carlos Santos",
      empresa: "Café Aromático",
      telefone: "(11) 98765-4321",
      email: "carlos@cafearomatico.com",
      endereco: "Rua das Flores, 123 - Vila Madalena, São Paulo - SP",
      status: "Novo",
      fonte: "Indicação",
      dataContato: new Date("2024-05-10"),
      observacoes: "Interessado em 50 unidades semanais. Café especializado.",
      valorEstimado: 15000,
      probabilidade: 20,
      proximaAcao: "Ligar para apresentar produtos",
      dataProximaAcao: new Date("2024-05-15")
    },
    {
      id: 2,
      nome: "Ana Martins",
      empresa: "Padaria Moderna",
      telefone: "(11) 91234-5678",
      email: "ana@padariamoderna.com",
      endereco: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
      status: "Contato Inicial",
      fonte: "Google Ads",
      dataContato: new Date("2024-05-08"),
      observacoes: "Já tem fornecedor, mas aberta para testar nossos produtos.",
      valorEstimado: 8000,
      probabilidade: 40,
      proximaAcao: "Enviar amostras",
      dataProximaAcao: new Date("2024-05-14")
    },
    {
      id: 3,
      nome: "Roberto Silva",
      empresa: "Mercado do Bairro",
      telefone: "(11) 99876-5432",
      email: "roberto@mercadobairro.com",
      endereco: "Rua Consolação, 500 - Consolação, São Paulo - SP",
      status: "Proposta Enviada",
      fonte: "Visita presencial",
      dataContato: new Date("2024-05-05"),
      observacoes: "Proposta enviada para 80 unidades. Aguardando retorno.",
      valorEstimado: 20000,
      probabilidade: 70,
      proximaAcao: "Follow-up da proposta",
      dataProximaAcao: new Date("2024-05-13")
    },
    {
      id: 4,
      nome: "Fernanda Costa",
      empresa: "Café Gourmet Plus",
      telefone: "(11) 94567-8901",
      email: "fernanda@cafegourmetplus.com",
      endereco: "Rua Augusta, 200 - Centro, São Paulo - SP",
      status: "Negociação",
      fonte: "LinkedIn",
      dataContato: new Date("2024-05-03"),
      observacoes: "Negociando preço para pedido mensal de 120 unidades.",
      valorEstimado: 35000,
      probabilidade: 85,
      proximaAcao: "Reunião final",
      dataProximaAcao: new Date("2024-05-12")
    },
    {
      id: 5,
      nome: "João Pereira",
      empresa: "Bistrô Urbano",
      telefone: "(11) 92345-6789",
      email: "joao@bistrourbano.com",
      endereco: "Rua Oscar Freire, 800 - Jardins, São Paulo - SP",
      status: "Perdido",
      fonte: "Indicação",
      dataContato: new Date("2024-04-28"),
      observacoes: "Decidiu continuar com fornecedor atual por questões de preço.",
      valorEstimado: 12000,
      probabilidade: 0
    }
  ]);

  const [novoLead, setNovoLead] = useState<Partial<Lead>>({
    nome: "",
    empresa: "",
    telefone: "",
    email: "",
    endereco: "",
    status: "Novo",
    fonte: "",
    observacoes: "",
    valorEstimado: 0,
    probabilidade: 20
  });

  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogNovoAberto, setDialogNovoAberto] = useState(false);

  const statusConfig = {
    'Novo': { color: 'bg-gray-500', icon: AlertCircle },
    'Contato Inicial': { color: 'bg-blue-500', icon: Phone },
    'Proposta Enviada': { color: 'bg-yellow-500', icon: Mail },
    'Negociação': { color: 'bg-orange-500', icon: Clock },
    'Fechado': { color: 'bg-green-500', icon: CheckCircle2 },
    'Perdido': { color: 'bg-red-500', icon: AlertCircle }
  };

  const handleAdicionarLead = () => {
    if (!novoLead.nome || !novoLead.empresa) {
      toast({
        title: "Erro",
        description: "Nome e empresa são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const lead: Lead = {
      id: Math.max(...leads.map(l => l.id)) + 1,
      nome: novoLead.nome!,
      empresa: novoLead.empresa!,
      telefone: novoLead.telefone || "",
      email: novoLead.email || "",
      endereco: novoLead.endereco || "",
      status: novoLead.status || "Novo",
      fonte: novoLead.fonte || "",
      dataContato: new Date(),
      observacoes: novoLead.observacoes || "",
      valorEstimado: novoLead.valorEstimado || 0,
      probabilidade: novoLead.probabilidade || 20
    };

    setLeads(prev => [...prev, lead]);
    setNovoLead({
      nome: "",
      empresa: "",
      telefone: "",
      email: "",
      endereco: "",
      status: "Novo",
      fonte: "",
      observacoes: "",
      valorEstimado: 0,
      probabilidade: 20
    });
    setDialogNovoAberto(false);

    toast({
      title: "Lead adicionado",
      description: `${lead.nome} foi adicionado ao funil.`
    });
  };

  const handleAtualizarStatus = (leadId: number, novoStatus: StatusLead) => {
    setLeads(prev => 
      prev.map(lead => 
        lead.id === leadId 
          ? { 
              ...lead, 
              status: novoStatus,
              probabilidade: novoStatus === 'Fechado' ? 100 : 
                           novoStatus === 'Perdido' ? 0 : lead.probabilidade
            }
          : lead
      )
    );

    toast({
      title: "Status atualizado",
      description: `Lead movido para ${novoStatus}.`
    });
  };

  const handleConverterParaCliente = (lead: Lead) => {
    // Converter lead para cliente
    const novoCliente = {
      nome: lead.empresa,
      cnpjCpf: "", // Será preenchido posteriormente
      enderecoEntrega: lead.endereco,
      contatoNome: lead.nome,
      contatoTelefone: lead.telefone,
      contatoEmail: lead.email,
      quantidadePadrao: 50, // Valor padrão
      periodicidadePadrao: 7, // Semanal
      statusCliente: "Ativo" as const,
      observacoes: `Convertido do funil de leads. ${lead.observacoes}`,
      contabilizarGiroMedio: true,
      tipoLogistica: "Própria" as const,
      emiteNotaFiscal: true,
      tipoCobranca: "À vista" as const,
      formaPagamento: "PIX" as const,
      ativo: true,
      categoriaId: 1,
      subcategoriaId: 1
    };

    adicionarCliente(novoCliente);

    // Atualizar status do lead para Fechado
    handleAtualizarStatus(lead.id, 'Fechado');

    toast({
      title: "Cliente convertido!",
      description: `${lead.empresa} foi adicionado como cliente ativo.`
    });
  };

  const getLeadsPorStatus = (status: StatusLead) => {
    return leads.filter(lead => lead.status === status);
  };

  const calcularValorTotalPipeline = () => {
    return leads
      .filter(lead => lead.status !== 'Perdido' && lead.status !== 'Fechado')
      .reduce((total, lead) => total + (lead.valorEstimado || 0), 0);
  };

  const calcularTaxaConversao = () => {
    const totalLeads = leads.length;
    const leadsFechados = leads.filter(lead => lead.status === 'Fechado').length;
    return totalLeads > 0 ? (leadsFechados / totalLeads * 100).toFixed(1) : "0";
  };

  return (
    <div className="space-y-6">
      {/* Header com Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total no Pipeline</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.filter(l => l.status !== 'Perdido' && l.status !== 'Fechado').length}</div>
            <p className="text-xs text-muted-foreground">leads ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {calcularValorTotalPipeline().toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">no pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calcularTaxaConversao()}%</div>
            <p className="text-xs text-muted-foreground">leads → clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.filter(l => l.status === 'Fechado').length}</div>
            <p className="text-xs text-muted-foreground">este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Funil de Vendas</h2>
        <Dialog open={dialogNovoAberto} onOpenChange={setDialogNovoAberto}>
          <DialogTrigger asChild>
            <Button>
              <User className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Lead</DialogTitle>
              <DialogDescription>
                Cadastre um novo prospect no funil de vendas.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Contato*</Label>
                  <Input
                    id="nome"
                    value={novoLead.nome || ""}
                    onChange={(e) => setNovoLead(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="empresa">Empresa*</Label>
                  <Input
                    id="empresa"
                    value={novoLead.empresa || ""}
                    onChange={(e) => setNovoLead(prev => ({ ...prev, empresa: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={novoLead.telefone || ""}
                    onChange={(e) => setNovoLead(prev => ({ ...prev, telefone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={novoLead.email || ""}
                    onChange={(e) => setNovoLead(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={novoLead.endereco || ""}
                  onChange={(e) => setNovoLead(prev => ({ ...prev, endereco: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fonte">Fonte</Label>
                  <Select
                    value={novoLead.fonte || ""}
                    onValueChange={(value) => setNovoLead(prev => ({ ...prev, fonte: value }))}
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
                <div>
                  <Label htmlFor="valorEstimado">Valor Estimado (R$)</Label>
                  <Input
                    id="valorEstimado"
                    type="number"
                    value={novoLead.valorEstimado || ""}
                    onChange={(e) => setNovoLead(prev => ({ ...prev, valorEstimado: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={novoLead.observacoes || ""}
                  onChange={(e) => setNovoLead(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogNovoAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdicionarLead}>
                Adicionar Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Funil de Vendas */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const leadsDoStatus = getLeadsPorStatus(status as StatusLead);
          const Icon = config.icon;
          
          return (
            <Card key={status} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  {status}
                  <Badge variant="secondary" className="ml-auto">
                    {leadsDoStatus.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leadsDoStatus.map(lead => (
                  <Card key={lead.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setLeadSelecionado(lead);
                          setDialogAberto(true);
                        }}>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">{lead.empresa}</div>
                      <div className="text-xs text-muted-foreground">{lead.nome}</div>
                      {lead.valorEstimado && (
                        <div className="text-xs font-medium text-green-600">
                          R$ {lead.valorEstimado.toLocaleString('pt-BR')}
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {lead.probabilidade}%
                        </Badge>
                        <Icon className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Detalhes do Lead */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-[600px]">
          {leadSelecionado && (
            <>
              <DialogHeader>
                <DialogTitle>{leadSelecionado.empresa}</DialogTitle>
                <DialogDescription>
                  {leadSelecionado.nome} • {leadSelecionado.status}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </div>
                    <div className="text-muted-foreground">{leadSelecionado.telefone}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <div className="text-muted-foreground">{leadSelecionado.email}</div>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </div>
                  <div className="text-muted-foreground">{leadSelecionado.endereco}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="font-medium">Fonte</div>
                    <div className="text-muted-foreground">{leadSelecionado.fonte}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Valor Estimado</div>
                    <div className="text-muted-foreground">
                      R$ {leadSelecionado.valorEstimado?.toLocaleString('pt-BR') || '0'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="font-medium">Observações</div>
                  <div className="text-muted-foreground">{leadSelecionado.observacoes}</div>
                </div>

                {leadSelecionado.proximaAcao && (
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">Próxima Ação</div>
                    <div className="text-muted-foreground">{leadSelecionado.proximaAcao}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Mover para Status:</Label>
                  <Select
                    value={leadSelecionado.status}
                    onValueChange={(value) => handleAtualizarStatus(leadSelecionado.id, value as StatusLead)}
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
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogAberto(false)}>
                  Fechar
                </Button>
                {leadSelecionado.status === 'Negociação' && (
                  <Button onClick={() => handleConverterParaCliente(leadSelecionado)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Converter para Cliente
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
