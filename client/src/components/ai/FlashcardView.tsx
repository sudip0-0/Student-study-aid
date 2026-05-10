import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { FlashcardDeck, Flashcard } from "../../types";

interface FlashcardViewProps {
  fileId: string;
  mutation: UseMutationResult<FlashcardDeck, Error, { fileId: string; count?: number }>;
}

export default function FlashcardView({ fileId, mutation }: FlashcardViewProps) {
  const [count, setCount] = useState(10);
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleGenerate = () => {
    setError(null);
    setCardIdx(0);
    setFlipped(false);
    mutation.mutate(
      { fileId, count },
      {
        onSuccess: (data) => setDeck(data),
        onError: (err: Error) => {
          const msg = (err as unknown as { response?: { data?: { error?: string } } }).response?.data?.error || err.message;
          setError(msg);
        },
      }
    );
  };

  const cards = (deck?.cards as Flashcard[]) || [];

  const goNext = () => {
    setFlipped(false);
    setCardIdx((p) => Math.min(p + 1, cards.length - 1));
  };
  const goPrev = () => {
    setFlipped(false);
    setCardIdx((p) => Math.max(p - 1, 0));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value={5}>5 cards</option>
          <option value={10}>10 cards</option>
          <option value={15}>15 cards</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={mutation.isPending}
          className="h-8 text-xs"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          Generate
        </Button>
      </div>

      {mutation.isPending && (
        <p className="text-xs text-muted-foreground">Generating flashcards...</p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {cards.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground text-center">
            {cardIdx + 1} / {cards.length}
          </div>

          <div
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer min-h-[120px] rounded-lg border-2 p-4 flex items-center justify-center text-center transition-all hover:border-primary/50 select-none"
          >
            {flipped ? (
              <p className="text-xs leading-relaxed">{cards[cardIdx].back}</p>
            ) : (
              <p className="text-sm font-medium">{cards[cardIdx].front}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="ghost"
              onClick={goPrev}
              disabled={cardIdx === 0}
              className="h-7 text-xs"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Prev
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFlipped(!flipped)}
              className="h-7 text-xs"
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Flip
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={goNext}
              disabled={cardIdx === cards.length - 1}
              className="h-7 text-xs"
            >
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {!deck && !mutation.isPending && !error && (
        <p className="text-xs text-muted-foreground">
          Generate flashcards to review key concepts.
        </p>
      )}
    </div>
  );
}
