import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface QuestionTime {
  questionKey: string;
  questionLabel: string;
  avgTimeSeconds: number;
  totalResponses: number;
}

interface TimePerQuestionProps {
  data: QuestionTime[];
}

export function TimePerQuestion({ data }: TimePerQuestionProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tempo Médio por Questão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum dado disponível ainda.</p>
        </CardContent>
      </Card>
    );
  }

  const avgTime = data.reduce((sum, q) => sum + q.avgTimeSeconds, 0) / data.length;

  const getBarColor = (time: number) => {
    if (time > avgTime * 1.5) {
      return "hsl(38, 92%, 50%)"; // warning - taking too long
    }
    return "hsl(var(--primary))";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tempo Médio por Questão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) => `${v.toFixed(0)}s`}
              />
              <YAxis
                type="category"
                dataKey="questionLabel"
                width={200}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}s`, "Tempo Médio"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="avgTimeSeconds" name="Tempo" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.avgTimeSeconds)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Tempo médio geral</p>
            <p className="text-2xl font-bold">{avgTime.toFixed(1)}s</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Questão mais demorada</p>
            <p className="text-sm font-medium">
              {data.sort((a, b) => b.avgTimeSeconds - a.avgTimeSeconds)[0]?.questionLabel}
            </p>
            <p className="text-lg font-bold text-primary">
              {data.sort((a, b) => b.avgTimeSeconds - a.avgTimeSeconds)[0]?.avgTimeSeconds.toFixed(1)}s
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
