
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useConfirmacaoProducao } from '@/hooks/useConfirmacaoProducao';

interface ConfirmacaoProducaoButtonProps {
  registroId: string;
  status: string;
  onConfirmado: () => void;
}

// Um clique e pronto. A janela de "tem certeza" e a de "saldo insuficiente de insumos"
// sairam em 12/10/2026: eram dois cliques a mais por linha, e o estoque de insumos do
// Mischa OS nao e mantido (a funcao do banco repoe o que falta).
export function ConfirmacaoProducaoButton({
  registroId,
  status,
  onConfirmado
}: ConfirmacaoProducaoButtonProps) {
  const { confirmarProducao, loading } = useConfirmacaoProducao();

  // Só mostrar o botão se o status for "Registrado"
  if (status !== 'Registrado') {
    return null;
  }

  const handleConfirmar = async () => {
    const resultado = await confirmarProducao(registroId);
    if (resultado.ok) onConfirmado();
  };

  return (
    <Button
      size="sm"
      className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
      disabled={loading}
      onClick={handleConfirmar}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      Confirmar
    </Button>
  );
}
