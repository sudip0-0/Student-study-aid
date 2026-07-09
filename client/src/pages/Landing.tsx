import { Link } from "react-router-dom";
import { FileText, Highlighter, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-grid text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <p className="font-heading text-2xl font-black tracking-tight sm:text-3xl">Lumio</p>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
        <section className="max-w-2xl space-y-5">
          <h1 className="font-heading text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Turn course PDFs into active study.
          </h1>
          <p className="max-w-xl text-base font-bold text-muted-foreground sm:text-lg">
            Upload documents, highlight and take notes, then generate quizzes, flashcards, and summaries
            with your own OpenRouter key — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg">
              <Link to="/register">Create free account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          <div className="rounded-neoLg border-2 border-border bg-surface p-4 shadow-neoSm">
            <FileText className="mb-3 h-5 w-5" aria-hidden />
            <h2 className="text-sm font-extrabold">Upload & organize</h2>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              PDF, DOCX, and TXT in color-coded folders with search across your library.
            </p>
          </div>
          <div className="rounded-neoLg border-2 border-border bg-surface p-4 shadow-neoSm">
            <Highlighter className="mb-3 h-5 w-5" aria-hidden />
            <h2 className="text-sm font-extrabold">Annotate in context</h2>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              Highlights and markdown notes stay attached to the document you are reading.
            </p>
          </div>
          <div className="rounded-neoLg border-2 border-border bg-surface p-4 shadow-neoSm">
            <Sparkles className="mb-3 h-5 w-5" aria-hidden />
            <h2 className="text-sm font-extrabold">Practice with AI</h2>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              Summaries, quizzes, flashcards, cheat sheets, and Ask Doc — powered by your key.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
