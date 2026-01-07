import { useMemo, useCallback } from "react";
import ReactWordcloud from "react-wordcloud";

interface WordCloudProps {
  titles: (string | null | undefined)[];
  onWordClick: (word: string) => void;
  activeWord?: string;
}

// Common Portuguese stop words to filter out
const STOP_WORDS = new Set([
  "a", "e", "o", "de", "da", "do", "em", "que", "para", "com", "por", "no", "na",
  "um", "uma", "os", "as", "dos", "das", "ao", "aos", "se", "seu", "sua", "ou",
  "mais", "como", "mas", "foi", "são", "tem", "ser", "está", "isso", "ele", "ela",
  "não", "já", "sobre", "após", "entre", "pode", "quando", "ainda", "vez", "ano",
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
      .split(/[^a-záàâãéèêíïóôõöúçñ]+/i)
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

const options = {
  colors: [
    "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181",
    "#AA96DA", "#FCBAD3", "#A8E6CF", "#FF8B94", "#88D8B0",
    "#FFEAA7", "#DFE6E9", "#74B9FF", "#FD79A8", "#00CEC9"
  ],
  enableTooltip: true,
  deterministic: true,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSizes: [14, 72] as [number, number],
  fontStyle: "normal",
  fontWeight: "bold",
  padding: 3,
  rotations: 2,
  rotationAngles: [-90, 0] as [number, number],
  scale: "sqrt" as const,
  spiral: "archimedean" as const,
  transitionDuration: 500,
};

export function WordCloud({ titles, onWordClick, activeWord }: WordCloudProps) {
  const words = useMemo(() => extractWords(titles), [titles]);

  const callbacks = useMemo(
    () => ({
      onWordClick: (word: { text: string }) => {
        onWordClick(activeWord === word.text ? "" : word.text);
      },
      getWordColor: (word: { text: string }) => {
        if (activeWord === word.text) {
          return "#00d4ff";
        }
        if (activeWord && activeWord !== word.text) {
          return "#6b7280";
        }
        return undefined;
      },
      getWordTooltip: (word: { text: string; value: number }) => 
        `${word.text}: ${word.value} ocorrência(s)`,
    }),
    [activeWord, onWordClick]
  );

  if (words.length === 0) {
    return null;
  }

  return (
    <div className="relative rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(45,212,191,0.1),transparent_50%)]" />
      </div>
      
      {/* Word cloud */}
      <div className="relative h-[280px] w-full">
        <ReactWordcloud
          words={words}
          options={options}
          callbacks={callbacks}
        />
      </div>
      
      {/* Clear filter button */}
      {activeWord && (
        <button
          onClick={() => onWordClick("")}
          className="absolute top-2 right-2 px-2 py-1 text-xs text-cyan-300/70 hover:text-cyan-200 bg-slate-800/50 rounded transition-colors z-10"
        >
          ✕ Limpar filtro: "{activeWord}"
        </button>
      )}
    </div>
  );
}
