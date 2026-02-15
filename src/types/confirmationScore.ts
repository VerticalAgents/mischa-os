export interface ConfirmationScore {
  score: number;           // 0-100
  nivel: 'alto' | 'medio' | 'baixo';
  motivo: string;          // texto explicativo para tooltip
  fatores: {
    baseline: number;
    penalidade_volatilidade: number;
    vetor_tendencia: number;
  };
}
