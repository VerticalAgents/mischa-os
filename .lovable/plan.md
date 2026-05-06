## Objetivo

Adaptar a experiência do representante em duas telas: `/rep` (Home) e `/rep/agendamentos` (Dashboard), priorizando os "previstos prováveis" e simplificando o layout.

---

## 1. Home do representante — `src/pages/rep/RepHome.tsx`

No bloco amarelo "Previstos da semana", ordenar por probabilidade de confirmação (prováveis primeiro):

- Usar `useConfirmationScore` (já existente) sobre `data.previstosSemanaAtual`.
- Como o hook recebe `AgendamentoItem[]` (com `cliente.id` e `dataReposicao`), construir um array compatível mínimo a partir de `RepAgendamentoLite` (mapeando `cliente_id` → `cliente.id`, `data_proxima_reposicao` → `dataReposicao`).
- Ordenar a lista por `score` decrescente (sem score = trata como 70). Empate: data mais próxima primeiro.
- Adicionar um pequeno selo "Provável" ao lado do badge "Previsto" quando `score > 85` (mesmo critério usado no dashboard).

Não muda o bloco vermelho de pendentes.

---

## 2. Dashboard de agendamento do representante — `src/components/agendamento/AgendamentoDashboard.tsx`

Adicionar uma nova prop opcional `repMode?: boolean` (default `false`) e propagá-la a partir de `RepAgendamentos.tsx`:

```tsx
<AgendamentoDashboard hideExportPDF repMode />
```

Comportamentos quando `repMode = true`:

### 2.1 Previstos prováveis visíveis por padrão
No `useState` atual:
- `incluirPrevistos` inicia em `true` (em vez de `false`).
- `modoPrevistos` inicia em `'provaveis'` (já é o default).

Manter o toggle visível para o admin/funcionário. Para o representante, usar valor inicial diferente via `useState(repMode ? true : false)`.

### 2.2 Esconder blocos pesados
Não renderizar quando `repMode`:
- `<QuantidadesProdutosSemanal ... />` (linha ~1053)
- `<EntregasRealizadasSemanal ... />` (linha ~1064)

Envolver o `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> ... </div>` em `{!repMode && (...)}`.

### 2.3 Cards de indicadores mais minimalistas (somente repMode)
Os 5 cards do topo (Total da Semana, Agendamentos Restantes, Confirmados, Previstos, Entregas Realizadas) hoje têm `CardHeader` + `CardContent` separados com descrição em `text-xs`.

Para `repMode`, renderizar uma versão compacta:
- Grid `grid-cols-2 md:grid-cols-5 gap-2`.
- Cada card: `p-3`, sem `CardHeader/CardContent` separados.
- Layout horizontal: ícone pequeno à esquerda, valor `text-xl font-bold`, label `text-[11px] text-muted-foreground` em uma linha; sem texto descritivo extra.
- Mesmas cores semânticas (verde/âmbar/azul/roxo).

Implementar via condicional dentro do mesmo bloco (`repMode ? <CompactCards/> : <CardsAtuais/>`) para não impactar o admin.

---

## 3. Arquivos a editar

- `src/pages/rep/RepHome.tsx` — ordenar previstos por score + selo "Provável".
- `src/pages/rep/RepAgendamentos.tsx` — passar `repMode` para `<AgendamentoDashboard/>`.
- `src/components/agendamento/AgendamentoDashboard.tsx` — aceitar `repMode`, defaults diferentes, esconder blocos, cards compactos.

Sem alterações de schema/backend.
