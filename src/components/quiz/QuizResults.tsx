import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

import SalesHeader from "@/components/sales/SalesHeader";
import SalesHero from "@/components/sales/SalesHero";
import SalesPainPoints from "@/components/sales/SalesPainPoints";
import SalesSolution from "@/components/sales/SalesSolution";
import SalesBenefits from "@/components/sales/SalesBenefits";
import SalesObjections from "@/components/sales/SalesObjections";
import SalesSocialProof from "@/components/sales/SalesSocialProof";
import SalesOffer from "@/components/sales/SalesOffer";
import SalesScarcity from "@/components/sales/SalesScarcity";
import SalesFinalCta from "@/components/sales/SalesFinalCta";

const CHECKOUT_URL = "https://lastlink.com/p/C7229FE68/checkout-payment/";

const buildCheckoutUrl = (email?: string) => {
  const url = new URL(CHECKOUT_URL);
  const redirectUrl = `${window.location.origin}/premium/success`;
  url.searchParams.set("redirect_url", redirectUrl);
  if (email) {
    url.searchParams.set("email", email);
    url.searchParams.set("quiz_email", email);
  }
  return url.toString();
};

const QuizResults = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const { toast } = useToast();
  const quizId = sessionStorage.getItem("quizId");
  const getSaoPauloTimestamp = () => new Date().toISOString();

  // Countdown timer
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = Math.max(0, 600 - elapsed);
      setRemainingSeconds(left);
      if (left === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track sales page view
  useEffect(() => {
    if (!quizId) return;
    supabase
      .rpc("update_quiz_response", {
        _quiz_id: quizId,
        _data: { sales_page_at: getSaoPauloTimestamp() },
      } as any)
      .then(({ error }) => {
        if (error) console.error("Failed to track sales page:", error);
      });
  }, [quizId]);

  const handleActivatePlan = async (buttonIndex: number) => {
    setIsLoading(true);
    try {
      const preferredEmail = sessionStorage.getItem("pendingQuizEmail") || undefined;
      if (quizId) {
        const clickKey = `checkout_button_${buttonIndex}_at`;
        await supabase.rpc("update_quiz_response", {
          _quiz_id: quizId,
          _data: { [clickKey]: getSaoPauloTimestamp() },
        } as any);
      }
      window.location.href = buildCheckoutUrl(preferredEmail || undefined);
    } catch (error: unknown) {
      console.error("Subscription error:", error);
      toast({
        title: t("Erro ao iniciar assinatura"),
        description: error instanceof Error ? error.message : t("Tente novamente mais tarde."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="min-h-screen flex flex-col bg-quiz-background">
      <SalesHeader minutes={minutes} seconds={seconds} />

      <div className="flex-1 px-4 sm:px-6">
        <div className="w-full max-w-lg mx-auto flex flex-col space-y-8 py-6">
          <SalesHero onCtaClick={() => handleActivatePlan(1)} isLoading={isLoading} />
          <SalesPainPoints />
          <SalesSolution />
          <SalesBenefits />
          <SalesObjections />
          <SalesSocialProof />
          <SalesOffer onCtaClick={() => handleActivatePlan(1)} isLoading={isLoading} />
          <SalesScarcity />
          <SalesFinalCta onCtaClick={() => handleActivatePlan(2)} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
