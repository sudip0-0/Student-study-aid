import { useState, useEffect, useCallback, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { PanelLeft, Search, Moon, Sun } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { useUIStore } from "../../store/uiStore";
import Sidebar from "./Sidebar";
import FileUploader from "../files/FileUploader";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import KeyboardShortcuts from "./KeyboardShortcuts";
import SearchDropdown from "./SearchDropdown";
import { useTheme } from "next-themes";

export default function AppShell() {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const awaitingGoRef = useRef(false);
  const goTimerRef = useRef<number | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isTyping) return;
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        const input = document.getElementById("global-search") as HTMLInputElement;
        input?.focus();
      }

      if (isTyping || e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (awaitingGoRef.current) {
        const destinations: Record<string, string> = { d: "/", q: "/quizzes", s: "/settings" };
        const destination = destinations[key];
        awaitingGoRef.current = false;
        if (goTimerRef.current) window.clearTimeout(goTimerRef.current);
        goTimerRef.current = null;
        if (destination) {
          e.preventDefault();
          navigate(destination);
        }
        return;
      }

      if (key === "g") {
        awaitingGoRef.current = true;
        if (goTimerRef.current) window.clearTimeout(goTimerRef.current);
        goTimerRef.current = window.setTimeout(() => {
          awaitingGoRef.current = false;
          goTimerRef.current = null;
        }, 1000);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (goTimerRef.current) window.clearTimeout(goTimerRef.current);
    };
  }, [navigate]);

  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "Dashboard — Lumio",
    };
    const path = location.pathname;
    const title = titles[path] || (path.startsWith("/study/") ? "Study — Lumio" : path === "/quizzes" ? "Quizzes — Lumio" : path === "/settings" ? "Settings — Lumio" : "Lumio");
    document.title = title;
  }, [location.pathname]);

  const handleUploadToFolder = useCallback((folderId: string | null) => {
    setUploadFolderId(folderId);
    setShowUpload(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  if (!isInitialized || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user && location.pathname !== "/login" && location.pathname !== "/register") {
    return <Navigate to="/login" />;
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <aside
        className={cn(
          "border-r bg-card shrink-0 transition-all duration-200 overflow-hidden",
          sidebarCollapsed ? "w-0" : "w-60",
          "hidden lg:block"
        )}
      >
        {!sidebarCollapsed && (
          <Sidebar activeFolderId={activeFolderId} onSelectFolder={setActiveFolderId} onUploadToFolder={handleUploadToFolder} />
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b px-3 py-2 flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-accent hidden lg:block"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="global-search"
              placeholder="Search files and notes... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="pl-8 h-8 text-sm"
            />
            {searchOpen && searchQuery && (
              <SearchDropdown query={searchQuery} onClose={closeSearch} />
            )}
            {searchOpen && !searchQuery && (
              <div
                className="fixed inset-0 z-40"
                onClick={closeSearch}
              />
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0"
            title="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </header>
        <main className={cn("flex-1 overflow-hidden", location.pathname.startsWith("/study/") ? "" : "p-4 lg:p-6 overflow-auto")}>
          <Outlet context={{ activeFolderId, setActiveFolderId }} />
        </main>
      </div>

      {shortcutsOpen && <KeyboardShortcuts onClose={() => setShortcutsOpen(false)} />}
      {showUpload && (
        <FileUploader
          folderId={uploadFolderId}
          onClose={() => { setShowUpload(false); setUploadFolderId(null); }}
        />
      )}
    </div>
  );
}
