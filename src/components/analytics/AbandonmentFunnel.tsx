import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  percentage: number;
}

interface AbandonmentFunnelProps {
  steps: FunnelStep[];
}

export function AbandonmentFunnel({ steps }: AbandonmentFunnelProps) {
  if (steps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Abandono</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum dado disponível ainda.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate drop-off between steps
  const dataWithDropoff = steps.map((step, index) => {
    const prevCount = index > 0 ? steps[index - 1].count : step.count;
    const dropoff = prevCount - step.count;
    const dropoffPercentage = prevCount > 0 ? (dropoff / prevCount) * 100 : 0;
    
    return {
      ...step,
      dropoff,
      dropoffPercentage,
    };
  });

  // Find highest drop-off point
  const maxDropoff = Math.max(...dataWithDropoff.slice(1).map((d) => d.dropoffPercentage));

  const getBarColor = (dropoffPercentage: number, index: number) => {
    if (index === 0) return "hsl(var(--primary))";
    if (dropoffPercentage >= maxDropoff * 0.9 && dropoffPercentage > 10) {
      return "hsl(var(--destructive))";
    }
    if (dropoffPercentage > 20) {
      return "hsl(38, 92%, 50%)"; // warning orange
    }
    return "hsl(var(--primary))";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Abandono</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataWithDropoff}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis
                type="category"
                dataKey="label"
                width={180}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}%`,
                  name === "percentage" ? "Alcançaram" : "Taxa de Abandono",
                ]}
                labelFormatter={(label) => label}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="percentage" name="percentage" radius={[0, 4, 4, 0]}>
                {dataWithDropoff.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.dropoffPercentage, index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Drop-off highlights */}
        <div className="mt-6 space-y-2">
          <h4 className="font-medium text-sm">Pontos de maior abandono:</h4>
          <div className="grid gap-2">
            {dataWithDropoff
              .slice(1)
              .filter((d) => d.dropoffPercentage > 15)
              .sort((a, b) => b.dropoffPercentage - a.dropoffPercentage)
              .slice(0, 3)
              .map((step) => (
                <div
                  key={step.step}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <span className="text-sm">{step.label}</span>
                  <span className="text-sm font-medium text-destructive">
                    -{step.dropoffPercentage.toFixed(1)}% ({step.dropoff} usuários)
                  </span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
