## Atualização das Fichas Técnicas (6 receitas — 60 un cada)

### Correções importantes vs. tentativa anterior

1. **Sem manteiga, sem cacau em pó genérico, sem "chocolate meio amargo"** — esses ingredientes não existem nas fichas reais. Foram inventados na primeira tentativa. Serão removidos.
2. **Custos NÃO devem ser divididos por 1000.** O modelo do sistema é `custo_medio` = R$ da embalagem inteira (campo `volume_bruto` em g). Exemplos: Açúcar Refinado R$4,19/1000g, Ovo em Pó hidratado R$1050/86956g. Está correto. A correção combinada antes seria um erro — fica revertida.
3. **Rendimento por receita = 60 un** (1× = 1 forma = 3980g de massa). As fichas enviadas mostram 2× (120 un / 7960g) só pra produção real; vou cadastrar a base 1×.
4. **Ovo em Pó**: o insumo cadastrado já é "homogeneizado" (com água embutida). Usar a quantidade total da ficha (ex: 548g), sem desmembrar pó+água.

### Plano de execução

**1. Atualizar receitas (rendimento = 60, ativo = true) e limpar `itens_receita`** das 6 ativas: Tradicional, Choco Duo, Stikadinho, Meio Amargo, Doce de Leite, Avelã.

**2. Inserir os novos `itens_receita` (qtd 1× por forma, 60 un)** mapeando para os insumos reais:

**Tradicional** (60 un)
- Açúcar Refinado 1164,8 · Chocolate em Pó 50% - Sicao 411,3 · Sorbitol em Pó 81,9 · Farinha de Trigo 500,1 · Propionato de Cálcio 8 · Sal 4 · Ovo em Pó (homogeneizado) 548 · Óleo de Soja 576 · Cobertura Ao Leite - Genuine 616,9 · Água 21 · Essência de Baunilha 27 · Sorbato de Potássio 21 · Spray Desmoldante - Carlex 2

**Choco Duo** (60 un) — igual à Tradicional, mas topping = **Cobertura Branca Genuine 616,9** (no lugar da Cobertura Ao Leite).

**Stikadinho** (60 un) — igual à Tradicional, mas topping = **Stikadinho 616,9** (no lugar da Cobertura Ao Leite).

**Meio Amargo** (60 un)
- Açúcar Refinado 1235,8 · Chocolate em Pó 50% - Sicao 463,2 · Cacau Black 27,9 · Sorbitol em Pó 99,8 · Farinha de Trigo 562 · Propionato de Cálcio 8 · Sal 4 · Ovo em Pó (homogeneizado) 617,9 · Óleo de Soja 610,9 · Cobertura Meio Amargo - Genuine 280,5 · Água 21 · Essência de Baunilha 28 · Sorbato de Potássio 21 · Spray Desmoldante - Carlex 2

**Doce de Leite** (60 un) — receita especial (sem chocolate em pó):
- Açúcar Refinado 590 · Doce de Leite Tirol 925 (775 massa + 150 topping) · Açúcar Líquido Invertido 80 · Sorbitol em Pó 80 · Farinha de Trigo 643 · Propionato de Cálcio 8 · Sal 21 · Ovo em Pó (homogeneizado) 380 · Óleo de Soja 275 · Cobertura Branca Genuine 909 (292 derretida + 617 topping) · Água 21 · Essência de Baunilha 27 · Sorbato de Potássio 21 · Spray Desmoldante - Carlex 2

**Avelã** (60 un)
- Açúcar Refinado 1117,7 · Chocolate em Pó 50% - Sicao 394,6 · Sorbitol em Pó 78,5 · Farinha de Trigo 479,8 · Propionato de Cálcio 8 · Sal 4 · Ovo em Pó (homogeneizado) 525,8 · Óleo de Soja 552,6 · Nutella 3kg 750 · Água 21 · Essência de Baunilha 27 · Sorbato de Potássio 21 · Spray Desmoldante - Carlex 2

### O que será mantido das migrations já rodadas

- ✅ Açúcar Líquido Invertido cadastrado (R$0,007/g — usado no Doce de Leite)
- ✅ Brownie Nesquik / Oreo / Pistache marcados como inativos
- ✅ "Brownie Tradicional (60 un)" (teste) deletado
- ✅ Coluna `ativo` em `receitas_base`

### Tabelas afetadas

- `receitas_base` — UPDATE rendimento + ativo nas 6 receitas
- `itens_receita` — DELETE antigos + INSERT das fichas acima

### Impacto esperado

- Custo por brownie ficará realista (alguns reais por unidade), batendo com a margem que vocês praticam.
- "Brownie Tradicional FS" não é tocado nesta migration (mantém como está) — confirmar se também deve receber a mesma ficha em rodada futura.

### Próxima etapa (após aprovar e rodar)

Gerar os registros de `historico_producao` que estavam pendentes desde o início da conversa, agora com fichas corretas.
