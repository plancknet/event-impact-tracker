
# Filtro por data e soma de cliques no checkout -- Analytics

## O que sera feito

1. **Filtro por range de data (De / Ate)**
   - Dois campos de data (usando o componente `DateFilter` ja existente) no topo da pagina, ao lado do titulo
   - Ao preencher as datas, a query ao banco filtra `session_started_at` pelo intervalo selecionado
   - Os dados recarregam automaticamente quando ambas as datas estao completas (10 caracteres cada)

2. **Card de cliques no checkout**
   - Novo card nos summary cards (grid passara de 4 para 5 colunas) com:
     - Total de cliques (botao 1 + botao 2)
     - Detalhe abaixo: "Botao 1: X | Botao 2: Y"
   - Icone: `MousePointerClick` do lucide-react

## Detalhes tecnicos

### `src/pages/QuizAnalytics.tsx`

- Adicionar estados `startDate` e `endDate` (strings no formato dd/mm/aaaa)
- Converter dd/mm/aaaa para ISO (aaaa-mm-dd) para usar no filtro `.gte()` e `.lte()` da query Supabase
- Re-fetch dos dados quando ambas as datas estiverem preenchidas (10 chars) -- useEffect com dependencia nas datas
- Na funcao `fetchResponses`, aplicar `.gte("session_started_at", isoStart)` e `.lte("session_started_at", isoEnd + "T23:59:59")` quando os filtros estiverem preenchidos
- Calcular `checkoutClicks` (contagem de `checkout_button_1_at` e `checkout_button_2_at` nao-nulos) a partir dos `responses` ja filtrados
- Adicionar o 5o card no grid com os totais
- Renderizar os dois `DateFilter` entre o titulo e os cards, com labels "De" e "Ate"
- Ajustar grid para `md:grid-cols-5`
