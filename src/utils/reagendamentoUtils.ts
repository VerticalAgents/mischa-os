import { startOfWeek, differenceInWeeks, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

/**
 * Registra um reagendamento entre semanas na tabela dedicada.
 * Só registra se a data original e a nova estiverem em semanas diferentes.
 */
export async function registrarReagendamentoEntreSemanas(
  clienteId: string,
  dataOriginal: Date,
  dataNova: Date
): Promise<void> {
  const semanaOriginal = startOfWeek(dataOriginal, { weekStartsOn: 1 });
  const semanaNova = startOfWeek(dataNova, { weekStartsOn: 1 });

  // Mesma semana = não registrar
  if (semanaOriginal.getTime() === semanaNova.getTime()) {
    return;
  }

  const semanasAdiadas = Math.abs(differenceInWeeks(dataNova, dataOriginal));

  if (semanasAdiadas === 0) return;

  const { error } = await supabase
    .from('reagendamentos_entre_semanas' as any)
    .insert({
      cliente_id: clienteId,
      data_original: format(dataOriginal, 'yyyy-MM-dd'),
      data_nova: format(dataNova, 'yyyy-MM-dd'),
      semana_original: format(semanaOriginal, 'yyyy-MM-dd'),
      semana_nova: format(semanaNova, 'yyyy-MM-dd'),
      semanas_adiadas: semanasAdiadas,
    });

  if (error) {
    console.error('❌ Erro ao registrar reagendamento entre semanas:', error);
  } else {
    console.log('📊 Reagendamento entre semanas registrado:', {
      clienteId,
      de: format(dataOriginal, 'dd/MM/yyyy'),
      para: format(dataNova, 'dd/MM/yyyy'),
      semanasAdiadas,
    });
  }
}
