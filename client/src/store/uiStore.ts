import { create } from "zustand";

type ViewMode = "grid" | "list";
type RightPanelTab = "notes" | "highlights" | "ai";

const VIEW_MODE_KEY = "lumio:viewMode";
const RIGHT_PANEL_KEY = "lumio:rightPanelTab";
const RECENT_FILES_KEY = "lumio:recentFiles";

function readViewMode(): ViewMode {
  const value = localStorage.getItem(VIEW_MODE_KEY);
  return value === "list" ? "list" : "grid";
}

function readRightPanelTab(): RightPanelTab {
  const value = localStorage.getItem(RIGHT_PANEL_KEY);
  if (value === "highlights" || value === "ai") return value;
  return "notes";
}

interface UIState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;
  recentFileIds: string[];
  pushRecentFile: (fileId: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  viewMode: readViewMode(),
  setViewMode: (mode) => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    set({ viewMode: mode });
  },
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  rightPanelTab: readRightPanelTab(),
  setRightPanelTab: (tab) => {
    localStorage.setItem(RIGHT_PANEL_KEY, tab);
    set({ rightPanelTab: tab });
  },
  recentFileIds: (() => {
    try {
      const raw = localStorage.getItem(RECENT_FILES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })(),
  pushRecentFile: (fileId) => {
    const current = get().recentFileIds.filter((id) => id !== fileId);
    const next = [fileId, ...current].slice(0, 8);
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(next));
    set({ recentFileIds: next });
  },
}));
