import { useState } from "react";
import {
  useSummarize,
  useGenerateQuiz,
  useGenerateFlashcards,
  useGenerateCheatsheet,
  useChat,
} from "../../hooks";
import SummaryView from "./SummaryView";
import QuizView from "./QuizView";
import FlashcardView from "./FlashcardView";
import CheatsheetView from "./CheatsheetView";
import ChatView from "./ChatView";
import AIStudyGate from "./AIStudyGate";
import { cn } from "../../lib/utils";
import type { File } from "../../types";

interface AIPanelProps {
  fileId: string;
  file: File;
  hasApiKey: boolean;
}

type AITab = "summary" | "quiz" | "flashcards" | "cheatsheet" | "chat";

const TABS: { key: AITab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "quiz", label: "Quiz" },
  { key: "flashcards", label: "Flashcards" },
  { key: "cheatsheet", label: "Cheatsheet" },
  { key: "chat", label: "Ask Doc" },
];

export default function AIPanel({ fileId, file, hasApiKey }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<AITab>("summary");

  const summarizeMutation = useSummarize();
  const quizMutation = useGenerateQuiz();
  const flashcardsMutation = useGenerateFlashcards();
  const cheatsheetMutation = useGenerateCheatsheet();
  const chatMutation = useChat();

  return (
    <AIStudyGate file={file} hasApiKey={hasApiKey}>
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 gap-1 overflow-x-auto rounded-neoLg border-2 border-border bg-surface-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "min-h-10 flex-1 rounded-md border-2 px-2 py-2 text-[11px] font-extrabold transition-colors",
                activeTab === tab.key
                  ? "border-border bg-accent text-foreground shadow-neoSm"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={activeTab === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-3">
          {activeTab === "summary" && (
            <SummaryView fileId={fileId} mutation={summarizeMutation} />
          )}
          {activeTab === "quiz" && <QuizView fileId={fileId} mutation={quizMutation} />}
          {activeTab === "flashcards" && (
            <FlashcardView fileId={fileId} mutation={flashcardsMutation} />
          )}
          {activeTab === "cheatsheet" && (
            <CheatsheetView fileId={fileId} mutation={cheatsheetMutation} />
          )}
          {activeTab === "chat" && <ChatView fileId={fileId} mutation={chatMutation} />}
        </div>
      </div>
    </AIStudyGate>
  );
}
