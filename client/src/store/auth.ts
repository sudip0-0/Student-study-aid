import { create } from "zustand";
import api from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  hasApiKey: boolean;
  aiModel: string;
}

interface Tokens {
  accessToken: string;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isInitialized: false,
  isInitializing: false,

  login: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    const tokens = { accessToken: data.data.accessToken };
    localStorage.setItem("accessToken", tokens.accessToken);
    set({ user: data.data.user, tokens, isAuthenticated: true, isInitialized: true, isInitializing: false });
  },

  register: async (email: string, password: string, name?: string) => {
    const { data } = await api.post("/auth/register", { email, password, name: name || email.split("@")[0] });
    const tokens = { accessToken: data.data.accessToken };
    localStorage.setItem("accessToken", tokens.accessToken);
    set({ user: data.data.user, tokens, isAuthenticated: true, isInitialized: true, isInitializing: false });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    set({ user: null, tokens: null, isAuthenticated: false, isInitialized: true, isInitializing: false });
    api.post("/auth/logout").catch(() => {});
  },

  fetchMe: async () => {
    set({ isInitializing: true });
    try {
      const { data } = await api.get("/auth/me");
      const accessToken = localStorage.getItem("accessToken");
      set({
        user: data.data,
        tokens: accessToken ? { accessToken } : null,
        isAuthenticated: true,
        isInitialized: true,
        isInitializing: false,
      });
    } catch {
      localStorage.removeItem("accessToken");
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isInitialized: true,
        isInitializing: false,
      });
    }
  },
}));
