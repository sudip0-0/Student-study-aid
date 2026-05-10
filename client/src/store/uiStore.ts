import { create } from "zustand";

type ViewMode = "grid" | "list";
type RightPanelTab = "notes" | "highlights" | "ai";

interface UIState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "grid",
  setViewMode: (mode) => set({ viewMode: mode }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  rightPanelTab: "notes",
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
}));
