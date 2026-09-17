# Mischa OS no WhatsApp — extensão do navegador

> **Esta pasta não é do app web. Não edite pelo Lovable.**
> Ela é compilada à parte e nada em `src/` importa daqui. A dependência é de mão
> única: `extension/` importa de `src/`, nunca o contrário.

Um painel lateral do Brave/Chrome que mostra, ao lado da conversa do WhatsApp Web, os dados
daquele cliente no Mischa OS. **Só lê e escreve texto na caixa de digitação — nunca envia
mensagem.**

## Como gerar e instalar

```
npm run build:extension
```

1. Abra `brave://extensions` (ou `chrome://extensions`)
2. Ligue o **Modo do desenvolvedor**, canto superior direito
3. **Carregar sem compactação** → escolha a pasta `dist-extension`
4. Abra `web.whatsapp.com` e clique no ícone da extensão: o painel abre à direita

Depois de cada `npm run build:extension` novo: clique no ⟳ do card da extensão e dê F5 na aba
do WhatsApp.

## O que não pode sumir do `package.json`

O Lovable reescreve o `package.json` quando instala ou remove biblioteca. Se a extensão parar
de compilar, confira se estes três itens continuam lá:

- script `"build:extension": "node extension/build.mjs"`
- script `"test": "vitest run"`
- devDependencies `vitest` e `@types/chrome`

## As três peças

| Peça | Onde roda | O que faz |
|---|---|---|
| `src/content/` | dentro da aba do WhatsApp | percebe qual conversa está aberta e escreve texto na caixa |
| `src/background/` | em segundo plano | liga o painel ao clicar no ícone, só em abas do WhatsApp |
| `src/panel/` | painel lateral | a interface e todo o acesso ao Supabase |

Regras que não se quebram:

- **Supabase só no painel.** Content script apanha de CORS.
- **Nada de injetar script no mundo da página** (wa-js, moduleRaid). É o que fez o WhatsApp
  derrubar 131 extensões em 2025.
- **Todo o acoplamento com o HTML do WhatsApp mora em `src/content/whatsapp-dom.ts`.** Quando
  o WhatsApp mudar o site, é esse arquivo que se conserta — e só ele.
- **Nunca disparar Enter nem clicar em enviar.** Quem manda a mensagem é o Lucca.
