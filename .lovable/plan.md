

# Fix: Erro "Algo deu errado" no site publicado

## Diagnostico

O erro e causado por **cache de modulos desatualizado** apos deploy. O navegador tenta carregar chunks JavaScript antigos (ex: `AuthPage.tsx`) que ja nao existem no servidor apos uma nova publicacao. O Vite gera nomes de arquivos com hash que mudam a cada build, mas o navegador ainda tem o HTML antigo em cache apontando para os arquivos anteriores.

A error boundary atual (`LazyErrorBoundary`) ja mostra o botao "Recarregar pagina", mas nao tenta recarregar automaticamente.

## Solucao

Melhorar o `LazyErrorBoundary` para **auto-reload automatico** quando detectar erro de dynamic import, evitando que o usuario veja a tela de erro:

### Alteracoes em `src/components/error/LazyErrorBoundary.tsx`:

1. Adicionar logica no `componentDidCatch` para auto-reload na primeira vez que detectar erro de dynamic import
2. Usar `sessionStorage` para evitar loop infinito de reloads (max 1 tentativa automatica)
3. Se o auto-reload ja foi tentado e falhou, mostrar a UI de erro com mensagem mais clara orientando o usuario a limpar cache

### Logica:
```
componentDidCatch:
  if (dynamic import error) {
    if (!sessionStorage.get('lazy-reload-attempted')) {
      sessionStorage.set('lazy-reload-attempted', 'true')
      window.location.reload()  // auto-reload
      return
    }
  }
  // se ja tentou, mostra UI de erro normal

handleRetry:
  sessionStorage.remove('lazy-reload-attempted')
  window.location.reload()
```

## Acao imediata para o usuario

Enquanto o fix nao e publicado: fazer **Ctrl+Shift+R** (hard refresh) no navegador para limpar o cache.

