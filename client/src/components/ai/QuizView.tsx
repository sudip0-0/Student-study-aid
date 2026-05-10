import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, Check, X } from "lucide-react";
import { useSaveQuizAttempt } from "../../hooks";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Quiz, QuizQuestion } from "../../types";

interface QuizViewProps {
  fileId: string;
  mutation: UseMutationResult<Quiz, Error, { fileId: string; count?: number }>;
}

export default function QuizView({ fileId, mutation }: QuizViewProps) {
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const saveAttempt = useSaveQuizAttempt();

  const handleGenerate = () => {
    setError(null);
    setAnswers({});
    setSubmitted(false);
    mutation.mutate(
      { fileId, count },
      {
        onSuccess: (data) => setQuiz(data),
        onError: (err: Error) => {
          const msg = (err as unknown as { response?: { data?: { error?: string } } }).response?.data?.error || err.message;
          setError(msg);
        },
      }
    );
  };

  const handleAnswer = (qIdx: number, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const handleSubmit = () => {
    if (!quiz) return;
    const questions = quiz.questions as QuizQuestion[];
    const correct = questions.filter((q, i) => answers[i] === q.answer).length;
    const score = Math.round((correct / questions.length) * 100);
    saveAttempt.mutate({ id: quiz.id, score });
    setSubmitted(true);
  };

  const questions = quiz?.questions as QuizQuestion[] | undefined;
  const correctCount = questions
    ? questions.filter((q, i) => answers[i] === q.answer).length
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="h-8 rounded-md border bg-background px-2 text-xs"
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
          {mutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          Generate
        </Button>
      </div>

      {mutation.isPending && (
        <p className="text-xs text-muted-foreground">Generating quiz...</p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {questions && (
        <div className="space-y-4 max-h-[400px] overflow-auto">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="rounded-md border p-3">
              <p className="text-xs font-medium mb-2">
                {qIdx + 1}. {q.question}
              </p>
              <div className="space-y-1">
                {q.options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = answers[qIdx] === letter;
                  const isCorrect = q.answer === letter;
                  const showResult = submitted;

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswer(qIdx, letter)}
                      disabled={submitted}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded border transition-colors ${
                        showResult && isCorrect
                          ? "border-green-500 bg-green-50 text-green-800"
                          : showResult && isSelected && !isCorrect
                          ? "border-red-500 bg-red-50 text-red-800"
                          : isSelected
                          ? "border-primary bg-primary/10"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium">{letter}.</span>
                        {opt}
                        {showResult && isCorrect && <Check className="h-3 w-3 text-green-600 ml-auto" />}
                        {showResult && isSelected && !isCorrect && <X className="h-3 w-3 text-red-600 ml-auto" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  {q.explanation}
                </p>
              )}
            </div>
          ))}

          {!submitted && Object.keys(answers).length === questions.length && (
            <Button size="sm" onClick={handleSubmit} className="w-full text-xs">
              Submit Answers
            </Button>
          )}

          {submitted && (
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="text-sm font-semibold">
                Score: {correctCount}/{questions.length} ({Math.round((correctCount / questions.length) * 100)}%)
              </p>
              {saveAttempt.isPending && (
                <p className="text-xs text-muted-foreground">Saving...</p>
              )}
            </div>
          )}
        </div>
      )}

      {!quiz && !mutation.isPending && !error && (
        <p className="text-xs text-muted-foreground">
          Generate a multiple-choice quiz from this document.
        </p>
      )}
    </div>
  );
}
