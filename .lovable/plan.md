Vou corrigir isso tratando o problema como fluxo completo, não só como botão de adicionar.

## Diagnóstico atual
- A tabela `niveis_embalagem_produto` existe e já tem pelo menos um nível salvo: `Display`, `12 un`, vinculado ao produto **Brownie Tradicional Odara**.
- No replay, esse nível chega a aparecer na aba **Níveis configurados** para esse produto.
- Depois, ao abrir outro produto (**Brownie Doce de Leite Odara**), a lista aparece vazia porque o nível está salvo por produto, não globalmente.
- A UI hoje não deixa isso claro e também não tem uma forma prática de reaproveitar/copiar níveis entre produtos parecidos.

## Plano de correção
1. **Deixar explícito que os níveis são do produto atual**
   - Mostrar no card de níveis configurados que aqueles níveis pertencem somente ao produto aberto.
   - Evitar a sensação de que o nível “sumiu” ao trocar de produto.

2. **Melhorar o carregamento da lista**
   - Ajustar o hook para manter o estado correto por `produtoId`.
   - Evitar que uma recarga antiga sobrescreva a lista quando o usuário troca rapidamente de produto/modal.
   - Manter o nível recém-adicionado visível imediatamente após salvar.

3. **Não fechar o modal ao adicionar nível**
   - Garantir que o botão **Adicionar** só salve o nível e limpe os campos.
   - O modal de produto só deve fechar se clicar em **Cancelar**, fechar o diálogo ou **Salvar Alterações**.

4. **Tratar duplicidade de forma amigável**
   - Se já existir um nível com o mesmo nome ou mesma quantidade para aquele produto, mostrar uma mensagem clara.
   - Não deixar o usuário achar que falhou silenciosamente.

5. **Adicionar uma ação para copiar níveis de outro produto**
   - Na aba **Embalagens**, adicionar uma opção tipo “Copiar níveis de outro produto”.
   - Isso resolve o caso dos brownies da Odara: você configura `Display`/`Caixa` em um e replica no outro sem cadastrar tudo de novo.
   - Ao copiar, respeitar duplicidades e não criar registros repetidos.

6. **Validar no produto certo**
   - Testar abrindo o produto que já tem `Display` salvo.
   - Testar abrindo outro produto sem níveis.
   - Adicionar/copiar níveis e confirmar que eles aparecem na lista sem fechar o modal.

## Resultado esperado
- O nível salvo aparece corretamente no produto onde foi cadastrado.
- Ao trocar de produto, fica claro se aquele produto ainda não tem níveis.
- Você consegue cadastrar vários níveis em sequência sem reabrir o modal.
- Para produtos parecidos, consegue copiar os níveis rapidamente.