
export interface HistoricoProducao {
  id: number;
  dataProducao: Date;
  produtoId: string;
  produtoNome: string;
  formasProducidas: number;
  unidadesCalculadas: number;
  observacoes?: string;
  origem: 'Manual' | 'Automatico';
  
  // Novos campos para snapshot e controle
  rendimentoUsado?: number;
  unidadesPrevistas?: number;
  status?: 'Registrado' | 'Confirmado';
  confirmadoEm?: Date;
}

export interface RegistroProducaoForm {
  produtoId: string;
  formasProducidas: number;
  dataProducao: Date;
  observacoes?: string;
}
