export interface CreatorProfile {
  id?: string;
  user_id?: string;

  // Creator identity
  display_name?: string;
  main_topic: string;
  expertise_level: string;

  // Audience profile
  audience_type: string;
  audience_age_min: number;
  audience_age_max: number;
  audience_gender_split: number;

  // Video format
  video_type: string;
  target_duration: string;
  duration_unit: 'minutes' | 'words';
  platform: string;

  // Speaking style
  speaking_tone: string;
  energy_level: string;

  // Content goal
  content_goal: string;

  // Script preferences
  script_language: string;
  news_language: string;
  include_cta: boolean;
  cta_template?: string;

  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_CREATOR_PROFILE: CreatorProfile = {
  main_topic: '',
  expertise_level: 'intermediario',
  audience_type: 'publico_geral',
  audience_age_min: 18,
  audience_age_max: 45,
  audience_gender_split: 50,
  video_type: 'video_curto',
  target_duration: '3',
  duration_unit: 'minutes',
  platform: 'YouTube',
  speaking_tone: 'conversacional',
  energy_level: 'medio',
  content_goal: 'informar',
  script_language: 'Portuguese',
  news_language: 'pt-BR',
  include_cta: true,
};

// Options for onboarding
export const EXPERTISE_OPTIONS = [
  { value: 'iniciante', label: 'Iniciante', description: 'Estou come\u00E7ando a criar conte\u00FAdo' },
  { value: 'intermediario', label: 'Intermedi\u00E1rio', description: 'J\u00E1 produzo conte\u00FAdo regularmente' },
  { value: 'avancado', label: 'Avan\u00E7ado', description: 'Criador experiente com audi\u00EAncia estabelecida' },
];

export const AUDIENCE_TYPE_OPTIONS = [
  { value: 'iniciantes', label: 'Iniciantes', description: 'Pessoas come\u00E7ando no tema' },
  { value: 'publico_geral', label: 'P\u00FAblico geral', description: 'Qualquer pessoa interessada' },
  { value: 'profissionais', label: 'Profissionais', description: 'Pessoas da \u00E1rea ou setor' },
  { value: 'especialistas', label: 'Especialistas', description: 'Experts e conhecedores' },
];

export const VIDEO_TYPE_OPTIONS = [
  { value: 'video_curto', label: 'V\u00EDdeo curto', description: 'Reels, Shorts, TikTok' },
  { value: 'video_longo', label: 'V\u00EDdeo longo', description: 'YouTube, Vimeo' },
  { value: 'live', label: 'Live', description: 'Transmiss\u00E3o ao vivo' },
  { value: 'tutorial', label: 'Tutorial', description: 'Passo a passo educativo' },
  { value: 'news', label: 'Not\u00EDcias', description: 'Cobertura de atualidades' },
  { value: 'opiniao', label: 'Opini\u00E3o', description: 'An\u00E1lise e coment\u00E1rio' },
];

export const DURATION_OPTIONS = [
  { value: '1', label: '1 min', description: 'Shorts/Reels' },
  { value: '3', label: '3 min', description: 'V\u00EDdeo curto' },
  { value: '5', label: '5 min', description: 'V\u00EDdeo m\u00E9dio' },
  { value: '10', label: '10 min', description: 'V\u00EDdeo longo' },
  { value: '15', label: '15+ min', description: 'Conte\u00FAdo aprofundado' },
];

export const PLATFORM_OPTIONS = [
  { value: 'YouTube', label: 'YouTube', icon: '\u25B6\uFE0F' },
  { value: 'Instagram', label: 'Instagram', icon: '\uD83D\uDCF8' },
  { value: 'TikTok', label: 'TikTok', icon: '\uD83C\uDFB5' },
  { value: 'LinkedIn', label: 'LinkedIn', icon: '\uD83D\uDCBC' },
  { value: 'Podcast', label: 'Podcast', icon: '\uD83C\uDF99\uFE0F' },
  { value: 'Twitter', label: 'Twitter/X', icon: 'X' },
];

export const TONE_OPTIONS = [
  { value: 'calmo', label: 'Calmo', description: 'Tranquilo e reflexivo' },
  { value: 'conversacional', label: 'Conversacional', description: 'Como uma conversa entre amigos' },
  { value: 'energetico', label: 'Energ\u00E9tico', description: 'Animado e motivador' },
  { value: 'educativo', label: 'Educativo', description: 'Did\u00E1tico e explicativo' },
  { value: 'persuasivo', label: 'Persuasivo', description: 'Convencente e direto' },
];

export const ENERGY_OPTIONS = [
  { value: 'baixo', label: 'Baixo', description: 'Meditativo, introspectivo' },
  { value: 'medio', label: 'M\u00E9dio', description: 'Equilibrado, natural' },
  { value: 'alto', label: 'Alto', description: 'Din\u00E2mico, empolgante' },
];

export const GOAL_OPTIONS = [
  { value: 'ensinar', label: 'Ensinar', description: 'Transmitir conhecimento', icon: '\uD83D\uDCDA' },
  { value: 'informar', label: 'Informar', description: 'Compartilhar novidades', icon: '\uD83D\uDCF0' },
  { value: 'entreter', label: 'Entreter', description: 'Divertir e engajar', icon: '\uD83C\uDF89' },
  { value: 'persuadir', label: 'Persuadir', description: 'Mudar perspectivas', icon: '\uD83E\uDDE0' },
  { value: 'vender', label: 'Vender', description: 'Promover produtos/servi\u00E7os', icon: '\uD83D\uDED2' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'Portuguese', label: 'Portugu\u00EAs' },
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Espa\u00F1ol' },
];

export const NEWS_LANGUAGE_OPTIONS = [
  { value: 'pt-BR', label: 'Portugu\u00EAs (BR)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espa\u00F1ol' },
];
