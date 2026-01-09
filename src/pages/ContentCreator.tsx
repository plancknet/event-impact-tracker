import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Monitor, Wand2 } from "lucide-react";
import { TeleprompterDisplay } from "@/components/teleprompter/TeleprompterDisplay";
import { runNewsPipelineWithTerms } from "@/news/pipeline";
import type { FullArticle, NewsSearchTerm } from "@/news/types";

type StepId = 1 | 2 | 3;

type WritingProfile = {
  mainSubject: string;
  tone: string;
  audience: string;
  duration: string;
  platform: string;
  goal: string;
};

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
    mainSubject: "Bitcoin",
    tone: "Calm",
    audience: "Creators",
    duration: "60s",
    platform: "YouTube",
    goal: "Entertain",
  });
  const [searchTerms, setSearchTerms] = useState<NewsSearchTerm[]>([]);
  const [newsItems, setNewsItems] = useState<FullArticle[]>([]);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [complementaryPrompt, setComplementaryPrompt] = useState("");
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [generationPayload, setGenerationPayload] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [editedScript, setEditedScript] = useState("");

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

  const canContinueFromProfile =
    profile.mainSubject.trim() &&
    profile.tone.trim() &&
    profile.audience.trim() &&
    profile.duration.trim() &&
    profile.platform.trim() &&
    profile.goal.trim();

  const canContinueFromNews = selectedNewsIds.length > 0;

  const handleToggleNews = (id: string) => {
    setSelectedNewsIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
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
      });

      // TODO: Enrich selected items with Firecrawl full text when available.
      setNewsItems(items);
      setStep(2);
    } catch (error) {
      console.error("Failed to load news context:", error);
      setNewsError("Unable to load news context. Please try again.");
    } finally {
      setNewsLoading(false);
    }
  };

  const buildGenerationPayload = () => {
    const newsBlocks = selectedNews
      .map((item) => {
        const fullText = item.fullText || item.summary || "";
        return [
          `Title: ${item.title}`,
          `Published: ${item.publishedAt ?? "Unknown"}`,
          `URL: ${item.link}`,
          `Full text: ${fullText || "Not available."}`,
        ].join("\n");
      })
      .join("\n\n");

    return [
      "Writing profile:",
      `Main subject: ${profile.mainSubject}`,
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
      const baseText = item.fullText || item.summary || "";
      const firstSentence = baseText.split(".")[0]?.trim();
      const source = item.link ? ` [Source: ${item.link}]` : "";
      const sentence = firstSentence ? `${firstSentence}.` : "No summary available.";
      return `- ${sentence}${source}`;
    });

    return [
      "Hook:",
      `Today, here's what matters in ${profile.mainSubject}.`,
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

            <div className="grid gap-4 lg:grid-cols-2">
              {newsItems.length === 0 ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                  No news found yet. Try again or adjust the main subject terms.
                </div>
              ) : (
                newsItems.map((item) => {
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
                            {item.publishedAt ?? "Unknown date"} • {item.link}
                          </p>
                        </div>
                        <span className="text-xs font-medium">
                          {selected ? "Selected" : "Select"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
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
