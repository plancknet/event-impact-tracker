

# Plano: Visual e Transicoes Estilo BetterMe

## Visao Geral

Este plano transforma o quiz do ThinkAndTalk para ter o visual limpo e as transicoes fluidas do BetterMe, mantendo a identidade visual existente com cores roxo/azul.

---

## Principais Mudancas de Design

### 1. Primeira Tela - Selecao de Idade com Cards de Imagem

Inspirado diretamente no BetterMe, a primeira pergunta (idade) sera apresentada como cards visuais com:
- Grid de cards com imagens de personas (ja existentes em `/public/imgs/`)
- Overlay com label de idade na parte inferior do card (estilo pill rosa do BetterMe)
- Hover suave com escala e sombra
- Transicao de entrada escalonada (staggered animation)

```text
+------------------+  +------------------+
|                  |  |                  |
|    [Persona]     |  |    [Persona]     |
|                  |  |                  |
+--[ 18-24     > ]-+  +--[ 25-34     > ]-+

+------------------+  +------------------+
|                  |  |                  |
|    [Persona]     |  |    [Persona]     |
|                  |  |                  |
+--[ 35-44     > ]-+  +--[ 45+       > ]-+
```

### 2. Transicoes Entre Perguntas

Atualmente usa `animate-fade-in`. Sera aprimorado para:

- **Slide horizontal**: Proxima pergunta desliza da direita, anterior sai pela esquerda
- **Timing**: 350ms com curva `cubic-bezier(0.4, 0, 0.2, 1)`
- **Fade combinado**: Opacidade muda junto com o slide para efeito mais suave
- **Direcao dinamica**: Ao voltar, animacao inverte (direita para esquerda)

### 3. Opcoes de Resposta - Design BetterMe

Cards de opcao mais limpos:
- Fundo branco puro com borda sutil
- Icone a esquerda em circulo colorido
- Texto centralizado verticalmente
- Ao selecionar: borda roxa, fundo levemente tintado
- Checkmark animado aparece suavemente

### 4. Layout e Espacamento

- Header mais compacto e fixo
- Barra de progresso mais fina e elegante
- Mais espaco vertical entre elementos
- Tipografia com hierarquia mais clara

---

## Detalhes Tecnicos

### Novas Animacoes CSS (tailwind.config.ts e index.css)

```css
/* Slide horizontal */
@keyframes slide-in-from-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-out-to-left {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
}

@keyframes slide-in-from-left {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-out-to-right {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

/* Staggered fade para opcoes */
@keyframes stagger-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Componentes a Modificar

| Componente | Mudancas |
|------------|----------|
| `QuizQuestion.tsx` | Novo layout de cards, animacoes staggered nas opcoes, transicao de slide |
| `Quiz.tsx` | Controle de direcao da animacao, estado de transicao |
| `QuizAgeHighlight.tsx` | Transicao suave de entrada/saida |
| `QuizMidMessage.tsx` | Animacao de entrada mais elaborada |
| `QuizProcessing.tsx` | Manter estilo atual (ja esta bom) |
| `QuizTransition.tsx` | Manter estilo atual |
| `QuizCoupon.tsx` | Transicao de entrada mais suave |
| `QuizEmailCapture.tsx` | Animacao de entrada mais fluida |
| `QuizResults.tsx` | Entrance animation mais elaborada |

### Novo Componente: QuizAgeCards.tsx

Card visual especifico para a pergunta de idade, com:
- Imagem da persona ocupando todo o card
- Overlay gradient na parte inferior
- Label com faixa etaria e seta
- Efeito hover com scale e shadow

### Atualizacoes de Estilo

**Cores (manter as existentes, ajustar tons)**
- Background: `#f8f9fc` (mais neutro)
- Cards: `#ffffff` com sombra sutil
- Borda selecionada: gradiente azul-roxo
- Texto: contraste mais forte

**Tipografia**
- Titulos: 600 weight, 1.75rem mobile / 2rem desktop
- Subtitulos: 400 weight, cor muted
- Opcoes: 500 weight

---

## Implementacao por Etapa

### Etapa 1: Animacoes Base
1. Adicionar keyframes de slide no `index.css`
2. Configurar classes de animacao no `tailwind.config.ts`
3. Criar utility classes para transicoes

### Etapa 2: Componente de Cards de Idade
1. Criar `QuizAgeCards.tsx` com grid de imagens
2. Usar imagens existentes de personas
3. Overlay com label estilo BetterMe
4. Integrar com primeira pergunta do quiz

### Etapa 3: Transicoes de Perguntas
1. Modificar `Quiz.tsx` para controlar estado de transicao
2. Implementar slide direction baseado em navegacao
3. Aplicar animacao de exit/enter em `QuizQuestion.tsx`

### Etapa 4: Opcoes de Resposta
1. Redesenhar cards de opcao com visual mais limpo
2. Animacao staggered para opcoes aparecerem sequencialmente
3. Feedback visual aprimorado ao selecionar

### Etapa 5: Telas Intermediarias
1. Aplicar transicoes suaves em `QuizAgeHighlight`
2. Animar entrada de `QuizMidMessage`
3. Melhorar fluidez entre todas as etapas

### Etapa 6: Polimento Final
1. Ajustar timing de todas as animacoes
2. Testar em mobile e desktop
3. Verificar performance das animacoes
4. Garantir acessibilidade (prefers-reduced-motion)

---

## Arquivos Afetados

- `src/index.css` - Novas keyframes e utility classes
- `tailwind.config.ts` - Configuracao de animacoes
- `src/components/quiz/QuizQuestion.tsx` - Layout e animacoes
- `src/components/quiz/QuizAgeCards.tsx` - Novo componente
- `src/pages/Quiz.tsx` - Controle de transicoes
- `src/components/quiz/QuizAgeHighlight.tsx` - Transicoes
- `src/components/quiz/QuizMidMessage.tsx` - Transicoes
- `src/components/quiz/QuizCoupon.tsx` - Transicoes
- `src/components/quiz/QuizEmailCapture.tsx` - Transicoes
- `src/components/quiz/QuizResults.tsx` - Transicoes

---

## Consideracoes de Performance

- Usar `transform` e `opacity` para animacoes (GPU-accelerated)
- Evitar animacoes em propriedades que causam reflow
- Implementar `will-change` seletivamente
- Respeitar `prefers-reduced-motion` para acessibilidade

## Resultado Esperado

Quiz com visual premium estilo BetterMe:
- Primeira tela impactante com cards visuais
- Transicoes horizontais fluidas entre perguntas
- Opcoes com animacao staggered
- Feedback visual refinado em todas as interacoes
- Experiencia mobile-first otimizada

