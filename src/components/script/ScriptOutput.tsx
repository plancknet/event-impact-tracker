import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n";

interface ScriptOutputProps {
  script: string;
  isLoading?: boolean;
  onEdit?: (script: string) => void;
}

export function ScriptOutput({ script, isLoading, onEdit }: ScriptOutputProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-4/5" />
        </div>
        <p className="text-center text-muted-foreground mt-8">
          {t("Gerando seu roteiro...")}
        </p>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
        <p className="text-muted-foreground">{t("Seu roteiro aparecerá aqui")}</p>
        <p className="text-sm text-muted-foreground/70 mt-2">
          {t("Clique em \"Gerar Roteiro\" para começar")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 md:p-8">
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">{t("Texto do roteiro")}</div>
        <Textarea
          value={script}
          onChange={(event) => onEdit?.(event.target.value)}
          rows={12}
          className={cn("resize-none", onEdit ? "bg-background" : "bg-muted/30")}
          readOnly={!onEdit}
        />
        <p className="text-xs text-muted-foreground">
          {t("Você pode editar o texto a qualquer momento antes de salvar.")}
        </p>
      </div>
    </div>
  );
}

