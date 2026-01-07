import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsItems, parameters }: { newsItems: NewsItem[]; parameters: EditorialParameters } = await req.json();

    if (!newsItems || newsItems.length === 0) {
      throw new Error("Nenhuma notícia selecionada");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Build news context
    const newsContext = newsItems.map((news, index) => {
      let content = `### Notícia ${index + 1}\n`;
      content += `**Título:** ${news.title}\n`;
      if (news.summary) {
        content += `**Resumo:** ${news.summary}\n`;
      }
      if (news.content) {
        content += `**Conteúdo:** ${news.content}\n`;
      }
      return content;
    }).join('\n\n');

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

    const systemPrompt = `Você é um roteirista profissional especializado em criar textos para leitura em voz alta.

REGRAS ABSOLUTAS:
1. Retorne APENAS o texto do roteiro, sem explicações, comentários, listas ou formatação técnica
2. O texto deve ser escrito como será LIDO EM VOZ ALTA, como um teleprompter
3. NÃO invente fatos que não estejam nas notícias fornecidas
4. Insira marcações de pausa nos seguintes formatos:
   - <pause-short> para pausas breves (1-2 segundos) após frases importantes
   - <pause-medium> para pausas médias (3-4 segundos) entre tópicos
   - <pause-long> para pausas longas (5-6 segundos) entre notícias diferentes ou seções
5. Coloque pausas naturais onde um apresentador respiraria ou daria ênfase
6. O idioma do roteiro deve ser: ${parameters.language}

CONFIGURAÇÕES DO ROTEIRO:
- Tom: ${toneMap[parameters.tone] || parameters.tone}
- Público-alvo: ${audienceMap[parameters.audience] || parameters.audience}
- Tipo de roteiro: ${scriptTypeMap[parameters.scriptType] || parameters.scriptType}
- ${durationInstruction}
${ctaInstruction}

Escreva um roteiro contínuo, coeso e envolvente baseado nas notícias abaixo. Conecte as informações de forma natural, criando transições fluidas entre os assuntos.`;

    const userPrompt = `Com base nas seguintes notícias, crie o roteiro conforme as configurações acima:

${newsContext}

Lembre-se: retorne APENAS o texto do roteiro com as marcações de pausa. Nada mais.`;

    console.log("Gerando roteiro para", newsItems.length, "notícias");

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
    const scriptText = data.choices?.[0]?.message?.content || "";

    if (!scriptText) {
      throw new Error("A IA não retornou um roteiro válido");
    }

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: savedScript, error: saveError } = await supabase
      .from("teleprompter_scripts")
      .insert({
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
      scriptId: savedScript?.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro na função generate-teleprompter-script:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
