import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, addBusinessDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Phone, MessageCircleQuestion, Clock, AlertCircle, CalendarCheck2, PhoneX, MessageCircleAlert, AlertTriangle, MessageCircleDashed } from "lucide-react";
import { useConfirmacaoReposicaoStore } from "@/hooks/useConfirmacaoReposicaoStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { cn } from "@/lib/utils";
import { useSearchParams, useNavigate } from "react-router-dom";

export const ConfirmacaoReposicaoTab = () => {
  const { toast } = useToast();
  const { clientes } = useClienteStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    confirmacoes,
    gerarConfirmacoesPendentes,
    getContatoNecessarioHoje,
    getContatoNaoRealizadoAtrasado,
    getContatadoSemResposta,
    getReenvioApos24h,
    getSemRespostaApos2Contato,
    registrarContato,
    registrarResposta,
    atualizarStatusConfirmacao,
    reagendarAutomatico,
    reagendarManual
  } = useConfirmacaoReposicaoStore();
  
  const [selectedData, setSelectedData] = useState<Date | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [reagendamentoDialogOpen, setReagendamentoDialogOpen] = useState(false);
  const [clienteEmReagendamento, setClienteEmReagendamento] = useState<number | null>(null);
  const [reagendamentoManualDialogOpen, setReagendamentoManualDialogOpen] = useState(false);
  const [reagendamentoAutoDialogOpen, setReagendamentoAutoDialogOpen] = useState(false);
  const [reagendamentoConfirmDialogOpen, setReagendamentoConfirmDialogOpen] = useState(false);

  // Gerar confirmações pendentes com base nos clientes
  useEffect(() => {
    gerarConfirmacoesPendentes(clientes);
  }, [gerarConfirmacoesPendentes, clientes]);

  // Listas filtradas
  const contatoNecessarioHoje = getContatoNecessarioHoje();
  const contatoAtrasado = getContatoNaoRealizadoAtrasado();
  const contatadoSemResposta = getContatadoSemResposta();
  const reenvioApos24h = getReenvioApos24h();
  const semRespostaApos2Contato = getSemRespostaApos2Contato();

  // Função para abrir WhatsApp
  const abrirWhatsApp = (telefone: string, idConfirmacao: number) => {
    if (!telefone) {
      toast({
        title: "Telefone não cadastrado",
        description: "Este cliente não possui telefone cadastrado para contato.",
        variant: "destructive"
      });
      return;
    }

    // Formatar telefone para padrão internacional
    const numeroFormatado = telefone.replace(/\D/g, '');
    const textoMensagem = "Olá! Estamos confirmando a reposição de produtos para sua loja. Por favor, confirme se podemos prosseguir com a entrega conforme agendado.";
    
    // Registrar contato
    registrarContato(idConfirmacao, "Contato via WhatsApp iniciado");
    
    // Abrir WhatsApp
    window.open(`https://wa.me/55${numeroFormatado}?text=${encodeURIComponent(textoMensagem)}`, '_blank');
    
    toast({
      description: "WhatsApp aberto para contato."
    });
  };

  // Função para iniciar reagendamento
  const iniciarReagendamento = (idConfirmacao: number) => {
    setClienteEmReagendamento(idConfirmacao);
    setReagendamentoDialogOpen(true);
  };

  // Função para abrir diálogo de reagendamento manual
  const abrirReagendamentoManual = () => {
    setReagendamentoDialogOpen(false);
    setSelectedData(null);
    setReagendamentoManualDialogOpen(true);
  };

  // Função para abrir diálogo de reagendamento automático
  const abrirReagendamentoAutomatico = () => {
    setReagendamentoDialogOpen(false);
    
    // Data automática (5 dias úteis)
    const novaData = addBusinessDays(new Date(), 5);
    setSelectedData(novaData);
    
    setReagendamentoAutoDialogOpen(true);
  };

  // Função para confirmar reagendamento
  const confirmarReagendamento = (isAutomatico: boolean) => {
    if (!clienteEmReagendamento || !selectedData) return;
    
    if (isAutomatico) {
      reagendarAutomatico(clienteEmReagendamento);
    } else {
      reagendarManual(clienteEmReagendamento, selectedData);
    }
    
    setReagendamentoManualDialogOpen(false);
    setReagendamentoAutoDialogOpen(false);
    
    toast({
      title: "Reagendamento concluído",
      description: `A reposição foi reagendada para ${format(selectedData, 'dd/MM/yyyy')}.`
    });
    
    setClienteEmReagendamento(null);
    setSelectedData(null);
  };

  // Função para adicionar observações
  const adicionarObservacao = (idConfirmacao: number) => {
    if (!observacoes.trim()) {
      toast({
        title: "Observação vazia",
        description: "Digite uma observação para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    atualizarStatusConfirmacao(idConfirmacao, 'Contatado', observacoes);
    
    toast({
      description: "Observação adicionada com sucesso."
    });
    
    setObservacoes("");
  };

  // Renderiza um card de confirmação
  const renderConfirmacaoCard = (confirmacao: any) => {
    const dataFormatada = format(new Date(confirmacao.dataPrevisaoReposicao), 'dd/MM/yyyy', { locale: ptBR });
    
    return (
      <Card key={confirmacao.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{confirmacao.nomeCliente}</CardTitle>
              <CardDescription>
                Data prevista: {dataFormatada}
              </CardDescription>
            </div>
            <Badge 
              variant={
                confirmacao.statusConfirmacao === 'Pendente' ? 'outline' : 
                confirmacao.statusConfirmacao === 'Contatado' ? 'secondary' :
                confirmacao.statusConfirmacao === 'Respondido' ? 'default' :
                'destructive'
              }
              className="ml-2"
            >
              {confirmacao.statusConfirmacao}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          {confirmacao.observacoes && (
            <div className="text-sm text-muted-foreground mt-2 mb-2 p-2 bg-muted rounded">
              <p>{confirmacao.observacoes}</p>
            </div>
          )}
          
          <div className="flex flex-col space-y-2 mt-3">
            <div className="flex flex-col space-y-2">
              <Textarea 
                placeholder="Adicionar observação..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => adicionarObservacao(confirmacao.id)}
                className="self-end"
              >
                <MessageCircleDashed className="h-4 w-4 mr-1" />
                Adicionar observação
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <Button 
            variant="outline" 
            onClick={() => iniciarReagendamento(confirmacao.id)}
          >
            <CalendarCheck2 className="h-4 w-4 mr-2" />
            Não será reposto
          </Button>
          
          <Button 
            onClick={() => abrirWhatsApp(confirmacao.telefoneContato || '', confirmacao.id)}
            disabled={!confirmacao.telefoneContato}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Phone className="h-4 w-4 mr-2" />
            Abrir WhatsApp
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Check URL params on mount to correctly set up the tab
  useEffect(() => {
    if (searchParams.get('tab') === 'confirmacao') {
      // We're already on the right tab thanks to the URL param
      // This will be handled by the parent component (Agendamento.tsx)
    }
  }, [searchParams]);

  return (
    <TabsContent value="confirmacao">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Confirmação de Reposição</h2>
        <p className="text-muted-foreground">
          Gerencie os PDVs que necessitam de confirmação para a próxima reposição
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contato necessário hoje */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center">
                <Phone className="mr-2 h-4 w-4 text-blue-500" />
                Contato necessário hoje
              </CardTitle>
              <CardDescription>PDVs com reposição nos próximos 2 dias</CardDescription>
            </div>
            <Badge variant="outline">{contatoNecessarioHoje.length}</Badge>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {contatoNecessarioHoje.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Não há contatos necessários para hoje.
              </div>
            ) : (
              contatoNecessarioHoje.map(confirmacao => renderConfirmacaoCard(confirmacao))
            )}
          </CardContent>
        </Card>
        
        {/* Contato não realizado (atrasado) */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                Contato não realizado
              </CardTitle>
              <CardDescription>PDVs com contato atrasado</CardDescription>
            </div>
            <Badge variant="outline">{contatoAtrasado.length}</Badge>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {contatoAtrasado.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Não há contatos atrasados.
              </div>
            ) : (
              contatoAtrasado.map(confirmacao => renderConfirmacaoCard(confirmacao))
            )}
          </CardContent>
        </Card>
        
        {/* Contatado, sem resposta */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center">
                <MessageCircleQuestion className="mr-2 h-4 w-4 text-blue-500" />
                Contatado, sem resposta
              </CardTitle>
              <CardDescription>PDVs contatados que não responderam</CardDescription>
            </div>
            <Badge variant="outline">{contatadoSemResposta.length}</Badge>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {contatadoSemResposta.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Não há PDVs aguardando resposta.
              </div>
            ) : (
              contatadoSemResposta.map(confirmacao => renderConfirmacaoCard(confirmacao))
            )}
          </CardContent>
        </Card>
        
        {/* Reenvio após 24h */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center">
                <Clock className="mr-2 h-4 w-4 text-amber-500" />
                Reenvio após 24h
              </CardTitle>
              <CardDescription>Necessário novo contato após 24h sem resposta</CardDescription>
            </div>
            <Badge variant="outline">{reenvioApos24h.length}</Badge>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {reenvioApos24h.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Não há PDVs para recontato.
              </div>
            ) : (
              reenvioApos24h.map(confirmacao => renderConfirmacaoCard(confirmacao))
            )}
          </CardContent>
        </Card>
        
        {/* Sem resposta após 2º contato */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                Sem resposta após 2º contato
              </CardTitle>
              <CardDescription>PDVs para conferência presencial</CardDescription>
            </div>
            <Badge variant="outline">{semRespostaApos2Contato.length}</Badge>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {semRespostaApos2Contato.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Não há PDVs para conferência presencial.
              </div>
            ) : (
              semRespostaApos2Contato.map(confirmacao => renderConfirmacaoCard(confirmacao))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de opções de reagendamento */}
      <AlertDialog open={reagendamentoDialogOpen} onOpenChange={setReagendamentoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reagendamento de Reposição</AlertDialogTitle>
            <AlertDialogDescription>
              Como deseja reagendar esta reposição?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center gap-4 py-4">
            <Button
              className="flex-1"
              variant="outline"
              onClick={abrirReagendamentoAutomatico}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Automático (5 dias úteis)
            </Button>
            <Button
              className="flex-1"
              onClick={abrirReagendamentoManual}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Manual (selecionar data)
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de reagendamento manual */}
      <AlertDialog open={reagendamentoManualDialogOpen} onOpenChange={setReagendamentoManualDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selecione uma nova data</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha a data para a nova reposição.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedData}
              onSelect={setSelectedData}
              disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
              initialFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedData) {
                  setReagendamentoManualDialogOpen(false);
                  setReagendamentoConfirmDialogOpen(true);
                }
              }}
              disabled={!selectedData}
            >
              Avançar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de reagendamento automático */}
      <AlertDialog open={reagendamentoAutoDialogOpen} onOpenChange={setReagendamentoAutoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reagendamento Automático</AlertDialogTitle>
            <AlertDialogDescription>
              A reposição será reagendada para 5 dias úteis a partir de hoje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 flex justify-center">
            {selectedData && (
              <div className="text-center p-4 border rounded-md">
                <CalendarIcon className="mx-auto h-6 w-6 mb-2 text-primary" />
                <p className="font-medium">Nova data de reposição:</p>
                <p className="text-2xl font-bold">
                  {format(selectedData, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {format(selectedData, "EEEE", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setReagendamentoAutoDialogOpen(false);
                setReagendamentoConfirmDialogOpen(true);
              }}
            >
              Avançar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação final */}
      <AlertDialog open={reagendamentoConfirmDialogOpen} onOpenChange={setReagendamentoConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reagendamento</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedData && (
                <>
                  Deseja reagendar a próxima reposição para{' '}
                  <span className="font-medium">
                    {format(selectedData, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                confirmarReagendamento(reagendamentoAutoDialogOpen);
                setReagendamentoConfirmDialogOpen(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabsContent>
  );
}

export default ConfirmacaoReposicaoTab;
