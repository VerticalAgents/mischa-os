## Objetivo

1. Corrigir o gráfico de pizza por representante (nomes cortados): mover legenda para baixo e remover labels externos.
2. Adicionar campo **cor** no cadastro de representantes; usar essa cor nos gráficos quando o toggle "Representantes" estiver ativo.

## Mudanças

### 1. Schema — nova coluna `cor`

Migration adiciona coluna `cor text` em `public.representantes` (nullable, formato `#RRGGBB`).

### 2. Cadastro de representante (`RepresentantesList.tsx` + `useSupabaseRepresentantes.ts`)

- `Representante` ganha `cor?: string`.
- Form de adicionar/editar ganha um campo color picker (`<input type="color">` + input texto, com preview do swatch).
- Coluna nova "Cor" na tabela mostra um quadradinho com a cor (ou placeholder cinza se não definida).
- Cor default sugerida ao criar: pega da paleta padrão.

### 3. Gráficos no Agendamento (`AgendamentoDashboard.tsx`)

**Pizza:**
- Remover `label={({status, unidades}) => …}` (rótulos externos que cortam fora do container).
- Sempre renderizar `<Legend verticalAlign="bottom" />` (mobile e desktop), com formatter mostrando `${status}: ${unidades}`. Wrap em layout horizontal.
- Aumentar `outerRadius` agora que não há label externo.

**Cores no modo "Representantes":**
- Em `dadosGraficoRepresentantes`, usar `representantes.find(...)?.cor` quando disponível, com fallback para a paleta atual.
- O mesmo se aplica ao `BarChart` por representante (`dadosGraficoSemanalRep`) — usa a mesma cor por rep.

### 4. Tipo compartilhado

`src/types/index.ts` — adicionar `cor?: string` em `Representante`.

## Arquivos
- `supabase/migrations/<novo>.sql` (add column)
- `src/types/index.ts`
- `src/hooks/useSupabaseRepresentantes.ts`
- `src/components/configuracoes/listas/RepresentantesList.tsx`
- `src/components/agendamento/AgendamentoDashboard.tsx`
