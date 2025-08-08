
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { useConfirmacaoProducao } from '@/hooks/useConfirmacaoProducao';

interface ConfirmacaoProducaoButtonProps {
  registroId: string;
  produtoNome: string;
  formasProducidas: number;
  unidadesPrevistas?: number;
  status: string;
  onConfirmado: () => void;
}

export function ConfirmacaoProducaoButton({
  registroId,
  produtoNome,
  formasProducidas,
  unidadesPrevistas,
  status,
  onConfirmado
}: ConfirmacaoProducaoButtonProps) {
  const { confirmarProducao, loading } = useConfirmacaoProducao();
  const [showDialog, setShowDialog] = useState(false);

  const handleConfirmar = async () => {
    const sucesso = await confirmarProducao(registroId);
    if (sucesso) {
      onConfirmado();
      setShowDialog(false);
    }
  };

  // Só mostrar o botão se o status for "Registrado"
  if (status !== 'Registrado') {
    return null;
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <Button 
          size="sm" 
          className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Confirmar Produção
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirmar Produção
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está prestes a confirmar a produção de:
            </p>
            <div className="bg-muted p-3 rounded-md space-y-1">
              <p><strong>Produto:</strong> {produtoNome}</p>
              <p><strong>Formas:</strong> {formasProducidas}</p>
              <p><strong>Unidades previstas:</strong> {unidadesPrevistas || 0}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta ação irá:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Validar saldo de insumos necessários</li>
              <li>• Criar entrada no estoque de produtos</li>
              <li>• Criar saídas no estoque de insumos</li>
              <li>• Marcar o registro como "Confirmado"</li>
            </ul>
            <p className="text-sm font-medium text-amber-600">
              Esta operação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmar}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Confirmando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
