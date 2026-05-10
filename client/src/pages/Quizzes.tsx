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
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !quizzes) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <p className="text-sm text-muted-foreground">Failed to load quizzes.</p>
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
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{activeQuiz.title}</h2>
            <Link
              to={`/study/${activeQuiz.fileId}`}
              className="text-xs text-muted-foreground hover:underline"
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
              <div key={qIdx} className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-2">
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
                        className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                          showResult && thisIsCorrect
                            ? "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                            : showResult && userPicked && !thisIsCorrect
                            ? "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                            : userPicked
                            ? "border-primary bg-primary/10"
                            : "border-transparent hover:bg-muted"
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
              <div className="flex-1 p-3 bg-muted rounded-lg text-center">
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
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Quizzes</h2>

      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
          <p className="text-sm">No quizzes yet.</p>
          <p className="text-xs">Open a document and generate a quiz from the AI panel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const questions = quiz.questions as QuizQuestion[];
            return (
              <div
                key={quiz.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{quiz.title}</h3>
                  {quiz.fileName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {quiz.fileName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {questions.length} questions
                    {quiz.score !== null && (
                      <span className="ml-2 font-medium">
                        • Score: {quiz.score}%
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                    {quiz.attemptedAt && (
                      <span className="ml-2">
                        • Attempted: {new Date(quiz.attemptedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
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
