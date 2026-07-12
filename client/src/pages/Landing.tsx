import { Link } from "react-router-dom";
import { FileText, Highlighter, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-grid text-foreground">
      <a
        href="#landing-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border-2 focus:border-border focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-extrabold"
      >
        Skip to content
      </a>
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

      <main id="landing-main" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-16 pt-10 outline-none sm:px-6 sm:pt-16">
        <section className="relative max-w-2xl space-y-5">
          <div
            className="pointer-events-none absolute -inset-x-8 -top-8 -z-10 h-48 opacity-40 motion-safe:animate-none"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse at top left, color-mix(in oklab, var(--primary) 35%, transparent), transparent 70%)",
            }}
          />
          <p className="font-heading text-5xl font-black tracking-tight sm:text-6xl">Lumio</p>
          <h1 className="font-heading text-3xl font-black leading-tight tracking-tight text-muted-foreground sm:text-4xl">
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

        <section className="mt-20 space-y-4" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="font-heading text-xl font-black">
            How it works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border-l-4 border-border pl-4">
              <FileText className="mb-3 h-5 w-5" aria-hidden />
              <h3 className="text-sm font-extrabold">Upload & organize</h3>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                PDF, DOCX, and TXT in color-coded folders with search across your library.
              </p>
            </div>
            <div className="border-l-4 border-border pl-4">
              <Highlighter className="mb-3 h-5 w-5" aria-hidden />
              <h3 className="text-sm font-extrabold">Annotate in context</h3>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                Highlights and markdown notes stay attached to the document you are reading.
              </p>
            </div>
            <div className="border-l-4 border-border pl-4">
              <Sparkles className="mb-3 h-5 w-5" aria-hidden />
              <h3 className="text-sm font-extrabold">Practice with AI</h3>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                Summaries, quizzes, flashcards, cheat sheets, and Ask Doc — powered by your key.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
