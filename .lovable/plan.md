## Objetivo

Otimizar a versão mobile (≤ 1024px) das abas internas exibidas dentro de um cliente na rota `/rep/clientes`: **Informações**, **Agendamento Atual**, **Análise de Giro** e **Histórico de Entregas**. Hoje os conteúdos foram desenhados para desktop (paddings grandes, grids fixos, tabelas largas) e ficam apertados/quebrados a 390px.

Os componentes são compartilhados com o admin, portanto as melhorias serão **responsivas** (mobile-first), sem mudar o layout desktop.

---

## Mudanças por aba

### 1. Aba "Informações" — `src/components/clientes/ClienteDetalhesInfo.tsx`
- Reduzir paddings/gaps no mobile: `space-y-8` → `space-y-4 lg:space-y-8`, `gap-8` → `gap-4 lg:gap-8`.
- Header de status: empilhar nome + badge no mobile (`flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`), reduzir padding (`p-4 lg:p-6`) e tamanho do título (`text-lg lg:text-xl`).
- `CardHeader` e `CardContent`: padding compacto no mobile (`p-3 lg:p-6`, `pb-3 lg:pb-6`). Reduzir `text-lg` dos títulos para `text-base lg:text-lg`.
- `InfoItem`: padding `p-2 lg:p-3` para liberar espaço.
- Grid de configurações financeiras: já é `grid-cols-1 md:grid-cols-3`, manter.

### 2. Aba "Agendamento Atual" — `src/components/clientes/AgendamentoAtual.tsx`
- Grid superior `grid-cols-2 gap-4` → `grid-cols-1 sm:grid-cols-2 gap-4` (Status + Tipo de Pedido empilham no mobile).
- `CardContent` com `p-4 lg:p-6` e `space-y-4`.
- Garantir que o `ProdutoQuantidadeSelector` (já otimizado em loop anterior) continue ok.
- Botão "Salvar Agendamento" já é `w-full`, manter.

### 3. Aba "Análise de Giro" — `src/components/clientes/AnaliseGiro.tsx`
- Cards de indicadores de periodicidade (Última Entrega / Periodicidade Configurada / Periodicidade Real): grid já é `grid-cols-1 md:grid-cols-3`. Reduzir padding (`pt-4 lg:pt-6`) e fonte do valor principal (`text-xl lg:text-2xl`) para caber melhor.
- Grid de métricas de giro (Média / Última Semana / Comparativo): mesma simplificação.
- Gráfico (`LineChart`): reduzir altura no mobile (`h-64 lg:h-80`) e margens (`left: 0, right: 10` no mobile) para o eixo Y não cortar.
- `Card` do gráfico: `CardHeader` com `p-4 lg:p-6` e `CardTitle` `text-base lg:text-lg`.

### 4. Aba "Histórico de Entregas" — `src/components/clientes/HistoricoEntregasCliente.tsx` + `src/components/expedicao/HistoricoTable.tsx`
- Card externo: `p-3 lg:p-6`, `space-y-4 lg:space-y-6`.
- Bloco de filtros: header `flex-col items-start gap-2 lg:flex-row lg:items-center lg:gap-4`; botão "Restaurar Padrão" `w-full lg:w-auto lg:ml-auto`.
- Resumo (Total / Entregas / Retornos): trocar `grid-cols-3 gap-4` por `grid-cols-3 gap-2 lg:gap-4` com padding `p-2 lg:p-4` e fonte `text-lg lg:text-2xl` para caber a 390px sem quebrar.
- `TabsList`: já é horizontal compacta; envolver em `overflow-x-auto` para não estourar.
- **`HistoricoTable`** (mais crítico): tabela tem 5–6 colunas que não cabem em 390px. Aplicar o padrão já adotado em `RepClientes`/`RepAgendamentos`:
  - Renderização condicional: tabela atual fica `hidden lg:block`.
  - No mobile (`lg:hidden`), lista de cards empilhados mostrando: Data + ícone "editado", Badge tipo (Entrega/Retorno), Itens (com `line-clamp-2`), Quantidade, e botões Ver detalhes / Editar como ícones em uma linha.

---

## Padrão técnico

```tsx
// Padding e tipografia responsivos em cards
<Card>
  <CardHeader className="p-3 lg:p-6">
    <CardTitle className="text-base lg:text-lg">...</CardTitle>
  </CardHeader>
  <CardContent className="p-3 lg:p-6 space-y-3 lg:space-y-4">...</CardContent>
</Card>

// Tabela vira cards no mobile
<div className="hidden lg:block"><Table>...</Table></div>
<div className="lg:hidden space-y-2">
  {registros.map(r => (
    <div className="rounded-lg border p-3 bg-card">...</div>
  ))}
</div>
```

Breakpoint usado: `lg` (1024px) — consistente com o sidebar e demais telas do representante já otimizadas.

## Arquivos a editar

- `src/components/clientes/ClienteDetalhesInfo.tsx`
- `src/components/clientes/AgendamentoAtual.tsx`
- `src/components/clientes/AnaliseGiro.tsx`
- `src/components/clientes/HistoricoEntregasCliente.tsx`
- `src/components/expedicao/HistoricoTable.tsx`

## Fora do escopo

- Mudanças no admin (alterações são responsivas, não afetam o desktop).
- Nova lógica de negócio — apenas layout/responsividade.
