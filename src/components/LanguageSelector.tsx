import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";

function BrazilFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-3.5 w-5" aria-hidden="true">
      <rect width="24" height="16" fill="#009739" />
      <polygon points="12,2 22,8 12,14 2,8" fill="#FEDD00" />
      <circle cx="12" cy="8" r="4" fill="#002776" />
    </svg>
  );
}

function UsFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-3.5 w-5" aria-hidden="true">
      <rect width="24" height="16" fill="#B22234" />
      <rect y="2" width="24" height="2" fill="#FFFFFF" />
      <rect y="6" width="24" height="2" fill="#FFFFFF" />
      <rect y="10" width="24" height="2" fill="#FFFFFF" />
      <rect y="14" width="24" height="2" fill="#FFFFFF" />
      <rect width="10" height="8" fill="#3C3B6E" />
    </svg>
  );
}

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("pt")}
        className={`gap-1 px-2 text-xs ${language === "pt" ? "text-foreground" : "text-muted-foreground"}`}
      >
        <BrazilFlag />
        <span className="sr-only">PT</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("en")}
        className={`gap-1 px-2 text-xs ${language === "en" ? "text-foreground" : "text-muted-foreground"}`}
      >
        <UsFlag />
        <span className="sr-only">EN</span>
      </Button>
    </div>
  );
}
