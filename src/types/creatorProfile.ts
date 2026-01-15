// Creator profile type and options for onboarding and script generation

export interface CreatorProfile {
  id?: string;
  user_id?: string;
  display_name?: string | null;
  main_topic: string;
  expertise_level: string;
  audience_type: string;
  audience_pain_points?: string[] | null;
  audience_age_min?: number;
  audience_age_max?: number;
  audience_gender_split?: number;
  video_type: string;
  target_duration: string;
  duration_unit: "minutes" | "words";
  platform: string;
  speaking_tone: string;
  energy_level: string;
  content_goal: string;
  news_language: string;
  script_language: string;
  include_cta: boolean;
  cta_template?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_CREATOR_PROFILE: CreatorProfile = {
  main_topic: "Tecnologia",
  expertise_level: "intermediario",
  audience_type: "publico_geral",
  audience_pain_points: [],
  audience_age_min: 15,
  audience_age_max: 65,
  audience_gender_split: 50,
  video_type: "video_curto",
  target_duration: "3",
  duration_unit: "minutes",
  platform: "YouTube",
  speaking_tone: "conversacional",
  energy_level: "medio",
  content_goal: "informar",
  news_language: "pt-BR",
  script_language: "Portuguese",
  include_cta: true,
  cta_template: null,
};

export const EXPERTISE_OPTIONS = [
  { value: "iniciante", label: "Iniciante", description: "Começando na área" },
  { value: "intermediario", label: "Intermediário", description: "Experiência moderada" },
  { value: "avancado", label: "Avançado", description: "Conhecimento profundo" },
  { value: "especialista", label: "Especialista", description: "Referência na área" },
];

export const AUDIENCE_TYPE_OPTIONS = [
  { value: "publico_geral", label: "Público geral", description: "Audiência ampla" },
  { value: "criadores", label: "Criadores", description: "Criadores de conteúdo" },
  { value: "empreendedores", label: "Empreendedores", description: "Donos de negócio" },
  { value: "estudantes", label: "Estudantes", description: "Pessoas em aprendizado" },
  { value: "profissionais", label: "Profissionais", description: "Trabalhadores da área" },
  { value: "investidores", label: "Investidores", description: "Pessoas com capital" },
];

export const VIDEO_TYPE_OPTIONS = [
  { value: "video_curto", label: "Vídeo curto (Reels/Shorts)", description: "Até 60 segundos" },
  { value: "video_medio", label: "Vídeo médio", description: "1-5 minutos" },
  { value: "video_longo", label: "Vídeo longo", description: "Mais de 5 minutos" },
  { value: "podcast", label: "Podcast", description: "Áudio longo" },
  { value: "live", label: "Live/Transmissão", description: "Ao vivo" },
];

export const DURATION_OPTIONS = [
  { value: "1", label: "1 minuto" },
  { value: "2", label: "2 minutos" },
  { value: "3", label: "3 minutos" },
  { value: "5", label: "5 minutos" },
  { value: "10", label: "10 minutos" },
];

export const PLATFORM_OPTIONS = [
  { value: "YouTube", label: "YouTube" },
  { value: "Instagram", label: "Instagram" },
  { value: "TikTok", label: "TikTok" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Twitter", label: "Twitter/X" },
  { value: "Podcast", label: "Podcast" },
];

export const TONE_OPTIONS = [
  { value: "conversacional", label: "Conversacional", description: "Tom amigável" },
  { value: "profissional", label: "Profissional", description: "Tom formal" },
  { value: "entusiasmado", label: "Entusiasmado", description: "Tom animado" },
  { value: "didatico", label: "Didático", description: "Tom educativo" },
  { value: "humoristico", label: "Humorístico", description: "Tom divertido" },
  { value: "inspirador", label: "Inspirador", description: "Tom motivacional" },
  { value: "jornalistico", label: "Jornalístico", description: "Tom informativo" },
];

export const ENERGY_OPTIONS = [
  { value: "baixo", label: "Baixa energia", description: "Calmo e tranquilo" },
  { value: "medio", label: "Média energia", description: "Equilibrado" },
  { value: "alto", label: "Alta energia", description: "Dinâmico e intenso" },
];

export const GOAL_OPTIONS = [
  { value: "informar", label: "Informar", description: "Compartilhar notícias" },
  { value: "educar", label: "Educar", description: "Ensinar conceitos" },
  { value: "entreter", label: "Entreter", description: "Divertir audiência" },
  { value: "inspirar", label: "Inspirar", description: "Motivar pessoas" },
  { value: "vender", label: "Vender", description: "Promover produtos" },
  { value: "engajar", label: "Engajar", description: "Criar comunidade" },
];

export const LANGUAGE_OPTIONS = [
  { value: "Portuguese", label: "Português" },
  { value: "English", label: "Inglês" },
  { value: "Spanish", label: "Espanhol" },
  { value: "French", label: "Francês" },
  { value: "German", label: "Alemão" },
  { value: "Italian", label: "Italiano" },
];

export const NEWS_LANGUAGE_OPTIONS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "Inglês (EUA)" },
  { value: "en-GB", label: "Inglês (UK)" },
  { value: "es-ES", label: "Espanhol" },
  { value: "fr-FR", label: "Francês" },
  { value: "de-DE", label: "Alemão" },
  { value: "it-IT", label: "Italiano" },
];

