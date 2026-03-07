

# Mapa de Modulos SaaS com Agentes IA Cross-Module

## Conceito Atualizado

Os Agentes de IA (Mischa IA) nao pertencem a nenhum tier especifico -- sao **cross-module**, disponiveis em todos os planos, mas com capacidades que escalam conforme o tier do cliente. Isso cria um mecanismo natural de upsell: o agente mostra insights do tier superior que o cliente ainda nao tem acesso, gerando curiosidade e demonstrando valor.

```text
┌─────────────────────────────────────────────────────────────┐
│                    MISCHA IA (Cross-Module)                  │
│  Disponivel em todos os tiers, capacidades escalam          │
│  Tier 1: responde sobre clientes, agendamentos, entregas   │
│  Tier 2: + estoque, producao, trocas, compras              │
│  Tier 3: + financeiro, analytics, comercial, mapas          │
│  Upsell: mostra previews de insights do tier superior       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ESSENCIAL (Tier 1)         OPERACOES (Tier 2)              │
│  ┌──────────┐               ┌────────┐                     │
│  │ Clientes │──────────────→│Estoque │                     │
│  │ Produtos │──────────────→│  PCP   │                     │
│  │Agendamento│─────────────→│Trocas  │                     │
│  │ Expedicao │─────────────→│Reagend.│                     │
│  └──────────┘               └────────┘                     │
│       │                         │                           │
│       └────────────┬────────────┘                           │
│                    ▼                                        │
│          GESTAO & INTELIGENCIA (Tier 3)                     │
│          ┌────────────┐ ┌──────────────┐                   │
│          │Precificacao│ │  Financeiro  │                   │
│          │   Mapas    │ │  Dashboard   │                   │
│          │Gestao Com. │ │ Insights PDV │                   │
│          └────────────┘ └──────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Estrategia de Upsell via IA

O agente em Tier 1 pode dizer coisas como:
- "Voce tem 3 clientes com queda de giro. Com o modulo de **Insights PDV** voce teria alertas automaticos."
- "Baseado nas suas entregas, estimo que seu custo por entrega e X. O modulo **Financeiro** te daria essa visao completa."

## O que sera construido

### 1. `src/pages/Modulos.tsx` - Pagina de Mapa de Modulos

Pagina visual com:
- **3 cards de tier** lado a lado (Essencial, Operacoes, Gestao) com cores distintas (emerald, blue, purple)
- **Card especial da Mischa IA** no topo, com visual diferenciado mostrando que e cross-module
- Cada card de tier lista seus modulos com icone e descricao curta
- **Setas/conexoes** entre modulos mostrando dependencias (SVG simples ou indicadores visuais)
- **Matriz de dependencias** em tabela expandivel mostrando qual modulo depende de qual
- Secao de **estrategia de upsell** mostrando como a IA conecta os tiers

### 2. `src/components/layout/navigation-items.tsx`

Adicionar "Mapa de Módulos" ao grupo Administracao com icone `Blocks`.

### 3. `src/App.tsx`

Adicionar rota `/modulos` com lazy loading, ProtectedRoute e AppLayout.

### Dados da Matriz de Dependencias

| Modulo | Tier | Depende de |
|---|---|---|
| Clientes | 1 | - |
| Produtos (Config) | 1 | - |
| Agendamento | 1 | Clientes, Produtos |
| Expedicao | 1 | Agendamento |
| Estoque | 2 | Produtos |
| PCP | 2 | Agendamento, Estoque |
| Controle de Trocas | 2 | Expedicao, Clientes |
| Reagendamentos | 2 | Agendamento |
| Precificacao | 3 | Produtos, Estoque |
| Financeiro | 3 | Expedicao, Clientes |
| Dashboard & Analytics | 3 | Todos |
| Insights PDV | 3 | Expedicao, Clientes |
| Mapas | 3 | Clientes |
| Gestao Comercial | 3 | Clientes |
| **Mischa IA** | **Cross** | **Escala com tier ativo** |

### Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/Modulos.tsx` | Criar |
| `src/App.tsx` | Adicionar rota |
| `src/components/layout/navigation-items.tsx` | Adicionar item menu |

