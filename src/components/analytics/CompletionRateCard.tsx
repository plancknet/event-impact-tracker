import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CompletionRateCardProps {
  completed: number;
  total: number;
  rate: number;
}

export function CompletionRateCard({ completed, total, rate }: CompletionRateCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conclusão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-4xl font-bold text-primary">{rate.toFixed(1)}%</span>
          <span className="text-muted-foreground">
            {completed} de {total} sessões
          </span>
        </div>
        <Progress value={rate} className="h-3" />
        <p className="text-sm text-muted-foreground">
          Porcentagem de usuários que chegaram até a página de resultados do quiz.
        </p>
      </CardContent>
    </Card>
  );
}
