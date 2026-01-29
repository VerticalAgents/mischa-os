
# Plano: Corrigir Badges do Calendário Semanal Quebrando em Duas Linhas

## Problema Identificado
Os badges que mostram "X Confirmados" estão quebrando o texto em duas linhas (número em cima, "Confirmados" embaixo) devido à largura restrita das colunas do grid de 7 dias. O texto "Confirmados" é mais longo que "Previstos", causando comportamento inconsistente.

## Solução
Adicionar `whitespace-nowrap` aos badges para impedir a quebra de linha e ajustar o tamanho do texto para garantir que caiba na largura da coluna.

---

## Alterações Necessárias

### Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx`

### Localização: Linhas 933-938 (Badges do Calendário Semanal)

### Código Atual:
```tsx
{dia.previstos > 0 && <Badge variant="outline" className="text-xs w-full bg-amber-100 rounded-none">
    {dia.previstos} Previstos
  </Badge>}
{dia.confirmados > 0 && <Badge variant="default" className="text-xs w-full bg-green-500">
    {dia.confirmados} Confirmados
  </Badge>}
```

### Novo Código:
```tsx
{dia.previstos > 0 && <Badge variant="outline" className="text-[10px] w-full bg-amber-100 rounded-none whitespace-nowrap justify-center">
    {dia.previstos} Previstos
  </Badge>}
{dia.confirmados > 0 && <Badge variant="default" className="text-[10px] w-full bg-green-500 whitespace-nowrap justify-center">
    {dia.confirmados} Confirmados
  </Badge>}
```

---

## Detalhes das Mudanças

| Classe | Propósito |
|--------|-----------|
| `whitespace-nowrap` | Impede que o texto quebre em múltiplas linhas |
| `text-[10px]` | Reduz o tamanho da fonte de `text-xs` (12px) para 10px, garantindo que "X Confirmados" caiba na largura da coluna |
| `justify-center` | Centraliza o conteúdo do badge horizontalmente |

---

## Comparação Visual

**Antes:**
```
+-------------+
|     10      |
| Confirmados |
+-------------+
```

**Depois:**
```
+----------------+
| 10 Confirmados |
+----------------+
```

---

## Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/agendamento/AgendamentoDashboard.tsx` | Adicionar `whitespace-nowrap`, `justify-center` e ajustar tamanho da fonte nos badges |

---

## Resultado Esperado
- Badges sempre exibem número e texto na mesma linha
- Layout do grid de 7 dias permanece intacto
- Consistência visual entre "Previstos" e "Confirmados"
