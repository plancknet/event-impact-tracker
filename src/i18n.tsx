import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Language = "pt" | "en";

type TranslationMap = Record<string, string>;

const translations: Record<Language, TranslationMap> = {
  pt: {},
  en: {
    "Bem-vindo, {name}": "Welcome, {name}",
    "Visitante": "Guest",
    "Novo roteiro": "New script",
    "Meus Roteiros": "My scripts",
    "Sair": "Sign out",
    "Você": "You",
    "Público": "Audience",
    "Formato": "Format",
    "Estilo": "Style",
    "Objetivo": "Goal",
    "Roteiros": "Scripts",
    "Crie ": "Create ",
    " para ": " for ",
    " em segundos, usando ": " in seconds, using ",
    "Vídeos": "Videos",
    "IA": "AI",
    "Crie scripts personalizados para YouTube, Instagram, TikTok, Reels, Shorts, Lives e muito mais — adaptados ao seu público, tom de voz e objetivo. Rode o texto em um teleprompter com ajustes fino.":
      "Create personalized scripts for YouTube, Instagram, TikTok, Reels, Shorts, Lives, and more — tailored to your audience, tone, and goal. Run the text in a teleprompter with fine adjustments.",
    "Crie agora sua ": "Create your ",
    " e obtenha seu ": " and get your ",
    "conta": "account",
    "roteiro": "script",
    "Email": "Email",
    "Senha": "Password",
    "Confirmar senha": "Confirm password",
    "Confirme a senha.": "Please confirm your password.",
    "As senhas não conferem.": "Passwords do not match.",
    "Criar conta": "Create account",
    "Entrar": "Sign in",
    "Crie uma conta para começar": "Create an account to get started",
    "ou": "or",
    "Continuar com Google": "Continue with Google",
    "Não tem conta? Criar conta": "Don't have an account? Create one",
    "Já tem conta? Entrar": "Already have an account? Sign in",
    "Planos": "Plans",
    "Recursos": "Resources",
    "Português": "Portuguese",
    "Testar Grátis": "Try Free",
    "Email inválido": "Invalid email",
    "A senha deve ter pelo menos 6 caracteres": "Password must be at least 6 characters",
    "Email ou senha incorretos.": "Incorrect email or password.",
    "Este email já está cadastrado. Faça login.": "This email is already registered. Please sign in.",
    "Conta criada, mas não foi possível entrar automaticamente.": "Account created, but we could not sign you in automatically.",
    "Conta criada com sucesso!": "Account created successfully!",
    "Atualize sua senha para continuar": "Update your password to continue",
    "Nova senha": "New password",
    "Confirmar nova senha": "Confirm new password",
    "Salvar nova senha": "Save new password",
    "A nova senha deve ser diferente da senha inicial.": "The new password must be different from the initial password.",
    "Senha atualizada com sucesso!": "Password updated successfully!",
    "Você precisa estar logado para salvar.": "You need to be signed in to save.",
    "Não foi possível salvar o roteiro.": "Couldn't save the script.",
    "Roteiro salvo.": "Script saved.",
    "Salvar roteiro": "Save script",
    "Salvando...": "Saving...",
    "Gerar roteiro": "Generate script",
    "Gerar Roteiro": "Generate Script",
    "Gerando roteiro...": "Generating script...",
    "Sobre:": "About:",
    "Defina um tema no seu perfil": "Set a topic in your profile",
    "({count} notícia(s) selecionada(s))": "({count} selected news item(s))",
    "Prompt complementar": "Complementary prompt",
    "Adicione instruções específicas para personalizar o roteiro, ex: 'Foque nos aspectos de segurança' ou 'Use um tom mais crítico'...":
      "Add specific instructions to customize the script, e.g., 'Focus on safety aspects' or 'Use a more critical tone'...",
    "Opcional: instruções adicionais para guiar a geração do roteiro":
      "Optional: additional instructions to guide script generation",
    "Selecione pelo menos uma notícia ou adicione um prompt complementar":
      "Select at least one news item or add a complementary prompt",
    "Salvar vídeo": "Save video",
    "Gravar vídeo": "Record video",
    "Parar Gravação": "Stop recording",
    "Reiniciar": "Restart",
    "Pausar": "Pause",
    "Continuar": "Resume",
    "Iniciar": "Start",
    "Preparando": "Preparing",
    "Recolher": "Collapse",
    "Expandir": "Expand",
    "Voltar": "Back",
    "Fonte": "Font",
    "Tamanho": "Size",
    "Cor": "Color",
    "Fundo": "Background",
    "Pausas (s)": "Pauses (s)",
    "Curta": "Short",
    "Média": "Medium",
    "Longa": "Long",
    "Pausa curta": "Short pause",
    "Pausa média": "Medium pause",
    "Pausa longa": "Long pause",
    "Pausa": "Pause",
    "Vertical": "Vertical",
    "Horizontal": "Horizontal",
    "Não foi possível acessar a câmera.": "Couldn't access the camera.",
    "Não foi possível iniciar a gravação.": "Couldn't start recording.",
    "Cor da fonte": "Font color",
    "Cor do fundo": "Background color",
    "Diminuir pausa curta": "Decrease short pause",
    "Aumentar pausa curta": "Increase short pause",
    "Diminuir pausa média": "Decrease medium pause",
    "Aumentar pausa média": "Increase medium pause",
    "Diminuir pausa longa": "Decrease long pause",
    "Aumentar pausa longa": "Increase long pause",
    "Histórico de Roteiros": "Script History",
    "Buscar roteiros...": "Search scripts...",
    "Filtrar por tema": "Filter by topic",
    "Nenhum roteiro salvo ainda": "No scripts saved yet",
    "Nenhum roteiro encontrado": "No scripts found",
    "Roteiro": "Script",
    "Roteiro 2": "Script 2",
    "Tema": "Topic",
    "Data": "Date",
    "Deseja excluir este roteiro?": "Do you want to delete this script?",
    "Notícias encontradas": "News found",
    "Buscar notícias...": "Search news...",
    "Filtrar por fonte": "Filter by source",
    "Somente selecionadas": "Selected only",
    "Todas": "All",
    "Nenhuma": "None",
    "Buscando notícias...": "Fetching news...",
    "Título": "Title",
    "Resumo": "Summary",
    "Nenhuma notícia encontrada": "No news found",
    "{selected}/{total} selecionadas": "{selected}/{total} selected",
    "Buscar notícias": "Search news",
    "Atualizar": "Refresh",
    "Erro ao carregar notícias.": "Failed to load news.",
    "Não foi possível carregar as notícias.": "Couldn't load the news.",
    "Defina um tema principal.": "Set a main topic.",
    "Não foi possível buscar as notícias. Tente novamente.": "Couldn't fetch the news. Please try again.",
    "Texto do roteiro": "Script text",
    "Abrir teleprompter": "Open teleprompter",
    "Copiar": "Copy",
    "Copiado!": "Copied!",
    "Regenerar": "Regenerate",
    "Teleprompter": "Teleprompter",
    "Tom": "Tone",
    "Duração": "Duration",
    "Gerando seu roteiro...": "Generating your script...",
    "Seu roteiro aparecerá aqui": "Your script will appear here",
    "Clique em \"Gerar Roteiro\" para começar": "Click \"Generate Script\" to get started",
    "Você pode editar o texto a qualquer momento antes de salvar.":
      "You can edit the text at any time before saving.",
    "Configure seu perfil de criador": "Configure your creator profile",
    "Vamos personalizar seus roteiros para soar como você.":
      "Let's personalize your scripts to sound like you.",
    "Pular": "Skip",
    "Sobre você": "About you",
    "Conte-nos sobre seu conteúdo e experiência":
      "Tell us about your content and experience",
    "Sobre o que vamos falar hoje?": "What are we talking about today?",
    "Ex: Bitcoin, Finanças, Marketing Digital, Culinária...":
      "Example: Bitcoin, Finance, Digital Marketing, Cooking...",
    "Separe múltiplos temas por vírgula": "Separate multiple topics with commas",
    "Qual é o seu nível como criador?": "What is your level as a creator?",
    "Seu público": "Your audience",
    "Para quem você cria conteúdo?": "Who do you create content for?",
    "Quem é sua audiência principal?": "Who is your main audience?",
    "Faixa etária do público": "Audience age range",
    "{min} - {max} anos": "{min} - {max} years",
    "Distribuição de sexo": "Gender split",
    "Masculino": "Male",
    "Feminino": "Female",
    "Formato do vídeo": "Video format",
    "Defina o tipo e duração do seu conteúdo": "Define the type and length of your content",
    "Que tipo de vídeo você vai criar?": "What type of video will you create?",
    "Qual a duração alvo?": "What is the target duration?",
    "Onde você vai publicar?": "Where will you publish?",
    "Seu estilo": "Your style",
    "Como você quer soar no seu conteúdo?": "How do you want to sound in your content?",
    "Qual é o tom da sua fala?": "What's the tone of your speech?",
    "Nível de energia": "Energy level",
    "Objetivo do conteúdo": "Content goal",
    "Defina o objetivo e busque notícias relevantes":
      "Define the goal and search for relevant news",
    "Qual é o objetivo principal?": "What is the main goal?",
    "Idioma do roteiro": "Script language",
    "Incluir chamada para a ação?": "Include a call to action?",
    "Adicionar CTA ao final do roteiro": "Add a CTA to the end of the script",
    "Ex: Se inscreva no canal, ative o sininho, deixe seu like...":
      "Example: Subscribe to the channel, turn on notifications, leave your like...",
    "Sem tema": "No topic",
    "Plataforma": "Platform",
    "Tipo de vídeo": "Video type",
    "Idioma": "Language",
    "Faixa etária": "Age range",
    "Sexo": "Gender",
    "Editar perfil": "Edit profile",
    "{min}-{max} anos": "{min}-{max} years",
    "{male}% masc / {female}% fem": "{male}% male / {female}% female",
    "palavras": "words",
    "min": "min",
    "Iniciante": "Beginner",
    "Começando na área": "Starting out",
    "Intermediário": "Intermediate",
    "Experiência moderada": "Moderate experience",
    "Avançado": "Advanced",
    "Conhecimento profundo": "Deep knowledge",
    "Especialista": "Expert",
    "Referência na área": "Reference in the field",
    "Público geral": "General audience",
    "Audiência ampla": "Broad audience",
    "Criadores": "Creators",
    "Criadores de conteúdo": "Content creators",
    "Empreendedores": "Entrepreneurs",
    "Donos de negócio": "Business owners",
    "Estudantes": "Students",
    "Pessoas em aprendizado": "Learners",
    "Profissionais": "Professionals",
    "Trabalhadores da área": "Industry professionals",
    "Investidores": "Investors",
    "Pessoas com capital": "People with capital",
    "Vídeo curto (Reels/Shorts)": "Short video (Reels/Shorts)",
    "Até 60 segundos": "Up to 60 seconds",
    "Vídeo médio": "Medium video",
    "1-5 minutos": "1-5 minutes",
    "Vídeo longo": "Long video",
    "Mais de 5 minutos": "More than 5 minutes",
    "Podcast": "Podcast",
    "Áudio longo": "Long audio",
    "Live/Transmissão": "Live/Stream",
    "Ao vivo": "Live",
    "1 minuto": "1 minute",
    "2 minutos": "2 minutes",
    "3 minutos": "3 minutes",
    "5 minutos": "5 minutes",
    "10 minutos": "10 minutes",
    "YouTube": "YouTube",
    "Instagram": "Instagram",
    "TikTok": "TikTok",
    "LinkedIn": "LinkedIn",
    "Twitter/X": "Twitter/X",
    "Conversacional": "Conversational",
    "Tom amigável": "Friendly tone",
    "Profissional": "Professional",
    "Tom formal": "Formal tone",
    "Entusiasmado": "Enthusiastic",
    "Tom animado": "Energetic tone",
    "Didático": "Didactic",
    "Tom educativo": "Educational tone",
    "Humorístico": "Humorous",
    "Tom divertido": "Playful tone",
    "Inspirador": "Inspiring",
    "Tom motivacional": "Motivational tone",
    "Jornalístico": "Journalistic",
    "Tom informativo": "Informative tone",
    "Baixa energia": "Low energy",
    "Calmo e tranquilo": "Calm and steady",
    "Média energia": "Medium energy",
    "Equilibrado": "Balanced",
    "Alta energia": "High energy",
    "Dinâmico e intenso": "Dynamic and intense",
    "Calmo": "Calm",
    "Energético": "Energetic",
    "Educativo": "Educational",
    "Persuasivo": "Persuasive",
    "Iniciantes": "Beginners",
    "Ensinar": "Teach",
    "Persuadir": "Persuade",
    "Informar": "Inform",
    "Compartilhar notícias": "Share news",
    "Educar": "Educate",
    "Ensinar conceitos": "Teach concepts",
    "Entreter": "Entertain",
    "Divertir audiência": "Entertain the audience",
    "Inspirar": "Inspire",
    "Motivar pessoas": "Motivate people",
    "Vender": "Sell",
    "Promover produtos": "Promote products",
    "Engajar": "Engage",
    "Criar comunidade": "Build a community",
    "Inglês": "English",
    "Espanhol": "Spanish",
    "Francês": "French",
    "Alemão": "German",
    "Italiano": "Italian",
    "Verificando pagamento...": "Verifying payment...",
    "Parabéns!": "Congratulations!",
    "Obrigado!": "Thank you!",
    "Sua assinatura foi ativada com sucesso!": "Your subscription has been activated successfully!",
    "Seu pagamento está sendo processado.": "Your payment is being processed.",
    "Você agora tem acesso a todos os recursos do ThinkAndTalk Pro. Comece a criar conteúdo incrível!":
      "You now have access to all ThinkAndTalk Pro features. Start creating amazing content!",
    "Em alguns instantes você terá acesso a todos os recursos premium.":
      "In a few moments you'll have access to all premium features.",
    "Começar a usar": "Start using",
    "Desbloqueie todo o potencial": "Unlock the full potential",
    "Torne-se um criador": "Become a professional",
    "profissional": "creator",
    "Crie roteiros personalizados com IA, acesse notícias em tempo real e transforme suas ideias em conteúdo de qualidade.":
      "Create personalized scripts with AI, access real-time news, and turn your ideas into high-quality content.",
    "Tudo que você precisa para criar conteúdo incrível": "Everything you need to create amazing content",
    "mês": "month",
    "Processando...": "Processing...",
    "Assinar agora": "Subscribe now",
    "Cancele a qualquer momento. Sem compromisso.": "Cancel anytime. No commitment.",
    "Pagamento seguro processado por Stripe": "Secure payment processed by Stripe",
    "Erro ao iniciar assinatura": "Failed to start subscription",
    "Tente novamente mais tarde.": "Try again later.",
    "Scripts ilimitados por mês": "Unlimited scripts per month",
    "Teleprompter profissional": "Professional teleprompter",
    "IA treinada para criadores": "AI trained for creators",
    "Curadoria de notícias em tempo real": "Real-time news curation",
    "Suporte prioritário": "Priority support",
    "Novos recursos em primeira mão": "New features first",
    "URL de checkout não retornada": "Checkout URL not returned",
  },
};

const BRAZIL_TIMEZONES = new Set([
  "America/Sao_Paulo",
  "America/Fortaleza",
  "America/Recife",
  "America/Belem",
  "America/Campo_Grande",
  "America/Cuiaba",
  "America/Eirunepe",
  "America/Manaus",
  "America/Noronha",
  "America/Porto_Velho",
  "America/Rio_Branco",
  "America/Santarem",
  "America/Araguaina",
  "America/Bahia",
  "America/Maceio",
  "America/Boa_Vista",
  "America/Palmas",
  "America/Japura",
]);

const detectLanguage = (): Language => {
  const stored = localStorage.getItem("tat_lang");
  if (stored === "pt" || stored === "en") return stored;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (BRAZIL_TIMEZONES.has(tz)) return "pt";
  const browserLang = (navigator.language || "").toLowerCase();
  if (browserLang.startsWith("pt")) return "pt";
  return "en";
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem("tat_lang", lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      const map = translations[language] || {};
      const template = map[key] || key;
      if (!vars) return template;
      return Object.keys(vars).reduce(
        (result, token) => result.split(`{${token}}`).join(vars[token]),
        template
      );
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
