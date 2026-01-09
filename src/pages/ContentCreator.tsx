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
import { ChevronDown, ChevronUp, FileText, Loader2, Monitor, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

export default function ContentCreator() {
  const [step, setStep] = useState<StepId>(1);
  const [profile, setProfile] = useState<WritingProfile>({
    mainSubject: "Bitcoin",
    tone: "Calm",
    audience: "Creators",
    duration: "60s",
    platform: "YouTube",
    goal: "Entertain",
    newsLanguage: "en",
    scriptLanguage: "English",
  });
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
  const [scriptHistory, setScriptHistory] = useState<
    { id: string; created_at: string; script_text: string; news_ids_json: unknown }[]
  >([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [isScriptsCollapsed, setIsScriptsCollapsed] = useState(true);

  const scriptLanguageOptions = [
    { label: "English", value: "English" },
    { label: "Portuguese", value: "Portuguese" },
    { label: "Spanish", value: "Spanish" },
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

  const canContinueFromNews = selectedNewsIds.length > 0;
  const canGenerateFromNews = canContinueFromNews && profile.scriptLanguage.trim();
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
        setNewsError("Add a main subject to generate search terms.");
        return;
      }

      setSearchTerms(terms);

      const { items } = await runNewsPipelineWithTerms(terms, {
        maxItemsPerTerm: 6,
        language: profile.newsLanguage.trim(),
      });

      const fetchedAt = new Date().toISOString();
      const recentItems = filterNewsLast24Hours(items.map((item) => ({ ...item, fetchedAt })));
      // TODO: Enrich selected items with Firecrawl full text when available.
      setNewsItems(recentItems);
      setStep(2);
    } catch (error) {
      console.error("Failed to load news context:", error);
      setNewsError("Unable to load news context. Please try again.");
    } finally {
      setNewsLoading(false);
    }
  };

  const handleGenerate = () => {
    // NOTE: This restores the teleprompter Edge Function behavior from the old branch.
    void generateScriptFromSelection();
  };

  const handleSaveScript = async () => {
    const scriptText = editedScript.trim();
    if (!scriptText) {
      setGenerationError("Edite o roteiro antes de salvar.");
      return;
    }

    setIsSavingScript(true);
    try {
      const parameters = buildTeleprompterParameters(profile, complementaryPrompt);
      const { error } = await supabase
        .from("teleprompter_scripts")
        .insert({
          news_ids_json: selectedNewsIds as unknown as import("@/integrations/supabase/types").Json,
          parameters_json: parameters as unknown as import("@/integrations/supabase/types").Json,
          script_text: scriptText,
        });

      if (error) throw error;
      await loadScriptHistory();
    } catch (error) {
      console.error("Failed to save teleprompter script:", error);
      setGenerationError("Nao foi possivel salvar o roteiro.");
    } finally {
      setIsSavingScript(false);
    }
  };

  const generateScriptFromSelection = async () => {
    setGenerationError(null);
    setIsGenerating(true);
    try {
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
      setGeneratedScript(result.script);
      setEditedScript(result.script);
      await loadScriptHistory();
    } catch (error) {
      console.error("Failed to generate teleprompter script:", error);
      setGenerationError("Unable to generate script. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadScriptHistory = async () => {
    setScriptsLoading(true);
    try {
      const { data, error } = await supabase
        .from("teleprompter_scripts")
        .select("id, created_at, script_text, news_ids_json")
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

  return (
    <div className="space-y-6">
      <Card className="border bg-gradient-to-br from-card via-background to-muted/60">
        <CardContent className="py-6">
          <div>
            <h1 className="text-2xl font-bold">Content Creator Workflow</h1>
            <p className="text-muted-foreground">
              Build a writing profile, add news context, and generate a spoken-first script.
            </p>
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
              <CardTitle>Recent scripts</CardTitle>
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
                        Preview
                      </SortableTableHead>
                      <TableHead className="w-[120px]">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScripts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum roteiro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScripts.map((script) => (
                        <TableRow key={script.id}>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {format(new Date(script.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getNewsCount(script.news_ids_json)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getScriptPreview(script.script_text)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={generatedScript === script.script_text ? "secondary" : "outline"}
                              onClick={() => {
                                setGeneratedScript(script.script_text);
                                setEditedScript(script.script_text);
                              }}
                            >
                              {generatedScript === script.script_text ? "Em uso" : "Usar"}
                            </Button>
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
        <Card className={step === 1 ? "border-primary" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Step 1
            </CardTitle>
            <CardDescription>Writing profile</CardDescription>
          </CardHeader>
        </Card>
        <Card className={step === 2 ? "border-primary" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Step 2
            </CardTitle>
            <CardDescription>News context</CardDescription>
          </CardHeader>
        </Card>
        <Card className={step === 3 ? "border-primary" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Step 3
            </CardTitle>
            <CardDescription>Generate script</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Writing Profile</CardTitle>
            <CardDescription>Minimal fields to set the voice and format.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Main Subject (comma-separated)</p>
              <Input
                value={profile.mainSubject}
                onChange={(event) => setProfile((prev) => ({ ...prev, mainSubject: event.target.value }))}
                placeholder="Bitcoin, crypto market, fear & greed index"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Tone</p>
                <Input
                  value={profile.tone}
                  onChange={(event) => setProfile((prev) => ({ ...prev, tone: event.target.value }))}
                  placeholder="Conversational, bold, calm"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Audience</p>
                <Input
                  value={profile.audience}
                  onChange={(event) => setProfile((prev) => ({ ...prev, audience: event.target.value }))}
                  placeholder="Creators, founders, students"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Duration</p>
                <Input
                  value={profile.duration}
                  onChange={(event) => setProfile((prev) => ({ ...prev, duration: event.target.value }))}
                  placeholder="60s, 2 minutes, 800 words"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Platform</p>
                <Input
                  value={profile.platform}
                  onChange={(event) => setProfile((prev) => ({ ...prev, platform: event.target.value }))}
                  placeholder="YouTube, TikTok, Podcast"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium">Goal</p>
                <Input
                  value={profile.goal}
                  onChange={(event) => setProfile((prev) => ({ ...prev, goal: event.target.value }))}
                  placeholder="Teach, persuade, entertain, sell"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium">News language</p>
                <Input
                  value={profile.newsLanguage}
                  onChange={(event) => setProfile((prev) => ({ ...prev, newsLanguage: event.target.value }))}
                  placeholder="en, pt-BR, es"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleContinueToNews} disabled={!canContinueFromProfile || newsLoading}>
                {newsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading news...
                  </>
                ) : (
                  "Continue to news"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>News Context</CardTitle>
            <CardDescription>Select news and add a complementary prompt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {newsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm">
                {newsError}
              </div>
            )}

            {searchTerms.length > 0 && (
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Search terms used</p>
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
                {filteredAndSortedNews.length} de {newsItems.length} noticias nas ultimas 24 horas
              </p>
            </div>

            {newsItems.length === 0 ? (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                No news found yet. Try again or adjust the main subject terms.
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
                      titles={termFilteredResults.map((n) => n.title)}
                      onWordClick={handleWordCloudClick}
                      activeWords={wordCloudFilter}
                      onClear={() => setWordCloudFilter([])}
                    />
                  </div>
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
              <p className="text-sm font-medium">Complementary prompt</p>
              <Textarea
                value={complementaryPrompt}
                onChange={(event) => setComplementaryPrompt(event.target.value)}
                rows={3}
                placeholder="Ex: focus on creator takeaways, keep it punchy, add a CTA."
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Script language</p>
              <Select
                value={profile.scriptLanguage}
                onValueChange={(value) => setProfile((prev) => ({ ...prev, scriptLanguage: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {scriptLanguageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back to profile
              </Button>
              <Button
                onClick={() => {
                  handleGenerate();
                  setStep(3);
                }}
                disabled={!canGenerateFromNews || isGenerating}
              >
                Generate script
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate</CardTitle>
              <CardDescription>Compose inputs and generate the script.</CardDescription>
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
              <CardTitle>Script editor</CardTitle>
              <CardDescription>Edit before displaying in teleprompter.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={editedScript}
                onChange={(event) => setEditedScript(event.target.value)}
                rows={10}
                placeholder="Generated script appears here..."
              />
              <Button onClick={handleSaveScript} disabled={!canSaveScript || isSavingScript}>
                {isSavingScript ? "Saving..." : "Save changes"}
              </Button>
            </CardContent>
          </Card>

          {editedScript ? (
            <TeleprompterDisplay script={editedScript} references={references} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Generate a script to see the teleprompter.
              </CardContent>
            </Card>
          )}

          <div className="flex justify-start">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back to news
            </Button>
          </div>
        </div>
      )}
    </div>
  );
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

function filterNewsLast24Hours(items: FullArticle[]): FullArticle[] {
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    if (!item.publishedAt) return false;
    const publishedTime = new Date(item.publishedAt).getTime();
    if (Number.isNaN(publishedTime)) return false;
    return publishedTime >= cutoff && publishedTime <= now;
  });
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
    language: profile.scriptLanguage.trim() || "English",
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
