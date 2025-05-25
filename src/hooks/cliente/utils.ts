import { Cliente, DiaSemana, FormaPagamentoNome, StatusCliente, TipoCobranca, TipoLogisticaNome } from '../../types';
import { clientesMock } from '../../data/mockData';

export function generateInitialClientes(): Cliente[] {
  // Dados dos clientes com giro semanal e periodicidade
  const clientesComDados = [
    { nome: "AMPM (João Wallig)", quantidade_padrao: 15, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Dr. João Wallig, 1800 - Passo da Areia, Porto Alegre - RS" },
    { nome: "Arena Sports Poa", quantidade_padrao: 15, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Bento Gonçalves, 567 - Partenon, Porto Alegre - RS" },
    { nome: "Argentum", quantidade_padrao: 50, periodicidade_padrao: 7, status_cliente: "Ativo", endereco_entrega: "R. 24 de Outubro, 111 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "Armazém da Redenção", quantidade_padrao: 20, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. José Bonifácio, 675 - Farroupilha, Porto Alegre - RS" },
    { nome: "Armazém do Sabor", quantidade_padrao: 7, periodicidade_padrao: 14, status_cliente: "A ativar", endereco_entrega: "R. Padre Chagas, 342 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "Bampi", quantidade_padrao: 5, periodicidade_padrao: 21, status_cliente: "Ativo", endereco_entrega: "R. Silva Jardim, 408 - Auxiliadora, Porto Alegre - RS" },
    { nome: "Bendita Esquina", quantidade_padrao: 15, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Osvaldo Aranha, 960 - Bom Fim, Porto Alegre - RS" },
    { nome: "Boteco 787", quantidade_padrao: 15, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Protásio Alves, 787 - Rio Branco, Porto Alegre - RS" },
    { nome: "Bruno - Distribuidor", quantidade_padrao: 120, periodicidade_padrao: 14, status_cliente: "Em análise", endereco_entrega: "Av. Assis Brasil, 3522 - São Sebastião, Porto Alegre - RS" },
    { nome: "Cafeína e Gasolina", quantidade_padrao: 30, periodicidade_padrao: 7, status_cliente: "Ativo", endereco_entrega: "R. Barão do Triunfo, 440 - Azenha, Porto Alegre - RS" },
    { nome: "CASL", quantidade_padrao: 15, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Ipiranga, 6681 - Partenon, Porto Alegre - RS" },
    { nome: "Cavanhas Barão", quantidade_padrao: 8, periodicidade_padrao: 21, status_cliente: "Standby", endereco_entrega: "Av. Barão do Amazonas, 123 - São Geraldo, Porto Alegre - RS" },
    { nome: "CECIV UFRGS", quantidade_padrao: 25, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Paulo Gama, 110 - Farroupilha, Porto Alegre - RS" },
    { nome: "Cestas POA", quantidade_padrao: 20, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "R. Ramiro Barcelos, 1450 - Rio Branco, Porto Alegre - RS" },
    { nome: "Chalet Suisse", quantidade_padrao: 20, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Goethe, 100 - Rio Branco, Porto Alegre - RS" },
    { nome: "Confraria do Café", quantidade_padrao: 15, periodicidade_padrao: 7, status_cliente: "Ativo", endereco_entrega: "Av. Independência, 820 - Independência, Porto Alegre - RS" },
    { nome: "Curtir e Celebrar Cestas", quantidade_padrao: 5, periodicidade_padrao: 21, status_cliente: "Inativo", endereco_entrega: "R. Gonçalo de Carvalho, 330 - Floresta, Porto Alegre - RS" },
    { nome: "DAEAMB", quantidade_padrao: 20, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Bento Gonçalves, 9500 - Agronomia, Porto Alegre - RS" },
    { nome: "DAPROD UFRGS", quantidade_padrao: 30, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Paulo Gama, 110 - Farroupilha, Porto Alegre - RS" },
    { nome: "DCE UFCSPA", quantidade_padrao: 208, periodicidade_padrao: 7, status_cliente: "Ativo", endereco_entrega: "R. Sarmento Leite, 245 - Centro Histórico, Porto Alegre - RS" },
    { nome: "Demarchi", quantidade_padrao: 15, periodicidade_padrao: 21, status_cliente: "A ativar", endereco_entrega: "Av. Cristóvão Colombo, 545 - Floresta, Porto Alegre - RS" },
    { nome: "Divino Verde", quantidade_padrao: 90, periodicidade_padrao: 7, status_cliente: "Ativo", endereco_entrega: "R. Quintino Bocaiúva, 707 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "E.E.E.E.F Jerônimo de Alb.", quantidade_padrao: 10, periodicidade_padrao: 21, status_cliente: "Ativo", endereco_entrega: "R. Jerônimo de Ornelas, 55 - Santana, Porto Alegre - RS" },
    { nome: "Engenho do Pão", quantidade_padrao: 30, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "R. Mariante, 288 - Rio Branco, Porto Alegre - RS" },
    { nome: "Eurostock Investimentos", quantidade_padrao: 30, periodicidade_padrao: 7, status_cliente: "Ativo", endereco_entrega: "Av. Carlos Gomes, 300 - Auxiliadora, Porto Alegre - RS" },
    { nome: "Everest Pub", quantidade_padrao: 10, periodicidade_padrao: 28, status_cliente: "Ativo", endereco_entrega: "R. Olavo Barreto Viana, 18 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "EWF Luta Livre", quantidade_padrao: 12, periodicidade_padrao: 28, status_cliente: "Ativo", endereco_entrega: "R. Mostardeiro, 780 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "Giulia - Distribuidor", quantidade_padrao: 150, periodicidade_padrao: 3, status_cliente: "Ativo", endereco_entrega: "Av. Borges de Medeiros, 2500 - Praia de Belas, Porto Alegre - RS" },
    { nome: "GL Assados", quantidade_padrao: 10, periodicidade_padrao: 28, status_cliente: "Standby", endereco_entrega: "Av. Otto Niemeyer, 2500 - Cavalhada, Porto Alegre - RS" },
    { nome: "Guadalajara Formaturas", quantidade_padrao: 100, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Ipiranga, 5200 - Azenha, Porto Alegre - RS" },
    { nome: "La Mafia (João Wallig)", quantidade_padrao: 10, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Dr. João Wallig, 1800 - Passo da Areia, Porto Alegre - RS" },
    { nome: "La Mafia (Petrópolis)", quantidade_padrao: 7, periodicidade_padrao: 21, status_cliente: "Ativo", endereco_entrega: "R. Lavras, 400 - Petrópolis, Porto Alegre - RS" },
    { nome: "Limas Bar", quantidade_padrao: 10, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "R. Fernandes Vieira, 466 - Bom Fim, Porto Alegre - RS" },
    { nome: "Madri Padaria e Confeitaria", quantidade_padrao: 10, periodicidade_padrao: 21, status_cliente: "Ativo", endereco_entrega: "Av. Cristóvão Colombo, 545 - Floresta, Porto Alegre - RS" },
    { nome: "MedCafé Fleming", quantidade_padrao: 15, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "R. Prof. Annes Dias, 295 - Centro Histórico, Porto Alegre - RS" },
    { nome: "Mercado Pinheiro", quantidade_padrao: 40, periodicidade_padrao: 7, status_cliente: "Ativo", endereco_entrega: "Av. Venâncio Aires, 1060 - Azenha, Porto Alegre - RS" },
    { nome: "Mercado Santiago", quantidade_padrao: 20, periodicidade_padrao: 7, status_cliente: "Ativo", endereco_entrega: "R. Santiago, 725 - São Geraldo, Porto Alegre - RS" },
    { nome: "Moita", quantidade_padrao: 30, periodicidade_padrao: 7, status_cliente: "Ativo", endereco_entrega: "R. Padre Chagas, 314 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "Onii Soluções Autônomas", quantidade_padrao: 15, periodicidade_padrao: 28, status_cliente: "Ativo", endereco_entrega: "Av. Ipiranga, 6681 - Partenon, Porto Alegre - RS" },
    { nome: "Panetteria", quantidade_padrao: 40, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Otto Niemeyer, 2565 - Camaquã, Porto Alegre - RS" },
    { nome: "Pé na Areia 1", quantidade_padrao: 20, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Guaíba, 10435 - Ipanema, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Aeroporto)", quantidade_padrao: 15, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Severo Dullius, 90010 - Anchieta, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Anita)", quantidade_padrao: 18, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Anita Garibaldi, 1300 - Mont'Serrat, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Bela Vista)", quantidade_padrao: 40, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "R. Dr. Timóteo, 602 - Bela Vista, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Bento/Intercap)", quantidade_padrao: 15, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Bento Gonçalves, 8000 - Agronomia, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Brino)", quantidade_padrao: 15, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Otto Niemeyer, 2500 - Cavalhada, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Carlos Gomes)", quantidade_padrao: 20, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Carlos Gomes, 281 - Auxiliadora, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Forte/Via Porto)", quantidade_padrao: 15, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Mauá, 1050 - Centro Histórico, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Moinhos)", quantidade_padrao: 15, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "R. Dinarte Ribeiro, 50 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Painera)", quantidade_padrao: 20, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Protásio Alves, 1090 - Alto Petrópolis, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Planetário)", quantidade_padrao: 10, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Ipiranga, 6000 - Partenon, Porto Alegre - RS" },
    { nome: "REDEVIP24H (Ramiro)", quantidade_padrao: 30, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "R. Ramiro Barcelos, 1954 - Rio Branco, Porto Alegre - RS" },
    { nome: "Refugios Bar e Restaurante", quantidade_padrao: 15, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Protásio Alves, 6999 - Alto Petrópolis, Porto Alegre - RS" },
    { nome: "Silva Lanches", quantidade_padrao: 10, periodicidade_padrao: 21, status_cliente: "Ativo", endereco_entrega: "R. 24 de Outubro, 1222 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "Sirene Fish n Chips", quantidade_padrao: 15, periodicidade_padrao: 10, status_cliente: "Ativo", endereco_entrega: "Av. Dr. Nilo Peçanha, 1851 - Três Figueiras, Porto Alegre - RS" },
    { nome: "Temperandus", quantidade_padrao: 10, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "R. Padre Chagas, 400 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "The Brothers Distribuidora", quantidade_padrao: 0, periodicidade_padrao: 7, status_cliente: "Em análise", endereco_entrega: "R. Padre Chagas, 342 - Moinhos de Vento, Porto Alegre - RS" },
    { nome: "Xirú Beer", quantidade_padrao: 8, periodicidade_padrao: 14, status_cliente: "Ativo", endereco_entrega: "Av. Dr. Nilo Peçanha, 2000 - Boa Vista, Porto Alegre - RS" }
  ];

  // Convert the clientesComDados to proper Cliente objects
  const convertedClientes: Cliente[] = clientesComDados.map((cliente, index) => {
    // Gerar datas aleatórias para próxima reposição (entre hoje e 30 dias à frente)
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const proximaDataReposicao = new Date(today);
    proximaDataReposicao.setDate(today.getDate() + randomDays);
    
    // Definir status de agendamento baseado na data de reposição
    const statusAgendamento = randomDays <= 7 
      ? 'Agendado' 
      : (randomDays <= 15 ? 'Pendente' : 'Não Agendado');
      
    // Ensure proper typing for DiaSemana[]
    const janelasEntrega: DiaSemana[] = ['Seg', 'Qua', 'Sex'];
    
    // Ensure proper typing for TipoLogisticaNome
    const tipoLogistica: TipoLogisticaNome = Math.random() > 0.3 ? 'Própria' : 'Distribuição';
    
    // Ensure proper typing for TipoCobranca
    const tipoCobranca: TipoCobranca = Math.random() > 0.5 ? 'À vista' : 'Consignado';
    
    // Ensure proper typing for FormaPagamentoNome
    const formaPagamento: FormaPagamentoNome = 
      ['Boleto', 'PIX', 'Dinheiro'][Math.floor(Math.random() * 3)] as FormaPagamentoNome;

    return {
      id: `${1000 + index}`, // Convert to string
      nome: cliente.nome || `Cliente ${1000 + index}`,
      cnpj_cpf: `${Math.floor(Math.random() * 99)}.${Math.floor(Math.random() * 999)}.${Math.floor(Math.random() * 999)}/0001-${Math.floor(Math.random() * 99)}`,
      endereco_entrega: cliente.endereco_entrega || `Endereço do cliente ${1000 + index}`,
      contato_nome: `Contato ${1000 + index}`,
      contato_telefone: `(51) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      contato_email: `contato@${cliente.nome?.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
      quantidade_padrao: cliente.quantidade_padrao || 0,
      periodicidade_padrao: cliente.periodicidade_padrao || 7,
      status_cliente: cliente.status_cliente as StatusCliente || "Ativo",
      created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      meta_giro_semanal: Math.round((cliente.quantidade_padrao || 0) * 1.2), // Meta inicial: 20% acima do giro atual
      ultima_data_reposicao_efetiva: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0],
      proxima_data_reposicao: Math.random() > 0.1 ? proximaDataReposicao.toISOString().split('T')[0] : undefined,
      status_agendamento: Math.random() > 0.1 ? statusAgendamento : undefined,
      // Using properly typed values
      janelas_entrega: janelasEntrega,
      representante_id: Math.ceil(Math.random() * 3),
      rota_entrega_id: Math.ceil(Math.random() * 3),
      categoria_estabelecimento_id: Math.ceil(Math.random() * 6),
      instrucoes_entrega: Math.random() > 0.7 ? `Instruções de entrega para ${cliente.nome}` : undefined,
      contabilizar_giro_medio: Math.random() > 0.1, // 90% dos clientes contabilizam
      tipo_logistica: tipoLogistica,
      emite_nota_fiscal: Math.random() > 0.2,
      tipo_cobranca: tipoCobranca,
      forma_pagamento: formaPagamento,
      observacoes: Math.random() > 0.8 ? `Observações para ${cliente.nome}` : undefined,
      ativo: cliente.status_cliente === 'Ativo',
      giro_medio_semanal: calcularGiroSemanal(cliente.quantidade_padrao || 0, cliente.periodicidade_padrao || 7)
    };
  });

  return [...clientesMock, ...convertedClientes];
}

// Helper para calcular giro semanal
function calcularGiroSemanal(qtdPadrao: number, periodicidadeDias: number): number {
  // Para periodicidade em dias, converter para semanas
  if (periodicidadeDias === 3) {
    // Caso especial: 3x por semana
    return qtdPadrao * 3;
  }
  
  // Para outros casos, calcular giro semanal
  const periodicidadeSemanas = periodicidadeDias / 7;
  return Math.round(qtdPadrao / periodicidadeSemanas);
}
