import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Language = "pt" | "en";

type TranslationMap = Record<string, string>;

const translations: Record<Language, TranslationMap> = {
  pt: {},
  en: {
    // ── Studio / Header ──
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
    "Roteiro": "Script",
    "Roteiro 2": "Script 2",

    // ── Auth page ──
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
    "Continuar": "Continue",
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

    // ── Onboarding ──
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

    // ── Creator profile options ──
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

    // ── Premium ──
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
    "Pagamento seguro processado por Lastlink": "Secure payment processed by Lastlink",
    "Erro ao iniciar assinatura": "Failed to start subscription",
    "Tente novamente mais tarde.": "Try again later.",
    "Scripts ilimitados por mês": "Unlimited scripts per month",
    "Teleprompter profissional": "Professional teleprompter",
    "IA treinada para criadores": "AI trained for creators",
    "Curadoria de notícias em tempo real": "Real-time news curation",
    "Suporte prioritário": "Priority support",
    "Novos recursos em primeira mão": "New features first",
    "URL de checkout não retornada": "Checkout URL not returned",
    "Carregando...": "Loading...",
    "Pagamento confirmado!": "Payment confirmed!",
    "Faça login para acessar sua conta.": "Sign in to access your account.",
    "Use o email que você cadastrou no quiz e a senha padrão: 12345678": "Use the email you registered in the quiz and the default password: 12345678",
    "Fazer login": "Sign in",
    "Sua licença foi ativada com sucesso!": "Your license has been activated successfully!",
    "Começar a criar": "Start creating",

    // ── Quiz Intro ──
    "O Segredo dos criadores de conteúdo": "The Secret of content creators",
    "Os maiores criadores de conteúdos estão utilizando IA personalizada para impulsionar suas carreiras.":
      "The biggest content creators are using personalized AI to boost their careers.",
    "Nós vamos te mostrar como, em apenas 3 minutos.":
      "We'll show you how, in just 3 minutes.",
    "Vamos lá!": "Let's go!",

    // ── Quiz Welcome ──
    "Descubra seu perfil como": "Discover your profile as a",
    "Criador de Vídeo": "Video Creator",
    "Responda algumas perguntas rápidas e receba um plano personalizado":
      "Answer a few quick questions and get a personalized plan",
    "Começar agora": "Start now",
    "Leva menos de 1 minuto": "Takes less than 1 minute",

    // ── Quiz Age Cards ──
    "Quantos anos você tem?": "How old are you?",
    "Até 18": "Under 18",

    // ── Quiz Questions (quizData.ts) ──
    "Até 18 anos": "Under 18",
    "45+": "45+",
    "Qual o seu gênero?": "What is your gender?",
    "Mulher": "Woman",
    "Homem": "Man",
    "Não-binário": "Non-binary",
    "Prefiro não informar": "Prefer not to say",
    "Qual é o seu principal objetivo?": "What is your main goal?",
    "+ Seguidores": "+ Followers",
    "+ Visualizações": "+ Views",
    "Maior engajamento": "More engagement",
    "Receber mais mensagens/vendas": "Get more messages/sales",
    "Como você se sente ao gravar vídeos?": "How do you feel about recording videos?",
    "Às vezes fico inseguro": "Sometimes I feel insecure",
    "Costumo travar ou perder palavras": "I tend to freeze or lose words",
    "Evito gravar sempre que posso": "I avoid recording whenever I can",
    "Muito desconfortável": "Very uncomfortable",
    "Qual é o maior desafio que você enfrenta hoje com vídeos?":
      "What is the biggest challenge you face today with videos?",
    "Faltar ideias de conteúdo": "Lack of content ideas",
    "Não saber editar bem": "Not knowing how to edit well",
    "Não conseguir engajar o público": "Unable to engage the audience",
    "Timidez / falta de confiança ao falar": "Shyness / lack of confidence when speaking",
    "Como você planeja seus vídeos?": "How do you plan your videos?",
    "Faço roteiros sem técnica": "I write scripts without technique",
    "Tenho apenas tópicos soltos": "I only have loose topics",
    "Vou gravando sem roteiro": "I record without a script",
    "Vejo outros vídeos": "I watch other videos",
    "Quanto tempo você dedica à gravação?": "How much time do you dedicate to recording?",
    "Menos de 30 min por vídeo": "Less than 30 min per video",
    "30 min - 1h": "30 min - 1h",
    "1-2h": "1-2h",
    "Mais de 2h": "More than 2h",
    "Sobre o que você gosta de falar?": "What do you like to talk about?",
    "Educação / Conteúdo informativo": "Education / Informative content",
    "Negócios / Marketing / Vendas": "Business / Marketing / Sales",
    "Lifestyle / Rotina / Vlogs": "Lifestyle / Routine / Vlogs",
    "Saúde / Fitness / Bem-estar": "Health / Fitness / Wellness",
    "Entretenimento / Humor": "Entertainment / Humor",
    "Outro / Ainda estou definindo": "Other / Still defining",
    "Qual é o seu nível como criador de conteúdo?": "What is your level as a content creator?",
    "Iniciante (começando na área)": "Beginner (just starting out)",
    "Básico (já postei alguns vídeos)": "Basic (already posted some videos)",
    "Intermediário (posto com frequência)": "Intermediate (post frequently)",
    "Avançado (crio conteúdo profissionalmente)": "Advanced (create content professionally)",
    "Pessoas físicas (B2C)": "Consumers (B2C)",
    "Empreendedores / Profissionais": "Entrepreneurs / Professionals",
    "Empresas (B2B)": "Companies (B2B)",
    "Qual é a faixa etária do seu público?": "What is the age range of your audience?",
    "Como é a distribuição de gênero do seu público?": "What is the gender split of your audience?",
    "Majoritariamente feminino": "Mostly female",
    "Majoritariamente masculino": "Mostly male",
    "Bem equilibrado": "Well balanced",
    "Ainda não sei": "I don't know yet",
    "Que tipo de vídeo você mais gosta de criar?": "What type of video do you enjoy creating the most?",
    "Educacional / Dicas": "Educational / Tips",
    "Storytelling / Histórias": "Storytelling / Stories",
    "Opinião / Comentários": "Opinion / Commentary",
    "Bastidores / Vida real": "Behind the scenes / Real life",
    "Venda / Oferta / Convite": "Sales / Offer / Invite",
    "Misturo vários formatos": "I mix several formats",
    "Qual é a duração ideal dos seus vídeos?": "What is the ideal length of your videos?",
    "Até 1 minuto": "Up to 1 minute",
    "+10 min": "+10 min",
    "Onde você pretende publicar seus vídeos?": "Where do you plan to publish your videos?",
    "Instagram (Reels / Stories)": "Instagram (Reels / Stories)",
    "YouTube Shorts": "YouTube Shorts",
    "YouTube (vídeos longos)": "YouTube (long videos)",
    "Lives": "Lives",
    "Outras plataformas": "Other platforms",
    "Qual é o tom da sua fala nos vídeos?": "What is the tone of your speech in videos?",
    "Profissional / Autoridade": "Professional / Authority",
    "Amigável / Conversa informal": "Friendly / Casual conversation",
    "Motivacional / Inspirador": "Motivational / Inspiring",
    "Divertido / Descontraído": "Fun / Relaxed",
    "Direto ao ponto": "Straight to the point",
    "Qual é o nível de energia dos seus vídeos?": "What is the energy level of your videos?",
    "Baixo (calmo, reflexivo)": "Low (calm, reflective)",
    "Médio (equilibrado)": "Medium (balanced)",
    "Alto (animado, intenso)": "High (lively, intense)",
    "Qual é o objetivo principal dos seus vídeos hoje?": "What is the main goal of your videos today?",
    "Informar (compartilhar notícias)": "Inform (share news)",
    "Educar (Ensinar conceitos)": "Educate (teach concepts)",
    "Entreter (Divertir audiência)": "Entertain (amuse your audience)",
    "Inspirar (Motivar Pessoas)": "Inspire (motivate people)",
    "Vender (Promover produtos)": "Sell (promote products)",
    "Engajar (Criar comunidade)": "Engage (build community)",

    // ── Quiz multi-select confirm ──
    "Continuar ({count} selecionado)": "Continue ({count} selected)",
    "Continuar ({count} selecionados)": "Continue ({count} selected)",

    // ── Quiz AgeHighlight ──
    "Depoimento": "Testimonial",
    "seguidores": "followers",
    "visualizações": "views",
    "ações de engajamento": "engagement actions",
    "mensagens/vendas": "messages/sales",
    "Em menos de 7 dias eles conseguiram aumentar o número de": "In less than 7 days they managed to increase the number of",
    "em": "by",
    "Você também vai": "You will also",
    "conseguir": "make it",

    // ── Quiz Processing ──
    "Processando": "Processing",
    "ter segurança": "feel confident",
    "destravar": "overcome blocks",
    "não procrastinar": "stop procrastinating",
    "ficar confortável": "feel comfortable",
    "a ter ideias": "coming up with ideas",
    "a editar": "with editing",
    "no engajamento": "with engagement",
    "a superar a timidez": "overcoming shyness",
    "Nossa": "Our",
    "vai criar um": "will create a personalized",
    "aplicativo": "app",
    "personalizado para você...": "for you...",
    "gravando vídeos.": "recording videos.",
    "Vamos te ajudar": "We will help you",
    "criando um": "by creating a",
    "roteiro prático.": "practical script.",
    "Em menos de": "In less than",
    "seu vídeo estará pronto.": "your video will be ready.",

    // ── Quiz MidMessage ──
    "Falta bem pouco para ter um": "You're almost there to have an",
    "aplicativo com IA": "AI-powered app",
    "treinada e configurada para você, para gerar": "trained and configured for you, to generate",
    "roteiro de vídeos": "video scripts",
    "em um teleprompter.": "on a teleprompter.",

    // ── Quiz Transition ──
    "Analisando seu perfil...": "Analyzing your profile...",
    "Ajustando o tom ideal...": "Adjusting the ideal tone...",
    "Preparando seus roteiros...": "Preparing your scripts...",
    "Criando seu plano personalizado...": "Creating your personalized plan...",
    "\"Com o ThinkAndTalk, passei a gravar 3x mais rápido!\"":
      "\"With ThinkAndTalk, I started recording 3x faster!\"",
    "\"Finalmente consegui manter consistência nos meus vídeos\"":
      "\"I finally managed to stay consistent with my videos\"",
    "\"Minha confiança ao gravar aumentou demais\"":
      "\"My confidence when recording increased a lot\"",
    "\"O teleprompter com IA mudou minha rotina de criação\"":
      "\"The AI teleprompter changed my creation routine\"",
    "\"Agora tenho roteiros prontos em minutos, não horas\"":
      "\"Now I have scripts ready in minutes, not hours\"",
    "— Criador ThinkAndTalk": "— ThinkAndTalk Creator",

    // ── Quiz Coupon ──
    "Você ganhou um presente!": "You got a gift!",
    "Seu perfil tem alto potencial com o uso do ThinkAndTalk.":
      "Your profile has high potential with ThinkAndTalk.",
    "Raspe o cupom abaixo para descobrir seu desconto especial":
      "Scratch the coupon below to discover your special discount",
    "✨ Raspe para revelar ✨": "✨ Scratch to reveal ✨",
    "DE DESCONTO": "OFF",
    "Código: CREATOR40": "Code: CREATOR40",
    "🎉 Parabéns! Seu cupom será aplicado automaticamente.":
      "🎉 Congrats! Your coupon will be applied automatically.",
    "Use o dedo ou mouse para raspar": "Use your finger or mouse to scratch",

    // ── Quiz Email Capture ──
    "Quase lá! 🎉": "Almost there! 🎉",
    "Garanta seu DESCONTO de 40% informando seu EMAIL. Ele será seu LOGIN no aplicativo.":
      "Secure your 40% DISCOUNT by entering your EMAIL. It will be your LOGIN for the app.",
    "Por favor, insira seu email": "Please enter your email",
    "Por favor, insira um email válido": "Please enter a valid email",
    "Seus dados estão seguros. Sem spam.": "Your data is safe. No spam.",

    // ── Quiz Results / Sales Page ──
    "Oferta valida por": "Offer valid for",
    "minutos": "minutes",
    "Análise Completa": "Full Analysis",
    "ThinkAndTalk personalizado para seu perfil": "ThinkAndTalk personalized for your profile",
    "Criamos um aplicativo com um plano sob medida para você criar vídeos com mais clareza, confiança e consistência usando roteiros inteligentes e teleprompter com IA.":
      "We created an app with a tailored plan for you to create videos with more clarity, confidence, and consistency using smart scripts and AI teleprompter.",
    "pagamento único": "one-time payment",
    "♾️ Acesso vitalício": "♾️ Lifetime access",
    "Você faz um pagamento único de": "You make a one-time payment of",
    "e tem acesso ao aplicativo com a IA personalizada para sempre!":
      "and get access to the app with personalized AI forever!",
    "Compra 100% segura, com criptografia de ponta a ponta.":
      "100% secure purchase, with end-to-end encryption.",
    "Tenha acesso a um grupo exclusivo no WhatsApp para networking com outros criadores de conteúdo e alavancagem para viralização de conteúdo.":
      "Get access to an exclusive WhatsApp group for networking with other content creators and leverage for content viralization.",
    "😓 Antes do ThinkAndTalk": "😓 Before ThinkAndTalk",
    "❌ Passava horas olhando para a tela sem saber o que falar no vídeo":
      "❌ Spent hours staring at the screen without knowing what to say",
    "❌ Gravava vários takes e ainda assim não ficava satisfeito":
      "❌ Recorded multiple takes and still wasn't satisfied",
    "❌ Perdida(o) sobre o que postar e quando postar":
      "❌ Lost about what to post and when to post",
    "❌ Vídeos longos, confusos ou sem uma mensagem clara":
      "❌ Long, confusing videos or without a clear message",
    "❌ Dependia de inspiração (que quase nunca vinha)":
      "❌ Depended on inspiration (which almost never came)",
    "❌ Falava travado(a), esquecia partes importantes ou se perdia no meio do vídeo":
      "❌ Spoke stuttering, forgot important parts or got lost in the middle of the video",
    "❌ Falta de consistência: alguns dias postava, depois sumia":
      "❌ Lack of consistency: posted some days, then disappeared",
    "❌ Sentia insegurança e vergonha ao gravar":
      "❌ Felt insecurity and shame when recording",
    "❌ Conteúdo não convertia em seguidores, leads ou vendas":
      "❌ Content didn't convert into followers, leads, or sales",
    "🚀 Depois do ThinkAndTalk": "🚀 After ThinkAndTalk",
    "✅ Roteiros prontos em segundos, alinhados ao objetivo do vídeo":
      "✅ Scripts ready in seconds, aligned with the video's goal",
    "✅ Gravação fluida com teleprompter ajustável":
      "✅ Smooth recording with adjustable teleprompter",
    "✅ Clareza total sobre o que dizer, como dizer e em quanto tempo":
      "✅ Total clarity on what to say, how to say it, and in how much time",
    "✅ Conteúdos objetivos, envolventes e fáceis de entender":
      "✅ Objective, engaging, and easy-to-understand content",
    "✅ Consistência real: postar virou rotina, não sofrimento":
      "✅ Real consistency: posting became routine, not suffering",
    "✅ Confiança ao falar, mesmo para quem é tímido ou iniciante":
      "✅ Confidence when speaking, even for shy or beginner creators",
    "✅ Vídeos adaptados para Instagram, TikTok, YouTube, Reels, Shorts e Lives":
      "✅ Videos adapted for Instagram, TikTok, YouTube, Reels, Shorts, and Lives",
    "✅ Mais engajamento, retenção e conexão com o público":
      "✅ More engagement, retention, and connection with the audience",
    "✅ Mais autoridade, profissionalismo e resultados":
      "✅ More authority, professionalism, and results",
    "· 98% satisfação": "· 98% satisfaction",
    "\"Ficou incrível o resultado.\"": "\"The result was incredible.\"",
    "\"Em menos de 5 minutos ficou pronto. Revolucionário!\"":
      "\"Ready in less than 5 minutes. Revolutionary!\"",
    "\"Só com o celular eu consegui.\"": "\"I did it with just my phone.\"",
    "\"Economizei tempo e muita grana. Sensacional!\"":
      "\"Saved time and a lot of money. Amazing!\"",
    "A mesma técnica que os grandes criadores usam para gravar vídeos profissionais — agora no seu celular.":
      "The same technique big creators use to record professional videos — now on your phone.",
    "Técnica dos grandes criadores": "Big creators' technique",
    "usada pelos maiores influenciadores": "used by the biggest influencers",
    "Só precisa do celular": "You only need your phone",
    "zero custo com edição": "zero editing cost",
    "Resultado em 5 minutos": "Results in 5 minutes",
    "rapidez impressionante": "impressive speed",
    "Sem conhecimento técnico": "No technical knowledge needed",
    "qualquer pessoa consegue": "anyone can do it",
    "Como funciona?": "How does it work?",
    "Abra no celular": "Open on your phone",
    "Informe o tema do vídeo": "Enter the video topic",
    "Selecione as notícias recentes": "Select recent news",
    "A IA cria o roteiro": "AI creates the script",
    "✨ Pronto — roteiro no teleprompter profissional":
      "✨ Done — script on the professional teleprompter",
    "Garantia de 7 dias": "7-day guarantee",
    "Se você não ficar satisfeito, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.":
      "If you're not satisfied, we refund 100% of your money. No questions, no hassle.",
    "Ativar meu aplicativo personalizado por apenas R$ 47":
      "Activate my personalized app for only R$ 47",
    // ── Quiz flow (Quiz.tsx) ──
    "Erro ao iniciar o quiz": "Error starting the quiz",
    "Tente novamente em instantes.": "Try again in a moment.",
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
