import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Monitor, Wand2 } from "lucide-react";
import { TeleprompterDisplay } from "@/components/teleprompter/TeleprompterDisplay";

type StepId = 1 | 2 | 3;

type WritingProfile = {
  mainAreaChips: string[];
  tone: string;
  audience: string;
  duration: string;
  platform: string;
  goal: string;
};

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  fullText: string;
  publishedAt: string;
};

const MAIN_AREA_OPTIONS = [
  "Marketing",
  "Fintech",
  "Climate",
  "AI",
  "Healthcare",
  "Education",
  "Sports",
  "Politics",
];

// TODO: Replace mock news with RSS ingestion aligned with docs/news-pipeline.md.
// TODO: Add Firecrawl full-text extraction once RSS items are fetched.
// TODO: Persist news with dedupe rules (URL + canonical title) in Lovable DB.
const MOCK_NEWS: NewsItem[] = [
  {
    id: "news-1",
    title: "Local startups use AI to speed up medical imaging reviews",
    summary: "Hospitals report shorter wait times as AI tools assist radiologists.",
    url: "https://example.com/ai-imaging",
    fullText:
      "Hospitals across the region are deploying AI-assisted imaging review tools. " +
      "Early pilots show reductions in turnaround time for routine scans while keeping doctors in the loop.",
    publishedAt: "2026-01-06",
  },
  {
    id: "news-2",
    title: "New education policy expands access to online certifications",
    summary: "A new framework funds short-form credentials for working adults.",
    url: "https://example.com/education-policy",
    fullText:
      "The education ministry announced expanded funding for micro-credentials. " +
      "The policy emphasizes skills-based learning and partnerships with employers.",
    publishedAt: "2026-01-05",
  },
  {
    id: "news-3",
    title: "Fintech regulators propose faster approval for digital wallets",
    summary: "A draft proposal outlines a streamlined compliance checklist.",
    url: "https://example.com/fintech-wallets",
    fullText:
      "Regulators released a draft proposal to simplify the approval process for digital wallets. " +
      "The checklist focuses on consumer protections and data security.",
    publishedAt: "2026-01-03",
  },
];

const SYSTEM_PROMPT_GUIDANCE = [
  "Optimize for speech, not reading.",
  "Preserve the creator's voice and intent.",
  "Keep structure visible and easy to follow.",
  "Be concise and practical.",
  "Do not invent facts; flag uncertainty.",
];

export default function ContentCreator() {
  const [step, setStep] = useState<StepId>(1);
  const [profile, setProfile] = useState<WritingProfile>({
    mainAreaChips: [],
    tone: "",
    audience: "",
    duration: "",
    platform: "",
    goal: "",
  });
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [complementaryPrompt, setComplementaryPrompt] = useState("");
  const [generationPayload, setGenerationPayload] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [editedScript, setEditedScript] = useState("");

  const selectedNews = useMemo(
    () => MOCK_NEWS.filter((item) => selectedNewsIds.includes(item.id)),
    [selectedNewsIds],
  );

  const references = useMemo(
    () =>
      selectedNews.map((item) => ({
        title: item.title,
        url: item.url,
      })),
    [selectedNews],
  );

  const canContinueFromProfile =
    profile.mainAreaChips.length > 0 &&
    profile.tone.trim() &&
    profile.audience.trim() &&
    profile.duration.trim() &&
    profile.platform.trim() &&
    profile.goal.trim();

  const canContinueFromNews = selectedNewsIds.length > 0;

  const handleToggleChip = (chip: string) => {
    setProfile((prev) => {
      const exists = prev.mainAreaChips.includes(chip);
      return {
        ...prev,
        mainAreaChips: exists
          ? prev.mainAreaChips.filter((item) => item !== chip)
          : [...prev.mainAreaChips, chip],
      };
    });
  };

  const handleToggleNews = (id: string) => {
    setSelectedNewsIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const buildGenerationPayload = () => {
    const newsBlocks = selectedNews
      .map((item) => {
        return [
          `Title: ${item.title}`,
          `Published: ${item.publishedAt}`,
          `URL: ${item.url}`,
          `Full text: ${item.fullText}`,
        ].join("\n");
      })
      .join("\n\n");

    return [
      "Writing profile:",
      `Main areas: ${profile.mainAreaChips.join(", ")}`,
      `Tone: ${profile.tone}`,
      `Audience: ${profile.audience}`,
      `Duration: ${profile.duration}`,
      `Platform: ${profile.platform}`,
      `Goal: ${profile.goal}`,
      "",
      "News context:",
      newsBlocks || "No news selected.",
      "",
      "Complementary prompt:",
      complementaryPrompt.trim() || "None.",
    ].join("\n");
  };

  const buildScript = () => {
    const mainPoints = selectedNews.map((item) => {
      const firstSentence = item.fullText.split(".")[0]?.trim() || item.summary;
      const source = item.url ? ` [Source: ${item.url}]` : "";
      return `- ${firstSentence}.${source}`;
    });

    return [
      "Hook:",
      `Today, here's what matters in ${profile.mainAreaChips.join(", ")}.`,
      "",
      "Main points:",
      mainPoints.length > 0 ? mainPoints.join("\n") : "- No news selected.",
      "",
      "Transitions:",
      "Now let's connect this to what it means for you.",
      "",
      "CTA:",
      `If you want more ${profile.goal.toLowerCase()} content like this, follow for the next update.`,
      "",
      "Optional alt hook:",
      `Quick update for ${profile.audience}: here's what's changing.`,
    ].join("\n");
  };

  const handleGenerate = () => {
    const payload = buildGenerationPayload();
    setGenerationPayload(payload);

    // TODO: Replace with Lovable function call using prompts/system.md guidance.
    const script = buildScript();
    setGeneratedScript(script);
    setEditedScript(script);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Creator Workflow</h1>
        <p className="text-muted-foreground">
          Build a writing profile, add news context, and generate a spoken-first script.
        </p>
      </div>

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
              <p className="text-sm font-medium">Main areas</p>
              <div className="flex flex-wrap gap-2">
                {MAIN_AREA_OPTIONS.map((chip) => {
                  const selected = profile.mainAreaChips.includes(chip);
                  return (
                    <Button
                      key={chip}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleChip(chip)}
                    >
                      {chip}
                    </Button>
                  );
                })}
              </div>
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
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canContinueFromProfile}>
                Continue to news
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
            <div className="grid gap-4 lg:grid-cols-2">
              {MOCK_NEWS.map((item) => {
                const selected = selectedNewsIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleNews(item.id)}
                    className={`rounded-lg border p-4 text-left transition ${
                      selected ? "border-primary bg-muted" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.publishedAt} • {item.url}
                        </p>
                      </div>
                      <span className="text-xs font-medium">
                        {selected ? "Selected" : "Select"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Complementary prompt</p>
              <Textarea
                value={complementaryPrompt}
                onChange={(event) => setComplementaryPrompt(event.target.value)}
                rows={3}
                placeholder="Ex: focus on creator takeaways, keep it punchy, add a CTA."
              />
            </div>

            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back to profile
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canContinueFromNews}>
                Continue to generate
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
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">System guidance</p>
                <ul className="list-disc pl-5">
                  {SYSTEM_PROMPT_GUIDANCE.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              <Button onClick={handleGenerate} disabled={!canContinueFromNews}>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate script
              </Button>

              {generationPayload && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Generation payload</p>
                  <Textarea value={generationPayload} readOnly rows={8} />
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
