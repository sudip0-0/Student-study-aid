import { useState, useEffect, useCallback, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { PanelLeft, Search, Moon, Sun, X } from "lucide-react";
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const awaitingGoRef = useRef(false);
  const goTimerRef = useRef<number | null>(null);
  const { theme, setTheme } = useTheme();
  const pageTitle = location.pathname.startsWith("/study/")
    ? "Study"
    : location.pathname === "/quizzes"
      ? "Quizzes"
      : location.pathname === "/settings"
        ? "Settings"
        : "Dashboard";

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
        const input = document.querySelector<HTMLInputElement>("#global-search, #global-search-mobile");
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
    setMobileSidebarOpen(false);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  if (!isInitialized || isInitializing) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background text-sm font-bold text-muted-foreground">
        <div className="neo-box px-5 py-3">Loading Lumio...</div>
      </div>
    );
  }

  if (!user && location.pathname !== "/login" && location.pathname !== "/register") {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "shrink-0 overflow-hidden border-r-2 border-border bg-surface shadow-[5px_0_0_var(--shadow)] transition-all duration-200",
          sidebarCollapsed ? "w-0" : "w-60",
          "hidden lg:block"
        )}
      >
        {!sidebarCollapsed && (
          <Sidebar activeFolderId={activeFolderId} onSelectFolder={setActiveFolderId} onUploadToFolder={handleUploadToFolder} />
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex shrink-0 items-center gap-2 border-b-2 border-border bg-surface px-3 py-2 sm:px-4">
          <button
            onClick={toggleSidebar}
            className="hidden min-h-10 rounded-md border-2 border-transparent p-2 hover:border-border hover:bg-accent lg:block"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="min-h-10 rounded-md border-2 border-border bg-surface p-2 shadow-neoSm hover:bg-accent lg:hidden"
            aria-label="Open navigation"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 pr-1 sm:min-w-36">
            <p className="font-heading text-base font-black leading-none sm:text-lg">Lumio</p>
            <p className="hidden font-mono text-[10px] font-bold uppercase text-muted-foreground sm:block">{pageTitle}</p>
          </div>

          <div className="relative ml-auto hidden flex-1 sm:block sm:max-w-md">
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
              className="min-h-10 pl-8 text-sm shadow-none"
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

          <button
            onClick={() => {
              setSearchOpen(true);
              requestAnimationFrame(() => {
                const input = document.querySelector<HTMLInputElement>("#global-search-mobile, #global-search");
                input?.focus();
              });
            }}
            className="min-h-10 rounded-md border-2 border-transparent p-2 hover:border-border hover:bg-accent sm:hidden"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </header>
        {searchOpen && (
          <div className="border-b-2 border-border bg-surface p-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="global-search-mobile"
                placeholder="Search files and notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-10 pl-8 pr-10 text-sm shadow-none"
              />
              <button
                onClick={closeSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md border-2 border-transparent p-1.5 hover:border-border hover:bg-accent"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {searchQuery && (
                <SearchDropdown query={searchQuery} onClose={closeSearch} />
              )}
            </div>
          </div>
        )}
        <main className={cn("flex-1 overflow-hidden", location.pathname.startsWith("/study/") ? "" : "overflow-auto p-4 lg:p-6")}>
          <Outlet context={{ activeFolderId, setActiveFolderId }} />
        </main>
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[min(86vw,22rem)] border-r-2 border-border bg-surface shadow-[6px_0_0_var(--shadow)]">
            <Sidebar
              activeFolderId={activeFolderId}
              onSelectFolder={(folderId) => {
                setActiveFolderId(folderId);
                setMobileSidebarOpen(false);
              }}
              onUploadToFolder={handleUploadToFolder}
              onClose={() => setMobileSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

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
