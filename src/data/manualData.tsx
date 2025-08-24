
import { ManualSection } from '@/types/manual';
import { 
  Settings, 
  Package, 
  Users, 
  Calendar, 
  BarChart3,
  Rocket,
  ShoppingBag,
  Truck,
  CheckCircle,
  DollarSign
} from 'lucide-react';

export const manualSections: ManualSection[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros Passos',
    description: 'Configure o sistema pela primeira vez e conheça a interface',
    icon: <Rocket className="h-6 w-6" />,
    estimatedTime: '15 min',
    difficulty: 'iniciante',
    color: 'bg-blue-500',
    steps: [
      {
        id: 'acesso-inicial',
        title: 'Primeiro Acesso ao Sistema',
        description: 'Faça seu primeiro login e conheça a tela inicial do MischaOS',
        actionUrl: '/home',
        tips: [
          'Use as credenciais fornecidas pelo administrador',
          'A tela inicial mostra um resumo de todas as funcionalidades'
        ]
      },
      {
        id: 'configuracao-empresa',
        title: 'Configurar Dados da Empresa',
        description: 'Defina as informações básicas da sua confeitaria',
        actionUrl: '/configuracoes?tab=empresa',
        tips: [
          'Preencha todos os campos obrigatórios',
          'Os dados da empresa aparecerão em relatórios e documentos'
        ]
      },
      {
        id: 'configuracao-usuario',
        title: 'Configurar Perfil do Usuário',
        description: 'Ajuste suas preferências pessoais e foto de perfil',
        actionUrl: '/configuracoes?tab=usuario',
        tips: [
          'Defina uma senha forte',
          'A foto de perfil aparece no cabeçalho do sistema'
        ]
      },
      {
        id: 'parametros-basicos',
        title: 'Definir Parâmetros Básicos',
        description: 'Configure os parâmetros gerais do sistema',
        actionUrl: '/configuracoes?tab=sistema',
        tips: [
          'Defina o fuso horário correto',
          'Configure as unidades de medida padrão'
        ]
      },
      {
        id: 'tour-interface',
        title: 'Tour pela Interface',
        description: 'Conheça os principais menus e funcionalidades',
        tips: [
          'Use a barra lateral para navegar entre as seções',
          'O dashboard inicial mostra métricas importantes',
          'Cada seção tem sua própria cor para facilitar identificação'
        ]
      }
    ]
  },
  {
    id: 'produtos-precificacao',
    title: 'Produtos e Precificação',
    description: 'Configure seu catálogo de produtos e defina preços',
    icon: <Package className="h-6 w-6" />,
    estimatedTime: '30 min',
    difficulty: 'intermediario',
    color: 'bg-purple-500',
    steps: [
      {
        id: 'cadastro-insumos',
        title: 'Cadastrar Insumos',
        description: 'Registre todos os ingredientes e materiais que você usa',
        actionUrl: '/precificacao?tab=insumos',
        tips: [
          'Inclua o custo por unidade de cada insumo',
          'Mantenha os preços sempre atualizados',
          'Use unidades de medida consistentes'
        ]
      },
      {
        id: 'criar-receitas',
        title: 'Criar Receitas',
        description: 'Defina as receitas dos seus produtos com ingredientes e quantidades',
        actionUrl: '/precificacao?tab=receitas',
        tips: [
          'Seja preciso nas quantidades',
          'Inclua todos os insumos, inclusive embalagens',
          'Teste o rendimento real das receitas'
        ]
      },
      {
        id: 'cadastro-produtos',
        title: 'Cadastrar Produtos',
        description: 'Crie seu catálogo de produtos finais',
        actionUrl: '/precificacao?tab=produtos',
        tips: [
          'Vincule cada produto à sua receita',
          'Defina categorias para organizar melhor',
          'Configure sabores e variações quando necessário'
        ]
      },
      {
        id: 'definir-precos',
        title: 'Definir Preços e Margens',
        description: 'Estabeleça os preços de venda com base nos custos',
        actionUrl: '/precificacao',
        tips: [
          'Considere todos os custos: insumos, mão de obra, overhead',
          'Defina margens diferentes para cada tipo de cliente',
          'Revise os preços periodicamente'
        ]
      },
      {
        id: 'proporcoes-padrao',
        title: 'Configurar Proporções Padrão',
        description: 'Defina a distribuição padrão de produtos nos pedidos',
        actionUrl: '/configuracoes?tab=proporcoes',
        tips: [
          'Base-se no histórico de vendas',
          'Ajuste conforme a sazonalidade',
          'Mantenha sempre 100% na soma das proporções'
        ]
      }
    ]
  },
  {
    id: 'gestao-clientes',
    title: 'Gestão de Clientes',
    description: 'Cadastre clientes e configure parâmetros comerciais',
    icon: <Users className="h-6 w-6" />,
    estimatedTime: '25 min',
    difficulty: 'intermediario',
    color: 'bg-green-500',
    steps: [
      {
        id: 'primeiro-cliente',
        title: 'Cadastrar Primeiro Cliente',
        description: 'Registre seu primeiro ponto de venda',
        actionUrl: '/clientes',
        tips: [
          'Preencha todos os dados de contato',
          'Defina a categoria do estabelecimento',
          'Configure os dias de entrega'
        ]
      },
      {
        id: 'rotas-entrega',
        title: 'Configurar Rotas de Entrega',
        description: 'Organize suas rotas de distribuição',
        actionUrl: '/configuracoes?tab=clientes',
        tips: [
          'Agrupe clientes por proximidade geográfica',
          'Considere o trânsito e horários de funcionamento',
          'Otimize as rotas para reduzir custos'
        ]
      },
      {
        id: 'representantes',
        title: 'Cadastrar Representantes',
        description: 'Registre os vendedores ou representantes',
        actionUrl: '/configuracoes?tab=clientes',
        tips: [
          'Associe cada cliente ao seu representante',
          'Defina comissões quando aplicável',
          'Mantenha contatos atualizados'
        ]
      },
      {
        id: 'formas-pagamento',
        title: 'Configurar Formas de Pagamento',
        description: 'Defina as modalidades de pagamento aceitas',
        actionUrl: '/configuracoes?tab=financeiro',
        tips: [
          'Configure diferentes prazos por forma de pagamento',
          'Considere descontos para pagamento à vista',
          'Monitore inadimplência por modalidade'
        ]
      },
      {
        id: 'categorias-estabelecimento',
        title: 'Definir Categorias de Estabelecimento',
        description: 'Classifique seus clientes por tipo de negócio',
        actionUrl: '/configuracoes?tab=clientes',
        tips: [
          'Use categorias que façam sentido para seu negócio',
          'Permita preços diferenciados por categoria',
          'Analise performance por categoria'
        ]
      }
    ]
  },
  {
    id: 'operacao-diaria',
    title: 'Operação Diária',
    description: 'Aprenda o fluxo completo do pedido à entrega',
    icon: <Calendar className="h-6 w-6" />,
    estimatedTime: '40 min',
    difficulty: 'intermediario',
    color: 'bg-orange-500',
    steps: [
      {
        id: 'primeiro-agendamento',
        title: 'Criar Primeiro Agendamento',
        description: 'Faça seu primeiro pedido no sistema',
        actionUrl: '/agendamento',
        tips: [
          'Use as proporções padrão como base',
          'Ajuste quantidades conforme necessário',
          'Defina a data de entrega corretamente'
        ]
      },
      {
        id: 'confirmacao-reposicao',
        title: 'Processo de Confirmação de Reposição',
        description: 'Entenda como confirmar pedidos recorrentes',
        actionUrl: '/agendamento?tab=confirmacao',
        tips: [
          'Confirme pedidos dentro do prazo estabelecido',
          'Ajuste quantidades baseado no giro real',
          'Comunique alterações ao cliente'
        ]
      },
      {
        id: 'planejamento-producao',
        title: 'Planejamento de Produção (PCP)',
        description: 'Organize a produção baseada nos pedidos',
        actionUrl: '/pcp',
        tips: [
          'Revise o planejamento diariamente',
          'Considere capacidade de produção',
          'Antecipe necessidades de insumos'
        ]
      },
      {
        id: 'separacao-pedidos',
        title: 'Separação de Pedidos',
        description: 'Organize os produtos para expedição',
        actionUrl: '/expedicao',
        tips: [
          'Separe por rota de entrega',
          'Confira quantidades e qualidade',
          'Embale adequadamente para transporte'
        ]
      },
      {
        id: 'expedicao-entregas',
        title: 'Expedição e Controle de Entregas',
        description: 'Gerencie o processo de entrega aos clientes',
        actionUrl: '/expedicao?tab=despacho',
        tips: [
          'Registre horários de saída e chegada',
          'Confirme entregas com assinatura/foto',
          'Monitore devoluções e avarias'
        ]
      }
    ]
  },
  {
    id: 'analytics-avancado',
    title: 'Analytics e Gestão Avançada',
    description: 'Use dados para otimizar seu negócio',
    icon: <BarChart3 className="h-6 w-6" />,
    estimatedTime: '35 min',
    difficulty: 'avancado',
    color: 'bg-indigo-500',
    steps: [
      {
        id: 'interpretacao-dashboard',
        title: 'Interpretar o Dashboard',
        description: 'Entenda as métricas e indicadores principais',
        actionUrl: '/dashboard-analytics',
        tips: [
          'Monitore indicadores diariamente',
          'Compare performance entre períodos',
          'Identifique tendências e padrões'
        ]
      },
      {
        id: 'analise-giro-clientes',
        title: 'Análise de Giro de Clientes',
        description: 'Otimize a frequência e quantidade de entregas',
        actionUrl: '/analise-giro',
        tips: [
          'Ajuste giros baseado no histórico real',
          'Considere sazonalidade e eventos',
          'Negocie mudanças com os clientes'
        ]
      },
      {
        id: 'projecoes-financeiras',
        title: 'Projeções Financeiras',
        description: 'Faça projeções de faturamento e custos',
        actionUrl: '/gestao-financeira',
        tips: [
          'Use cenários conservadores e otimistas',
          'Monitore desvios entre projetado e real',
          'Ajuste projeções mensalmente'
        ]
      },
      {
        id: 'agentes-ia',
        title: 'Uso dos Agentes de IA',
        description: 'Aproveite a inteligência artificial para insights',
        actionUrl: '/agentes-ia',
        tips: [
          'Faça perguntas específicas e claras',
          'Use IA para análises complexas',
          'Valide sugestões com sua experiência'
        ]
      },
      {
        id: 'relatorios-exportacoes',
        title: 'Relatórios e Exportações',
        description: 'Gere relatórios customizados para análise',
        tips: [
          'Exporte dados para análises externas',
          'Configure relatórios automáticos',
          'Mantenha backup dos dados importantes'
        ]
      }
    ]
  }
];
