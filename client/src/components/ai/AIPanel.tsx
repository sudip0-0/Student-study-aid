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

interface AIPanelProps {
  fileId: string;
}

type AITab = "summary" | "quiz" | "flashcards" | "cheatsheet" | "chat";

const TABS: { key: AITab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "quiz", label: "Quiz" },
  { key: "flashcards", label: "Flashcards" },
  { key: "cheatsheet", label: "Cheatsheet" },
  { key: "chat", label: "Chat" },
];

export default function AIPanel({ fileId }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<AITab>("summary");

  const summarizeMutation = useSummarize();
  const quizMutation = useGenerateQuiz();
  const flashcardsMutation = useGenerateFlashcards();
  const cheatsheetMutation = useGenerateCheatsheet();
  const chatMutation = useChat();

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-1.5 py-2 text-[11px] font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3">
        {activeTab === "summary" && (
          <SummaryView fileId={fileId} mutation={summarizeMutation} />
        )}
        {activeTab === "quiz" && (
          <QuizView fileId={fileId} mutation={quizMutation} />
        )}
        {activeTab === "flashcards" && (
          <FlashcardView fileId={fileId} mutation={flashcardsMutation} />
        )}
        {activeTab === "cheatsheet" && (
          <CheatsheetView fileId={fileId} mutation={cheatsheetMutation} />
        )}
        {activeTab === "chat" && (
          <ChatView fileId={fileId} mutation={chatMutation} />
        )}
      </div>
    </div>
  );
}
