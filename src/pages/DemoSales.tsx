import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n";

import SalesHeader from "@/components/sales/SalesHeader";
import DemoSalesHero from "@/components/sales/DemoSalesHero";
import SalesPainPoints from "@/components/sales/SalesPainPoints";
import SalesSolution from "@/components/sales/SalesSolution";
import SalesBenefits from "@/components/sales/SalesBenefits";
import SalesObjections from "@/components/sales/SalesObjections";
import SalesSocialProof from "@/components/sales/SalesSocialProof";
import SalesOffer from "@/components/sales/SalesOffer";
import SalesScarcity from "@/components/sales/SalesScarcity";
import SalesFinalCta from "@/components/sales/SalesFinalCta";
import CheckoutTransition from "@/components/sales/CheckoutTransition";

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

const DemoSales = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const { toast } = useToast();

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

  const handleActivatePlan = async (buttonIndex: number) => {
    setIsLoading(true);
    try {
      const preferredEmail = sessionStorage.getItem("pendingQuizEmail") || undefined;
      const url = buildCheckoutUrl(preferredEmail || undefined);
      setPendingRedirectUrl(url);
      setShowTransition(true);
    } catch (error: unknown) {
      console.error("Subscription error:", error);
      toast({
        title: t("Erro ao iniciar assinatura"),
        description: error instanceof Error ? error.message : t("Tente novamente mais tarde."),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleTransitionComplete = useCallback(() => {
    if (pendingRedirectUrl) {
      window.location.href = pendingRedirectUrl;
    }
  }, [pendingRedirectUrl]);

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="min-h-screen flex flex-col bg-quiz-background">
      {showTransition && <CheckoutTransition onComplete={handleTransitionComplete} />}
      <SalesHeader minutes={minutes} seconds={seconds} />

      <div className="flex-1 px-4 sm:px-6">
        <div className="w-full max-w-lg mx-auto flex flex-col space-y-8 py-6">
          <DemoSalesHero onCtaClick={() => handleActivatePlan(1)} isLoading={isLoading} />
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

export default DemoSales;
