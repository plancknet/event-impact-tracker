import { useMemo } from "react";
import ReactWordcloud from "react-wordcloud";

interface WordCloudProps {
  titles: (string | null | undefined)[];
  onWordClick: (word: string) => void;
  activeWords?: string[];
  compact?: boolean;
  onClear?: () => void;
}

// Common Portuguese stop words to filter out
const STOP_WORDS = new Set([
  "a", "e", "o", "de", "da", "do", "em", "que", "para", "com", "por", "no", "na",
  "um", "uma", "os", "as", "dos", "das", "ao", "aos", "se", "seu", "sua", "ou",
  "mais", "como", "mas", "foi", "sao", "tem", "ser", "esta", "isso", "ele", "ela",
  "nao", "ja", "sobre", "apos", "entre", "pode", "quando", "ainda", "vez", "ano",
  "anos", "dia", "dias", "the", "and", "is", "to", "of", "in", "for", "on", "with",
  "at", "by", "from", "this", "that", "it", "an", "be", "as", "are", "was", "were",
  "will", "has", "have", "had", "been", "would", "could", "should", "their", "its",
  "says", "said", "after", "new", "may", "can", "than", "into", "also", "us", "all",
  "out", "up", "what", "which", "who", "how", "now", "just", "other", "some", "any",
]);

function extractWords(titles: (string | null | undefined)[]): { text: string; value: number }[] {
  const wordCounts = new Map<string, number>();

  for (const title of titles) {
    if (!title) continue;

    const words = title
      .toLowerCase()
      .split(/[^a-z\u00C0-\u017F]+/i)
      .filter((word) =>
        word.length >= 3 &&
        !STOP_WORDS.has(word) &&
        !/^\d+$/.test(word)
      );

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }

  // Sort by count descending, take top 50
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([text, value]) => ({ text, value }));
}

// Vibrant colors ordered by intensity (most vibrant first)
const VIBRANT_COLORS = [
  "#FF0066", // Hot pink
  "#00FF88", // Neon green
  "#FFD700", // Gold
  "#00BFFF", // Deep sky blue
  "#FF6B35", // Bright orange
  "#9B59B6", // Purple
  "#1ABC9C", // Turquoise
  "#E91E63", // Pink
  "#00CED1", // Dark turquoise
  "#FF4757", // Red-pink
];

// Muted colors for less frequent words
const MUTED_COLORS = [
  "#7B8FA1", // Muted blue-gray
  "#95A5A6", // Gray
  "#A29BFE", // Light purple
  "#81ECEC", // Light cyan
  "#FFEAA7", // Light yellow
];

const getOptions = (compact: boolean) => ({
  enableTooltip: true,
  deterministic: false,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSizes: compact ? [10, 28] as [number, number] : [14, 80] as [number, number],
  fontStyle: "normal",
  fontWeight: "bold",
  padding: compact ? 2 : 4,
  rotations: compact ? 0 : 2,
  rotationAngles: [0, 0] as [number, number],
  scale: "sqrt" as const,
  spiral: "archimedean" as const,
  transitionDuration: 300,
});

export function WordCloud({ titles, onWordClick, activeWords = [], compact = false, onClear }: WordCloudProps) {
  const words = useMemo(() => extractWords(titles), [titles]);

  const maxValue = useMemo(() => {
    if (words.length === 0) return 1;
    return Math.max(...words.map((w) => w.value));
  }, [words]);

  const options = useMemo(() => getOptions(compact), [compact]);

  const callbacks = useMemo(
    () => ({
      onWordClick: (word: { text: string }) => {
        onWordClick(word.text);
      },
      getWordColor: (word: { text: string; value: number }) => {
        if (activeWords.length > 0 && activeWords.includes(word.text)) {
          return "#00FFFF"; // Cyan for active
        }
        if (activeWords.length > 0 && !activeWords.includes(word.text)) {
          return "#4a5568"; // Gray for inactive when filtering
        }

        // Calculate relative frequency (0 to 1)
        const relativeFreq = word.value / maxValue;

        // Top 20% get vibrant colors
        if (relativeFreq >= 0.8) {
          return VIBRANT_COLORS[Math.floor(Math.random() * 3)]; // Top 3 vibrant
        }
        // 50-80% get medium vibrant colors
        if (relativeFreq >= 0.5) {
          return VIBRANT_COLORS[3 + Math.floor(Math.random() * 4)];
        }
        // 30-50% get lower vibrant colors
        if (relativeFreq >= 0.3) {
          return VIBRANT_COLORS[7 + Math.floor(Math.random() * 3)];
        }
        // Below 30% get muted colors
        return MUTED_COLORS[Math.floor(Math.random() * MUTED_COLORS.length)];
      },
      getWordTooltip: (word: { text: string; value: number }) =>
        `${word.text}: ${word.value} ocorrencia(s)`,
    }),
    [activeWords, onWordClick, maxValue]
  );

  if (words.length === 0) {
    return null;
  }

  const height = compact ? "h-[56px]" : "h-[280px]";

  return (
    <div className="relative rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(45,212,191,0.1),transparent_50%)]" />
      </div>

      {/* Word cloud */}
      <div className={`relative ${height} w-full`}>
        <ReactWordcloud
          words={words}
          options={options}
          callbacks={callbacks}
        />
      </div>

      {/* Clear filter button */}
      {activeWords.length > 0 && (
        <button
          onClick={() => (onClear ? onClear() : onWordClick(""))}
          className={`absolute top-1 right-1 px-1.5 py-0.5 text-xs text-cyan-300/70 hover:text-cyan-200 bg-slate-800/50 rounded transition-colors z-10 ${compact ? "text-[10px]" : ""}`}
        >
          Limpar ({activeWords.length})
        </button>
      )}
    </div>
  );
}
