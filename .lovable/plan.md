## Atualização das Fichas Técnicas — Plano Final

Vou atualizar 6 receitas de brownie ao novo padrão (forma de 60 unidades, ~3980g por forma, ~65g por brownie, com margem de 2% já incluída), além de cadastrar 1 novo insumo, inativar 3 receitas fora de linha e deletar a receita teste.

### Resumo das mudanças

| # | Ação |
|---|---|
| 1 | Cadastrar insumo **Açúcar Líquido Invertido** (R$70 / 10kg = R$0,007/g) |
| 2 | Adicionar coluna `ativo boolean default true` em `receitas_base` |
| 3 | Inativar **Brownie Nesquik**, **Brownie Oreo Cream**, **Brownie Pistache** |
| 4 | Atualizar **6 receitas** (Tradicional, Choco Duo, Stikadinho, Meio Amargo, Doce de Leite, Avelã) — novos itens + rendimento 60 |
| 5 | Deletar receita teste **Brownie Tradicional (60 un)** |

### Decisões confirmadas

- **Padrão massa+topping (Doce de Leite)**: manter **2 linhas separadas** quando o mesmo insumo aparece em massa e topping (Opção B).
- **Ovo em Pó**: usar o **total homogeneizado** (já é assim que o insumo está cadastrado). Não somar a água da homogeneização separadamente.
- **Histórico de produção**: registros antigos ficam intactos (snapshot já está salvo em `rendimento_usado`/`unidades_calculadas`). Mudança de rendimento só afeta registros novos.

### Novas quantidades por receita (1 forma = base)

**Brownie Tradicional** (rendimento 60, peso 3980g)
| Insumo | Qtd (g) |
|---|---|
| Açúcar Refinado | 1164.8 |
| Chocolate em Pó 50% - Sicao | 411.3 |
| Sorbitol em Pó | 81.9 |
| Farinha de Trigo | 500.1 |
| Propionato de Cálcio | 8 |
| Sal | 4 |
| Ovo em Pó (homogeneizado) | 548 |
| Óleo de Soja | 576 |
| Cobertura Ao Leite - Genuine | 616.9 |
| Água | 21 |
| Essência de Baunilha | 27 |
| Sorbato de Potássio | 21 |
| Spray Desmoldante - Carlex | 2 |

**Brownie Choco Duo** (60, 3980g) — idêntico à Tradicional, trocando "Cobertura Ao Leite" por **Cobertura Branca Genuine 616.9g**.

**Brownie Stikadinho** (60, 3980g) — idêntico à Tradicional, trocando "Cobertura Ao Leite" por **Stikadinho 616.9g**.

**Brownie Meio Amargo** (60, 3980g)
| Insumo | Qtd (g) |
|---|---|
| Açúcar Refinado | 1235.8 |
| Chocolate em Pó 50% - Sicao | 463.2 |
| Cacau Black | 27.9 |
| Sorbitol em Pó | 99.8 |
| Farinha de Trigo | 562 |
| Propionato de Cálcio | 8 |
| Sal | 4 |
| Ovo em Pó (homogeneizado) | 617.9 |
| Óleo de Soja | 610.9 |
| Cobertura Meio Amargo - Genuine | 280.5 |
| Água | 21 |
| Essência de Baunilha | 28 |
| Sorbato de Potássio | 21 |
| Spray Desmoldante - Carlex | 2 |

**Brownie Doce de Leite** (60, 3980g) — Opção B: massa e topping em linhas separadas
| Insumo | Qtd (g) | Função |
|---|---|---|
| Açúcar Refinado | 590 | massa |
| Doce de Leite Tirol | 775 | massa |
| Doce de Leite Tirol | 150 | topping |
| Açúcar Líquido Invertido | 80 | massa (novo insumo) |
| Sorbitol em Pó | 80 | massa |
| Farinha de Trigo | 643 | massa |
| Propionato de Cálcio | 8 | massa |
| Sal | 21 | massa |
| Ovo em Pó (homogeneizado) | 380 | massa |
| Óleo de Soja | 275 | massa |
| Cobertura Branca Genuine | 292 | massa (derretida) |
| Cobertura Branca Genuine | 617 | topping (pedaços) |
| Água | 21 | massa |
| Essência de Baunilha | 27 | massa |
| Sorbato de Potássio | 21 | massa |
| Spray Desmoldante - Carlex | 2 | separado |

**Brownie Avelã** (60, 3980g)
| Insumo | Qtd (g) |
|---|---|
| Açúcar Refinado | 1117.7 |
| Chocolate em Pó 50% - Sicao | 394.6 |
| Sorbitol em Pó | 78.5 |
| Farinha de Trigo | 479.8 |
| Propionato de Cálcio | 8 |
| Sal | 4 |
| Ovo em Pó (homogeneizado) | 525.8 |
| Óleo de Soja | 552.6 |
| Nutella 3kg | 750 |
| Água | 21 |
| Essência de Baunilha | 27 |
| Sorbato de Potássio | 21 |
| Spray Desmoldante - Carlex | 2 |

### Ordem de execução técnica

1. **Migration**: adicionar coluna `ativo boolean not null default true` em `receitas_base`.
2. **Insert**: novo insumo "Açúcar Líquido Invertido" (`unidade_medida='g'`, `custo_medio=0.007`, `categoria='Matéria Prima'`, `volume_bruto=10000`, `user_id` = mesmo dono dos outros insumos).
3. **Update**: marcar Brownie Nesquik, Oreo Cream e Pistache com `ativo = false`.
4. Para cada uma das 6 receitas:
   - `DELETE FROM itens_receita WHERE receita_id = ?`
   - `INSERT` das novas linhas (com referência ao `insumo_id` correto)
   - `UPDATE receitas_base SET rendimento = 60 WHERE id = ?`
5. **Delete**: receita "Brownie Tradicional (60 un)" (apaga `itens_receita` + `receitas_base`).
6. **Verificação**: rodar uma query de conferência mostrando, para cada receita atualizada, peso total e rendimento → você confere se bate.

### O que NÃO está neste plano (próximo passo)

Após esta atualização e sua verificação, partimos para o **registro de produção semana a semana** desde 06/03 até a semana passada, batendo aproximadamente com o que foi entregue. Esse será um plano separado.

### Pontos de atenção / impacto no app

- A coluna `ativo` em `receitas_base` é nova — telas que listam receitas continuarão funcionando (default `true`), mas não vão filtrar inativas automaticamente. Se quiser, em uma próxima iteração, filtramos as inativas em `useSupabaseReceitas` e telas relacionadas.
- O `src/integrations/supabase/types.ts` será regenerado automaticamente após a migration; não preciso editar manualmente.
- Custo unitário das receitas vai mudar (mais ingrediente + mais rendimento). Telas de precificação refletirão isso na próxima carga.
