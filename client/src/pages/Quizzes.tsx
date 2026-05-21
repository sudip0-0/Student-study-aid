import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuizzes, useDeleteQuiz, useSaveQuizAttempt } from "../hooks";
import { Button } from "../components/ui/button";
import { Loader2, Trash2, Play, Check, X } from "lucide-react";
import type { Quiz, QuizQuestion } from "../types";

export default function Quizzes() {
  const { data: quizzes, isLoading, isError } = useQuizzes();
  const deleteQuiz = useDeleteQuiz();
  const saveAttempt = useSaveQuizAttempt();

  const [attemptingId, setAttemptingId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="neo-box flex items-center gap-2 px-5 py-3 text-sm font-bold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading quizzes...
        </div>
      </div>
    );
  }

  if (isError || !quizzes) {
    return (
      <div className="neo-empty flex h-40 flex-col items-center justify-center gap-2">
        <p className="text-sm font-extrabold text-foreground">Failed to load quizzes.</p>
      </div>
    );
  }

  const startAttempt = (quiz: Quiz) => {
    setAttemptingId(quiz.id);
    setAnswers({});
    setSubmitted(false);
  };

  const cancelAttempt = () => {
    setAttemptingId(null);
    setAnswers({});
    setSubmitted(false);
  };

  const handleAnswer = (qIdx: number, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const handleSubmit = (quiz: Quiz) => {
    const questions = quiz.questions as QuizQuestion[];
    const correct = questions.filter((q, i) => answers[i] === q.answer).length;
    const score = Math.round((correct / questions.length) * 100);
    saveAttempt.mutate({ id: quiz.id, score });
    setSubmitted(true);
  };

  const activeQuiz = attemptingId
    ? quizzes.find((q) => q.id === attemptingId)
    : null;
  const activeQuestions = activeQuiz?.questions as QuizQuestion[] | undefined;

  if (activeQuiz && activeQuestions) {
    const correctCount = activeQuestions.filter(
      (q, i) => answers[i] === q.answer
    ).length;

    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-black">{activeQuiz.title}</h2>
            <Link
              to={`/study/${activeQuiz.fileId}`}
              className="text-xs font-bold text-muted-foreground hover:underline"
            >
              View source document
            </Link>
          </div>
          <Button size="sm" variant="ghost" onClick={cancelAttempt} className="text-xs">
            Back to list
          </Button>
        </div>

        <div className="space-y-4">
          {activeQuestions.map((q, qIdx) => {
            const isSelected = answers[qIdx];
            const isCorrect = q.answer;
            const showResult = submitted;
            return (
              <div key={qIdx} className="neo-box p-4">
                <p className="mb-3 text-sm font-extrabold">
                  {qIdx + 1}. {q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const userPicked = isSelected === letter;
                    const thisIsCorrect = isCorrect === letter;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswer(qIdx, letter)}
                        disabled={submitted}
                        className={`min-h-11 w-full rounded-md border-2 px-3 py-2 text-left text-sm font-bold transition-colors ${
                          showResult && thisIsCorrect
                            ? "border-border bg-success-soft text-foreground"
                            : showResult && userPicked && !thisIsCorrect
                            ? "border-border bg-danger-soft text-foreground"
                            : userPicked
                            ? "border-border bg-primary-soft"
                            : "border-transparent hover:border-border hover:bg-accent-soft"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{letter}.</span>
                          {opt}
                          {showResult && thisIsCorrect && (
                            <Check className="h-4 w-4 text-green-600 ml-auto" />
                          )}
                          {showResult && userPicked && !thisIsCorrect && (
                            <X className="h-4 w-4 text-red-600 ml-auto" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-3">
            {!submitted && Object.keys(answers).length === activeQuestions.length && (
              <Button onClick={() => handleSubmit(activeQuiz)} className="text-sm">
                Submit Answers
              </Button>
            )}
            {submitted && (
              <div className="flex-1 rounded-neoLg border-2 border-border bg-accent-soft p-3 text-center shadow-neoSm">
                <p className="text-base font-semibold">
                  Score: {correctCount}/{activeQuestions.length} ({Math.round((correctCount / activeQuestions.length) * 100)}%)
                </p>
                {saveAttempt.isPending && (
                  <p className="text-xs text-muted-foreground mt-1">Saving...</p>
                )}
                {saveAttempt.isSuccess && (
                  <p className="text-xs text-green-600 mt-1">Score saved!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="app-panel p-5">
        <p className="font-mono text-[11px] font-extrabold uppercase text-muted-foreground">Practice history</p>
        <h1 className="app-section-title text-3xl sm:text-4xl">Quizzes</h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Review generated quizzes, retry attempts, and jump back to source documents.
        </p>
      </div>

      {quizzes.length === 0 ? (
        <div className="neo-empty flex h-40 flex-col items-center justify-center gap-2 text-center">
          <p className="text-base font-extrabold text-foreground">No quizzes yet.</p>
          <p className="text-sm text-muted-foreground">Open a document and generate a quiz from the AI panel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const questions = quiz.questions as QuizQuestion[];
            return (
              <div
                key={quiz.id}
                className="neo-box flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-extrabold">{quiz.title}</h3>
                  {quiz.fileName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {quiz.fileName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {questions.length} questions
                    {quiz.score !== null && (
                      <span className="ml-2 font-medium">
                        - Score: {quiz.score}%
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                    {quiz.attemptedAt && (
                      <span className="ml-2">
                        - Attempted: {new Date(quiz.attemptedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startAttempt(quiz)}
                    className="h-8 text-xs"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {quiz.score !== null ? "Re-attempt" : "Attempt"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Delete this quiz?")) deleteQuiz.mutate(quiz.id);
                    }}
                    disabled={deleteQuiz.isPending}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${quiz.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
