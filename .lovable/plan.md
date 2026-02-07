

# Plano: Senha Padrao e Criacao de Usuario Apenas Apos Pagamento

## Resumo

Este plano reverte a senha para "12345678" e garante que usuarios so sejam criados apos o recebimento do pagamento via webhook Lastlink.

## Alteracoes Necessarias

### 1. Edge Function `lastlink-webhook`

**Arquivo**: `supabase/functions/lastlink-webhook/index.ts`

**Mudanca**: Substituir a geracao de senha aleatoria pela senha padrao "12345678".

**Antes (linha 11-14)**:
```typescript
const generateSecurePassword = () => {
  return crypto.randomUUID() + crypto.randomUUID();
};
```

**Depois**:
```typescript
const DEFAULT_PASSWORD = "12345678";
```

**Na linha 74**: Trocar `password: securePassword` por `password: DEFAULT_PASSWORD`.

### 2. Pagina Quiz - Remover Criacao de Usuario

**Arquivo**: `src/pages/Quiz.tsx`

**Mudanca**: Remover a logica de `signUp` no `handleEmailSubmit`. O quiz deve apenas:
- Salvar o email na tabela `quiz_responses`
- Armazenar o perfil em `sessionStorage` para uso posterior
- Nao criar usuario

**O que sera removido (linhas 473-509)**:
- Geracao de senha aleatoria
- Chamada `supabase.auth.signUp`
- Tratamento de erro de usuario existente
- Toda a logica de criacao de conta

**O que permanece**:
- Salvar email na `quiz_responses` (ja existe)
- Guardar `draftCreatorProfile` em `sessionStorage` (ja existe)
- Redirecionar para checkout

### 3. Fluxo Resultante

```text
FLUXO APOS ALTERACOES:

1. Usuario faz quiz
2. Informa email -> Salvo em quiz_responses (sem criar conta)
3. Clica no botao de checkout -> Vai para Lastlink
4. Completa pagamento
5. Lastlink envia webhook -> Edge Function:
   - Se usuario NAO existe: cria com senha "12345678"
   - Se usuario JA existe: apenas ativa licenca
6. creator_profiles.has_license = true
7. Usuario acessa /auth e faz login com senha "12345678"
8. Sistema detecta must_change_password e solicita troca
```

## Detalhes Tecnicos

### Quiz.tsx - handleEmailSubmit simplificado

A funcao `handleEmailSubmit` sera simplificada para:

```typescript
const handleEmailSubmit = async (submittedEmail: string) => {
  setEmail(submittedEmail);
  
  // Salvar email no quiz
  if (quizId) {
    await supabase
      .from("quiz_responses")
      .update({ 
        email: submittedEmail,
        completed_at: getSaoPauloTimestamp(),
        reached_results: true,
      })
      .eq("id", quizId);
  }

  // Guardar perfil para uso apos login
  const creatorProfilePayload = buildCreatorProfileFromQuiz(answers);
  sessionStorage.setItem("draftCreatorProfile", JSON.stringify(creatorProfilePayload));
  sessionStorage.setItem("pendingQuizEmail", submittedEmail);
  
  setStep("results");
};
```

### Remocao de codigo desnecessario

- Funcao `generateSecurePassword` no Quiz.tsx (linha 60-63)
- Toda logica de `signUp` e tratamento de erros (linhas 473-530+)
- Funcao `upsertProfileAndLinkQuiz` pode ser simplificada ou removida

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/lastlink-webhook/index.ts` | Trocar senha aleatoria por "12345678" |
| `src/pages/Quiz.tsx` | Remover criacao de usuario, manter apenas captura de email |

## Consideracoes de Seguranca

Usar senha padrao "12345678" significa que:
- Usuarios devem ser orientados a trocar a senha no primeiro login
- A flag `must_change_password: true` continuara sendo definida
- A pagina `/auth` deve continuar verificando essa flag

