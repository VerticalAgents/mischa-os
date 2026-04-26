
# Reconstrução do Histórico de Produção (semanas zeradas)

## Diagnóstico

- **Última semana com produção registrada:** 02/mar/2026 → 08/mar/2026
- **Semanas zeradas (com entregas, sem produção):**
  - 09/03 → 15/03 (38 entregas)
  - 16/03 → 22/03 (41 entregas)
  - 23/03 → 29/03 (40 entregas)
  - 30/03 → 05/04 (36 entregas)
  - 06/04 → 12/04 (45 entregas)
  - 13/04 → 19/04 (48 entregas) — semana passada
- **Semana atual (20/04 →):** NÃO entra (a pedido: "até a semana passada")

## Lógica de reconstrução

Para cada semana zerada:

1. Somar `quantidade` por `produto_id` em `historico_entregas.itens` (jsonb).
2. Mapear cada `produto_id` para a sua receita_base via `componentes_produto` (tipo='receita').
3. Agrupar unidades entregues por **receita** (várias variações como Mini/Nano Tradicional caem todas em "Brownie Tradicional").
4. Calcular `formas = ceil(unidades_entregues / rendimento)`, onde rendimento = 60 un/forma.
5. Inserir 1 registro por **produto final** (não por receita), distribuindo as formas proporcionalmente às unidades entregues de cada produto, para preservar o detalhamento histórico.
6. Cada registro recebe:
   - `data_producao` = segunda-feira da semana (consistente com padrão existente)
   - `formas_producidas`, `unidades_calculadas` (= formas × 60)
   - `rendimento_usado` = 60
   - `status` = `'Confirmado'`, `confirmado_em` = now()
   - `origem` = `'Reconstrução histórica'`
   - `observacoes` = "Reconstruído a partir de entregas da semana DD/MM–DD/MM"

## Tratamento de produtos especiais

- **Brownie Oreo Cream** (`129a01ab…`, inativo): aparece em várias entregas. Será incluído normalmente nos registros (produto inativo não impede histórico).
- **Mini/Nano Brownie Tradicional**: vão como registros separados (produtos próprios), mas as **formas são calculadas em conjunto** com o Brownie Tradicional padrão (mesma receita), pois compartilham a mesma massa.
- Produtos que aparecem em entregas mas **não têm receita vinculada**: ignorar e listar no relatório final.

## Etapas de execução

1. Rodar query de levantamento mostrando, por semana e produto, total de unidades entregues e formas calculadas — exibir tabela para conferência **antes de inserir**.
2. Após confirmação visual, executar `INSERT` em `historico_producao` (via insert tool) com todos os registros.
3. Validar com query final agregando produção × entregas semana a semana.

## Resultado esperado

~6 semanas × ~7 produtos = **~40 novos registros** em `historico_producao`, todos com status Confirmado, deixando o card "Produção da Semana" e o histórico do PCP completos até 19/04.

## Observação

Nada será alterado no código — é só dados. O Card de Produção da Semana (HomeProducaoSemana.tsx) e o Histórico PCP passarão a mostrar os números automaticamente.

