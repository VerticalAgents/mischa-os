
import { 
  Representante, 
  RotaEntrega, 
  CategoriaEstabelecimento, 
  TipoLogistica, 
  FormaPagamento,
  ConfiguracoesProducao
} from '@/types';

// Mock data for representantes
export const representantesMock: Representante[] = [
  { id: 1, nome: 'João Silva', email: 'joao@exemplo.com', telefone: '(51) 99999-1111', ativo: true },
  { id: 2, nome: 'Maria Oliveira', email: 'maria@exemplo.com', telefone: '(51) 99999-2222', ativo: true },
  { id: 3, nome: 'Pedro Santos', email: 'pedro@exemplo.com', telefone: '(51) 99999-3333', ativo: true },
  { id: 4, nome: 'Ana Costa', email: 'ana@exemplo.com', telefone: '(51) 99999-4444', ativo: false },
];

// Mock data for rotas de entrega
export const rotasEntregaMock: RotaEntrega[] = [
  { id: 1, nome: 'Zona Norte', descricao: 'Região norte da cidade', ativo: true },
  { id: 2, nome: 'Zona Sul', descricao: 'Região sul da cidade', ativo: true },
  { id: 3, nome: 'Centro', descricao: 'Região central', ativo: true },
  { id: 4, nome: 'Zona Leste', descricao: 'Região leste da cidade', ativo: false },
];

// Mock data for categorias de estabelecimento
export const categoriasEstabelecimentoMock: CategoriaEstabelecimento[] = [
  { id: 1, nome: 'Cafeteria', descricao: 'Estabelecimentos focados em café', ativo: true },
  { id: 2, nome: 'Empório', descricao: 'Empórios e lojas de produtos naturais', ativo: true },
  { id: 3, nome: 'Restaurante', descricao: 'Restaurantes em geral', ativo: true },
  { id: 4, nome: 'Bar', descricao: 'Bares e pubs', ativo: true },
  { id: 5, nome: 'Hotel', descricao: 'Hotéis e pousadas', ativo: true },
  { id: 6, nome: 'Padaria', descricao: 'Padarias e confeitarias', ativo: true },
];

// Mock data for tipos de logística
export const tiposLogisticaMock: TipoLogistica[] = [
  { id: 1, nome: 'Própria', percentualLogistico: 8.5, ativo: true },
  { id: 2, nome: 'Distribuição', percentualLogistico: 12.0, ativo: true },
  { id: 3, nome: 'Terceirizada', percentualLogistico: 15.0, ativo: true },
  { id: 4, nome: 'Retirada pelo cliente', percentualLogistico: 0, ativo: true },
];

// Mock data for formas de pagamento
export const formasPagamentoMock: FormaPagamento[] = [
  { id: 1, nome: 'Dinheiro', ativo: true },
  { id: 2, nome: 'Cartão de Crédito', ativo: true },
  { id: 3, nome: 'Cartão de Débito', ativo: true },
  { id: 4, nome: 'PIX', ativo: true },
  { id: 5, nome: 'Boleto Bancário', ativo: true },
  { id: 6, nome: 'Transferência', ativo: true },
];

// Mock data for configurações de produção
export const configuracoesProducaoMock: ConfiguracoesProducao = {
  unidadesPorForma: 24,
  formasPorLote: 4,
  incluirPedidosPrevistos: true,
  percentualPedidosPrevistos: 15,
  tempoMedioPorFornada: 45,
  unidadesBrowniePorForma: 16,
  formasPorFornada: 2
};
