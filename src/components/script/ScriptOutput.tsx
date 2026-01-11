import { cn } from "@/lib/utils";

interface ScriptOutputProps {
  script: string;
  isLoading?: boolean;
  onEdit?: (script: string) => void;
}

export function ScriptOutput({ script, isLoading, onEdit }: ScriptOutputProps) {
  // Parse and render script with pause tags
  const renderScript = () => {
    if (!script) return null;
    
    const pauseRegex = /<(pause-short|pause-medium|pause-long|pause|topic-change)>/g;
    const parts: { type: 'text' | 'pause' | 'topic'; content: string; pauseType?: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = pauseRegex.exec(script)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: script.slice(lastIndex, match.index),
        });
      }
      if (match[1] === 'topic-change') {
        parts.push({
          type: 'topic',
          content: match[0],
        });
      } else {
        parts.push({
          type: 'pause',
          content: match[0],
          pauseType: match[1],
        });
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < script.length) {
      parts.push({
        type: 'text',
        content: script.slice(lastIndex),
      });
    }

    return parts.map((part, index) => {
      if (part.type === 'pause') {
        const pauseLabel = (() => {
          switch (part.pauseType) {
            case 'pause-short': return '· pausa curta ·';
            case 'pause-medium': return '·· pausa ··';
            case 'pause-long': return '··· pausa longa ···';
            default: return '·· pausa ··';
          }
        })();
        return (
          <span 
            key={index}
            className="inline-block mx-2 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
          >
            {pauseLabel}
          </span>
        );
      }
      if (part.type === 'topic') {
        return (
          <div key={index} className="my-6 py-2 border-t border-dashed border-primary/30">
            <span className="text-xs font-medium text-primary/60 uppercase tracking-wider">
              Novo assunto
            </span>
          </div>
        );
      }
      // Format text for readability
      return part.content.split('\n').map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`}>
          {lineIndex > 0 && <br />}
          {line}
        </span>
      ));
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-4/5" />
        </div>
        <p className="text-center text-muted-foreground mt-8">
          Gerando seu roteiro...
        </p>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
        <p className="text-muted-foreground">
          Seu roteiro aparecerá aqui
        </p>
        <p className="text-sm text-muted-foreground/70 mt-2">
          Clique em "Gerar Roteiro" para começar
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-8 md:p-10">
      <div 
        className={cn(
          "prose prose-lg max-w-none",
          "text-foreground leading-relaxed",
          "font-serif text-xl md:text-2xl"
        )}
        style={{
          lineHeight: '1.8',
          letterSpacing: '0.01em',
        }}
      >
        {renderScript()}
      </div>
    </div>
  );
}
