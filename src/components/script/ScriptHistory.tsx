import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  ChevronDown,
  FileText,
  Trash2
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  onDeleteScript?: (id: string) => void;
  refreshTrigger?: number;
  expandTrigger?: number;
  defaultOpen?: boolean;
}

export function ScriptHistory({ 
  currentScriptId, 
  onSelectScript, 
  onDeleteScript,
  refreshTrigger,
  expandTrigger,
  defaultOpen = false
}: ScriptHistoryProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [scripts, setScripts] = useState<ScriptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

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
    
    if (!confirm("Deseja excluir este roteiro?")) return;

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
    if (!searchFilter.trim()) return scripts;
    const query = searchFilter.toLowerCase();
    return scripts.filter((script) =>
      script.script_text.toLowerCase().includes(query)
    );
  }, [scripts, searchFilter]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-t-xl">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">Hist\u00F3rico de Roteiros</h3>
              {scripts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {scripts.length}
                </Badge>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar roteiros..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Scripts list */}
            {!isLoading && (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredScripts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {scripts.length === 0 
                      ? "Nenhum roteiro salvo ainda" 
                      : "Nenhum roteiro encontrado"}
                  </p>
                ) : (
                  filteredScripts.map((script) => (
                    <div
                      key={script.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors group ${
                        currentScriptId === script.id
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => onSelectScript(script)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{getScriptPreview(script.script_text)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(script.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(e, script.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
