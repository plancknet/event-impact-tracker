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

// Cyan/teal color palette inspired by the reference image
const COLORS = [
  "hsl(180, 70%, 75%)", // Light cyan
  "hsl(180, 60%, 60%)", // Medium cyan
  "hsl(185, 55%, 50%)", // Teal
  "hsl(190, 50%, 45%)", // Blue-teal
  "hsl(175, 65%, 55%)", // Bright teal
  "hsl(180, 45%, 40%)", // Darker teal
  "hsl(185, 70%, 70%)", // Soft cyan
];

// Rotation angles for variety
const ROTATIONS = [0, 0, 0, -8, 8, -15, 15, 90, -90]; // More horizontal, some vertical

function extractWords(titles: (string | null | undefined)[]): Map<string, number> {
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
  
  return wordCounts;
}

// Seeded random for consistent layout
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function WordCloud({ titles, onWordClick, activeWord }: WordCloudProps) {
  const wordData = useMemo(() => {
    const counts = extractWords(titles);
    
    // Sort by count descending, take top 40
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40);
    
    if (sorted.length === 0) return [];
    
    const maxCount = sorted[0][1];
    const minCount = sorted[sorted.length - 1][1];
    const range = maxCount - minCount || 1;
    
    return sorted.map(([word, count], index) => {
      const normalizedSize = (count - minCount) / range;
      // Size from 0.65rem to 2rem based on frequency
      const size = 0.65 + normalizedSize * 1.35;
      // Font weight: more frequent = bolder
      const weight = normalizedSize > 0.6 ? 700 : normalizedSize > 0.3 ? 500 : 400;
      // Pick color based on index for variety
      const color = COLORS[index % COLORS.length];
      // Pick rotation - bias towards horizontal
      const rotation = ROTATIONS[Math.floor(seededRandom(index * 7) * ROTATIONS.length)];
      // Opacity varies slightly
      const opacity = 0.7 + normalizedSize * 0.3;
      
      return {
        word,
        count,
        size,
        weight,
        color,
        rotation,
        opacity,
      };
    });
  }, [titles]);

  if (wordData.length === 0) {
    return null;
  }

  return (
    <div className="relative p-6 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden min-h-[180px]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(45,212,191,0.1),transparent_50%)]" />
      </div>
      
      {/* Word cloud */}
      <div className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {wordData.map(({ word, count, size, weight, color, rotation, opacity }) => (
          <button
            key={word}
            onClick={() => onWordClick(activeWord === word ? "" : word)}
            className={`
              transition-all duration-200 hover:scale-110 cursor-pointer
              ${activeWord === word ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 rounded px-1" : ""}
            `}
            style={{ 
              fontSize: `${size}rem`,
              fontWeight: weight,
              color: activeWord === word ? "hsl(180, 100%, 80%)" : color,
              opacity: activeWord && activeWord !== word ? 0.3 : opacity,
              transform: `rotate(${rotation}deg)`,
              textShadow: activeWord === word ? "0 0 10px rgba(56, 189, 248, 0.5)" : "none",
              lineHeight: 1.2,
            }}
            title={`${count} ocorrência(s)`}
          >
            {word}
          </button>
        ))}
      </div>
      
      {/* Clear filter button */}
      {activeWord && (
        <button
          onClick={() => onWordClick("")}
          className="absolute top-2 right-2 px-2 py-1 text-xs text-cyan-300/70 hover:text-cyan-200 bg-slate-800/50 rounded transition-colors"
        >
          ✕ Limpar filtro
        </button>
      )}
    </div>
  );
}
