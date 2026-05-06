## Objetivo

Usar o mesmo layout compacto de 5 cards (Total Sem., Restantes, Confirmados, Previstos, Entregues) que hoje só aparece no modo representante (`repMode`) também no dashboard de admin.

## Alteração

Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx` (linhas ~957-1074)

- Remover o ternário `repMode ? (...) : (...)` que renderiza dois layouts distintos.
- Manter apenas o bloco compacto (atualmente dentro do ramo `repMode`):
  - Grid `grid-cols-2 md:grid-cols-5 gap-2`
  - Cards `p-2.5` com ícone + valor + label pequeno
  - Mesmas 5 métricas e cores já usadas
- Excluir o bloco grande (`Total da Semana`, `Agendamentos Restantes`, etc.) com `CardHeader/CardContent` e descrições longas.

Resultado: admin e representante passam a ver exatamente os mesmos cards compactos da imagem de referência.
