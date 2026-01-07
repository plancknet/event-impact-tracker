import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, FileText, Monitor } from "lucide-react";
import { NewsSelector, type SelectableNews } from "@/components/teleprompter/NewsSelector";
import { EditorialParameters, type EditorialParametersData } from "@/components/teleprompter/EditorialParameters";
import { TeleprompterDisplay } from "@/components/teleprompter/TeleprompterDisplay";
import { format } from "date-fns";

type TabValue = "select" | "configure" | "teleprompter";

export default function ContentCreator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabValue>("select");
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [parameters, setParameters] = useState<EditorialParametersData>({
    tone: "jornalistico",
    audience: "publico_geral",
    language: "Português",
    duration: "5",
    durationUnit: "minutes",
    scriptType: "video_longo",
    includeCta: false,
    ctaText: "",
  });

  // Fetch news with full content or analysis
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ["eligible-news-for-teleprompter"],
    queryFn: async () => {
      // Get news with full content
      const { data: fullContentNews, error: fullError } = await supabase
        .from("full_news_content")
        .select(`
          id,
          news_id,
          content_full,
          fetched_at,
          alert_news_results!inner (
            id,
            title,
            link_url,
            snippet
          )
        `)
        .eq("status", "success")
        .not("content_full", "is", null)
        .order("fetched_at", { ascending: false });

      if (fullError) throw fullError;

      // Get news with AI analysis
      const { data: analysisNews, error: analysisError } = await supabase
        .from("news_ai_analysis")
        .select(`
          id,
          news_id,
          summary,
          analyzed_at,
          full_news_content!inner (
            id,
            content_full,
            alert_news_results!inner (
              id,
              title,
              link_url
            )
          )
        `)
        .order("analyzed_at", { ascending: false });

      if (analysisError) throw analysisError;

      // Combine and deduplicate
      const newsMap = new Map<string, SelectableNews>();

      // Add from full content
      fullContentNews?.forEach((item: any) => {
        const newsItem = item.alert_news_results;
        if (newsItem && !newsMap.has(newsItem.id)) {
          newsMap.set(newsItem.id, {
            id: newsItem.id,
            title: newsItem.title || "Sem título",
            date: new Date(item.fetched_at),
            source: extractDomain(newsItem.link_url),
            summary: newsItem.snippet,
            content: item.content_full,
          });
        }
      });

      // Add/update from analysis
      analysisNews?.forEach((item: any) => {
        const fullContent = item.full_news_content;
        const newsItem = fullContent?.alert_news_results;
        if (newsItem) {
          const existing = newsMap.get(newsItem.id);
          if (existing) {
            existing.summary = item.summary || existing.summary;
          } else {
            newsMap.set(newsItem.id, {
              id: newsItem.id,
              title: newsItem.title || "Sem título",
              date: new Date(item.analyzed_at),
              source: extractDomain(newsItem.link_url),
              summary: item.summary,
              content: fullContent.content_full,
            });
          }
        }
      });

      return Array.from(newsMap.values());
    },
  });

  const { data: scriptsData = [], isLoading: scriptsLoading } = useQuery({
    queryKey: ["teleprompter-scripts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teleprompter_scripts")
        .select("id, created_at, news_ids_json, script_text")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Generate script mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const selectedNews = newsData?.filter((n) => selectedNewsIds.includes(n.id)) || [];
      
      const newsItems = selectedNews.map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        content: n.content,
      }));

      const { data, error } = await supabase.functions.invoke("generate-teleprompter-script", {
        body: { newsItems, parameters },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data.script;
    },
    onSuccess: (script) => {
      setGeneratedScript(script);
      setActiveTab("teleprompter");
      toast({
        title: "Roteiro gerado!",
        description: "O roteiro foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao gerar roteiro",
        description: error.message,
      });
    },
  });

  const handleGenerate = () => {
    if (selectedNewsIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione notícias",
        description: "Você precisa selecionar pelo menos uma notícia para gerar o roteiro.",
      });
      return;
    }
    generateMutation.mutate();
  };

  const canGenerate = selectedNewsIds.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Criação de Conteúdo e Teleprompter</h1>
          <p className="text-muted-foreground">
            Gere roteiros a partir de notícias e apresente com teleprompter
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="select" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            1. Notícias
          </TabsTrigger>
          <TabsTrigger value="configure" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            2. Configurar
          </TabsTrigger>
          <TabsTrigger value="teleprompter" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            3. Teleprompter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="mt-6">
          {newsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Carregando notícias...
              </CardContent>
            </Card>
          ) : (
            <>
              <NewsSelector
                news={newsData || []}
                selectedIds={selectedNewsIds}
                onSelectionChange={setSelectedNewsIds}
              />
              {selectedNewsIds.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setActiveTab("configure")}>
                    Continuar para Configuração →
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="configure" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <EditorialParameters parameters={parameters} onChange={setParameters} />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Seleção</CardTitle>
                <CardDescription>
                  {selectedNewsIds.length} notícia(s) selecionada(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {newsData
                    ?.filter((n) => selectedNewsIds.includes(n.id))
                    .map((news) => (
                      <div key={news.id} className="p-2 bg-muted rounded text-sm">
                        {news.title}
                      </div>
                    ))}
                </div>
                
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !canGenerate}
                  className="w-full"
                  size="lg"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Gerando Roteiro...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Gerar Roteiro com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teleprompter" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conteudos gerados</CardTitle>
                <CardDescription>
                  {scriptsData.length} roteiro(s) disponivel(eis)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scriptsLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Carregando roteiros...
                  </div>
                ) : scriptsData.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhum roteiro gerado ainda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px]">Data</TableHead>
                          <TableHead className="w-[120px]">Noticias</TableHead>
                          <TableHead>Preview</TableHead>
                          <TableHead className="w-[120px]">Acoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scriptsData.map((script) => (
                          <TableRow key={script.id}>
                            <TableCell className="font-mono text-xs whitespace-nowrap">
                              {format(new Date(script.created_at), "dd/MM/yyyy HH:mm")}
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
                                onClick={() => setGeneratedScript(script.script_text)}
                              >
                                {generatedScript === script.script_text ? "Em uso" : "Usar"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {generatedScript ? (
              <TeleprompterDisplay script={generatedScript} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                  Selecione um roteiro acima ou gere um novo.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function extractDomain(url: string | null): string {
  if (!url) return "Fonte desconhecida";
  try {
    const domain = new URL(url).hostname;
    return domain.replace("www.", "");
  } catch {
    return "Fonte desconhecida";
  }
}

function getNewsCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object" && "length" in (value as { length: number })) {
    const length = (value as { length: number }).length;
    return typeof length === "number" ? length : 0;
  }
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

function getScriptPreview(text: string, maxLength = 140): string {
  const condensed = text.replace(/\s+/g, " ").trim();
  if (condensed.length <= maxLength) return condensed;
  return `${condensed.slice(0, maxLength)}...`;
}
