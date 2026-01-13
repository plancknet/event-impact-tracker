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
  { value: "iniciante", label: "Iniciante", description: "Come?ando na ?rea" },
  { value: "intermediario", label: "Intermedi?rio", description: "Experi?ncia moderada" },
  { value: "avancado", label: "Avan?ado", description: "Conhecimento profundo" },
  { value: "especialista", label: "Especialista", description: "Refer?ncia na ?rea" },
];

export const AUDIENCE_TYPE_OPTIONS = [
  { value: "publico_geral", label: "P?blico geral", description: "Audi?ncia ampla" },
  { value: "criadores", label: "Criadores", description: "Criadores de conte?do" },
  { value: "empreendedores", label: "Empreendedores", description: "Donos de neg?cio" },
  { value: "estudantes", label: "Estudantes", description: "Pessoas em aprendizado" },
  { value: "profissionais", label: "Profissionais", description: "Trabalhadores da ?rea" },
  { value: "investidores", label: "Investidores", description: "Pessoas com capital" },
];

export const VIDEO_TYPE_OPTIONS = [
  { value: "video_curto", label: "V?deo curto (Reels/Shorts)", description: "At? 60 segundos" },
  { value: "video_medio", label: "V?deo m?dio", description: "1-5 minutos" },
  { value: "video_longo", label: "V?deo longo", description: "Mais de 5 minutos" },
  { value: "podcast", label: "Podcast", description: "?udio longo" },
  { value: "live", label: "Live/Transmiss?o", description: "Ao vivo" },
];

export const DURATION_OPTIONS = [
  { value: "1", label: "1 minuto" },
  { value: "2", label: "2 minutos" },
  { value: "3", label: "3 minutos" },
  { value: "5", label: "5 minutos" },
  { value: "10", label: "10 minutos" },
];

export const PLATFORM_OPTIONS = [
  { value: "YouTube", label: "YouTube", icon: "Youtube" },
  { value: "Instagram", label: "Instagram", icon: "Instagram" },
  { value: "TikTok", label: "TikTok", icon: "Music" },
  { value: "LinkedIn", label: "LinkedIn", icon: "Linkedin" },
  { value: "Twitter", label: "Twitter/X", icon: "Twitter" },
  { value: "Podcast", label: "Podcast", icon: "Mic" },
];

export const TONE_OPTIONS = [
  { value: "conversacional", label: "Conversacional", description: "Tom amig?vel" },
  { value: "profissional", label: "Profissional", description: "Tom formal" },
  { value: "entusiasmado", label: "Entusiasmado", description: "Tom animado" },
  { value: "didatico", label: "Did?tico", description: "Tom educativo" },
  { value: "humoristico", label: "Humor?stico", description: "Tom divertido" },
  { value: "inspirador", label: "Inspirador", description: "Tom motivacional" },
  { value: "jornalistico", label: "Jornal?stico", description: "Tom informativo" },
];

export const ENERGY_OPTIONS = [
  { value: "baixo", label: "Baixa energia", description: "Calmo e tranquilo" },
  { value: "medio", label: "M?dia energia", description: "Equilibrado" },
  { value: "alto", label: "Alta energia", description: "Din?mico e intenso" },
];

export const GOAL_OPTIONS = [
  { value: "informar", label: "Informar", description: "Compartilhar not?cias", icon: "Info" },
  { value: "educar", label: "Educar", description: "Ensinar conceitos", icon: "GraduationCap" },
  { value: "entreter", label: "Entreter", description: "Divertir audi?ncia", icon: "Smile" },
  { value: "inspirar", label: "Inspirar", description: "Motivar pessoas", icon: "Sparkles" },
  { value: "vender", label: "Vender", description: "Promover produtos", icon: "ShoppingBag" },
  { value: "engajar", label: "Engajar", description: "Criar comunidade", icon: "Users" },
];

export const LANGUAGE_OPTIONS = [
  { value: "Portuguese", label: "Portugu?s" },
  { value: "English", label: "Ingl?s" },
  { value: "Spanish", label: "Espanhol" },
  { value: "French", label: "Franc?s" },
  { value: "German", label: "Alem?o" },
  { value: "Italian", label: "Italiano" },
];

export const NEWS_LANGUAGE_OPTIONS = [
  { value: "pt-BR", label: "Portugu?s (Brasil)" },
  { value: "en-US", label: "Ingl?s (EUA)" },
  { value: "en-GB", label: "Ingl?s (UK)" },
  { value: "es-ES", label: "Espanhol" },
  { value: "fr-FR", label: "Franc?s" },
  { value: "de-DE", label: "Alem?o" },
  { value: "it-IT", label: "Italiano" },
];
