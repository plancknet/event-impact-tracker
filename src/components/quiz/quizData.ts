import { 
  Target, Users, Calendar, Mic, Lightbulb, FileText, Clock, 
  TrendingUp, Briefcase, Award, UserCheck, Heart, Film, 
  Timer, Share2, Volume2, Zap, Goal
} from "lucide-react";

export interface QuizOption {
  value: string;
  label: string;
  icon?: any;
}

export interface QuizQuestionData {
  key: string;
  question: string;
  subtitle?: string;
  icon?: any;
  options: QuizOption[];
  multiSelect?: boolean;
}

export const QUIZ_QUESTIONS: QuizQuestionData[] = [
  {
    key: "age_range",
    question: "Qual a sua faixa etária?",
    options: [
      { value: "under_18", label: "Até 18 anos" },
      { value: "18_24", label: "18–24" },
      { value: "25_34", label: "25–34" },
      { value: "35_44", label: "35–44" },
      { value: "45_plus", label: "45+" },
    ],
  },
  {
    key: "main_goal",
    question: "Qual é o seu principal objetivo com vídeos nas redes sociais?",
    subtitle: "Escolha o que mais se aplica a você",
    icon: Target,
    options: [
      { value: "grow_audience", label: "Crescer minha audiência", icon: TrendingUp },
      { value: "engage_community", label: "Engajar minha comunidade", icon: Users },
      { value: "sell_products", label: "Vender produtos/serviços", icon: Briefcase },
      { value: "share_knowledge", label: "Compartilhar conhecimentos", icon: Lightbulb },
    ],
  },
  {
    key: "publish_frequency",
    question: "Com que frequência você publica vídeos atualmente?",
    icon: Calendar,
    options: [
      { value: "daily", label: "Diariamente" },
      { value: "3_5_weekly", label: "3–5 vezes por semana" },
      { value: "1_2_weekly", label: "1–2 vezes por semana" },
      { value: "rarely", label: "Quase nunca" },
    ],
  },
  {
    key: "comfort_recording",
    question: "Como você se sente ao gravar vídeos?",
    icon: Mic,
    options: [
      { value: "very_comfortable", label: "Muito confortável" },
      { value: "ok_insecure", label: "OK, mas fico inseguro às vezes" },
      { value: "freeze_lose_words", label: "Costumo travar ou perder palavras" },
      { value: "avoid", label: "Evito gravar sempre que posso" },
    ],
  },
  {
    key: "biggest_challenge",
    question: "Qual é o maior desafio que você enfrenta hoje com vídeos?",
    subtitle: "Identificar isso nos ajuda a personalizar seu plano",
    options: [
      { value: "lack_ideas", label: "Faltar ideias de conteúdo", icon: Lightbulb },
      { value: "poor_editing", label: "Não saber editar bem", icon: Film },
      { value: "no_engagement", label: "Não conseguir engajar o público", icon: Users },
      { value: "shyness", label: "Timidez / falta de confiança ao falar", icon: Mic },
    ],
  },
  {
    key: "planning_style",
    question: "Como você planeja seus vídeos?",
    icon: FileText,
    options: [
      { value: "full_scripts", label: "Faço roteiros completos" },
      { value: "loose_topics", label: "Tenho apenas tópicos soltos" },
      { value: "no_script", label: "Vou gravando sem roteiro" },
      { value: "want_to_learn", label: "Quero aprender a planejar conteúdo" },
    ],
  },
  {
    key: "editing_time",
    question: "Quanto tempo você dedica à edição?",
    icon: Clock,
    options: [
      { value: "less_30min", label: "Menos de 30 min por vídeo" },
      { value: "30min_1h", label: "30 min – 1h" },
      { value: "1_2h", label: "1–2h" },
      { value: "more_2h", label: "Mais de 2h" },
    ],
  },
  {
    key: "result_goal",
    question: "Qual resultado você quer ver nos próximos 3 meses?",
    icon: TrendingUp,
    options: [
      { value: "more_followers", label: "+ Seguidores" },
      { value: "more_views", label: "+ Visualizações" },
      { value: "more_engagement", label: "Maior engajamento" },
      { value: "more_messages_sales", label: "Receber mais mensagens/vendas" },
    ],
  },
  {
    key: "niche",
    question: "Qual é o seu nicho principal?",
    icon: Briefcase,
    options: [
      { value: "education", label: "Educação / Conteúdo informativo" },
      { value: "business", label: "Negócios / Marketing / Vendas" },
      { value: "lifestyle", label: "Lifestyle / Rotina / Vlogs" },
      { value: "health", label: "Saúde / Fitness / Bem-estar" },
      { value: "entertainment", label: "Entretenimento / Humor" },
      { value: "other", label: "Outro / Ainda estou definindo" },
    ],
  },
  {
    key: "creator_level",
    question: "Qual é o seu nível como criador de conteúdo?",
    icon: Award,
    options: [
      { value: "beginner", label: "Iniciante (começando na área)" },
      { value: "basic", label: "Básico (já postei alguns vídeos)" },
      { value: "intermediate", label: "Intermediário (posto com frequência)" },
      { value: "advanced", label: "Avançado (crio conteúdo profissionalmente)" },
    ],
  },
  {
    key: "audience_type",
    question: "Quem é sua audiência principal?",
    icon: UserCheck,
    options: [
      { value: "b2c", label: "Pessoas físicas (B2C)" },
      { value: "entrepreneurs", label: "Empreendedores / Profissionais" },
      { value: "creators", label: "Criadores de conteúdo" },
      { value: "b2b", label: "Empresas (B2B)" },
      { value: "general", label: "Público geral" },
    ],
  },
  {
    key: "audience_age",
    question: "Qual é a faixa etária do seu PÚBLICO?",
    icon: Users,
    options: [
      { value: "under_18", label: "Até 18 anos" },
      { value: "18_24", label: "18–24" },
      { value: "25_34", label: "25–34" },
      { value: "35_44", label: "35–44" },
      { value: "45_plus", label: "45+" },
    ],
  },
  {
    key: "audience_gender",
    question: "Como é a distribuição de gênero do seu PÚBLICO?",
    icon: Heart,
    options: [
      { value: "mostly_female", label: "Majoritariamente feminino" },
      { value: "mostly_male", label: "Majoritariamente masculino" },
      { value: "balanced", label: "Bem equilibrado" },
      { value: "unknown", label: "Ainda não sei" },
    ],
  },
  {
    key: "video_format",
    question: "Que tipo de vídeo você mais gosta de criar?",
    icon: Film,
    options: [
      { value: "educational", label: "Educacional / Dicas" },
      { value: "storytelling", label: "Storytelling / Histórias" },
      { value: "opinion", label: "Opinião / Comentários" },
      { value: "behind_scenes", label: "Bastidores / Vida real" },
      { value: "sales", label: "Venda / Oferta / Convite" },
      { value: "mixed", label: "Misturo vários formatos" },
    ],
  },
  {
    key: "video_duration",
    question: "Qual é a duração ideal dos seus vídeos?",
    icon: Timer,
    options: [
      { value: "1min", label: "Até 1 minuto" },
      { value: "2min", label: "2 minutos" },
      { value: "3min", label: "3 minutos" },
      { value: "5min", label: "5 minutos" },
      { value: "10min_plus", label: "+10 min" },
    ],
  },
  {
    key: "platforms",
    question: "Onde você publica (ou pretende publicar) seus vídeos?",
    subtitle: "Pode selecionar mais de uma opção",
    icon: Share2,
    multiSelect: true,
    options: [
      { value: "instagram", label: "Instagram (Reels / Stories)" },
      { value: "tiktok", label: "TikTok" },
      { value: "youtube_shorts", label: "YouTube Shorts" },
      { value: "youtube_long", label: "YouTube (vídeos longos)" },
      { value: "lives", label: "Lives" },
      { value: "other", label: "Outras plataformas" },
    ],
  },
  {
    key: "speaking_tone",
    question: "Qual é o tom da sua fala nos vídeos?",
    icon: Volume2,
    options: [
      { value: "professional", label: "Profissional / Autoridade" },
      { value: "friendly", label: "Amigável / Conversa informal" },
      { value: "motivational", label: "Motivacional / Inspirador" },
      { value: "fun", label: "Divertido / Descontraído" },
      { value: "direct", label: "Direto ao ponto" },
    ],
  },
  {
    key: "energy_level",
    question: "Qual é o nível de energia dos seus vídeos?",
    icon: Zap,
    options: [
      { value: "low", label: "Baixo (calmo, reflexivo)" },
      { value: "medium", label: "Médio (equilibrado)" },
      { value: "high", label: "Alto (animado, intenso)" },
    ],
  },
  {
    key: "content_goal",
    question: "Qual é o objetivo principal dos seus vídeos hoje?",
    icon: Goal,
    options: [
      { value: "inform", label: "Informar (compartilhar notícias)" },
      { value: "educate", label: "Educar (Ensinar conceitos)" },
      { value: "entertain", label: "Entreter (Divertir audiência)" },
      { value: "inspire", label: "Inspirar (Motivar Pessoas)" },
      { value: "sell", label: "Vender (Promover produtos)" },
      { value: "engage", label: "Engajar (Criar comunidade)" },
    ],
  },
];