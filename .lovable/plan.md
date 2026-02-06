
# Plano: Integração com Lastlink via Webhook

## Visao Geral

Este plano implementa uma integracaoo segura com a Lastlink via webhook para ativar licencas de usuarios automaticamente apos a confirmacao de pagamento. A Lastlink enviara um evento `Purchase_Order_Confirmed` para a aplicacao, que identificara o usuario pelo email e ativara `has_license = true` na tabela `creator_profiles`.

## Fluxo Atual vs. Novo Fluxo

```text
FLUXO ATUAL (problematico):
Quiz -> Email -> Cria usuario/profile -> /premium/success?token=xxx -> Ativa has_license
        (inseguro: qualquer pessoa pode acessar a URL com token inventado)

NOVO FLUXO (seguro):
Quiz -> Email -> Cria usuario/profile (has_license=false)
                      |
                      v
              Checkout Lastlink
                      |
                      v
              Pagamento confirmado
                      |
                      v
         Lastlink envia webhook ->  Edge Function  -> Ativa has_license=true
                      |
                      v
              /premium/success (apenas confirmacao visual)
```

## Componentes a Implementar

### 1. Nova Edge Function: `lastlink-webhook`

Cria uma nova funcao serverless para receber webhooks da Lastlink.

**Arquivo**: `supabase/functions/lastlink-webhook/index.ts`

**Funcionalidades**:
- Validar token de autenticacao no header
- Processar evento `Purchase_Order_Confirmed`
- Encontrar usuario pelo email (Buyer.Email)
- Atualizar `has_license = true` na tabela `creator_profiles`
- Registrar eventos em nova tabela para auditoria

**Estrutura do payload Lastlink (Purchase_Order_Confirmed)**:
```json
{
  "Id": "uuid-do-evento",
  "IsTest": false,
  "Event": "Purchase_Order_Confirmed",
  "CreatedAt": "2025-10-15T22:10:57",
  "Data": {
    "Buyer": {
      "Email": "email-do-comprador@example.com",
      "Name": "Nome do Comprador"
    },
    "Purchase": {
      "PaymentId": "uuid-do-pagamento"
    }
  }
}
```

### 2. Nova Tabela: `lastlink_events`

Tabela para registrar todos os eventos recebidos da Lastlink para auditoria e debug.

**Colunas**:
- `id` (uuid, PK)
- `lastlink_event_id` (text) - ID unico do evento Lastlink
- `event_type` (text) - Tipo do evento (ex: Purchase_Order_Confirmed)
- `buyer_email` (text) - Email do comprador
- `payload` (jsonb) - Payload completo do webhook
- `processed` (boolean) - Se foi processado com sucesso
- `error_message` (text, nullable) - Mensagem de erro se falhou
- `created_at` (timestamptz)

### 3. Configuracao do Secret

Armazenar o token de autenticacao da Lastlink como secret:
- Nome: `LASTLINK_WEBHOOK_TOKEN`
- Valor: `cbbc80567b974493a7e7ef288954020e`

### 4. Alteracoes na PremiumSuccess Page

Remover a logica de ativacao de licenca do frontend. A pagina passa a ser apenas informativa:
- Mostra mensagem de sucesso do pagamento
- Orienta usuario a fazer login
- Nao modifica mais a tabela `creator_profiles`

## Detalhes Tecnicos

### Edge Function: Validacao e Processamento

```typescript
// Pseudocodigo da logica principal

// 1. Validar token no header
const token = req.headers.get("Authorization") || req.headers.get("x-webhook-token");
if (token !== expectedToken) {
  return 401 Unauthorized;
}

// 2. Parsear payload
const payload = await req.json();

// 3. Verificar tipo de evento
if (payload.Event !== "Purchase_Order_Confirmed") {
  return 200 OK; // Ignorar outros eventos
}

// 4. Extrair email do comprador
const buyerEmail = payload.Data?.Buyer?.Email;

// 5. Buscar usuario por email na auth.users (via admin API)
const { data: users } = await supabase.auth.admin.listUsers();
const user = users.users.find(u => u.email === buyerEmail);

// 6. Atualizar creator_profiles
await supabase
  .from("creator_profiles")
  .update({ has_license: true })
  .eq("user_id", user.id);

// 7. Registrar evento
await supabase
  .from("lastlink_events")
  .insert({ ... });
```

### Busca de Usuario por Email

Como o email do comprador vem da Lastlink, precisamos encontrar o usuario correspondente:

1. **Opcao A**: Usar `supabase.auth.admin.listUsers()` com filtro por email (requer service role key)
2. **Opcao B**: Buscar na tabela `quiz_responses` que ja armazena o email

Usaremos a **Opcao B** como fallback, pois:
- A tabela `quiz_responses` ja tem a coluna `email` e `user_id`
- E mais eficiente do que listar todos usuarios
- Fallback para admin API se nao encontrar

### Configuracao no Painel Lastlink

URL do webhook a ser configurada:
```
https://bficxnetrsuyzygutztn.supabase.co/functions/v1/lastlink-webhook
```

**Configuracoes**:
- Eventos: `Purchase_Order_Confirmed`
- Token: Adicionar no header de autenticacao

## Tarefas de Implementacao

1. **Criar secret LASTLINK_WEBHOOK_TOKEN**
   - Armazenar token fornecido pelo usuario

2. **Criar migracao de banco de dados**
   - Tabela `lastlink_events` para auditoria
   - RLS: apenas service role pode inserir/ler

3. **Criar edge function `lastlink-webhook`**
   - Validacao de token
   - Processamento do evento
   - Atualizacao de licenca
   - Registro de eventos

4. **Atualizar supabase/config.toml**
   - Adicionar configuracao da nova funcao

5. **Simplificar PremiumSuccess**
   - Remover logica de ativacao automatica
   - Manter apenas como pagina informativa

6. **Testes**
   - Testar webhook via Postman/curl
   - Verificar ativacao de licenca
   - Testar casos de erro (email nao encontrado, token invalido)

## Seguranca

- Token de webhook validado em todas as requisicoes
- Uso de service role key apenas no backend
- Registro de todos os eventos para auditoria
- Nenhuma ativacao de licenca possivel pelo frontend
- RLS na tabela de eventos previne acesso nao autorizado

## Configuracao na Lastlink

Apos a implementacao, o usuario devera:

1. Acessar Produtos > Selecionar Produto > Integracoes > Webhook
2. Criar novo webhook com:
   - Nome: "ThinkAndTalk License"
   - URL: `https://bficxnetrsuyzygutztn.supabase.co/functions/v1/lastlink-webhook`
   - Header de autenticacao: `x-webhook-token: cbbc80567b974493a7e7ef288954020e`
3. Selecionar evento: "Compra Completa" (Purchase_Order_Confirmed)
4. Salvar e testar
