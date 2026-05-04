
## Objetivo

Quando o **Estoque Total Disponível** (após considerar produção agendada e expedição) ficar entre **0 e X% do alvo semanal**, o badge do total deve ficar **laranja** com um aviso. O usuário deve poder configurar esse `X%` na aba **Setup** do PCP.

Atualmente o card só pinta:
- **vermelho** quando < 0
- **amarelo** quando < alvo (totalIdeal)
- **azul** quando ≥ alvo

A nova faixa **laranja** (alerta crítico) ficará entre `0` e `alvo × X%`, sobrescrevendo o amarelo nessa faixa.

## Mudanças

### 1. `src/components/pcp/SetupPCPTab.tsx`
Adicionar novo campo de configuração logo abaixo do seletor de modos (ou em um bloco próprio "Alerta de estoque crítico"):

- Input numérico **"Limite de alerta (% do alvo)"**, default `30`, range `0–100`.
- Texto explicativo: _"Se o estoque resultante ficar entre 0 e X% do alvo semanal, o card mostrará um aviso laranja."_
- Persistir no `useConfigStore` via `atualizarConfiguracoesProducao`, novo campo `estoqueAlertaCriticoPercentual`.
- Estado inicial lê de `configuracoesProducao?.estoqueAlertaCriticoPercentual ?? 30`.
- Incluir no `handleSalvar`.

### 2. `src/components/pcp/EstoqueDisponivel.tsx`
- Importar `useConfigStore` e ler `estoqueAlertaCriticoPercentual` (fallback 30).
- Calcular `limiteAlerta = totalIdeal * (percentual/100)`.
- Nova lógica de cor (ordem de prioridade):
  1. `< 0` → **vermelho**
  2. `totalIdeal > 0 && total >= 0 && total < limiteAlerta` → **laranja** (novo)
  3. `totalIdeal > 0 && total < totalIdeal` → **amarelo**
  4. caso contrário → **azul**
- Classes laranja: `bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30` para `blockClass` e `text-orange-600 dark:text-orange-400` para `totalTextClass`.
- Quando estiver em estado laranja, exibir um aviso pequeno abaixo do número:
  - Ícone `AlertTriangle` (lucide) + texto: `"Estoque abaixo de {X}% do alvo ({totalIdeal})"`.
  - Estilizado em `text-orange-700 dark:text-orange-400 text-xs font-medium`.

### 3. (opcional, se aplicável) Tipos do config store
Se `useConfigStore`/tipos das configurações de produção forem tipados explicitamente, adicionar `estoqueAlertaCriticoPercentual?: number` ao tipo. Caso já use `as any` no salvar (como no Setup atual), nenhuma mudança de tipo é necessária.

## Detalhes técnicos

```ts
// EstoqueDisponivel.tsx
const { configuracoesProducao } = useConfigStore();
const pctAlerta = Number(configuracoesProducao?.estoqueAlertaCriticoPercentual ?? 30);
const limiteAlerta = totalIdeal * (pctAlerta / 100);

const emAlerta = totalIdeal > 0 && totalDisponivelAjustado >= 0 && totalDisponivelAjustado < limiteAlerta;

const blockClass =
  totalDisponivelAjustado < 0
    ? "bg-red-500/10 dark:bg-red-500/20 border-red-500/30"
    : emAlerta
    ? "bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30"
    : totalIdeal > 0 && totalDisponivelAjustado < totalIdeal
    ? "bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30"
    : "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30";
```

## Arquivos afetados
- `src/components/pcp/SetupPCPTab.tsx` (novo input + persistência)
- `src/components/pcp/EstoqueDisponivel.tsx` (nova faixa laranja + aviso)

Sem migrações, sem novas rotas, sem mudanças de banco — apenas config local persistida via `useConfigStore`.
