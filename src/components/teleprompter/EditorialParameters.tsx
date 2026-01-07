import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface EditorialParametersData {
  tone: string;
  audience: string;
  language: string;
  duration: string;
  durationUnit: "minutes" | "words";
  scriptType: string;
  includeCta: boolean;
  ctaText: string;
}

interface EditorialParametersProps {
  parameters: EditorialParametersData;
  onChange: (params: EditorialParametersData) => void;
}

export function EditorialParameters({ parameters, onChange }: EditorialParametersProps) {
  const updateParam = <K extends keyof EditorialParametersData>(
    key: K,
    value: EditorialParametersData[K]
  ) => {
    onChange({ ...parameters, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Configurações do Conteúdo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tom e Estilo */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            🎭 Tom e Estilo
          </Label>
          <Select value={parameters.tone} onValueChange={(v) => updateParam("tone", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neutro">Neutro</SelectItem>
              <SelectItem value="jornalistico">Jornalístico</SelectItem>
              <SelectItem value="educativo">Educativo</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="humoristico">Humorístico</SelectItem>
              <SelectItem value="descontraido">Descontraido e informal</SelectItem>
              <SelectItem value="storytelling">Storytelling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Público-alvo */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            🧑 Público-alvo
          </Label>
          <Select value={parameters.audience} onValueChange={(v) => updateParam("audience", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o público" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="criancas">Crianças</SelectItem>
              <SelectItem value="adolescentes">Adolescentes</SelectItem>
              <SelectItem value="adultos">Adultos</SelectItem>
              <SelectItem value="publico_geral">Público Geral</SelectItem>
              <SelectItem value="especialistas">Especialistas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Idioma */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            🌍 Idioma
          </Label>
          <Select value={parameters.language} onValueChange={(v) => updateParam("language", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Português">Português</SelectItem>
              <SelectItem value="Inglês">Inglês</SelectItem>
              <SelectItem value="Espanhol">Espanhol</SelectItem>
              <SelectItem value="Francês">Francês</SelectItem>
              <SelectItem value="Italiano">Italiano</SelectItem>
              <SelectItem value="Alemão">Alemão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duração */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            ⏱️ Duração Aproximada
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={parameters.duration}
              onChange={(e) => updateParam("duration", e.target.value)}
              className="w-24"
            />
            <RadioGroup
              value={parameters.durationUnit}
              onValueChange={(v) => updateParam("durationUnit", v as "minutes" | "words")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minutes" id="minutes" />
                <Label htmlFor="minutes" className="font-normal">Minutos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="words" id="words" />
                <Label htmlFor="words" className="font-normal">Palavras</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Tipo de Roteiro */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            🎥 Tipo de Roteiro
          </Label>
          <Select value={parameters.scriptType} onValueChange={(v) => updateParam("scriptType", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video_curto">Vídeo Curto</SelectItem>
              <SelectItem value="video_longo">Vídeo Longo</SelectItem>
              <SelectItem value="telejornal">Telejornal</SelectItem>
              <SelectItem value="podcast">Podcast</SelectItem>
              <SelectItem value="narracao_simples">Narração Simples</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeCta"
              checked={parameters.includeCta}
              onCheckedChange={(checked) => updateParam("includeCta", !!checked)}
            />
            <Label htmlFor="includeCta" className="flex items-center gap-2 font-normal">
              📣 Incluir Chamada para Ação (CTA)
            </Label>
          </div>
          {parameters.includeCta && (
            <Textarea
              placeholder="Descreva a chamada para ação desejada..."
              value={parameters.ctaText}
              onChange={(e) => updateParam("ctaText", e.target.value)}
              className="mt-2"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
