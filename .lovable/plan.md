Plano para corrigir a rolagem do modal e revelar a lista de níveis configurados:

1. **Transformar o modal em layout de altura fixa**
   - Ajustar o `DialogContent` do modal de edição de produto para usar altura real baseada na viewport, não apenas `max-height`.
   - Manter `overflow-hidden` no contêiner principal para impedir que o footer sobreponha o conteúdo.

2. **Criar uma área central realmente rolável**
   - Fazer somente o corpo entre o cabeçalho e o rodapé rolar verticalmente.
   - Deixar o cabeçalho, as abas e os botões `Cancelar / Salvar Alterações` visíveis e estáveis.
   - Garantir `min-h-0` nos wrappers flex para o navegador permitir overflow interno.

3. **Ajustar a aba Embalagens**
   - Remover qualquer altura artificial que impeça o conteúdo de crescer.
   - Garantir que os cards “Sobre”, “Adicionar nível”, “Copiar de outro produto” e “Níveis configurados” fiquem dentro da área rolável.
   - A lista de níveis deve aparecer ao rolar para baixo, sem precisar fechar o modal.

4. **Melhorar responsividade**
   - Em telas menores, reduzir a altura do modal para caber melhor na viewport.
   - Manter a tabela sem rolagem lateral desnecessária e sem quebrar o layout.

5. **Validar no preview**
   - Abrir o produto `Brownie Tradicional Odara`.
   - Entrar na aba `Embalagens`.
   - Confirmar que a rolagem vertical funciona e que o card `Níveis configurados` aparece abaixo do card de cópia.