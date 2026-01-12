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
  { value: 'iniciante', label: 'Iniciante', description: 'Estou começando a criar conteúdo' },
  { value: 'intermediario', label: 'Intermediário', description: 'Já produzo conteúdo regularmente' },
  { value: 'avancado', label: 'Avançado', description: 'Criador experiente com audiência estabelecida' },
];

export const AUDIENCE_TYPE_OPTIONS = [
  { value: 'iniciantes', label: 'Iniciantes', description: 'Pessoas começando no tema' },
  { value: 'publico_geral', label: 'Público geral', description: 'Qualquer pessoa interessada' },
  { value: 'profissionais', label: 'Profissionais', description: 'Pessoas da área ou setor' },
  { value: 'especialistas', label: 'Especialistas', description: 'Experts e conhecedores' },
];

export const VIDEO_TYPE_OPTIONS = [
  { value: 'video_curto', label: 'Vídeo curto', description: 'Reels, Shorts, TikTok' },
  { value: 'video_longo', label: 'Vídeo longo', description: 'YouTube, Vimeo' },
  { value: 'live', label: 'Live', description: 'Transmissão ao vivo' },
  { value: 'tutorial', label: 'Tutorial', description: 'Passo a passo educativo' },
  { value: 'news', label: 'Notícias', description: 'Cobertura de atualidades' },
  { value: 'opiniao', label: 'Opinião', description: 'Análise e comentário' },
];

export const DURATION_OPTIONS = [
  { value: '1', label: '1 min', description: 'Shorts/Reels' },
  { value: '3', label: '3 min', description: 'Vídeo curto' },
  { value: '5', label: '5 min', description: 'Vídeo médio' },
  { value: '10', label: '10 min', description: 'Vídeo longo' },
  { value: '15', label: '15+ min', description: 'Conteúdo aprofundado' },
];

export const PLATFORM_OPTIONS = [
  { value: 'YouTube', label: 'YouTube', icon: '📺' },
  { value: 'Instagram', label: 'Instagram', icon: '📷' },
  { value: 'TikTok', label: 'TikTok', icon: '🎵' },
  { value: 'LinkedIn', label: 'LinkedIn', icon: '💼' },
  { value: 'Podcast', label: 'Podcast', icon: '🎙️' },
  { value: 'Twitter', label: 'Twitter/X', icon: '🐦' },
];

export const TONE_OPTIONS = [
  { value: 'calmo', label: 'Calmo', description: 'Tranquilo e reflexivo' },
  { value: 'conversacional', label: 'Conversacional', description: 'Como uma conversa entre amigos' },
  { value: 'energetico', label: 'Energético', description: 'Animado e motivador' },
  { value: 'educativo', label: 'Educativo', description: 'Didático e explicativo' },
  { value: 'persuasivo', label: 'Persuasivo', description: 'Convencente e direto' },
];

export const ENERGY_OPTIONS = [
  { value: 'baixo', label: 'Baixo', description: 'Meditativo, introspectivo' },
  { value: 'medio', label: 'Médio', description: 'Equilibrado, natural' },
  { value: 'alto', label: 'Alto', description: 'Dinâmico, empolgante' },
];

export const GOAL_OPTIONS = [
  { value: 'ensinar', label: 'Ensinar', description: 'Transmitir conhecimento', icon: '📚' },
  { value: 'informar', label: 'Informar', description: 'Compartilhar novidades', icon: '📰' },
  { value: 'entreter', label: 'Entreter', description: 'Divertir e engajar', icon: '🎭' },
  { value: 'persuadir', label: 'Persuadir', description: 'Mudar perspectivas', icon: '💡' },
  { value: 'vender', label: 'Vender', description: 'Promover produtos/serviços', icon: '🛒' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'Portuguese', label: 'Português' },
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Español' },
];

export const NEWS_LANGUAGE_OPTIONS = [
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];
