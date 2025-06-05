
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, AlertTriangle, AlertCircle, ArrowRight } from "lucide-react";
import { useConfirmacaoReposicaoStore } from "@/hooks/useConfirmacaoReposicaoStore";

export default function ConfirmacaoReposicaoWidget() {
  const navigate = useNavigate();
  const { clientesParaConfirmacao, carregarClientesParaConfirmacao } = useConfirmacaoReposicaoStore();
  const [contadores, setContadores] = useState({
    contatoHoje: 0,
    contatoPendente: 0,
    semRespostaPrimeiro: 0,
    semRespostaSegundo: 0
  });
  
  useEffect(() => {
    carregarClientesParaConfirmacao();
  }, [carregarClientesParaConfirmacao]);
  
  useEffect(() => {
    // Calcular contadores baseados nos dados reais
    const contatoHoje = clientesParaConfirmacao.filter(cliente => 
      cliente.status_contato === 'aguardando_retorno'
    ).length;
    
    const contatoPendente = clientesParaConfirmacao.filter(cliente => 
      cliente.status_contato === 'reenviado'
    ).length;
    
    const semRespostaPrimeiro = clientesParaConfirmacao.filter(cliente => 
      cliente.pode_reenviar && cliente.status_contato === 'aguardando_retorno'
    ).length;
    
    const semRespostaSegundo = clientesParaConfirmacao.filter(cliente => 
      cliente.em_atraso || cliente.status_contato === 'nao_respondeu'
    ).length;
    
    setContadores({
      contatoHoje,
      contatoPendente,
      semRespostaPrimeiro,
      semRespostaSegundo
    });
    
  }, [clientesParaConfirmacao]);
  
  const navigateToConfirmacao = () => {
    navigate("/agendamento?tab=confirmacao");
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Status de Confirmação de Reposições</CardTitle>
        <CardDescription>Acompanhamento de contatos com PDVs</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="flex flex-col border rounded-lg p-3 space-y-2 bg-green-50 border-green-200 cursor-pointer hover:bg-green-100"
            onClick={navigateToConfirmacao}
          >
            <div className="flex items-center justify-between">
              <div className="bg-green-100 p-2 rounded-full">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Hoje</span>
            </div>
            <span className="text-2xl font-bold">{contadores.contatoHoje}</span>
            <span className="text-sm text-muted-foreground">PDVs a contatar hoje</span>
          </div>
          
          <div 
            className="flex flex-col border rounded-lg p-3 space-y-2 bg-amber-50 border-amber-200 cursor-pointer hover:bg-amber-100"
            onClick={navigateToConfirmacao}
          >
            <div className="flex items-center justify-between">
              <div className="bg-amber-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Pendente</span>
            </div>
            <span className="text-2xl font-bold">{contadores.contatoPendente}</span>
            <span className="text-sm text-muted-foreground">PDVs com contato pendente</span>
          </div>
          
          <div 
            className="flex flex-col border rounded-lg p-3 space-y-2 bg-amber-50 border-amber-200 cursor-pointer hover:bg-amber-100"
            onClick={navigateToConfirmacao}
          >
            <div className="flex items-center justify-between">
              <div className="bg-amber-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Aguardando</span>
            </div>
            <span className="text-2xl font-bold">{contadores.semRespostaPrimeiro}</span>
            <span className="text-sm text-muted-foreground">Sem resposta após 1º contato</span>
          </div>
          
          <div 
            className="flex flex-col border rounded-lg p-3 space-y-2 bg-red-50 border-red-200 cursor-pointer hover:bg-red-100"
            onClick={navigateToConfirmacao}
          >
            <div className="flex items-center justify-between">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Crítico</span>
            </div>
            <span className="text-2xl font-bold">{contadores.semRespostaSegundo}</span>
            <span className="text-sm text-muted-foreground">Sem resposta após 2º contato</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={navigateToConfirmacao}
        >
          <span>Ir para Confirmação de Reposição</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
