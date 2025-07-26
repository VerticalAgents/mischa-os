
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Target, 
  Plus, 
  Calendar,
  TrendingUp,
  Users,
  Award,
  Edit,
  Trash2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MetaProspeccao {
  id: number;
  nome: string;
  periodo: string;
  metaLeads: number;
  metaConversoes: number;
  taxaConversaoEsperada: number;
  leadsAtuais: number;
  conversoesAtuais: number;
  dataInicio: Date;
  dataFim: Date;
  responsavel: string;
  status: 'ativa' | 'concluida' | 'pausada';
}

export default function MetasProspeccao() {
  const { toast } = useToast();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [metaEditando, setMetaEditando] = useState<MetaProspeccao | null>(null);

  const [metas, setMetas] = useState<MetaProspeccao[]>([
    {
      id: 1,
      nome: "Meta Q1 2024",
      periodo: "trimestral",
      metaLeads: 150,
      metaConversoes: 30,
      taxaConversaoEsperada: 20,
      leadsAtuais: 87,
      conversoesAtuais: 12,
      dataInicio: new Date("2024-01-01"),
      dataFim: new Date("2024-03-31"),
      responsavel: "João Silva",
      status: 'ativa'
    },
    {
      id: 2,
      nome: "Meta Janeiro",
      periodo: "mensal",
      metaLeads: 50,
      metaConversoes: 10,
      taxaConversaoEsperada: 20,
      leadsAtuais: 47,
      conversoesAtuais: 7,
      dataInicio: new Date("2024-01-01"),
      dataFim: new Date("2024-01-31"),
      responsavel: "Maria Santos",
      status: 'ativa'
    },
  ]);

  const [novaMeta, setNovaMeta] = useState<Partial<MetaProspeccao>>({
    nome: "",
    periodo: "mensal",
    metaLeads: 0,
    metaConversoes: 0,
    taxaConversaoEsperada: 20,
    responsavel: "",
    status: 'ativa'
  });

  const adicionarMeta = () => {
    if (!novaMeta.nome || !novaMeta.metaLeads || !novaMeta.metaConversoes) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const meta: MetaProspeccao = {
      id: Math.max(...metas.map(m => m.id)) + 1,
      nome: novaMeta.nome!,
      periodo: novaMeta.periodo!,
      metaLeads: novaMeta.metaLeads!,
      metaConversoes: novaMeta.metaConversoes!,
      taxaConversaoEsperada: novaMeta.taxaConversaoEsperada!,
      leadsAtuais: 0,
      conversoesAtuais: 0,
      dataInicio: new Date(),
      dataFim: novaMeta.periodo === 'mensal' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      responsavel: novaMeta.responsavel!,
      status: 'ativa'
    };

    setMetas(prev => [...prev, meta]);
    setNovaMeta({
      nome: "",
      periodo: "mensal",
      metaLeads: 0,
      metaConversoes: 0,
      taxaConversaoEsperada: 20,
      responsavel: "",
      status: 'ativa'
    });
    setDialogAberto(false);

    toast({
      title: "Meta criada",
      description: `${meta.nome} foi adicionada com sucesso.`
    });
  };

  const removerMeta = (id: number) => {
    setMetas(prev => prev.filter(m => m.id !== id));
    toast({
      title: "Meta removida",
      description: "A meta foi removida com sucesso."
    });
  };

  const calcularProgresso = (meta: MetaProspeccao) => {
    const progressoLeads = (meta.leadsAtuais / meta.metaLeads) * 100;
    const progressoConversoes = (meta.conversoesAtuais / meta.metaConversoes) * 100;
    return {
      progressoLeads: Math.min(100, progressoLeads),
      progressoConversoes: Math.min(100, progressoConversoes),
      taxaConversaoAtual: meta.leadsAtuais > 0 ? (meta.conversoesAtuais / meta.leadsAtuais) * 100 : 0
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'concluida':
        return <Badge className="bg-blue-500">Concluída</Badge>;
      case 'pausada':
        return <Badge variant="secondary">Pausada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Metas de Prospecção</h2>
          <p className="text-muted-foreground">
            Defina e acompanhe metas de captação e conversão de leads
          </p>
        </div>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
              <DialogDescription>
                Defina uma nova meta de prospecção para sua equipe
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="nome">Nome da Meta*</Label>
                <Input
                  id="nome"
                  value={novaMeta.nome || ""}
                  onChange={(e) => setNovaMeta(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Meta Janeiro 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periodo">Período</Label>
                  <Select
                    value={novaMeta.periodo || "mensal"}
                    onValueChange={(value) => setNovaMeta(prev => ({ ...prev, periodo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={novaMeta.responsavel || ""}
                    onChange={(e) => setNovaMeta(prev => ({ ...prev, responsavel: e.target.value }))}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metaLeads">Meta de Leads*</Label>
                  <Input
                    id="metaLeads"
                    type="number"
                    value={novaMeta.metaLeads || ""}
                    onChange={(e) => setNovaMeta(prev => ({ ...prev, metaLeads: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="metaConversoes">Meta de Conversões*</Label>
                  <Input
                    id="metaConversoes"
                    type="number"
                    value={novaMeta.metaConversoes || ""}
                    onChange={(e) => setNovaMeta(prev => ({ ...prev, metaConversoes: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="taxaConversao">Taxa de Conversão Esperada (%)</Label>
                <Input
                  id="taxaConversao"
                  type="number"
                  min="1"
                  max="100"
                  value={novaMeta.taxaConversaoEsperada || 20}
                  onChange={(e) => setNovaMeta(prev => ({ ...prev, taxaConversaoEsperada: Number(e.target.value) }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={adicionarMeta}>
                Criar Meta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo das Metas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metas.filter(m => m.status === 'ativa').length}</div>
            <p className="text-xs text-muted-foreground">em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metas.reduce((acc, m) => acc + m.leadsAtuais, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: {metas.reduce((acc, m) => acc + m.metaLeads, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metas.reduce((acc, m) => acc + m.conversoesAtuais, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: {metas.reduce((acc, m) => acc + m.metaConversoes, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metas.length > 0 ? 
                Math.round(metas.reduce((acc, m) => acc + calcularProgresso(m).progressoConversoes, 0) / metas.length) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">média das metas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 gap-4">
        {metas.map(meta => {
          const progresso = calcularProgresso(meta);
          return (
            <Card key={meta.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {meta.nome}
                      {getStatusBadge(meta.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {meta.responsavel} • {meta.periodo} • {meta.dataInicio.toLocaleDateString()} - {meta.dataFim.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removerMeta(meta.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Progresso de Leads */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Leads</span>
                      <span>{meta.leadsAtuais} / {meta.metaLeads}</span>
                    </div>
                    <Progress value={progresso.progressoLeads} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {progresso.progressoLeads.toFixed(1)}% concluído
                    </p>
                  </div>

                  {/* Progresso de Conversões */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conversões</span>
                      <span>{meta.conversoesAtuais} / {meta.metaConversoes}</span>
                    </div>
                    <Progress value={progresso.progressoConversoes} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {progresso.progressoConversoes.toFixed(1)}% concluído
                    </p>
                  </div>

                  {/* Taxa de Conversão */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxa Conversão</span>
                      <span>{progresso.taxaConversaoAtual.toFixed(1)}% / {meta.taxaConversaoEsperada}%</span>
                    </div>
                    <Progress 
                      value={(progresso.taxaConversaoAtual / meta.taxaConversaoEsperada) * 100} 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground">
                      {progresso.taxaConversaoAtual >= meta.taxaConversaoEsperada ? 
                        'Meta atingida!' : 
                        'Abaixo da meta'
                      }
                    </p>
                  </div>
                </div>

                {/* Status e observações */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span>Status geral: 
                        <Badge variant="outline" className="ml-1">
                          {Math.round((progresso.progressoLeads + progresso.progressoConversoes) / 2)}% completo
                        </Badge>
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      Atualizado há 2 horas
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {metas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma meta cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Crie sua primeira meta de prospecção para começar a acompanhar o desempenho da equipe
            </p>
            <Button onClick={() => setDialogAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
