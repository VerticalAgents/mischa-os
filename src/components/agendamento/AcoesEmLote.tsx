
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, MessageSquare } from "lucide-react";
import { Cliente } from "@/types";
import { toast } from "@/hooks/use-toast";

interface AcoesEmLoteProps {
  clientes: Cliente[];
  tipoAcao: "marcar-contatados" | "segundo-contato";
  onAcaoExecutada: (clientesAfetados: Cliente[], novoStatus: string) => void;
}

export default function AcoesEmLote({ 
  clientes, 
  tipoAcao, 
  onAcaoExecutada 
}: AcoesEmLoteProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getAcaoTexto = () => {
    switch (tipoAcao) {
      case "marcar-contatados":
        return {
          botao: "Marcar todos como contatados",
          titulo: "Marcar todos como contatados",
          descricao: `Deseja realmente marcar todos os ${clientes.length} PDVs desta seção como "Contatado, sem resposta"?`,
          novoStatus: "Contatado, sem resposta"
        };
      case "segundo-contato":
        return {
          botao: "Enviar 2º contato para todos",
          titulo: "Enviar segundo contato",
          descricao: `Deseja realmente marcar todos os ${clientes.length} PDVs desta seção para "Reenviar após 24h"?`,
          novoStatus: "Reenviar após 24h"
        };
      default:
        return {
          botao: "Ação em lote",
          titulo: "Ação em lote",
          descricao: "Confirmar ação em lote?",
          novoStatus: ""
        };
    }
  };

  const handleConfirmar = () => {
    const { novoStatus } = getAcaoTexto();
    
    onAcaoExecutada(clientes, novoStatus);
    
    toast({
      title: "Ação executada",
      description: `${clientes.length} PDVs foram atualizados para "${novoStatus}"`,
    });
    
    setIsOpen(false);
  };

  const acaoTexto = getAcaoTexto();

  if (clientes.length === 0) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
        >
          {tipoAcao === "marcar-contatados" ? (
            <MessageSquare className="h-4 w-4" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          <span>{acaoTexto.botao}</span>
          <span className="text-xs bg-muted text-muted-foreground px-1 rounded">
            {clientes.length}
          </span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{acaoTexto.titulo}</AlertDialogTitle>
          <AlertDialogDescription>
            {acaoTexto.descricao}
            <br /><br />
            <strong>PDVs afetados:</strong>
            <div className="mt-2 max-h-32 overflow-y-auto bg-muted p-2 rounded text-sm">
              {clientes.map((cliente, index) => (
                <div key={cliente.id} className="text-foreground">
                  {index + 1}. {cliente.nome}
                </div>
              ))}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmar}>
            Confirmar ação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
