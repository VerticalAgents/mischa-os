
# Plano: Redesign da Pagina de Login - Mischa's Bakery

## Objetivo
Atualizar a pagina de login para refletir a identidade visual da Mischa's Bakery, com fundo vermelho, logo do gato chef, e melhorias na experiencia do usuario.

---

## Mudancas Visuais

### 1. Fundo da Pagina
- **Antes**: `bg-gray-50` (cinza claro)
- **Depois**: Cor personalizada `#d1193a` (vermelho Mischa's Bakery)

### 2. Logo/Imagem de Perfil
- **Antes**: Icone de relogio roxo em um quadrado
- **Depois**: Imagem do gato chef com chapeu de cozinheiro (circular)
- Copiar imagem para `src/assets/mischas-logo.png`
- Usar como import ES6 para melhor bundling

### 3. Titulo e Subtitulo
- **Antes**: "Mischa's Bakery" (sem maiusculo padronizado)
- **Depois**: "MISCHA'S BAKERY LTDA" (tudo maiusculo)
- Centralizar ambos os textos (ja esta centralizado, garantir que permaneca)
- Ajustar cor do texto para branco (contraste com fundo vermelho)

### 4. Remocao do Login com Google
- Remover o separador "Ou"
- Remover o botao "Entrar com Google" da aba de login
- Remover o botao "Cadastrar com Google" da aba de cadastro
- Manter a funcao `handleGoogleLogin` pode ser removida tambem (limpeza de codigo)

### 5. Aba de Cadastro - Mensagem de Indisponibilidade
- Substituir o formulario de cadastro por uma mensagem informativa:
  - "Cadastro Indisponivel"
  - "No momento, nao e possivel realizar novos cadastros."
  - "O sistema ainda esta em fase de desenvolvimento."
- Estilizar com icone de alerta e texto amigavel

---

## Estrutura Visual Final

```text
+--------------------------------------------------+
|                                                  |
|          Fundo #d1193a (vermelho)                |
|                                                  |
|        +----------------------------+            |
|        |                            |            |
|        |      [Gato Chef Logo]      |            |
|        |      (imagem circular)     |            |
|        |                            |            |
|        |   MISCHA'S BAKERY LTDA     |            |
|        |     Sistema de Gestao      |            |
|        |                            |            |
|        |  [Entrar]    [Cadastrar]   |            |
|        |                            |            |
|        |  Aba Login:                |            |
|        |   - Email                  |            |
|        |   - Senha                  |            |
|        |   - Botao Entrar           |            |
|        |   (sem Google)             |            |
|        |                            |            |
|        |  Aba Cadastro:             |            |
|        |   - Mensagem de            |            |
|        |     indisponibilidade      |            |
|        |                            |            |
|        +----------------------------+            |
|                                                  |
+--------------------------------------------------+
```

---

## Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/auth/AuthPage.tsx` | Redesign completo: fundo, logo, textos, remover Google, mensagem cadastro |
| `src/assets/mischas-logo.png` | Copiar imagem do gato chef para assets |

---

## Detalhes Tecnicos

### Copiar Imagem
```bash
lov-copy user-uploads://Design_sem_nome_1.png src/assets/mischas-logo.png
```

### Import da Imagem
```typescript
import mischashLogo from '@/assets/mischas-logo.png';
```

### Estrutura do Header Atualizado
```tsx
<CardHeader className="text-center">
  <div className="flex justify-center mb-4">
    <img 
      src={mischasLogo} 
      alt="Mischa's Bakery Logo" 
      className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
    />
  </div>
  <CardTitle className="text-2xl text-gray-800">MISCHA'S BAKERY LTDA</CardTitle>
  <CardDescription className="text-gray-600">Sistema de Gestao</CardDescription>
</CardHeader>
```

### Aba Cadastro - Mensagem
```tsx
<TabsContent value="signup" className="space-y-4">
  <div className="text-center py-8 space-y-4">
    <div className="flex justify-center">
      <AlertCircle className="h-16 w-16 text-amber-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800">Cadastro Indisponivel</h3>
    <p className="text-muted-foreground text-sm">
      No momento, nao e possivel realizar novos cadastros.
    </p>
    <p className="text-muted-foreground text-sm">
      O sistema ainda esta em fase de desenvolvimento.
    </p>
  </div>
</TabsContent>
```

---

## Beneficios

1. **Identidade Visual**: Pagina de login alinhada com a marca Mischa's Bakery
2. **Experiencia Limpa**: Remocao de opcoes que nao funcionam (Google login)
3. **Comunicacao Clara**: Usuario sabe que cadastro nao esta disponivel
4. **Profissionalismo**: Visual mais polido e consistente com a marca
