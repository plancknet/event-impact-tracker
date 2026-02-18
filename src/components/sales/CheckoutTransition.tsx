import { useEffect, useState } from "react";

const STEPS = [
  { emoji: "🔒", text: "Preparando seu acesso..." },
  { emoji: "✅", text: "Garantindo sua oferta exclusiva..." },
  { emoji: "🔐", text: "Redirecionando para ambiente 100% seguro..." },
];

interface CheckoutTransitionProps {
  onComplete: () => void;
}

const CheckoutTransition = ({ onComplete }: CheckoutTransitionProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStepIndex(1), 800);
    const t2 = setTimeout(() => setStepIndex(2), 1600);
    const t3 = setTimeout(() => setShowFinal(true), 2400);
    const t4 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-quiz-background/95 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center text-center space-y-6 px-6 max-w-sm">
        {/* Spinner */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-quiz-muted/20" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-t-quiz-purple animate-spin" />
        </div>

        {/* Steps */}
        <div className="space-y-3 min-h-[120px]">
          {STEPS.map((step, i) => (
            <p
              key={i}
              className={`text-base font-medium text-quiz-foreground transition-all duration-500 ${
                i <= stepIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              {step.emoji} {step.text}
            </p>
          ))}
        </div>

        {/* Final message + Lastlink logo */}
        <div
          className={`transition-all duration-500 space-y-3 ${
            showFinal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <p className="text-sm text-quiz-muted leading-relaxed">
            Você será direcionado para a plataforma oficial de pagamento
          </p>
          <img
            src="/imgs/lastlink_logo.webp"
            alt="Lastlink"
            className="h-8 mx-auto object-contain"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutTransition;
