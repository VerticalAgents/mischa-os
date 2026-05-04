## Objetivo

Transformar o card **Produção Agendada** numa visão diária com validação de insumos sequencial, confirmação em massa e exportação PDF, sem sair do bloco existente.

## Mudanças por arquivo

### 1. `src/hooks/useProducaoAgendada.ts`
- Além de `produtosAgrupados`, expor também `registros` brutos (com `data_producao`, `turno`, `produto_id`, `produto_nome`, `formas_producidas`, `unidades_previstas`).
- Adicionar `diasAgendados`: agrupamento por `data_producao` ordenado **da data mais próxima de hoje em diante** (hoje → futuro; passado fica no fim ou é omitido — por padrão exibimos hoje+futuro).
  Cada item: `{ data, dataFormatada, registros[], totalFormas, totalUnidades, registroIds[] }`.

### 2. Novo hook: `src/hooks/useValidacaoInsumosProducaoAgendada.ts`
Responsável por calcular, para cada dia agendado, se há insumos suficientes considerando o **consumo acumulado dos dias anteriores** (lógica sequencial).

Algoritmo:
1. Recebe `diasAgendados` (ordenados do mais próximo ao mais distante).
2. Para cada dia, percorre seus registros e, usando `useSupabaseReceitas` + `useRendimentosReceitaProduto`, calcula a necessidade de insumos por `formas_producidas` (`receita.itens` × formas, ou via rendimento).
3. Mantém um mapa `estoqueRestantePorInsumo` inicializado com `insumo.estoque_atual` de `useSupabaseInsumos`.
4. Para cada dia em ordem cronológica:
   - Soma a necessidade de cada insumo do dia.
   - Para cada insumo: se `necessidadeDia > estoqueRestante[insumo]`, marca o insumo como **faltante para esse dia** (registra `faltante` e `quantidadeFaltante`).
   - Se houver pelo menos um insumo faltante → status do dia = `vermelho`; senão `verde`.
   - Subtrai a necessidade do estoque restante (mesmo se faltou, subtrai até zerar) antes de processar o próximo dia — assim um insumo escasso compartilhado naturalmente vai gerar vermelho nos dias seguintes.
5. Retorna `Map<data, { status: 'ok'|'faltante', insumosFaltantes: [{nome, unidade, necessario, disponivel, faltante}] }>`.

### 3. `src/components/pcp/ProducaoAgendadaCard.tsx` (refatorar)
Layout dentro do collapsible expandido (substituindo a lista plana por produto):

- **Header de ações** (apenas visível quando há produções):
  - `Confirmar tudo` (verde) — só habilita dias com badge verde.
  - `Exportar PDF`.
- **Cards diários** estilo enxuto (referência da imagem 2):
  ```
  ▶ Quinta-Feira, 07/05/2026         [✓ Insumos OK]   22 Formas | 48 Unid.
    2 registro(s)
  ```
  - Borda esquerda colorida: verde (`border-l-green-500`) ou vermelho (`border-l-red-500`).
  - Badge ao lado do título: `Insumos OK` (verde) ou `Faltam: Nutella, Chocolate…` (vermelho, com tooltip listando quantidades faltantes).
  - Header clicável colapsa/expande.
- **Conteúdo expandido (compacto)**: tabela enxuta — Produto | Formas | Unidades | Status, sem ações de editar/deletar (mantém o card pequeno; edição continua na aba Histórico).
- Botão de **confirmar em massa por dia** dentro do header expandido (verde) — desabilitado se o dia estiver vermelho. Confirma todos os `registros` daquele dia chamando `confirmarProducao(id)` em loop (reutiliza `useConfirmacaoProducao`).
- Manter o bloco de Total de Unidades Agendadas no topo do card.
- Manter o botão **Nova Produção** já existente.

### 4. Exportação PDF
Criar util `src/utils/exportProducaoAgendadaPDF.ts` usando `jspdf` + `jspdf-autotable` (já disponíveis no projeto, ou instalar se necessário). Conteúdo:
- Cabeçalho: "Planejamento de Produção Agendada — gerado em DD/MM/AAAA".
- Para cada dia: título com data, total Formas/Unidades, status de insumos (e lista de faltantes se houver).
- Tabela: Produto | Formas | Unidades.
- Ao final, resumo: total geral de formas/unidades e lista consolidada de insumos faltantes.

### 5. `ProjecaoProducaoTab.tsx`
- Passar `diasAgendados` e o resultado de `useValidacaoInsumosProducaoAgendada` para `ProducaoAgendadaCard`.
- Após confirmar em massa, chamar `recarregarProducaoAgendada()`.

## Comportamento esperado (exemplos)

- Produção hoje (Nutella 5kg necessária, estoque 5kg) + amanhã (Nutella 3kg necessária):
  - Hoje: verde (OK). Estoque restante de Nutella = 0.
  - Amanhã: vermelho — falta 3kg de Nutella.
- Insumo comum (Chocolate) insuficiente para os dois dias:
  - Hoje: consome o que tem; se ainda assim faltar para hoje → vermelho hoje.
  - Amanhã: vermelho (faltando o restante).
- Se hoje cabe inteiro mas amanhã não cabe pelo restante → hoje verde, amanhã vermelho. (Conforme exemplo do usuário.)

## Pontos não cobertos (manter como estão)
- Edição/exclusão de registros continua via aba Histórico de Produção.
- Validação de insumos individual ao confirmar (já existe em `confirmarProducao`) é mantida — a validação visual nova é apenas preventiva/planejamento.
