import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, KeyRound, Upload, ScrollText, X } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { useAllFiles, useQuizzes } from "../../hooks";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const DISMISS_KEY = "lumio:onboarding:dismissed";

function readDismissed(): boolean {
  return localStorage.getItem(DISMISS_KEY) === "1";
}

interface SetupChecklistProps {
  onUploadClick: () => void;
}

export default function SetupChecklist({ onUploadClick }: SetupChecklistProps) {
  const hasApiKey = useAuthStore((s) => s.user?.hasApiKey ?? false);
  const { data: allFiles = [], isLoading: filesLoading } = useAllFiles();
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuizzes();
  const [dismissed, setDismissed] = useState(readDismissed);

  const hasFiles = allFiles.length > 0;
  const hasQuiz = quizzes.length > 0;
  const firstFileId = allFiles[0]?.id;
  const allDone = hasApiKey && hasFiles && hasQuiz;

  const steps = useMemo(
    () => [
      {
        id: "key",
        done: hasApiKey,
        title: "Add your OpenRouter API key",
        description: "Required for summaries, quizzes, and Ask Doc.",
        action: (
          <Link
            to="/app/settings"
            className="inline-flex min-h-9 items-center rounded-md border-2 border-border bg-primary px-3 py-1.5 text-xs font-extrabold shadow-neoSm"
          >
            Open Settings
          </Link>
        ),
        icon: KeyRound,
      },
      {
        id: "upload",
        done: hasFiles,
        title: "Upload a study document",
        description: "PDF, DOCX, or TXT — then wait for text extraction.",
        action: (
          <Button size="sm" variant="outline" className="h-9 text-xs" onClick={onUploadClick}>
            Upload file
          </Button>
        ),
        icon: Upload,
      },
      {
        id: "quiz",
        done: hasQuiz,
        title: "Generate a quiz from a document",
        description: "Open Study → AI → Quiz to practice what you read.",
        action: firstFileId ? (
          <Link
            to={`/app/study/${firstFileId}`}
            className="inline-flex min-h-9 items-center rounded-md border-2 border-border bg-surface px-3 py-1.5 text-xs font-extrabold shadow-neoSm"
          >
            Open Study
          </Link>
        ) : (
          <span className="text-xs font-bold text-muted-foreground">Upload a file first</span>
        ),
        icon: ScrollText,
      },
    ],
    [hasApiKey, hasFiles, hasQuiz, firstFileId, onUploadClick]
  );

  if (filesLoading || quizzesLoading) return null;

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem(DISMISS_KEY);
          setDismissed(false);
        }}
        className="text-left text-xs font-extrabold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Show setup checklist
      </button>
    );
  }

  return (
    <section className="app-panel space-y-3 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-extrabold uppercase text-muted-foreground">Get started</p>
          <h2 className="text-lg font-extrabold">
            {allDone ? "Setup complete" : "Set up your first study session"}
          </h2>
          <p className="mt-1 text-xs font-bold text-muted-foreground">
            {allDone
              ? "You can dismiss this checklist anytime."
              : "Three steps to go from empty library to active practice."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          className="rounded-md border-2 border-transparent p-1.5 hover:border-border hover:bg-accent-soft"
          aria-label="Dismiss setup checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ol className="space-y-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.id}
              className={cn(
                "flex flex-col gap-3 rounded-md border-2 border-border p-3 sm:flex-row sm:items-center sm:justify-between",
                step.done ? "bg-success-soft" : "bg-surface"
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border-2 border-border bg-surface shadow-neoSm">
                  {step.done ? (
                    <Check className="h-4 w-4 text-foreground" aria-hidden />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">
                    <span className="font-mono text-xs text-muted-foreground">{index + 1}. </span>
                    {step.title}
                    {step.done && (
                      <span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">Done</span>
                    )}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {!step.done && <div className="shrink-0 sm:pl-11">{step.action}</div>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
