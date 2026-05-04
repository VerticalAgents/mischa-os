# Considerar produção agendada automaticamente

## Problema

Hoje os cards **Estoque Disponível** e **Sugestão de Produção** só somam a produção agendada quando o switch "Incluir prod. agendada" está ligado. Por padrão ele vem desligado, então depois de agendar uma produção, a sugestão não diminui.

Comportamento desejado: quando o usuário agenda uma produção (registro `status = 'Registrado'` em `historico_producao`), o estoque disponível final e a sugestão devem refletir isso automaticamente, abatendo as quantidades agendadas.

## Causa

Em `ProjecaoProducaoTab.tsx`:

```ts
const [incluirProducaoAgendada, setIncluirProducaoAgendada] = useState(false);

const estoqueAjustado = useMemo(() => {
  return produtosEstoque.map(p => {
    const extra = incluirProducaoAgendada ? (mapaPorProduto[p.produto_id] || 0) : 0;
    return { ..., estoque_disponivel: p.estoque_disponivel + extra };
  });
}, [...]);
```

E em `EstoqueDisponivel.tsx` o ajuste só acontece se `incluirProducaoAgendada === true`.

## Mudanças

### 1. `ProjecaoProducaoTab.tsx`
- Mudar o default de `incluirProducaoAgendada` para **`true`**.
- Calcular `estoqueAjustado` sempre somando `mapaPorProduto`, independentemente do switch (o switch passa a apenas controlar o rótulo/visualização do card de Estoque Disponível, mas a Sugestão sempre considera).
- Passar `estoqueAjustado` (já com produção agendada somada) para `SugestaoProducao` — isso já é feito; basta garantir que o cálculo seja sempre aplicado.

### 2. `EstoqueDisponivel.tsx`
- Manter o switch como controle apenas visual (mostrar/ocultar quanto da produção agendada já está embutido), porém o estado padrão fica ligado.
- Alternativa mais simples e clara: **remover o switch** e sempre exibir o estoque disponível considerando produção agendada, ajustando o texto da `CardDescription` para "Saldo atual + produção agendada − expedição".

Vou pela alternativa simples (remover o switch), porque o comportamento "sem produção agendada" deixa de fazer sentido para o fluxo do usuário descrito.

### 3. `SugestaoProducao.tsx`
- Nenhuma mudança de lógica: ele já consome `estoqueDisponivel` recebido como prop. Como o pai sempre soma a produção agendada, a sugestão vai cair automaticamente após o agendamento.

### 4. Recarregamento
Já existe `recarregarProducaoAgendada` sendo chamado:
- após salvar nova produção via modal (`handleSalvarProducao`)
- após agendar em massa (`onAgendamentoCriado` no `SugestaoProducao`)

Vai garantir que `mapaPorProduto` se atualize e os cards recalculem imediatamente.

## Detalhe técnico de exibição

No card "Estoque Disponível", nos detalhes por produto, mostrar a composição na linha de subtítulo:

```
Saldo: X | Separado: Y | Agendado: Z | Necessário: W
```

Assim o usuário entende de onde vem o número final.

## Arquivos editados

- `src/components/pcp/ProjecaoProducaoTab.tsx` — default `true`, sempre aplicar produção agendada no `estoqueAjustado`, remover prop de controle do switch.
- `src/components/pcp/EstoqueDisponivel.tsx` — remover switch "Incluir prod. agendada", sempre considerar `producaoAgendada`, atualizar descrição e linha de detalhe por produto para mostrar "Agendado: Z".
