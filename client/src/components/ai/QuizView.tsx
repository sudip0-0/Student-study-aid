import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, Check, X, ChevronLeft, ChevronDown } from "lucide-react";
import { useSaveQuizAttempt, useQuizzesByFile, useDeleteQuiz } from "../../hooks";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Quiz, QuizQuestion } from "../../types";

interface QuizViewProps {
  fileId: string;
  mutation: UseMutationResult<Quiz, Error, { fileId: string; count?: number }>;
}

export default function QuizView({ fileId, mutation }: QuizViewProps) {
  const { data: savedQuizzes = [] } = useQuizzesByFile(fileId);
  const deleteQuiz = useDeleteQuiz();
  const [count, setCount] = useState(5);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const saveAttempt = useSaveQuizAttempt();

  const handleGenerate = () => {
    setError(null);
    mutation.mutate(
      { fileId, count },
      {
        onSuccess: (data) => openQuiz(data),
        onError: (err: Error) => {
          const msg = (err as unknown as { response?: { data?: { error?: string } } }).response?.data?.error || err.message;
          setError(msg);
        },
      }
    );
  };

  const openQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentIdx(0);
    setAnswers({});
    setShowHint(false);
    setFinished(false);
    setError(null);
  };

  const backToList = () => {
    setActiveQuiz(null);
    setFinished(false);
  };

  // Active quiz - one question at a time
  if (activeQuiz) {
    const questions = activeQuiz.questions as QuizQuestion[];

    if (finished) {
      const correctCount = questions.filter((q, i) => answers[i] === q.answer).length;
      const score = Math.round((correctCount / questions.length) * 100);

      return (
        <div className="space-y-4">
          <button onClick={backToList} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3 w-3" /> Back
          </button>
          <div className="neo-box space-y-2 py-4 text-center">
            <p className="font-mono text-2xl font-black">{score}%</p>
            <p className="text-sm text-muted-foreground">
              {correctCount} of {questions.length} correct
            </p>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {questions.map((q, i) => (
              <div key={i} className={`rounded-md border-2 border-border p-2 text-xs ${answers[i] === q.answer ? "bg-success-soft" : "bg-danger-soft"}`}>
                <p className="font-bold">{i + 1}. {q.question}</p>
                <p className="text-muted-foreground mt-0.5">
                  Your answer: {answers[i] ? q.options[answers[i].charCodeAt(0) - 65] : "—"}
                  {answers[i] !== q.answer && <> · Correct: {q.options[q.answer.charCodeAt(0) - 65]}</>}
                </p>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => openQuiz(activeQuiz)}>
            Retake
          </Button>
        </div>
      );
    }

    const q = questions[currentIdx];
    const selected = answers[currentIdx];

    const handleNext = () => {
      setShowHint(false);
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        // Last question - submit
        const correctCount = questions.filter((qu, i) => answers[i] === qu.answer).length;
        const score = Math.round((correctCount / questions.length) * 100);
        saveAttempt.mutate({ id: activeQuiz.id, score });
        setFinished(true);
      }
    };

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <button onClick={backToList} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3 w-3" /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{currentIdx + 1} / {questions.length}</span>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!selected}
              className="text-xs h-7 px-2.5"
            >
              {currentIdx < questions.length - 1 ? "Next" : "Finish"}
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="rounded-md border-2 border-border bg-surface p-3 text-sm font-extrabold leading-relaxed shadow-neoSm">{q.question}</p>

          <div className="space-y-1.5">
            {q.options.map((opt, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              const isSelected = selected === letter;

              return (
                <button
                  key={oIdx}
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentIdx]: letter }))}
                  className={`min-h-11 w-full rounded-md border-2 px-3 py-2.5 text-left text-xs font-bold transition-colors ${
                    isSelected
                      ? "border-border bg-primary-soft shadow-neoSm"
                      : "border-border bg-surface hover:bg-accent-soft"
                  }`}
                >
                  {letter}.  {opt}
                </button>
              );
            })}
          </div>

          {showHint && q.explanation && (
            <p className="rounded-md border-2 border-border bg-surface-muted p-2 text-[11px] font-bold text-muted-foreground">{q.explanation}</p>
          )}
        </div>

        <div className="mt-auto flex items-center border-t-2 border-border pt-3">
          {q.explanation ? (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Hint <ChevronDown className={`h-3 w-3 transition-transform ${showHint ? "rotate-180" : ""}`} />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // Quiz list view
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="min-h-10 rounded-md border-2 border-border bg-surface px-2 font-mono text-xs font-bold shadow-neoSm"
        >
          <option value={3}>3 Q</option>
          <option value={5}>5 Q</option>
          <option value={10}>10 Q</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={mutation.isPending}
          className="h-8 text-xs"
        >
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          Generate
        </Button>
      </div>

      {mutation.isPending && (
        <p className="text-xs text-muted-foreground">Generating quiz...</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {savedQuizzes.length > 0 && (
        <div className="space-y-1.5">
        <p className="font-mono text-xs font-bold text-muted-foreground">Saved Quizzes</p>
          {savedQuizzes.map((q) => (
            <div
              key={q.id}
              className="flex cursor-pointer items-center justify-between rounded-md border-2 border-border bg-surface px-2.5 py-2 shadow-neoSm hover:bg-accent-soft"
              onClick={() => openQuiz(q)}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{q.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {(q.questions as QuizQuestion[]).length} questions
                  {q.score !== null && ` · Last: ${q.score}%`}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("Delete this quiz?")) deleteQuiz.mutate(q.id); }}
                className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                aria-label={`Delete ${q.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {savedQuizzes.length === 0 && !mutation.isPending && !error && (
        <p className="neo-empty p-4 text-center text-xs font-bold text-muted-foreground">
          Generate a multiple-choice quiz from this document.
        </p>
      )}
    </div>
  );
}
