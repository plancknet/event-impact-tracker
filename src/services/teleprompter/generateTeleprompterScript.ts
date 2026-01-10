import { supabase } from "@/integrations/supabase/client";

export type TeleprompterNewsItem = {
  id: string;
  title: string;
  summary?: string | null;
  content?: string | null;
};

export type TeleprompterParameters = {
  tone: string;
  audience: string;
  language: string;
  duration: string;
  durationUnit: "minutes" | "words";
  scriptType: string;
  includeCta: boolean;
  ctaText?: string;
  // Extra metadata is persisted in parameters_json for this flow.
  profile?: Record<string, unknown>;
  complementaryPrompt?: string;
};

export type TeleprompterGenerationResult = {
  script: string;
  questions: string[];
};

export async function generateTeleprompterScript(
  newsItems: TeleprompterNewsItem[],
  parameters: TeleprompterParameters,
  options?: {
    refinementPrompt?: string;
    baseScript?: string;
    feedback?: { question: string; answer: string }[];
  },
): Promise<TeleprompterGenerationResult> {
  const { data, error } = await supabase.functions.invoke("generate-teleprompter-script", {
    body: {
      newsItems,
      parameters,
      complementaryPrompt: parameters.complementaryPrompt,
      refinementPrompt: options?.refinementPrompt,
      baseScript: options?.baseScript,
      feedback: options?.feedback,
    },
  });

  if (error) {
    throw error;
  }

  return {
    script: typeof data?.script === "string" ? data.script : "",
    questions: Array.isArray(data?.questions) ? data.questions : [],
  };
}

export async function fetchLatestTeleprompterScript(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("teleprompter_scripts")
    .select("script_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.script_text ?? null;
}
