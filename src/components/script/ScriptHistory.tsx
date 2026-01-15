import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  ChevronDown,
  FileText,
  Monitor,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";

interface ScriptHistoryItem {
  id: string;
  created_at: string;
  script_text: string;
  news_ids_json: unknown;
  parameters_json?: unknown;
}

interface ScriptHistoryProps {
  currentScriptId: string | null;
  onSelectScript: (script: ScriptHistoryItem) => void;
  onOpenTeleprompter?: (script: ScriptHistoryItem) => void;
  onDeleteScript?: (id: string) => void;
  refreshTrigger?: number;
  expandTrigger?: number;
  defaultOpen?: boolean;
}

type SortKey = "created_at" | "topic" | "preview";

type SortConfig = {
  key: SortKey;
  direction: "asc" | "desc";
};

const getTopicFromParams = (value: unknown): string => {
  if (!value || typeof value !== "object") return "";
  const params = value as { profile?: { mainSubject?: unknown } };
  return typeof params.profile?.mainSubject === "string" ? params.profile.mainSubject : "";
};

export function ScriptHistory({
  currentScriptId,
  onSelectScript,
  onOpenTeleprompter,
  onDeleteScript,
  refreshTrigger,
  expandTrigger,
  defaultOpen = false,
}: ScriptHistoryProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [scripts, setScripts] = useState<ScriptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created_at",
    direction: "desc",
  });

  const loadScripts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("teleprompter_scripts")
        .select("id, created_at, script_text, news_ids_json, parameters_json")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setScripts(data || []);
    } catch (err) {
      console.error("Failed to load script history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, [user, refreshTrigger]);

  useEffect(() => {
    if (expandTrigger !== undefined) {
      setIsOpen(true);
    }
  }, [expandTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (!confirm(t("Deseja excluir este roteiro?"))) return;

    try {
      const { error } = await supabase
        .from("teleprompter_scripts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setScripts((prev) => prev.filter((s) => s.id !== id));
      onDeleteScript?.(id);
    } catch (err) {
      console.error("Failed to delete script:", err);
    }
  };

  const getScriptPreview = (text: string): string => {
    const cleaned = text
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.slice(0, 80) + (cleaned.length > 80 ? "..." : "");
  };

  const filteredScripts = useMemo(() => {
    let filtered = scripts;

    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase();
      filtered = filtered.filter((script) =>
        script.script_text.toLowerCase().includes(query)
      );
    }

    if (topicFilter.trim()) {
      const query = topicFilter.toLowerCase();
      filtered = filtered.filter((script) =>
        getTopicFromParams(script.parameters_json).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [scripts, searchFilter, topicFilter]);

  const sortedScripts = useMemo(() => {
    const sorted = [...filteredScripts];
    const { key, direction } = sortConfig;

    sorted.sort((a, b) => {
      if (key === "created_at") {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return direction === "asc" ? aTime - bTime : bTime - aTime;
      }

      const aValue = key === "topic"
        ? getTopicFromParams(a.parameters_json)
        : getScriptPreview(a.script_text);
      const bValue = key === "topic"
        ? getTopicFromParams(b.parameters_json)
        : getScriptPreview(b.script_text);

      return direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return sorted;
  }, [filteredScripts, sortConfig]);

  const toggleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-t-xl">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">{t("Histórico de Roteiros")}</h3>
              {scripts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {scripts.length}
                </Badge>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("Buscar roteiros...")}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Input
                placeholder={t("Filtrar por tema")}
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="h-9 w-full sm:w-[220px]"
              />
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && (
              <div className="space-y-2">
                <div className="hidden md:grid grid-cols-[2fr_1fr_160px_40px] gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <button
                    type="button"
                    onClick={() => toggleSort("preview")}
                    className="flex items-center gap-1 text-left"
                  >
                    {t("Roteiro")}
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("topic")}
                    className="flex items-center gap-1 text-left"
                  >
                    {t("Tema")}
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("created_at")}
                    className="flex items-center gap-1 text-left"
                  >
                    {t("Data")}
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                  <div />
                </div>

                <div className="max-h-[320px] overflow-y-auto space-y-2">
                  {sortedScripts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {scripts.length === 0
                        ? t("Nenhum roteiro salvo ainda")
                        : t("Nenhum roteiro encontrado")}
                    </p>
                  ) : (
                    sortedScripts.map((script) => (
                      <div
                        key={script.id}
                        className={`grid grid-cols-1 gap-2 p-3 rounded-lg border cursor-pointer transition-colors md:grid-cols-[2fr_1fr_160px_40px] md:gap-3 md:items-start ${
                          currentScriptId === script.id
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => onSelectScript(script)}
                      >
                        <div className="text-sm font-medium leading-snug">
                          {getScriptPreview(script.script_text)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getTopicFromParams(script.parameters_json) || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(script.created_at), "dd/MM/yyyy HH:mm", {
                            locale: language === "pt" ? ptBR : enUS,
                          })}
                        </div>
                        <div className="flex justify-end gap-2">
                          {onOpenTeleprompter && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTeleprompter(script);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Monitor className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(e, script.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

