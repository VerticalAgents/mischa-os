## Problema

O modal "Novo Cliente / Editar Cliente" (`ClienteFormDialog.tsx`) está quebrado no mobile (390px):
- Vários blocos usam grids fixos (`grid-cols-3`, `grid-cols-2`) que não colapsam em telas pequenas, espremendo labels (ex: "ID do Cliente", "Tipo de Cobrança", "Prazo de Pagamento") e cortando textos.
- O grupo de Tipo de Pessoa (PJ/PF) usa `flex` sem wrap, vazando para fora.
- O `DialogContent` tem `p-6` e `max-w-lg` padrão (em mobile sai dos limites do viewport quando combinado com o conteúdo), e o título/descrição ficam apertados ao lado do botão de fechar.

## Solução

Tornar o modal totalmente fluido no mobile, mantendo o layout multi-coluna em telas `sm`/`md` para cima.

### Ajustes no `src/components/clientes/ClienteFormDialog.tsx`

1. **DialogContent**: ajustar largura/padding para mobile.
   - `w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-full sm:max-w-[1000px]`
   - `p-4 sm:p-6` para reduzir padding lateral em telas pequenas.

2. **Bloco Dados Básicos**:
   - `grid-cols-3` (ID, Nome, Tipo de Pessoa) → `grid-cols-1 sm:grid-cols-3`
   - `grid-cols-2` (CNPJ, Insc. Estadual) → `grid-cols-1 sm:grid-cols-2`
   - `grid-cols-3` (Contato Nome, Telefone, Email) → `grid-cols-1 sm:grid-cols-3`
   - RadioGroup de Tipo de Pessoa: adicionar `flex-wrap` e `gap-x-4 gap-y-2`.

3. **Bloco Configurações Comerciais**:
   - `grid-cols-2` (Periodicidade, Status) → `grid-cols-1 sm:grid-cols-2`.

4. **Bloco Configurações de Entrega e Logística**:
   - Ambos `grid-cols-2` (Representante/Rota, Categoria/Tipo Logística) → `grid-cols-1 sm:grid-cols-2`.

5. **Bloco Configurações Financeiras**:
   - `grid-cols-3` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

6. **Card padding**: `CardContent` mantém `space-y-4`; sem mudança necessária além das grids.

7. **DialogHeader**: garantir que o título não seja cortado pelo botão X — adicionar `pr-8` no `DialogTitle` para reservar espaço do botão de fechar.

### Resultado esperado

- Mobile (≤640px): cada campo ocupa toda a largura, sem cortes; radios PJ/PF quebram linha se preciso.
- Tablet (≥640px): volta o layout 2 colunas.
- Desktop (≥1024px): layout original 3 colunas no bloco financeiro.

### Arquivo afetado

- `src/components/clientes/ClienteFormDialog.tsx` (apenas ajustes de classes Tailwind).
