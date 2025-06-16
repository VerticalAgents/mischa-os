
export interface AuditoriaItem {
  clienteNome: string;
  statusAgendamento: string;
  dataReposicao: Date;
  statusCliente: string;
  quantidadesPorProduto: Record<string, number>;
}

export interface ProdutoComCategoria {
  nome: string;
  categoria: string;
  categoriaId: number;
}
