import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface QuizTransitionProps {
  onComplete: () => void;
}

const LOADING_MESSAGES = [
  "Analisando seu perfil…",
  "Ajustando o tom ideal…",
  "Preparando seus roteiros…",
  "Criando seu plano personalizado…",
];

const SOCIAL_PROOF = [
  "\"Com o ThinkAndTalk, passei a gravar 3x mais rápido!\"",
  "\"Finalmente consegui manter consistência nos meus vídeos\"",
  "\"Minha confiança ao gravar aumentou demais\"",
  "\"O teleprompter com IA mudou minha rotina de criação\"",
  "\"Agora tenho roteiros prontos em minutos, não horas\"",
];

const QuizTransition = ({ onComplete }: QuizTransitionProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentProofIndex, setCurrentProofIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.25; // Complete in ~8 seconds
      });
    }, 100);

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => 
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 2000);

    // Social proof rotation
    const proofInterval = setInterval(() => {
      setCurrentProofIndex(prev => (prev + 1) % SOCIAL_PROOF.length);
    }, 2500);

    // Complete after 8 seconds
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearInterval(proofInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-8">
        {/* Logo */}
        <img 
          src="/imgs/TAT_Logo_sem_fundo_500px.png" 
          alt="ThinkAndTalk" 
          className="w-24 h-24 object-contain animate-pulse"
        />

        {/* Loading Spinner */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-quiz-muted/20" />
          <div 
            className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-quiz-purple animate-spin"
          />
        </div>

        {/* Loading Message */}
        <div className="h-8 flex items-center justify-center">
          <p 
            key={currentMessageIndex}
            className="text-lg font-medium text-quiz-foreground animate-fade-in"
          >
            {LOADING_MESSAGES[currentMessageIndex]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="h-2 bg-quiz-card rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-quiz-blue to-quiz-purple transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-quiz-muted mt-2">{Math.round(progress)}%</p>
        </div>

        {/* Social Proof Carousel */}
        <div className="mt-8 bg-quiz-card rounded-xl p-6 border border-quiz-border shadow-sm">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-lg">⭐</span>
            ))}
          </div>
          <p 
            key={currentProofIndex}
            className="text-quiz-foreground italic animate-fade-in"
          >
            {SOCIAL_PROOF[currentProofIndex]}
          </p>
          <p className="text-sm text-quiz-muted mt-2">— Criador ThinkAndTalk</p>
        </div>
      </div>
    </div>
  );
};

export default QuizTransition;