import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

// Constants for tail calculations (easily adjustable)
const LAMBDA1 = 0.15; // Fast shock decay
const TAU2 = 30; // Long tail time constant
const ALPHA2 = 1.5; // Long tail power
const MU3 = 30; // Anticipation peak day
const SIGMA3 = 10; // Anticipation spread
const MAX_IMPACT_PCT = 0.10; // 10% maximum impact

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
  impactDirection: string;
  maxImpactPct: number;
  chartData: { day: number; impact: number }[];
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
  numDays: number
): { day: number; impact: number }[] {
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
  
  // Calculate amplitude
  const baseAmp = vars.M * vars.g * confidenceScore;
  const S_percent = vars.s * baseAmp * MAX_IMPACT_PCT;
  
  // Generate chart data
  return mixtureNorm.map((norm, idx) => ({
    day: idx + 1,
    impact: S_percent * norm * 100, // Convert to percentage points
  }));
}

export default function ImpactTails() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tailResults, setTailResults] = useState<TailData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

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
          alert_news_results!inner(title, link_url, created_at)
        `)
        .eq("selected_for_model", true)
        .order("analyzed_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        news_id: item.news_id,
        title: item.alert_news_results?.title,
        link_url: item.alert_news_results?.link_url,
        created_at: item.alert_news_results?.created_at,
        categories: item.categories,
        impact_direction: item.impact_direction,
        confidence_score: item.confidence_score,
        model_variables_json: item.model_variables_json,
      })) as NewsWithAnalysis[];
    },
  });

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!newsItems) return;
    if (selectedIds.size === newsItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(newsItems.map((item) => item.id)));
    }
  };

  const calculateTails = () => {
    if (!newsItems || selectedIds.size === 0) {
      toast.warning("Selecione pelo menos uma notícia");
      return;
    }

    setIsCalculating(true);

    try {
      const results: TailData[] = [];
      const currentYear = new Date().getFullYear();
      const numDays = isLeapYear(currentYear) ? 366 : 365;

      for (const item of newsItems) {
        if (!selectedIds.has(item.id)) continue;

        const vars = parseModelVariables(item.model_variables_json);
        const confidence = item.confidence_score ?? 0.5;
        const chartData = calculateImpactTail(vars, confidence, numDays);
        
        const maxImpact = Math.max(...chartData.map(d => Math.abs(d.impact)));

        results.push({
          newsId: item.id,
          title: item.title || "Sem título",
          impactDirection: item.impact_direction || "neutral",
          maxImpactPct: maxImpact,
          chartData,
        });
      }

      setTailResults(results);
      toast.success(`Caudas calculadas para ${results.length} notícia(s)`);
    } catch (error) {
      console.error("Erro ao calcular caudas:", error);
      toast.error("Erro ao calcular caudas de impacto");
    } finally {
      setIsCalculating(false);
    }
  };

  const getDirectionIcon = (direction: string | null) => {
    switch (direction) {
      case "bullish":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "bearish":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "bullish":
        return "hsl(142, 76%, 36%)";
      case "bearish":
        return "hsl(0, 84%, 60%)";
      default:
        return "hsl(var(--muted-foreground))";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Passos 11 e 12 – Cauda de Impacto</h1>
          <p className="text-muted-foreground mt-1">
            Calcule e visualize o impacto percentual previsto ao longo do tempo
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Notícias Analisadas ({newsItems?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              disabled={!newsItems?.length}
            >
              {selectedIds.size === newsItems?.length
                ? "Desmarcar todas"
                : "Selecionar todas"}
            </Button>
            <Button
              onClick={calculateTails}
              disabled={selectedIds.size === 0 || isCalculating}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular cauda ({selectedIds.size} selecionada
                  {selectedIds.size !== 1 ? "s" : ""})
                </>
              )}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        newsItems?.length
                          ? selectedIds.size === newsItems.length
                          : false
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-40">Categorias</TableHead>
                  <TableHead className="w-28">Direção</TableHead>
                  <TableHead className="w-28">Confiança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsItems?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhuma notícia analisada com selected_for_model = true
                    </TableCell>
                  </TableRow>
                ) : (
                  newsItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelection(item.id)}
                        />
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
                          {getDirectionIcon(item.impact_direction)}
                          <span className="text-sm capitalize">
                            {item.impact_direction || "neutral"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {item.confidence_score
                            ? `${(item.confidence_score * 100).toFixed(0)}%`
                            : "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {tailResults.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Gráficos de Impacto</h2>
          {tailResults.map((tail) => (
            <Card key={tail.newsId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-1">
                    {tail.title}
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        tail.impactDirection === "bullish"
                          ? "default"
                          : tail.impactDirection === "bearish"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {tail.impactDirection}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Impacto máx: {tail.maxImpactPct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
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
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(3)}%`,
                          "Impacto",
                        ]}
                        labelFormatter={(label) => `Dia ${label}`}
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                      <Line
                        type="monotone"
                        dataKey="impact"
                        stroke={getDirectionColor(tail.impactDirection)}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
