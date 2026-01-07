import { useMemo } from "react";

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

function extractWords(titles: (string | null | undefined)[]): Map<string, number> {
  const wordCounts = new Map<string, number>();
  
  for (const title of titles) {
    if (!title) continue;
    
    // Split by non-word characters, normalize to lowercase
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
  
  return wordCounts;
}

export function WordCloud({ titles, onWordClick, activeWord }: WordCloudProps) {
  const wordData = useMemo(() => {
    const counts = extractWords(titles);
    
    // Sort by count descending, take top 30
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
    
    if (sorted.length === 0) return [];
    
    const maxCount = sorted[0][1];
    const minCount = sorted[sorted.length - 1][1];
    const range = maxCount - minCount || 1;
    
    return sorted.map(([word, count]) => ({
      word,
      count,
      // Size from 0.75rem to 1.5rem based on frequency
      size: 0.75 + ((count - minCount) / range) * 0.75,
      // Opacity from 0.6 to 1 based on frequency
      opacity: 0.6 + ((count - minCount) / range) * 0.4,
    }));
  }, [titles]);

  if (wordData.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
      {wordData.map(({ word, count, size, opacity }) => (
        <button
          key={word}
          onClick={() => onWordClick(activeWord === word ? "" : word)}
          className={`
            px-2 py-1 rounded transition-all hover:bg-primary/20
            ${activeWord === word 
              ? "bg-primary text-primary-foreground" 
              : "bg-background border hover:border-primary"
            }
          `}
          style={{ 
            fontSize: `${size}rem`,
            opacity: activeWord === word ? 1 : opacity,
          }}
          title={`${count} ocorrência(s)`}
        >
          {word}
        </button>
      ))}
      {activeWord && (
        <button
          onClick={() => onWordClick("")}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground underline"
        >
          Limpar filtro
        </button>
      )}
    </div>
  );
}
