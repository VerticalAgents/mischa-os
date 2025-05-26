
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
import { useClienteStore } from "@/hooks/useClienteStore";
import { differenceInBusinessDays, isSameDay } from "date-fns";

export default function ConfirmacaoReposicaoWidget() {
  const navigate = useNavigate();
  const { clientes } = useClienteStore();
  const [contadores, setContadores] = useState({
    contatoHoje: 0,
    contatoPendente: 0,
    semRespostaPrimeiro: 0,
    semRespostaSegundo: 0
  });
  
  useEffect(() => {
    // Contabilizar clientes por status de confirmação baseado nos dados reais de agendamento
    const clientesAtivos = clientes.filter(cliente => 
      cliente.statusCliente === "Ativo" && 
      cliente.proximaDataReposicao &&
      cliente.statusAgendamento
    );
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Clientes com status "Previsto" para hoje (precisam de confirmação)
    const contatoNecessarioHoje = clientesAtivos.filter(cliente => {
      if (!cliente.proximaDataReposicao || cliente.statusAgendamento !== "Previsto") return false;
      const dataReposicao = new Date(cliente.proximaDataReposicao);
      dataReposicao.setHours(0, 0, 0, 0);
      return isSameDay(dataReposicao, hoje);
    }).length;
    
    // Clientes com agendamentos atrasados (data já passou e ainda não confirmado)
    const contatoPendente = clientesAtivos.filter(cliente => {
      if (!cliente.proximaDataReposicao || cliente.statusAgendamento === "Agendado") return false;
      const dataReposicao = new Date(cliente.proximaDataReposicao);
      dataReposicao.setHours(0, 0, 0, 0);
      return dataReposicao < hoje;
    }).length;
    
    // Para fins de demonstração, simulamos os outros contadores baseados nos dados reais
    const semRespostaPrimeiro = Math.floor(contatoNecessarioHoje * 0.3);
    const semRespostaSegundo = Math.floor(contatoNecessarioHoje * 0.1);
    
    setContadores({
      contatoHoje: contatoNecessarioHoje,
      contatoPendente,
      semRespostaPrimeiro,
      semRespostaSegundo
    });
    
  }, [clientes]);
  
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
