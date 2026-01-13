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
  { value: "iniciante", label: "Iniciante", description: "Come\u00e7ando na \u00e1rea" },
  { value: "intermediario", label: "Intermedi\u00e1rio", description: "Experi\u00eancia moderada" },
  { value: "avancado", label: "Avan\u00e7ado", description: "Conhecimento profundo" },
  { value: "especialista", label: "Especialista", description: "Refer\u00eancia na \u00e1rea" },
];

export const AUDIENCE_TYPE_OPTIONS = [
  { value: "publico_geral", label: "P\u00fablico geral", description: "Audi\u00eancia ampla" },
  { value: "criadores", label: "Criadores", description: "Criadores de conte\u00fado" },
  { value: "empreendedores", label: "Empreendedores", description: "Donos de neg\u00f3cio" },
  { value: "estudantes", label: "Estudantes", description: "Pessoas em aprendizado" },
  { value: "profissionais", label: "Profissionais", description: "Trabalhadores da \u00e1rea" },
  { value: "investidores", label: "Investidores", description: "Pessoas com capital" },
];

export const VIDEO_TYPE_OPTIONS = [
  { value: "video_curto", label: "V\u00eddeo curto (Reels/Shorts)", description: "At\u00e9 60 segundos" },
  { value: "video_medio", label: "V\u00eddeo m\u00e9dio", description: "1-5 minutos" },
  { value: "video_longo", label: "V\u00eddeo longo", description: "Mais de 5 minutos" },
  { value: "podcast", label: "Podcast", description: "\u00c1udio longo" },
  { value: "live", label: "Live/Transmiss\u00e3o", description: "Ao vivo" },
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
  { value: "conversacional", label: "Conversacional", description: "Tom amig\u00e1vel" },
  { value: "profissional", label: "Profissional", description: "Tom formal" },
  { value: "entusiasmado", label: "Entusiasmado", description: "Tom animado" },
  { value: "didatico", label: "Did\u00e1tico", description: "Tom educativo" },
  { value: "humoristico", label: "Humor\u00edstico", description: "Tom divertido" },
  { value: "inspirador", label: "Inspirador", description: "Tom motivacional" },
  { value: "jornalistico", label: "Jornal\u00edstico", description: "Tom informativo" },
];

export const ENERGY_OPTIONS = [
  { value: "baixo", label: "Baixa energia", description: "Calmo e tranquilo" },
  { value: "medio", label: "M\u00e9dia energia", description: "Equilibrado" },
  { value: "alto", label: "Alta energia", description: "Din\u00e2mico e intenso" },
];

export const GOAL_OPTIONS = [
  { value: "informar", label: "Informar", description: "Compartilhar not\u00edcias", icon: "Info" },
  { value: "educar", label: "Educar", description: "Ensinar conceitos", icon: "GraduationCap" },
  { value: "entreter", label: "Entreter", description: "Divertir audi\u00eancia", icon: "Smile" },
  { value: "inspirar", label: "Inspirar", description: "Motivar pessoas", icon: "Sparkles" },
  { value: "vender", label: "Vender", description: "Promover produtos", icon: "ShoppingBag" },
  { value: "engajar", label: "Engajar", description: "Criar comunidade", icon: "Users" },
];

export const LANGUAGE_OPTIONS = [
  { value: "Portuguese", label: "Portugu\u00eas" },
  { value: "English", label: "Ingl\u00eas" },
  { value: "Spanish", label: "Espanhol" },
  { value: "French", label: "Franc\u00eas" },
  { value: "German", label: "Alem\u00e3o" },
  { value: "Italian", label: "Italiano" },
];

export const NEWS_LANGUAGE_OPTIONS = [
  { value: "pt-BR", label: "Portugu\u00eas (Brasil)" },
  { value: "en-US", label: "Ingl\u00eas (EUA)" },
  { value: "en-GB", label: "Ingl\u00eas (UK)" },
  { value: "es-ES", label: "Espanhol" },
  { value: "fr-FR", label: "Franc\u00eas" },
  { value: "de-DE", label: "Alem\u00e3o" },
  { value: "it-IT", label: "Italiano" },
];
