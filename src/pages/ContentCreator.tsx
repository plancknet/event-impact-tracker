import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, type SortDirection } from "@/components/SortableTableHead";
import { WordCloud } from "@/components/WordCloud";
import { DateFilter } from "@/components/DateFilter";
import { CategoryFilter } from "@/components/CategoryFilter";
import { LocalTermFilter } from "@/components/LocalTermFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, FileText, Loader2, LogOut, Monitor, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TeleprompterDisplay } from "@/components/teleprompter/TeleprompterDisplay";
import { runNewsPipelineWithTerms } from "@/news/pipeline";
import type { FullArticle, NewsSearchTerm } from "@/news/types";
import {
  fetchLatestTeleprompterScript,
  generateTeleprompterScript,
  type TeleprompterNewsItem,
  type TeleprompterParameters,
} from "@/services/teleprompter/generateTeleprompterScript";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

type StepId = 1 | 2 | 3;

type SortField = "published_at" | "title";

type ScriptSortField = "created_at" | "title";

type ScriptHistoryItem = {
  id: string;
  created_at: string;
  script_text: string;
  news_ids_json: unknown;
  parameters_json?: unknown;
};

type ScriptParameters = {
  tone?: string;
  audience?: string;
  duration?: string;
  language?: string;
  complementaryPrompt?: string;
  profile?: {
    mainSubject?: string;
    goal?: string;
    platform?: string;
    newsLanguage?: string;
    scriptLanguage?: string;
  };
};

type WritingProfile = {
  mainSubject: string;
  tone: string;
  audience: string;
  duration: string;
  platform: string;
  goal: string;
  newsLanguage: string;
  scriptLanguage: string;
};

const TONE_OPTIONS = [
  "Calmo",
  "Conversacional",
  "Direto",
  "Jornalistico",
  "Didatico",
  "Entusiasmado",
  "Humoristico",
  "Inspirador",
];

const AUDIENCE_OPTIONS = [
  "Criadores",
  "Fundadores",
  "Estudantes",
  "Publico geral",
  "Especialistas",
  "Investidores",
];

const DURATION_OPTIONS = [
  "30s",
  "45s",
  "60s",
  "90s",
  "2 minutos",
  "3 minutos",
  "5 minutos",
  "800 palavras",
];

const PLATFORM_OPTIONS = [
  "YouTube",
  "TikTok",
  "Instagram Reels",
  "Podcast",
  "TV",
  "LinkedIn",
];

const GOAL_OPTIONS = [
  "Entreter",
  "Informar",
  "Ensinar",
  "Persuadir",
  "Vender",
  "Engajar",
];

const NEWS_LANGUAGE_OPTIONS = [
  { label: "Português (pt-BR)", value: "pt-BR" },
  { label: "Ingles (en)", value: "en" },
  { label: "Espanhol (es)", value: "es" },
];

const DEFAULT_PROFILE: WritingProfile = {
  mainSubject: "Bitcoin",
  tone: "Calmo",
  audience: "Criadores",
  duration: "60s",
  platform: "YouTube",
  goal: "Entreter",
  newsLanguage: "pt-BR",
  scriptLanguage: "Portuguese",
};

export default function ContentCreator() {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState<StepId>(1);
  const [profile, setProfile] = useState<WritingProfile>(DEFAULT_PROFILE);
  const [searchTerms, setSearchTerms] = useState<NewsSearchTerm[]>([]);
  const [newsItems, setNewsItems] = useState<FullArticle[]>([]);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [complementaryPrompt, setComplementaryPrompt] = useState("");
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [titleFilter, setTitleFilter] = useState("");
  const [wordCloudFilter, setWordCloudFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [publishedDateFilter, setPublishedDateFilter] = useState("");
  const [termFilter, setTermFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [currentSort, setCurrentSort] = useState<{ key: SortField; direction: SortDirection }>({
    key: "published_at",
    direction: "desc",
  });
  const [scriptTitleFilter, setScriptTitleFilter] = useState("");
  const [scriptDateFilter, setScriptDateFilter] = useState("");
  const [scriptSort, setScriptSort] = useState<{ key: ScriptSortField; direction: SortDirection }>({
    key: "created_at",
    direction: "desc",
  });
  const [generatedScript, setGeneratedScript] = useState("");
  const [editedScript, setEditedScript] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingScript, setIsSavingScript] = useState(false);
  const [scriptHistory, setScriptHistory] = useState<ScriptHistoryItem[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [isScriptsCollapsed, setIsScriptsCollapsed] = useState(true);

  const scriptLanguageOptions = [
    { label: "Inglês", value: "English" },
    { label: "Português", value: "Portuguese" },
    { label: "Espanhol", value: "Spanish" },
  ];

  const selectedNews = useMemo(
    () => newsItems.filter((item) => selectedNewsIds.includes(item.id)),
    [newsItems, selectedNewsIds],
  );

  const references = useMemo(
    () =>
      selectedNews.map((item) => ({
        title: item.title,
        url: item.link,
      })),
    [selectedNews],
  );

  const termOptions = useMemo(() => searchTerms.map((term) => term.term), [searchTerms]);
  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    newsItems.forEach((item) => {
      const source = formatSource(item.source, item.link);
      if (source) set.add(source);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [newsItems]);

  const termFilteredResults = useMemo(() => {
    if (termFilter.length === 0) return newsItems;
    const termSet = new Set(termFilter.map((t) => t.toLowerCase()));
    return newsItems.filter((item) => {
      if (item.term && termSet.has(item.term.toLowerCase())) return true;
      return termFilter.some((term) => item.title.toLowerCase().includes(term.toLowerCase()));
    });
  }, [newsItems, termFilter]);

  const wordCloudTitles = useMemo(
    () => termFilteredResults.map((item) => item.title),
    [termFilteredResults],
  );

  const filteredAndSortedNews = useMemo(() => {
    let filtered = termFilteredResults;

    if (titleFilter.trim()) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(titleFilter.toLowerCase().trim()),
      );
    }

    if (wordCloudFilter.length > 0) {
      const words = wordCloudFilter.map((w) => w.toLowerCase());
      filtered = filtered.filter((item) =>
        words.some((word) => item.title.toLowerCase().includes(word)),
      );
    }

    if (categoryFilter.length > 0) {
      const categorySet = new Set(categoryFilter.map((c) => c.toLowerCase()));
      filtered = filtered.filter((item) => {
        const source = formatSource(item.source, item.link).toLowerCase();
        return source ? categorySet.has(source) : false;
      });
    }

    const creationFilterDate = parseFilterDate(dateFilter);
    if (creationFilterDate) {
      filtered = filtered.filter((item) => {
        if (!item.fetchedAt) return false;
        const newsDate = new Date(item.fetchedAt);
        return (
          newsDate.getDate() === creationFilterDate.getDate() &&
          newsDate.getMonth() === creationFilterDate.getMonth() &&
          newsDate.getFullYear() === creationFilterDate.getFullYear()
        );
      });
    }

    const publicationFilterDate = parseFilterDate(publishedDateFilter);
    if (publicationFilterDate) {
      filtered = filtered.filter((item) => {
        if (!item.publishedAt) return false;
        const publishedDate = new Date(item.publishedAt);
        return (
          publishedDate.getDate() === publicationFilterDate.getDate() &&
          publishedDate.getMonth() === publicationFilterDate.getMonth() &&
          publishedDate.getFullYear() === publicationFilterDate.getFullYear()
        );
      });
    }

    return [...filtered].sort((a, b) => {
      if (currentSort.key === "published_at") {
        const aVal = a.publishedAt || "";
        const bVal = b.publishedAt || "";
        return currentSort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const aVal = a.title.toLowerCase();
      const bVal = b.title.toLowerCase();
      return currentSort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [
    termFilteredResults,
    titleFilter,
    wordCloudFilter,
    categoryFilter,
    dateFilter,
    publishedDateFilter,
    currentSort,
  ]);

  const filteredScripts = useMemo(() => {
    let filtered = scriptHistory;

    if (scriptTitleFilter.trim()) {
      filtered = filtered.filter((script) =>
        script.script_text.toLowerCase().includes(scriptTitleFilter.toLowerCase().trim()),
      );
    }

    const creationFilterDate = parseFilterDate(scriptDateFilter);
    if (creationFilterDate) {
      filtered = filtered.filter((script) => {
        const scriptDate = new Date(script.created_at);
        return (
          scriptDate.getDate() === creationFilterDate.getDate() &&
          scriptDate.getMonth() === creationFilterDate.getMonth() &&
          scriptDate.getFullYear() === creationFilterDate.getFullYear()
        );
      });
    }

    return [...filtered].sort((a, b) => {
      if (scriptSort.key === "created_at") {
        return scriptSort.direction === "asc"
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at);
      }
      const aVal = getScriptPreview(a.script_text).toLowerCase();
      const bVal = getScriptPreview(b.script_text).toLowerCase();
      return scriptSort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [scriptHistory, scriptTitleFilter, scriptDateFilter, scriptSort]);

  const canContinueFromProfile =
    profile.mainSubject.trim() &&
    profile.tone.trim() &&
    profile.audience.trim() &&
    profile.duration.trim() &&
    profile.platform.trim() &&
    profile.goal.trim() &&
    profile.newsLanguage.trim();

  const hasComplementaryPrompt = complementaryPrompt.trim().length > 0;
  const canContinueFromNews = selectedNewsIds.length > 0;
  const canGenerateFromNews =
    profile.scriptLanguage.trim() && (canContinueFromNews || hasComplementaryPrompt);
  const canSaveScript = editedScript.trim().length > 0;

  const handleToggleNews = (id: string) => {
    setSelectedNewsIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelection = (id: string) => {
    handleToggleNews(id);
  };

  const toggleSelectAll = () => {
    if (selectedNewsIds.length === filteredAndSortedNews.length) {
      setSelectedNewsIds([]);
    } else {
      setSelectedNewsIds(filteredAndSortedNews.map((item) => item.id));
    }
  };

  const handleSort = (key: SortField) => {
    setCurrentSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleScriptSort = (key: ScriptSortField) => {
    setScriptSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleWordCloudClick = (word: string) => {
    setWordCloudFilter((prev) => (prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]));
  };

  const handleContinueToNews = async () => {
    setNewsError(null);
    setNewsLoading(true);
    setSelectedNewsIds([]);
    setSearchTerms([]);
    setNewsItems([]);
    try {
      const terms = buildTermsFromSubject(profile.mainSubject);
      if (terms.length === 0) {
        setNewsError("Adicione um assunto principal para gerar os termos de busca.");
        return;
      }

      setSearchTerms(terms);

      const { items } = await runNewsPipelineWithTerms(terms, {
        maxItemsPerTerm: 6,
        minItemsPerTerm: 5,
        initialWindowHours: 24,
        language: profile.newsLanguage.trim(),
      });

      const fetchedAt = new Date().toISOString();
      const recentItems = items.map((item) => ({ ...item, fetchedAt }));
      // TODO: Enrich selected items with Firecrawl full text when available.
      setNewsItems(recentItems);
      setStep(2);
    } catch (error) {
      console.error("Failed to load news context:", error);
      setNewsError("Nao foi possivel carregar o contexto de noticias. Tente novamente.");
    } finally {
      setNewsLoading(false);
    }
  };

  const resetSelectionToDefaults = () => {
    setProfile(DEFAULT_PROFILE);
    setComplementaryPrompt("");
    setGeneratedScript("");
    setEditedScript("");
    setSelectedNewsIds([]);
    setSearchTerms([]);
    setNewsItems([]);
    setNewsError(null);
    setSelectedScriptId(null);
  };

  const handleGenerate = async (): Promise<boolean> => {
    // NOTE: This restores the teleprompter Edge Function behavior from the old branch.
    return generateScriptFromSelection();
  };

  const handleRegenerateFromCurrent = async (): Promise<boolean> => {
    setGenerationError(null);
    setIsGenerating(true);
    try {
      if (!editedScript.trim()) {
        setGenerationError("Edite o roteiro antes de gerar novamente.");
        return false;
      }
      if (!complementaryPrompt.trim()) {
        setGenerationError("Preencha o prompt complementar para gerar novamente.");
        return false;
      }

      const newsItems = selectedNews.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        content: item.fullText || item.summary || null,
      })) satisfies TeleprompterNewsItem[];

      const parameters = buildTeleprompterParameters(profile, complementaryPrompt);
      const keywords = extractComplementaryKeywords(complementaryPrompt);
      const refinementPrompt =
        keywords.length > 0
          ? `Mantenha o roteiro base ao maximo. Adicione um complemento ao final que atenda ao prompt complementar e inclua: ${keywords.join(", ")}.`
          : "Mantenha o roteiro base ao maximo. Adicione um complemento ao final que atenda ao prompt complementar.";

      const refined = await generateTeleprompterScript(newsItems, parameters, {
        refinementPrompt,
        baseScript: editedScript,
      });

      if (!refined.script) {
        throw new Error("No script returned.");
      }

      if (!scriptIncludesComplementaryPrompt(refined.script, complementaryPrompt)) {
        setGenerationError(
          "O roteiro gerado nao inclui elementos do prompt complementar. Ajuste o prompt e tente novamente.",
        );
        return false;
      }

      setGeneratedScript(refined.script);
      setEditedScript(refined.script);
      await loadScriptHistory();
      return true;
    } catch (error) {
      console.error("Failed to regenerate teleprompter script:", error);
      setGenerationError("Nao foi possivel gerar o roteiro novamente. Tente novamente.");
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveScript = async () => {
    const scriptText = editedScript.trim();
    if (!scriptText) {
      setGenerationError("Edite o roteiro antes de salvar.");
      return;
    }

    if (!user) {
      setGenerationError("Você precisa estar logado para salvar o roteiro.");
      return;
    }

    setIsSavingScript(true);
    try {
      const parameters = buildTeleprompterParameters(profile, complementaryPrompt);
      
      if (selectedScriptId) {
        // Update existing record
        const { error } = await supabase
          .from("teleprompter_scripts")
          .update({
            news_ids_json: selectedNewsIds as unknown as import("@/integrations/supabase/types").Json,
            parameters_json: parameters as unknown as import("@/integrations/supabase/types").Json,
            script_text: scriptText,
          })
          .eq("id", selectedScriptId);

        if (error) throw error;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("teleprompter_scripts")
          .insert({
            user_id: user.id,
            news_ids_json: selectedNewsIds as unknown as import("@/integrations/supabase/types").Json,
            parameters_json: parameters as unknown as import("@/integrations/supabase/types").Json,
            script_text: scriptText,
          })
          .select("id")
          .single();

        if (error) throw error;
        if (data) setSelectedScriptId(data.id);
      }
      
      await loadScriptHistory();
    } catch (error) {
      console.error("Failed to save teleprompter script:", error);
      setGenerationError("Nao foi possivel salvar o roteiro.");
    } finally {
      setIsSavingScript(false);
    }
  };

  const generateScriptFromSelection = async (): Promise<boolean> => {
    setGenerationError(null);
    setIsGenerating(true);
    try {
      if (selectedNews.length === 0 && !hasComplementaryPrompt) {
        setGenerationError(
          "Selecione ao menos uma noticia ou preencha o prompt complementar para gerar o roteiro.",
        );
        return false;
      }
      const newsItems = selectedNews.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        content: item.fullText || item.summary || null,
      })) satisfies TeleprompterNewsItem[];

      const parameters = buildTeleprompterParameters(profile, complementaryPrompt);
      const result = await generateTeleprompterScript(newsItems, parameters);
      if (!result.script) {
        throw new Error("No script returned.");
      }
      const hasComplementary = scriptIncludesComplementaryPrompt(result.script, complementaryPrompt);
      let finalScript = result.script;

      if (!hasComplementary && complementaryPrompt.trim()) {
        const keywords = extractComplementaryKeywords(complementaryPrompt);
        const refinementPrompt =
          keywords.length > 0
            ? `Revise o roteiro para incluir explicitamente elementos do prompt complementar e mencione: ${keywords.join(", ")}.`
            : "Revise o roteiro para incluir explicitamente elementos do prompt complementar.";

        const refined = await generateTeleprompterScript(newsItems, parameters, {
          refinementPrompt,
          baseScript: result.script,
        });
        if (!refined.script) {
          throw new Error("No script returned.");
        }
        finalScript = refined.script;
      }

      if (!scriptIncludesComplementaryPrompt(finalScript, complementaryPrompt)) {
        setGenerationError(
          "O roteiro gerado não inclui elementos do prompt complementar. Ajuste o prompt e tente novamente.",
        );
        return false;
      }

      setGeneratedScript(finalScript);
      setEditedScript(finalScript);
      await loadScriptHistory();
      return true;
    } catch (error) {
      console.error("Failed to generate teleprompter script:", error);
      setGenerationError("Nao foi possivel gerar o roteiro. Tente novamente.");
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const loadScriptHistory = async () => {
    setScriptsLoading(true);
    try {
      const { data, error } = await supabase
        .from("teleprompter_scripts")
        .select("id, created_at, script_text, news_ids_json, parameters_json")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      setScriptHistory(data || []);
    } catch (error) {
      console.error("Failed to load teleprompter history:", error);
    } finally {
      setScriptsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    const loadLatest = async () => {
      try {
        const script = await fetchLatestTeleprompterScript();
        if (isActive && script && !generatedScript) {
          setGeneratedScript(script);
          setEditedScript(script);
        }
      } catch (error) {
        console.error("Failed to load last teleprompter script:", error);
      }
    };
    void loadLatest();
    void loadScriptHistory();
    return () => {
      isActive = false;
    };
  }, [generatedScript]);

  const handleUseScript = async (script: ScriptHistoryItem) => {
    if (selectedScriptId === script.id) {
      resetSelectionToDefaults();
      return;
    }

    setSelectedScriptId(script.id);
    setGeneratedScript(script.script_text);
    setEditedScript(script.script_text);

    const parameters = parseScriptParameters(script.parameters_json);
    const newsIds = parseNewsIds(script.news_ids_json);

    if (parameters) {
      const profileFromParams = parameters.profile || {};
      setProfile((prev) => ({
        ...prev,
        mainSubject: profileFromParams.mainSubject ?? prev.mainSubject,
        tone: parameters.tone ?? prev.tone,
        audience: parameters.audience ?? prev.audience,
        duration: parameters.duration ?? prev.duration,
        platform: profileFromParams.platform ?? prev.platform,
        goal: profileFromParams.goal ?? prev.goal,
        newsLanguage: profileFromParams.newsLanguage ?? prev.newsLanguage,
        scriptLanguage:
          profileFromParams.scriptLanguage ?? parameters.language ?? prev.scriptLanguage,
      }));
      setComplementaryPrompt(parameters.complementaryPrompt ?? "");
    } else {
      setProfile(DEFAULT_PROFILE);
      setComplementaryPrompt("");
    }

    setSelectedNewsIds(newsIds);

    const mainSubject = parameters?.profile?.mainSubject ?? DEFAULT_PROFILE.mainSubject;
    const newsLanguage = parameters?.profile?.newsLanguage ?? profile.newsLanguage;
    const terms = buildTermsFromSubject(mainSubject);
    if (terms.length > 0) {
      setNewsError(null);
      setNewsLoading(true);
      setSearchTerms(terms);
      try {
        const { items } = await runNewsPipelineWithTerms(terms, {
          maxItemsPerTerm: 6,
          minItemsPerTerm: 5,
          initialWindowHours: 24,
          language: newsLanguage?.trim(),
        });
        const fetchedAt = new Date().toISOString();
        const recentItems = items.map((item) => ({ ...item, fetchedAt }));
        setNewsItems(recentItems);
      } catch (error) {
        console.error("Failed to load news context:", error);
        setNewsError("Nao foi possivel carregar o contexto de noticias. Tente novamente.");
      } finally {
        setNewsLoading(false);
      }
    }

    setStep(3);
  };

  return (
    <div className="space-y-6">
      <Card className="border bg-gradient-to-br from-card via-background to-muted/60">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fluxo do Criador de Conteudo</h1>
              <p className="text-muted-foreground">
                Monte o perfil, adicione o contexto de noticias e gere um roteiro para fala.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <button
            type="button"
            className="flex items-center justify-between w-full text-left"
            onClick={() => setIsScriptsCollapsed((prev) => !prev)}
          >
            <div>
              <CardTitle>Roteiros recentes</CardTitle>
              <CardDescription>Textos gerados em execucoes anteriores.</CardDescription>
            </div>
            {isScriptsCollapsed ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {!isScriptsCollapsed && <CardContent>
          {scriptsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Carregando roteiros...
            </div>
          ) : scriptHistory.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum roteiro gerado ainda.
            </div>
          ) : (
            <>
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <DateFilter
                    value={scriptDateFilter}
                    onChange={setScriptDateFilter}
                    placeholder="Criacao dd/mm/aaaa"
                  />
                </div>
                <div className="relative flex-1">
                  <Input
                    placeholder="Filtrar por conteudo..."
                    value={scriptTitleFilter}
                    onChange={(e) => setScriptTitleFilter(e.target.value)}
                    className="pl-3"
                    maxLength={120}
                  />
                </div>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        sortKey="created_at"
                        currentSort={scriptSort}
                        onSort={handleScriptSort}
                        className="w-[140px]"
                      >
                        Data
                      </SortableTableHead>
                      <TableHead className="w-[120px]">Noticias</TableHead>
                      <SortableTableHead
                        sortKey="title"
                        currentSort={scriptSort}
                        onSort={handleScriptSort}
                      >
                        Previa
                      </SortableTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScripts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Nenhum roteiro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScripts.map((script) => (
                        <TableRow
                          key={script.id}
                          className={`cursor-pointer ${selectedScriptId === script.id ? "bg-muted/60" : ""}`}
                          onClick={() => void handleUseScript(script)}
                        >
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {format(new Date(script.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getNewsCount(script.news_ids_json)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getScriptPreview(script.script_text)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>}
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card
          className={`cursor-pointer ${step === 1 ? "border-primary" : ""}`}
          onClick={() => setStep(1)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setStep(1);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Step 1
            </CardTitle>
            <CardDescription>Perfil de escrita</CardDescription>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer ${step === 2 ? "border-primary" : ""}`}
          onClick={() => setStep(2)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setStep(2);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Step 2
            </CardTitle>
            <CardDescription>Contexto de noticias</CardDescription>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer ${step === 3 ? "border-primary" : ""}`}
          onClick={() => setStep(3)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setStep(3);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Step 3
            </CardTitle>
            <CardDescription>Gerar roteiro</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Perfil de escrita</CardTitle>
            <CardDescription>Campos basicos para definir a voz e o formato.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Assunto principal (separado por virgulas)</p>
              <Input
                value={profile.mainSubject}
                onChange={(event) => setProfile((prev) => ({ ...prev, mainSubject: event.target.value }))}
                placeholder="Bitcoin, mercado cripto, indice de medo e ganancia"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Tom</p>
                <Select
                  value={profile.tone}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, tone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tom" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureOption(TONE_OPTIONS, profile.tone).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Publico</p>
                <Select
                  value={profile.audience}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, audience: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o publico" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureOption(AUDIENCE_OPTIONS, profile.audience).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Duracao</p>
                <Select
                  value={profile.duration}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duracao" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureOption(DURATION_OPTIONS, profile.duration).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Plataforma</p>
                <Select
                  value={profile.platform}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureOption(PLATFORM_OPTIONS, profile.platform).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium">Objetivo</p>
                <Select
                  value={profile.goal}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, goal: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureOption(GOAL_OPTIONS, profile.goal).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium">Idioma das noticias</p>
                <Select
                  value={profile.newsLanguage}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, newsLanguage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureLabeledOption(NEWS_LANGUAGE_OPTIONS, profile.newsLanguage).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleContinueToNews} disabled={!canContinueFromProfile || newsLoading}>
                {newsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando noticias...
                  </>
                ) : (
                  "Continuar para noticias"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Contexto de noticias</CardTitle>
            <CardDescription>Selecione noticias e adicione um prompt complementar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {newsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm">
                {newsError}
              </div>
            )}

            {searchTerms.length > 0 && (
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Termos de busca usados</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {searchTerms.map((term) => (
                    <span key={term.term} className="rounded-full bg-muted px-3 py-1 text-xs">
                      {term.term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-muted-foreground">
                {filteredAndSortedNews.length} de {newsItems.length} noticias nas ultimas 24h (ou mais)
              </p>
            </div>

            {newsItems.length === 0 ? (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                Nenhuma noticia encontrada ainda. Tente novamente ou ajuste o assunto principal.
              </div>
            ) : (
              <>
                <div className="flex gap-4 mb-4">
                  <div className="flex flex-col gap-2 w-[60%]">
                    <div className="flex items-center gap-2">
                      <LocalTermFilter value={termFilter} options={termOptions} onChange={setTermFilter} />
                      <CategoryFilter value={categoryFilter} options={sourceOptions} onChange={setCategoryFilter} />
                      <DateFilter
                        value={dateFilter}
                        onChange={setDateFilter}
                        placeholder="Criacao dd/mm/aaaa"
                      />
                      <DateFilter
                        value={publishedDateFilter}
                        onChange={setPublishedDateFilter}
                        placeholder="Publicacao dd/mm/aaaa"
                      />
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="Filtrar por titulo..."
                        value={titleFilter}
                        onChange={(e) => {
                          setTitleFilter(e.target.value);
                        }}
                        className="pl-3"
                        maxLength={100}
                      />
                    </div>
                  </div>
                  <div className="w-[40%]">
                    <WordCloud
                      compact
                      titles={wordCloudTitles}
                      onWordClick={handleWordCloudClick}
                      activeWords={wordCloudFilter}
                      onClear={() => setWordCloudFilter([])}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Prompt complementar</p>
                  <Textarea
                    value={complementaryPrompt}
                    onChange={(event) => setComplementaryPrompt(event.target.value)}
                    rows={3}
                    placeholder="Ex.: foque nos aprendizados para criadores, seja direto e inclua CTA."
                  />
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedNewsIds.length === filteredAndSortedNews.length &&
                              filteredAndSortedNews.length > 0
                            }
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <SortableTableHead
                          sortKey="published_at"
                          currentSort={currentSort}
                          onSort={handleSort}
                          className="w-[120px]"
                        >
                          Publicacao
                        </SortableTableHead>
                        <SortableTableHead
                          sortKey="title"
                          currentSort={currentSort}
                          onSort={handleSort}
                        >
                          Titulo
                        </SortableTableHead>
                        <TableHead className="w-[140px]">Fonte</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedNews.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhuma noticia encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedNews.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedNewsIds.includes(item.id)}
                                onCheckedChange={() => toggleSelection(item.id)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap">
                              {item.publishedAt
                                ? format(new Date(item.publishedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                : "-"}
                            </TableCell>
                            <TableCell className="max-w-[400px] truncate font-medium">
                              {item.title}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatSource(item.source, item.link)}
                            </TableCell>
                            <TableCell>
                              {item.link ? (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                                >
                                  Ver original
                                </a>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Idioma do roteiro</p>
                <Select
                  value={profile.scriptLanguage}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, scriptLanguage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um idioma" />
                  </SelectTrigger>
                  <SelectContent>
                  {ensureLabeledOption(scriptLanguageOptions, profile.scriptLanguage).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar ao perfil
              </Button>
              <Button
                onClick={async () => {
                  const success = await handleGenerate();
                  if (success) {
                    setStep(3);
                  }
                }}
                disabled={!canGenerateFromNews || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando roteiro...
                  </>
                ) : (
                  "Gerar roteiro"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geracao</CardTitle>
              <CardDescription>Revise os dados e gere o roteiro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generationError && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm">
                  {generationError}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prompt complementar</CardTitle>
              <CardDescription>Ajuste o prompt e gere novamente se necessario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={complementaryPrompt}
                onChange={(event) => setComplementaryPrompt(event.target.value)}
                rows={3}
                placeholder="Ex.: foque nos aprendizados para criadores, seja direto e inclua CTA."
              />
              <div className="flex justify-end">
                <Button onClick={handleRegenerateFromCurrent} disabled={!canGenerateFromNews || isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando roteiro...
                    </>
                  ) : (
                    "Gerar novamente"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Editor do roteiro</CardTitle>
              <CardDescription>Edite antes de exibir no teleprompter.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={editedScript}
                onChange={(event) => setEditedScript(event.target.value)}
                rows={10}
                placeholder="O roteiro gerado aparece aqui..."
              />
              <Button onClick={handleSaveScript} disabled={!canSaveScript || isSavingScript}>
                {isSavingScript ? "Salvando..." : "Salvar alteracoes"}
              </Button>
            </CardContent>
          </Card>

          {editedScript ? (
            <TeleprompterDisplay script={editedScript} references={references} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Gere um roteiro para ver o teleprompter.
              </CardContent>
            </Card>
          )}

          <div className="flex justify-start">
            <Button variant="outline" onClick={() => setStep(2)}>
              Voltar as noticias
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ensureOption(options: string[], value: string): string[] {
  if (!value) return options;
  if (options.includes(value)) return options;
  return [value, ...options];
}

function ensureLabeledOption(
  options: { label: string; value: string }[],
  value: string,
): { label: string; value: string }[] {
  if (!value) return options;
  if (options.some((option) => option.value === value)) return options;
  return [{ label: value, value }, ...options];
}

function buildTermsFromSubject(subject: string): NewsSearchTerm[] {
  const rawTerms = subject
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const uniqueTerms: string[] = [];
  rawTerms.forEach((term) => {
    const key = term.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    uniqueTerms.push(term);
  });
  return uniqueTerms.map((term) => ({ term }));
}

function formatSource(source?: string, link?: string): string {
  if (source && source.trim()) {
    return source.trim();
  }
  if (!link) return "-";
  try {
    const domain = new URL(link).hostname;
    return domain.replace("www.", "");
  } catch {
    return "-";
  }
}

function parseFilterDate(dateStr: string): Date | null {
  if (dateStr.length !== 10) return null;
  const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

function getScriptPreview(text: string, maxLength = 140): string {
  const condensed = text.replace(/\s+/g, " ").trim();
  if (condensed.length <= maxLength) return condensed;
  return `${condensed.slice(0, maxLength)}...`;
}

function getNewsCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

function scriptIncludesComplementaryPrompt(script: string, prompt: string): boolean {
  if (!prompt.trim()) return true;
  const keywords = extractComplementaryKeywords(prompt);
  if (keywords.length === 0) return true;
  const haystack = normalizeText(script);
  return keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
}

function extractComplementaryKeywords(prompt: string): string[] {
  const stopwords = new Set([
    "a",
    "o",
    "os",
    "as",
    "um",
    "uma",
    "uns",
    "umas",
    "de",
    "da",
    "do",
    "das",
    "dos",
    "em",
    "no",
    "na",
    "nos",
    "nas",
    "para",
    "por",
    "com",
    "sem",
    "e",
    "ou",
    "que",
    "se",
    "nao",
    "não",
    "the",
    "and",
    "or",
    "to",
    "of",
    "for",
    "with",
    "without",
  ]);

  const tokens = prompt
    .replace(/[.,;:!?()\[\]{}]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token.length >= 3);

  const keywords: string[] = [];
  const seen = new Set<string>();
  tokens.forEach((token) => {
    const normalized = normalizeText(token);
    if (stopwords.has(normalized)) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    keywords.push(token);
  });

  return keywords;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildTeleprompterParameters(
  profile: WritingProfile,
    complementaryPrompt: string,
): TeleprompterParameters {
  const durationUnit = profile.duration.toLowerCase().includes("word") ? "words" : "minutes";
  const platform = profile.platform.toLowerCase();
  const scriptType = platform.includes("podcast")
    ? "podcast"
    : platform.includes("tiktok") || platform.includes("reel") || platform.includes("short")
      ? "video_curto"
      : "video_longo";

  return {
    tone: profile.tone,
    audience: profile.audience,
    language: profile.scriptLanguage.trim() || "Portuguese",
    duration: profile.duration,
    durationUnit,
    scriptType,
    includeCta: false,
    ctaText: "",
    // Extra metadata persisted in parameters_json for this flow.
    profile: {
      mainSubject: profile.mainSubject,
      goal: profile.goal,
      platform: profile.platform,
      newsLanguage: profile.newsLanguage,
      scriptLanguage: profile.scriptLanguage,
    },
    complementaryPrompt,
  };
}

function parseNewsIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return [];
}

function parseScriptParameters(value: unknown): ScriptParameters | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const profile = data.profile && typeof data.profile === "object" ? (data.profile as Record<string, unknown>) : null;
  const parsed: ScriptParameters = {
    tone: typeof data.tone === "string" ? data.tone : undefined,
    audience: typeof data.audience === "string" ? data.audience : undefined,
    duration: typeof data.duration === "string" ? data.duration : undefined,
    language: typeof data.language === "string" ? data.language : undefined,
    complementaryPrompt:
      typeof data.complementaryPrompt === "string" ? data.complementaryPrompt : undefined,
    profile: profile
      ? {
          mainSubject: typeof profile.mainSubject === "string" ? profile.mainSubject : undefined,
          goal: typeof profile.goal === "string" ? profile.goal : undefined,
          platform: typeof profile.platform === "string" ? profile.platform : undefined,
          newsLanguage: typeof profile.newsLanguage === "string" ? profile.newsLanguage : undefined,
          scriptLanguage: typeof profile.scriptLanguage === "string" ? profile.scriptLanguage : undefined,
        }
      : undefined,
  };

  return parsed;
}
