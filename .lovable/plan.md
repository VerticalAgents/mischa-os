

## Plano: Corrigir exibição de função e layout responsivo na aba Funcionários

### Problemas identificados
1. Beatriz aparece com "Gerente de Produção" porque o código faz fallback: `s.role === 'producao' ? 'Gerente de Produção' : s.role` — mas não existe nenhum custom_role cadastrado, então deveria mostrar "Não definido" ou similar
2. A tabela tem scroll horizontal cortando conteúdo — precisa ser responsiva

### Correções

**1. `FuncionariosTab.tsx` — getRoleName / getRoleColor**
- Se `custom_role_id` existe e encontra no array → mostra o nome/cor do custom role
- Se `custom_role_id` não existe (null) e `role` é qualquer valor antigo (incluindo "producao") → mostrar "Não definido" com cor cinza, indicando que precisa ser atribuído
- Remover o mapeamento hardcoded `producao → Gerente de Produção`

**2. `FuncionariosTab.tsx` — Layout responsivo da tabela**
- Remover a estrutura de `<Table>` rígida e trocar por um layout que se adapte ao espaço disponível
- Usar `table-fixed w-full` com colunas proporcionais, ou usar `overflow-hidden` com truncamento de texto (`truncate`, `max-w-[...]`)
- Células de email e nome com `truncate` para não estourar
- Reduzir padding e tamanhos de texto onde necessário
- Remover a barra de rolagem horizontal

### Arquivos afetados
- `src/components/configuracoes/tabs/FuncionariosTab.tsx`

