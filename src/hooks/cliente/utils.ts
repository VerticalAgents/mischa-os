
import { Cliente, DiaSemana, TipoLogisticaNome } from '../../types';
import { clientesMock } from '../../data/mockData';
import { clientesComDados } from './clienteMockData';

// Helper para calcular giro semanal
export function calcularGiroSemanal(qtdPadrao: number, periodicidadeDias: number): number {
  // Para periodicidade em dias, converter para semanas
  if (periodicidadeDias === 3) {
    // Caso especial: 3x por semana
    return qtdPadrao * 3;
  }
  
  // Para outros casos, calcular giro semanal
  const periodicidadeSemanas = periodicidadeDias / 7;
  return Math.round(qtdPadrao / periodicidadeSemanas);
}

// Generate initial clientes data with mock data
export function generateInitialClientes(): Cliente[] {
  return [
    ...clientesMock,
    ...clientesComDados.map((cliente, index) => {
      // Gerar datas aleatórias para próxima reposição (entre hoje e 30 dias à frente)
      const today = new Date();
      const randomDays = Math.floor(Math.random() * 30);
      const proximaDataReposicao = new Date(today);
      proximaDataReposicao.setDate(today.getDate() + randomDays);
      
      // Definir status de agendamento baseado na data de reposição
      const statusAgendamento = randomDays <= 7 
        ? 'Agendado' 
        : (randomDays <= 15 ? 'Pendente' : 'Não Agendado');

      // Converter os dias da semana para o tipo DiaSemana
      const diasSemanaRandom: DiaSemana[] = ['Seg', 'Qua', 'Sex'];

      // Ensure tipoLogistica is a valid TipoLogisticaNome
      const tipoLogistica: TipoLogisticaNome = Math.random() > 0.3 ? 'Própria' : 'Distribuição';

      return {
        id: 1000 + index,
        nome: cliente.nome || `Cliente ${1000 + index}`,
        cnpjCpf: `${Math.floor(Math.random() * 99)}.${Math.floor(Math.random() * 999)}.${Math.floor(Math.random() * 999)}/0001-${Math.floor(Math.random() * 99)}`,
        enderecoEntrega: cliente.enderecoEntrega || `Endereço do cliente ${1000 + index}`,
        contatoNome: `Contato ${1000 + index}`,
        contatoTelefone: `(51) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        contatoEmail: `contato@${cliente.nome?.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
        quantidadePadrao: cliente.quantidadePadrao || 0,
        periodicidadePadrao: cliente.periodicidadePadrao || 7,
        statusCliente: cliente.statusCliente || "Ativo",
        dataCadastro: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        metaGiroSemanal: Math.round((cliente.quantidadePadrao || 0) * 1.2), // Meta inicial: 20% acima do giro atual
        ultimaDataReposicaoEfetiva: new Date(Date.now() - Math.floor(Math.random() * 1000000000)),
        proximaDataReposicao: Math.random() > 0.1 ? proximaDataReposicao : undefined,
        statusAgendamento: Math.random() > 0.1 ? statusAgendamento : undefined,
        // Novos campos
        janelasEntrega: diasSemanaRandom,
        representanteId: Math.ceil(Math.random() * 3),
        rotaEntregaId: Math.ceil(Math.random() * 3),
        categoriaEstabelecimentoId: Math.ceil(Math.random() * 6),
        instrucoesEntrega: Math.random() > 0.7 ? `Instruções de entrega para ${cliente.nome}` : undefined,
        contabilizarGiroMedio: Math.random() > 0.1, // 90% dos clientes contabilizam
        tipoLogistica: tipoLogistica, // Using the properly typed variable
        emiteNotaFiscal: Math.random() > 0.2,
        tipoCobranca: Math.random() > 0.5 ? 'À vista' : 'Consignado',
        formaPagamento: ['Boleto', 'PIX', 'Dinheiro'][Math.floor(Math.random() * 3)] as 'Boleto' | 'PIX' | 'Dinheiro',
        observacoes: Math.random() > 0.8 ? `Observações para ${cliente.nome}` : undefined
      };
    })
  ];
}
