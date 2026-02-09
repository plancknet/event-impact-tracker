

## Ajuste no botão "Começar a criar" da /premium/success

### Problema atual
O botão navega para `/?step=roteiro` apenas quando `activated` é `true`. Se `activated` for `false`, redireciona de volta para `/premium/success`, criando um loop.

### Solução
Alterar o botão para **sempre** navegar para `/?step=roteiro`. A rota `/` ja é protegida pelo `ProtectedRoute`, que:
- Redireciona para `/auth` se o usuário não estiver autenticado
- Redireciona para `/quiz?step=results` se não tiver licença

Isso garante o comportamento desejado sem lógica extra.

### Alteracao tecnica

**Arquivo:** `src/pages/PremiumSuccess.tsx`

Linha do botão (aproximadamente linha 168):
```tsx
// De:
onClick={() => navigate(activated ? "/?step=roteiro" : "/premium/success")}

// Para:
onClick={() => navigate("/?step=roteiro")}
```

Apenas uma linha precisa ser alterada.

