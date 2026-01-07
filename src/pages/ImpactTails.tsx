import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calculator, TrendingUp, TrendingDown, Minus, Loader2, Search } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { WordCloud } from "@/components/WordCloud";
import { DateFilter } from "@/components/DateFilter";
import { TermFilter } from "@/components/TermFilter";

// Constants for tail calculations (easily adjustable)
const LAMBDA1 = 0.15; // Fast shock decay
const TAU2 = 30; // Long tail time constant
const ALPHA2 = 1.5; // Long tail power
const MU3 = 30; // Anticipation peak day
const SIGMA3 = 10; // Anticipation spread
const MAX_IMPACT_PCT = 0.50; // 50% maximum impact (updated for -50% to +50% range)

interface NewsWithAnalysis {
  id: string;
  news_id: string;
  title: string | null;
  link_url: string | null;
  created_at: string;
  categories: string | null;
  impact_direction: string | null;
  confidence_score: number | null;
  model_variables_json: string | null;
  term: string;
}

interface ModelVariables {
  M: number;
  s: number;
  r: number;
  u: number;
  p_e: number;
  a: number;
  e: number;
  g: number;
  v: number;
  A_n: number;
  b: number;
  f_m: number;
  f_n: number;
}

interface TailData {
  newsId: string;
  title: string;
  calculatedDirection: "bullish" | "bearish" | "neutral";
  maxImpactPct: number;
  newsDate: Date;
  chartData: { day: number; impact: number; date: string }[];
}

function getDefaultVariables(): ModelVariables {
  return {
    M: 0.5, s: 0, r: 0.5, u: 0.5, p_e: 0.5,
    a: 0.5, e: 0.5, g: 0.5, v: 0.5, A_n: 0.5,
    b: 0.5, f_m: 0.5, f_n: 0.5,
  };
}

function parseModelVariables(json: string | null): ModelVariables {
  const defaults = getDefaultVariables();
  if (!json) return defaults;
  
  try {
    const parsed = JSON.parse(json);
    return {
      M: parsed.M ?? defaults.M,
      s: parsed.s ?? defaults.s,
      r: parsed.r ?? defaults.r,
      u: parsed.u ?? defaults.u,
      p_e: parsed.p_e ?? defaults.p_e,
      a: parsed.a ?? defaults.a,
      e: parsed.e ?? defaults.e,
      g: parsed.g ?? defaults.g,
      v: parsed.v ?? defaults.v,
      A_n: parsed.A_n ?? defaults.A_n,
      b: parsed.b ?? defaults.b,
      f_m: parsed.f_m ?? defaults.f_m,
      f_n: parsed.f_n ?? defaults.f_n,
    };
  } catch {
    return defaults;
  }
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function calculateTailWeights(vars: ModelVariables): { w1: number; w2: number; w3: number } {
  const S1_raw = Math.max(vars.M * vars.v * (1 - vars.A_n) * (1 - vars.a), 0);
  const S2_raw = Math.max(vars.u * vars.p_e * ((vars.a + vars.f_m + vars.f_n) / 3.0) * (1 - vars.b), 0);
  const S3_raw = Math.max(vars.A_n * ((vars.a + vars.f_n) / 2.0), 0);
  
  const S_tot = S1_raw + S2_raw + S3_raw;
  
  if (S_tot < 0.0001) {
    return { w1: 0, w2: 0, w3: 0 };
  }
  
  return {
    w1: S1_raw / S_tot,
    w2: S2_raw / S_tot,
    w3: S3_raw / S_tot,
  };
}

function C1(t: number): number {
  return Math.exp(-LAMBDA1 * t);
}

function C2(t: number): number {
  return 1 / Math.pow(1 + t / TAU2, ALPHA2);
}

function C3(t: number): number {
  return Math.exp(-Math.pow(t - MU3, 2) / (2 * Math.pow(SIGMA3, 2)));
}

function calculateImpactTail(
  vars: ModelVariables,
  confidenceScore: number,
  numDays: number,
  newsDate: Date
): { chartData: { day: number; impact: number; date: string }[]; calculatedDirection: "bullish" | "bearish" | "neutral" } {
  const { w1, w2, w3 } = calculateTailWeights(vars);
  
  // Calculate raw mixture for all days
  const mixtureRaw: number[] = [];
  for (let t = 1; t <= numDays; t++) {
    const mix = w1 * C1(t) + w2 * C2(t) + w3 * C3(t);
    mixtureRaw.push(mix);
  }
  
  // Find max for normalization
  const maxMix = Math.max(...mixtureRaw, 0.0001);
  
  // Normalize mixture
  const mixtureNorm = mixtureRaw.map(m => m / maxMix);
  
  // Calculate amplitude - s determines direction (negative s = bearish = negative impact)
  const baseAmp = vars.M * vars.g * confidenceScore;
  const S_percent = vars.s * baseAmp * MAX_IMPACT_PCT;
  
  // Determine direction based on calculated s value
  let calculatedDirection: "bullish" | "bearish" | "neutral" = "neutral";
  if (S_percent > 0.001) {
    calculatedDirection = "bullish";
  } else if (S_percent < -0.001) {
    calculatedDirection = "bearish";
  }
  
  // Generate chart data - bearish will naturally be negative, include date
  const chartData = mixtureNorm.map((norm, idx) => {
    const dayNumber = idx + 1;
    const pointDate = addDays(newsDate, dayNumber);
    return {
      day: dayNumber,
      impact: S_percent * norm * 100, // Convert to percentage points
      date: format(pointDate, "dd/MM/yyyy", { locale: ptBR }),
    };
  });
  
  return { chartData, calculatedDirection };
}

function getDirectionFromTail(direction: "bullish" | "bearish" | "neutral") {
  switch (direction) {
    case "bullish":
      return { icon: <TrendingUp className="h-4 w-4 text-green-500" />, color: "hsl(142, 76%, 36%)" };
    case "bearish":
      return { icon: <TrendingDown className="h-4 w-4 text-red-500" />, color: "hsl(0, 84%, 60%)" };
    default:
      return { icon: <Minus className="h-4 w-4 text-muted-foreground" />, color: "hsl(var(--muted-foreground))" };
  }
}

// Mini chart component for table thumbnail
function MiniTailChart({ data, direction }: { data: { day: number; impact: number; date: string }[]; direction: "bullish" | "bearish" | "neutral" }) {
  const { color } = getDirectionFromTail(direction);
  
  return (
    <div className="w-32 h-12 cursor-pointer hover:opacity-80 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
          <Line
            type="monotone"
            dataKey="impact"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
          <YAxis domain={[-50, 50]} hide />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Full chart dialog component
function FullChartDialog({ 
  tail, 
  open, 
  onOpenChange 
}: { 
  tail: TailData | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!tail) return null;
  
  const { color } = getDirectionFromTail(tail.calculatedDirection);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="line-clamp-1">{tail.title}</span>
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  tail.calculatedDirection === "bullish"
                    ? "default"
                    : tail.calculatedDirection === "bearish"
                    ? "destructive"
                    : "secondary"
                }
              >
                {tail.calculatedDirection}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Impacto máx: {tail.maxImpactPct.toFixed(2)}%
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={tail.chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="day"
                label={{
                  value: "Dias",
                  position: "insideBottomRight",
                  offset: -10,
                }}
                tickFormatter={(value) =>
                  value % 30 === 0 || value === 1 ? value : ""
                }
              />
              <YAxis
                label={{
                  value: "Impacto (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                domain={[-50, 50]}
                ticks={[-50, -25, 0, 25, 50]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">Dia {label} - {data.date}</p>
                        <p className="text-sm text-muted-foreground">
                          Impacto: <span className="font-medium">{Number(data.impact).toFixed(3)}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="impact"
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ImpactTails() {
  const [selectedTail, setSelectedTail] = useState<TailData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [titleFilter, setTitleFilter] = useState("");
  const [wordCloudFilter, setWordCloudFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [termFilter, setTermFilter] = useState("all");

  const { data: newsItems, isLoading } = useQuery({
    queryKey: ["news-with-analysis-for-tails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_ai_analysis")
        .select(`
          id,
          news_id,
          categories,
          impact_direction,
          confidence_score,
          model_variables_json,
          alert_news_results!inner(
            id,
            title, 
            link_url, 
            created_at,
            is_duplicate,
            alert_query_results!inner (
              search_terms!inner (
                term
              )
            )
          )
        `)
        .eq("selected_for_model", true)
        .order("analyzed_at", { ascending: false });

      if (error) throw error;

      // Filter duplicates - keep smallest id
      const uniqueMap = new Map<string, NewsWithAnalysis>();
      
      for (const item of data || []) {
        if (!item.alert_news_results) continue;
        if (item.alert_news_results.is_duplicate) continue;

        const news = item.alert_news_results as {
          id: string;
          title: string | null;
          link_url: string | null;
          created_at: string;
          alert_query_results: { search_terms: { term: string } };
        };
        
        const key = `${(news.title || "").toLowerCase().trim()}|${(news.link_url || "").toLowerCase().trim()}`;
        const existing = uniqueMap.get(key);
        
        if (!existing || news.id < existing.id) {
          uniqueMap.set(key, {
            id: item.id,
            news_id: item.news_id,
            title: news.title,
            link_url: news.link_url,
            created_at: news.created_at,
            categories: item.categories,
            impact_direction: item.impact_direction,
            confidence_score: item.confidence_score,
            model_variables_json: item.model_variables_json,
            term: news.alert_query_results?.search_terms?.term || "—",
          });
        }
      }

      return Array.from(uniqueMap.values());
    },
  });

  // Pre-calculate all tails for display
  const tailsMap = useMemo(() => {
    if (!newsItems) return new Map<string, TailData>();
    
    const currentYear = new Date().getFullYear();
    const numDays = isLeapYear(currentYear) ? 366 : 365;
    const map = new Map<string, TailData>();
    
    for (const item of newsItems) {
      const vars = parseModelVariables(item.model_variables_json);
      const confidence = item.confidence_score ?? 0.5;
      const newsDate = new Date(item.created_at);
      const { chartData, calculatedDirection } = calculateImpactTail(vars, confidence, numDays, newsDate);
      
      const maxImpact = Math.max(...chartData.map(d => Math.abs(d.impact)));
      
      map.set(item.id, {
        newsId: item.id,
        title: item.title || "Sem título",
        calculatedDirection,
        maxImpactPct: maxImpact,
        newsDate,
        chartData,
      });
    }
    
    return map;
  }, [newsItems]);

  const handleWordCloudClick = (word: string) => {
    setWordCloudFilter(word);
    setTitleFilter(word);
  };

  const parseFilterDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  // Filter by term first (affects word cloud)
  const termFilteredItems = useMemo(() => {
    if (!newsItems) return [];
    if (!termFilter || termFilter === "all") return newsItems;
    return newsItems.filter((n) => n.term.toLowerCase() === termFilter.toLowerCase());
  }, [newsItems, termFilter]);

  const filteredNewsItems = useMemo(() => {
    let filtered = termFilteredItems;

    // Filter by title
    if (titleFilter.trim()) {
      filtered = filtered.filter((n) =>
        (n.title || "").toLowerCase().includes(titleFilter.toLowerCase().trim())
      );
    }

    // Filter by date
    const filterDate = parseFilterDate(dateFilter);
    if (filterDate) {
      filtered = filtered.filter((n) => {
        const newsDate = new Date(n.created_at);
        return (
          newsDate.getDate() === filterDate.getDate() &&
          newsDate.getMonth() === filterDate.getMonth() &&
          newsDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }

    return filtered;
  }, [newsItems, titleFilter, dateFilter, termFilter]);

  const handleThumbnailClick = (newsId: string) => {
    const tail = tailsMap.get(newsId);
    if (tail) {
      setSelectedTail(tail);
      setDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Passos 11 e 12 – Cauda de Impacto</h1>
        <p className="text-muted-foreground mt-1">
          Visualize o impacto percentual previsto ao longo do tempo (clique na miniatura para expandir)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Notícias Analisadas ({filteredNewsItems.length} de {newsItems?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col gap-2 w-[60%]">
              <div className="flex items-center gap-2">
                <TermFilter value={termFilter} onChange={setTermFilter} />
                <DateFilter
                  value={dateFilter}
                  onChange={setDateFilter}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por título..."
                  value={titleFilter}
                  onChange={(e) => {
                    setTitleFilter(e.target.value);
                    setWordCloudFilter("");
                  }}
                  className="pl-9"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="w-[40%]">
              <WordCloud
                compact
                titles={termFilteredItems.map((n) => n.title)}
                onWordClick={handleWordCloudClick}
                activeWord={wordCloudFilter}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-40">Categorias</TableHead>
                  <TableHead className="w-28">Direção</TableHead>
                  <TableHead className="w-28">Confiança</TableHead>
                  <TableHead className="w-36">Cauda de Impacto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNewsItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {titleFilter || dateFilter ? "Nenhuma notícia encontrada" : "Nenhuma notícia analisada com selected_for_model = true"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNewsItems.map((item) => {
                    const tail = tailsMap.get(item.id);
                    const { icon } = tail ? getDirectionFromTail(tail.calculatedDirection) : { icon: null };
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium line-clamp-2">
                            {item.title || "Sem título"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.categories?.split(",").slice(0, 2).map((cat, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {cat.trim()}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {icon}
                            <span className="text-sm capitalize">
                              {tail?.calculatedDirection || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.confidence_score !== null
                              ? `${(item.confidence_score * 100).toFixed(0)}%`
                              : "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tail && (
                            <div onClick={() => handleThumbnailClick(item.id)}>
                              <MiniTailChart
                                data={tail.chartData}
                                direction={tail.calculatedDirection}
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <FullChartDialog
        tail={selectedTail}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
