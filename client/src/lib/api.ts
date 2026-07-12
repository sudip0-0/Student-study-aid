import axios, { isAxiosError } from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenMemory";

/** Prefer server `{ error }` messages over generic Axios status text. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const payload = error.response?.data;
    if (payload && typeof payload === "object" && "error" in payload) {
      const message = (payload as { error?: unknown }).error;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const url = typeof original?.url === "string" ? original.url : "";
    const isAuthRefresh = url.includes("/auth/refresh") || url.includes("/auth/login") || url.includes("/auth/register");
    if (err.response?.status === 401 && !original._retry && !isAuthRefresh) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = axios
          .post<{ data: { accessToken: string } }>(
            `${import.meta.env.VITE_API_URL || "/api"}/auth/refresh`,
            {},
            { withCredentials: true },
          )
          .then(({ data }) => {
            const token = data.data.accessToken;
            setAccessToken(token);
            return token;
          })
          .catch(() => {
            clearAccessToken();
            if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
              window.location.href = "/login";
            }
            return "";
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const token = await refreshPromise;
      if (!token) return Promise.reject(err);
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
    return Promise.reject(err);
  },
);

export default api;
