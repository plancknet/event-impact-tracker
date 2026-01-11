import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Security: Restrict CORS to allowed origins
const ALLOWED_ORIGINS = [
  'https://bficxnetrsuyzygutztn.lovableproject.com',
  'https://thinkandtalk.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace(/\/$/, ''))) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Input validation constants
const MAX_NEWS_ITEMS = 50;
const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 50000;
const MAX_PROMPT_LENGTH = 5000;

interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
}

interface EditorialParameters {
  tone: string;
  audience: string;
  language: string;
  duration: string;
  durationUnit: string;
  scriptType: string;
  includeCta: boolean;
  ctaText?: string;
}

// Input validation helper
function validateNewsItem(item: unknown, index: number): NewsItem {
  if (typeof item !== 'object' || item === null) {
    throw new Error(`News item ${index} is invalid`);
  }
  const obj = item as Record<string, unknown>;
  
  // Allow id to be string, number, or generate fallback
  let id: string;
  if (typeof obj.id === 'string' && obj.id.length > 0) {
    id = obj.id.slice(0, 100);
  } else if (typeof obj.id === 'number') {
    id = String(obj.id);
  } else {
    id = `item-${index}`;
  }
  
  // Allow title to be missing if content exists
  const title = typeof obj.title === 'string' 
    ? obj.title.slice(0, MAX_TITLE_LENGTH) 
    : (typeof obj.content === 'string' ? obj.content.slice(0, 100) : `Item ${index + 1}`);
  
  return {
    id,
    title,
    summary: typeof obj.summary === 'string' ? obj.summary.slice(0, MAX_CONTENT_LENGTH) : undefined,
    content: typeof obj.content === 'string' ? obj.content.slice(0, MAX_CONTENT_LENGTH) : undefined,
  };
}

function validateParameters(params: unknown): EditorialParameters {
  if (typeof params !== 'object' || params === null) {
    throw new Error('Invalid parameters');
  }
  const obj = params as Record<string, unknown>;
  
  const validTones = ['neutro', 'jornalistico', 'educativo', 'tecnico', 'humoristico', 'descontraido', 'storytelling'];
  const validAudiences = ['criancas', 'adolescentes', 'adultos', 'publico_geral', 'especialistas'];
  const validScriptTypes = ['video_curto', 'video_longo', 'telejornal', 'podcast', 'narracao_simples'];
  const validDurationUnits = ['minutes', 'words'];
  
  const tone = typeof obj.tone === 'string' && validTones.includes(obj.tone) ? obj.tone : 'neutro';
  const audience = typeof obj.audience === 'string' && validAudiences.includes(obj.audience) ? obj.audience : 'publico_geral';
  const scriptType = typeof obj.scriptType === 'string' && validScriptTypes.includes(obj.scriptType) ? obj.scriptType : 'narracao_simples';
  const durationUnit = typeof obj.durationUnit === 'string' && validDurationUnits.includes(obj.durationUnit) ? obj.durationUnit : 'minutes';
  
  return {
    tone,
    audience,
    language: typeof obj.language === 'string' ? obj.language.slice(0, 10) : 'pt-BR',
    duration: typeof obj.duration === 'string' ? obj.duration.slice(0, 10) : '3',
    durationUnit,
    scriptType,
    includeCta: obj.includeCta === true,
    ctaText: typeof obj.ctaText === 'string' ? obj.ctaText.slice(0, 500) : undefined,
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Validate authentication before processing
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verify user with anon key first
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Authenticated user:', user.id);

    const body = await req.json();
    
    // Validate and sanitize inputs
    const rawNewsItems = body.newsItems;
    const rawParameters = body.parameters;
    const refinementPrompt = typeof body.refinementPrompt === 'string' 
      ? body.refinementPrompt.slice(0, MAX_PROMPT_LENGTH) 
      : undefined;
    const baseScript = typeof body.baseScript === 'string' 
      ? body.baseScript.slice(0, MAX_CONTENT_LENGTH) 
      : undefined;
    const complementaryPrompt = typeof body.complementaryPrompt === 'string' 
      ? body.complementaryPrompt.slice(0, MAX_PROMPT_LENGTH) 
      : undefined;
    
    // Validate feedback array
    let feedback: { question: string; answer: string }[] | undefined;
    if (Array.isArray(body.feedback)) {
      feedback = body.feedback
        .slice(0, 10)
        .filter((f: unknown) => 
          typeof f === 'object' && f !== null &&
          typeof (f as Record<string, unknown>).question === 'string' &&
          typeof (f as Record<string, unknown>).answer === 'string'
        )
        .map((f: Record<string, unknown>) => ({
          question: String(f.question).slice(0, 500),
          answer: String(f.answer).slice(0, 1000),
        }));
    }

    // Validate news items array
    let newsItems: NewsItem[] = [];
    if (Array.isArray(rawNewsItems)) {
      if (rawNewsItems.length > MAX_NEWS_ITEMS) {
        throw new Error(`Too many news items. Maximum is ${MAX_NEWS_ITEMS}`);
      }
      newsItems = rawNewsItems.map((item, index) => validateNewsItem(item, index));
    }

    // Validate parameters
    const parameters = validateParameters(rawParameters);

    if (newsItems.length === 0) {
      if (!complementaryPrompt || !complementaryPrompt.trim()) {
        throw new Error("Nenhuma noticia selecionada e nenhum prompt complementar informado");
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Build news context
    const newsContext = newsItems.length > 0
      ? newsItems.map((news, index) => {
          let content = `### Noticia ${index + 1}\n`;
          content += `**Titulo:** ${news.title}\n`;
          if (news.summary) {
            content += `**Resumo:** ${news.summary}\n`;
          }
          if (news.content) {
            content += `**Conteudo:** ${news.content}\n`;
          }
          return content;
        }).join('\n\n')
      : "Nenhuma noticia selecionada.";

    // Build duration instruction
    let durationInstruction = '';
    if (parameters.durationUnit === 'minutes') {
      durationInstruction = `O roteiro deve ter duração aproximada de ${parameters.duration} minutos quando lido em voz alta (considerando ritmo de apresentador profissional).`;
    } else {
      durationInstruction = `O roteiro deve ter aproximadamente ${parameters.duration} palavras.`;
    }

    // Build tone mapping
    const toneMap: Record<string, string> = {
      'neutro': 'neutro e objetivo, sem opiniões pessoais',
      'jornalistico': 'jornalístico e formal, como um telejornal tradicional',
      'educativo': 'educativo e didático, explicando conceitos de forma clara',
      'tecnico': 'técnico e preciso, usando terminologia especializada quando apropriado',
      'humoristico': 'leve e bem-humorado, mantendo a informação mas com toques de humor',
      'descontraido': 'descontraido e informal, com linguagem leve e natural',
      'storytelling': 'narrativo e envolvente, contando a história de forma cativante',
    };

    // Build audience mapping
    const audienceMap: Record<string, string> = {
      'criancas': 'crianças (linguagem simples, explicações básicas)',
      'adolescentes': 'adolescentes (linguagem acessível e dinâmica)',
      'adultos': 'adultos (linguagem madura e direta)',
      'publico_geral': 'público geral (linguagem universal e acessível)',
      'especialistas': 'especialistas na área (pode usar jargões e conceitos avançados)',
    };

    // Build script type mapping
    const scriptTypeMap: Record<string, string> = {
      'video_curto': 'vídeo curto para redes sociais (dinâmico, direto ao ponto)',
      'video_longo': 'vídeo longo para YouTube (mais detalhado, com desenvolvimento)',
      'telejornal': 'telejornal (formal, pausas naturais, entonação jornalística)',
      'podcast': 'podcast (conversacional, como se estivesse dialogando com o ouvinte)',
      'narracao_simples': 'narração simples (leitura fluida e clara)',
    };

    const ctaInstruction = parameters.includeCta && parameters.ctaText 
      ? `Inclua ao final uma chamada para ação (CTA) baseada em: "${parameters.ctaText}"`
      : '';

    let systemPrompt: string;
    let userPrompt: string;

    // Check if this is a refinement request
    const isRefinement = refinementPrompt && baseScript;

    if (isRefinement) {
      // Refinement mode: focus on modifying the existing script
      systemPrompt = `Você é um editor profissional especializado em refinar roteiros para leitura em voz alta.

TAREFA: Modificar o roteiro existente conforme as instruções do usuário.

REGRAS ABSOLUTAS PARA REFINAMENTO:
0. Retorne um JSON valido com as chaves "script" e "questions"
1. O roteiro refinado DEVE ser baseado no texto original fornecido
2. Mantenha a MAIOR PARTE do texto original - faça APENAS as alterações solicitadas
3. Preserve a estrutura geral, ordem dos tópicos e marcações de pausa existentes
4. NÃO adicione informações que não estejam no texto original ou nas notícias
5. Retorne o roteiro COMPLETO com as edições aplicadas
6. Mantenha as marcações de pausa: <pause-short>, <pause-medium>, <pause-long>, <topic-change>
7. O idioma do roteiro deve ser mantido: ${parameters.language}
8. Gere exatamente 3 perguntas sobre a opiniao pessoal do usuario sobre o texto

FORMATO DE SAIDA (JSON):
{
  "script": "...",
  "questions": ["Pergunta 1", "Pergunta 2", "Pergunta 3"]
}`;

      userPrompt = `ROTEIRO ATUAL (você DEVE partir deste texto):
---
${baseScript}
---

INSTRUÇÕES DE MODIFICAÇÃO DO USUÁRIO:
${refinementPrompt}

CONTEXTO DAS NOTÍCIAS ORIGINAIS (apenas para referência):
${newsContext}

Por favor, aplique as modificações solicitadas ao roteiro acima e retorne o roteiro completo refinado. Retorne apenas o JSON solicitado.`;

    } else {
      // Generation mode: create new script from scratch
      systemPrompt = `Você é um roteirista profissional especializado em criar textos para leitura em voz alta.

REGRAS ABSOLUTAS:
1. Retorne um JSON valido com as chaves "script" e "questions"
2. O texto deve ser escrito como será LIDO EM VOZ ALTA, como um teleprompter
3. NÃO invente fatos que não estejam nas notícias fornecidas
4. Insira marcações de pausa nos seguintes formatos:
   - <pause-short> para pausas breves (1-2 segundos) após frases importantes
   - <pause-medium> para pausas médias (3-4 segundos) entre tópicos
   - <pause-long> para pausas longas (5-6 segundos) entre notícias diferentes ou seções
5. Insira <topic-change> sempre que houver mudanca de assunto (entre noticias ou blocos distintos)
6. Coloque pausas naturais onde um apresentador respiraria ou daria enfase
7. O idioma do roteiro deve ser: ${parameters.language}
8. Gere exatamente 3 perguntas sobre a opiniao pessoal do usuario sobre o texto
9. Use o prompt complementar do usuario como guia principal, se fornecido
10. Use as noticias como contexto quando estiverem disponiveis, sem se limitar a elas

FORMATO DE SAIDA (JSON):
{
  "script": "...",
  "questions": ["Pergunta 1", "Pergunta 2", "Pergunta 3"]
}`;

      // Build detailed user prompt with all configurations
      const configDetails = `
=== CONFIGURAÇÕES OBRIGATÓRIAS DO ROTEIRO ===

🎭 TOM E ESTILO: ${toneMap[parameters.tone] || parameters.tone}
   - Escreva TODO o texto neste tom específico

🧑 PÚBLICO-ALVO: ${audienceMap[parameters.audience] || parameters.audience}
   - Adapte a linguagem, vocabulário e complexidade para este público

🌍 IDIOMA: ${parameters.language}
   - O roteiro DEVE ser escrito inteiramente neste idioma

⏱️ DURAÇÃO: ${durationInstruction}
   - ESTA É UMA REGRA CRÍTICA: o roteiro DEVE ter exatamente esta duração
   - ${parameters.durationUnit === 'minutes' 
       ? `Para ${parameters.duration} minutos, escreva aproximadamente ${parseInt(parameters.duration) * 150} palavras (considerando 150 palavras/minuto)`
       : `Conte as palavras e garanta que o texto tenha ${parameters.duration} palavras`}

🎥 TIPO DE ROTEIRO: ${scriptTypeMap[parameters.scriptType] || parameters.scriptType}
   - Adapte o formato, ritmo e estrutura para este tipo de conteúdo

${parameters.includeCta && parameters.ctaText ? `📣 CHAMADA PARA AÇÃO (CTA): ${parameters.ctaText}
   - Inclua esta CTA de forma natural ao final do roteiro` : ''}

=== FIM DAS CONFIGURAÇÕES ===
`;

      userPrompt = `${configDetails}

Com base nas CONFIGURAÇÕES OBRIGATÓRIAS acima e nas seguintes notícias, crie o roteiro:

${newsContext}

IMPORTANTE: 
- Siga RIGOROSAMENTE todas as configurações especificadas acima
- A duração é OBRIGATÓRIA: ${durationInstruction}
- Retorne APENAS o JSON solicitado.`;
    }

    const extraPrompt =
      complementaryPrompt ||
      (parameters as unknown as { complementaryPrompt?: string })?.complementaryPrompt;
    if (extraPrompt && typeof extraPrompt === "string" && extraPrompt.trim()) {
      userPrompt += `\n\nPrompt complementar do usuario (aplicar obrigatoriamente):\n${extraPrompt.trim()}\n`;
    }

    if (feedback && feedback.length > 0) {
      const feedbackText = feedback
        .filter((item) => item.question && item.answer)
        .map((item, index) => `${index + 1}) Q: ${item.question}\nA: ${item.answer}`)
        .join("\n");
      if (feedbackText) {
        userPrompt += `\n\nRespostas do usuario sobre o texto:\n${feedbackText}\n\nConsidere essas respostas ao ajustar o roteiro.`;
      }
    }

    console.log(isRefinement ? "Refinando roteiro existente" : "Gerando novo roteiro para", newsItems.length, "notícias");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Erro na API:", response.status, errorText);
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    let scriptText = rawContent;
    let questions: string[] = [];

    const cleaned = rawContent.trim().replace(/^```json/i, "```").replace(/^```/, "").replace(/```$/, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.script === "string") {
          scriptText = parsed.script;
        }
        if (Array.isArray(parsed.questions)) {
          questions = parsed.questions.filter((q: unknown) => typeof q === "string").slice(0, 3);
        }
      }
    } catch {
      // Fallback to raw content if JSON parsing fails
    }

    if (!scriptText) {
      throw new Error("A IA não retornou um roteiro válido");
    }

    // Save to database using service role (after authentication is verified)
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: savedScript, error: saveError } = await supabase
      .from("teleprompter_scripts")
      .insert({
        user_id: user.id, // Now we have verified user from auth
        news_ids_json: newsItems.map(n => n.id),
        parameters_json: parameters,
        script_text: scriptText,
        raw_ai_response: JSON.stringify(data),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Erro ao salvar roteiro:", saveError);
      // Still return the script even if saving fails
    }
    console.log("Roteiro gerado com sucesso:", scriptText.length, "caracteres");

    return new Response(JSON.stringify({ 
      script: scriptText,
      scriptId: savedScript?.id,
      questions,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro na função generate-teleprompter-script:", error);
    const origin = req.headers.get('origin');
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
    });
  }
});
