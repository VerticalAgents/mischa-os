import { BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import CartaoAcao from '@/components/common/CartaoAcao';
import { useManualProgress } from '@/hooks/useManualProgress';

interface ManualCardProps {
  onClick: () => void;
}

/**
 * O Manual usa o MESMO cartão dos outros atalhos. Antes tinha estrutura propria
 * — icone de 56px, titulo maior, respiros diferentes — e ficava visivelmente
 * fora de esquadro ao lado de "Agentes de IA" e "Configuracoes" na mesma grade.
 * O que ele tem de particular (a barra de progresso) entra pelo `extra`.
 */
export default function ManualCard({ onClick }: ManualCardProps) {
  const { progress } = useManualProgress();
  const temProgresso = progress.totalProgress > 0;

  return (
    <CartaoAcao
      titulo="Manual de Instruções"
      descricao="Guia completo para usar o MischaOS"
      Icone={BookOpen}
      aoClicar={onClick}
      rotuloAcao="Começar aprendizado"
      distintivo={temProgresso ? `${progress.totalProgress}% concluído` : undefined}
      extra={
        temProgresso ? (
          <div className="mb-3 text-left">
            <Progress value={progress.totalProgress} className="h-1.5" />
            <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
              {progress.completedSteps.length} passos concluídos
            </p>
          </div>
        ) : undefined
      }
    />
  );
}
