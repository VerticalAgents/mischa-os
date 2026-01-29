

# Plano: Aprimorar Cards Superiores das Abas de Despacho

## Objetivo
Atualizar o design dos cards superiores das abas "Entregas Hoje", "Entregas Pendentes" e "Separação Antecipada" para seguir o mesmo padrão de layout da aba "Separação de Pedidos".

## Situação Atual

### Separação de Pedidos (Referência)
```
+--------------------------------+--------------------------------+
| Card: Produtos Necessários     | Card: Ações                    |
| - Total grande em destaque     | - Botões empilhados:           |
| - Badge com qtd pedidos        |   Separar em Massa             |
| - Collapsible com detalhes     |   Gerar Vendas                 |
| - Indicadores de estoque       |   Listas de Expedição          |
|                                |   Atualizar                    |
+--------------------------------+--------------------------------+
```

### Abas de Despacho (Atual)
```
+------------------------------------------------------------------+
| ResumoStatusCard - Card único com gradiente colorido              |
| - Título + ícone                                                  |
| - Grid 2 colunas com badges de contagem                          |
+------------------------------------------------------------------+
| Filtros...                                                        |
| Título + Botões inline na mesma linha                            |
+------------------------------------------------------------------+
```

## Novo Layout Proposto

### Entregas Hoje / Pendentes / Antecipada
```
+--------------------------------+--------------------------------+
| Card: Resumo de Status         | Card: Ações                    |
| - Total em destaque (grande)   | - Botões empilhados:           |
| - Badge com qtd pedidos        |   Despachar em Massa           |
| - Grid 2x1 com Separados/      |   Entregar em Massa            |
|   Despachados                  |   Download CSV                 |
| - Design igual ao card de      |   Otimizador de Rota           |
|   Produtos Necessários         |                                |
+--------------------------------+--------------------------------+
```

---

## Componentes a Criar/Modificar

### 1. Novo: DespachoActionsCard.tsx

Card de ações para as abas de despacho:

```typescript
interface DespachoActionsCardProps {
  tipoFiltro: "hoje" | "atrasadas" | "antecipada";
  onDespacharEmMassa: () => void;
  onEntregarEmMassa: () => void;
  onDownloadCSV: () => void;
  onAtualizarDados: () => void;
  temPedidosSeparados: boolean;
  temPedidosDespachados: boolean;
  isLoading: boolean;
}
```

Conteúdo:
- Botão "Despachar em Massa" (apenas hoje/pendentes)
- Botão "Entregar em Massa" (apenas hoje/pendentes)
- Botão "Download CSV" (apenas hoje/pendentes)
- Botão "Otimizador de Rota" (apenas hoje/pendentes)
- Botão "Atualizar"

### 2. Refatorar: ResumoStatusCard.tsx

Redesign para seguir o padrão do ResumoQuantidadeProdutos:

**Novo design:**
- CardHeader com ícone + título
- Bloco de destaque com total grande (bg-primary/10)
- Badge com quantidade de pedidos
- Grid 2 colunas para status (Separados / Despachados)
- Remover gradientes coloridos (usar design neutro)

### 3. Modificar: Despacho.tsx

Reorganizar layout para:
1. Grid 2 colunas com cards superiores
2. Mover botões de ação para o novo DespachoActionsCard
3. Simplificar o título/header da listagem

---

## Detalhes de Implementação

### ResumoStatusCard (novo design)

```
+--------------------------------+
| 🚚 Resumo                      |
+--------------------------------+
| Quantidade Total               |
| [       42        ]  (grande)  |
| [42 pedidos]  badge            |
+--------------------------------+
| +------------+ +------------+  |
| | 📦 Separados   [12]       |  |
| +------------+ +------------+  |
| | 🚚 Despachados [30]       |  |
| +------------+ +------------+  |
+--------------------------------+
```

Cores por tipo:
- Hoje: Verde (green-600)
- Pendentes: Amarelo (yellow-600)  
- Antecipada: Azul (blue-600)

### DespachoActionsCard

```
+--------------------------------+
| ⚙️ Ações                       |
+--------------------------------+
| [🚚 Despachar em Massa]        |
| [📦 Entregar em Massa]         |
| [📥 Download CSV]              |
| [📍 Otimizador de Rota]        |
| [🔄 Atualizar]                 |
+--------------------------------+
```

### Despacho.tsx (layout atualizado)

```tsx
<div className="space-y-4">
  {/* Cards superiores lado a lado */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <ResumoStatusCard tipo={tipo} pedidos={pedidos} />
    <DespachoActionsCard 
      tipoFiltro={tipoFiltro}
      onDespacharEmMassa={...}
      onEntregarEmMassa={...}
      onDownloadCSV={...}
      onAtualizarDados={...}
      ...
    />
  </div>
  
  {/* WeekNavigator (apenas para pendentes) */}
  {tipoFiltro === "atrasadas" && <WeekNavigator ... />}
  
  {/* Filtros */}
  <DespachoFilters ... />
  
  {/* Listagem de pedidos (Card simplificado) */}
  <Card className="p-4">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {icone} {titulo}
      </h2>
    </div>
    {/* Lista de pedidos */}
  </Card>
</div>
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/expedicao/components/DespachoActionsCard.tsx` | Criar |
| `src/components/expedicao/components/ResumoStatusCard.tsx` | Refatorar design |
| `src/components/expedicao/Despacho.tsx` | Reorganizar layout |

---

## Comparação Visual

### Antes
```
+------------------------------------------------------------------+
| [ResumoStatusCard com gradiente colorido - largura total]         |
+------------------------------------------------------------------+
| [Título] -------- [Btn1] [Btn2] [Btn3] [Btn4]                    |
+------------------------------------------------------------------+
```

### Depois
```
+--------------------------------+--------------------------------+
| [ResumoStatusCard redesenhado] | [DespachoActionsCard]          |
| (50% largura)                  | (50% largura)                  |
+--------------------------------+--------------------------------+
| [Título simplificado]                                            |
+------------------------------------------------------------------+
```

---

## Considerações de Design

1. **Consistência**: Mesma estrutura de CardHeader/CardContent
2. **Cores neutras**: Usar bg-primary/10 ao invés de gradientes
3. **Hierarquia visual**: Total grande em destaque, detalhes menores
4. **Responsividade**: Grid 1 coluna em mobile, 2 colunas em desktop
5. **Ações contextuais**: Esconder botões desnecessários na aba "Antecipada"

