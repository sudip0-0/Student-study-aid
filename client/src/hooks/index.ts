import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { getApiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { toast } from "sonner";
import type {
  Folder as FolderType,
  File as FileType,
  Highlight,
  Note,
  Quiz,
  FlashcardDeck,
} from "../types";

function getErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, fallback);
}

export function useAuthCheck() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    retry: false,
    refetchOnWindowFocus: false,
  });
}



export function useFiles(folderId?: string) {
  return useQuery<FileType[]>({
    queryKey: ["files", folderId],
    queryFn: async () => {
      const { data } = await api.get("/files", { params: { folderId } });
      return data.data;
    },
  });
}

export function useAllFiles() {
  return useQuery<FileType[]>({
    queryKey: ["files"],
    queryFn: async () => {
      const { data } = await api.get("/files");
      return data.data;
    },
  });
}

export function useFile(id: string) {
  return useQuery<FileType>({
    queryKey: ["files", id],
    queryFn: async () => {
      const { data } = await api.get(`/files/${id}`);
      return data.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const file = query.state.data;
      if (!file || file.url === "") return false;
      if (file.extractedText) return false;
      return 3000;
    },
  });
}

export function useFolders() {
  return useQuery<FolderType[]>({
    queryKey: ["folders"],
    queryFn: async () => {
      const { data } = await api.get("/folders/all");
      return data.data;
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; parentId?: string; color?: string }) => {
      const { data } = await api.post("/folders", body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; color?: string }) => {
      const { data } = await api.patch(`/folders/${id}`, body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useSummarize() {
  return useMutation({
    mutationFn: async ({
      fileId,
      length,
    }: {
      fileId: string;
      length?: "short" | "medium" | "long";
    }) => {
      const { data } = await api.post("/ai/summarize", { fileId, length });
      return data.data as string;
    },
  });
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fileId, count }: { fileId: string; count?: number }) => {
      const { data } = await api.post("/ai/quiz", { fileId, count });
      return data.data as Quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useGenerateFlashcards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fileId, count }: { fileId: string; count?: number }) => {
      const { data } = await api.post("/ai/flashcards", { fileId, count });
      return data.data as FlashcardDeck;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });
}

export function useGenerateCheatsheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fileId }: { fileId: string }) => {
      const { data } = await api.post("/ai/cheatsheet", { fileId });
      return data.data as import("../types").Cheatsheet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cheatsheets"] });
    },
  });
}

export function useExplain() {
  return useMutation({
    mutationFn: async ({
      text,
      level,
    }: {
      text: string;
      level?: "simple" | "moderate" | "detailed";
    }) => {
      const { data } = await api.post("/ai/explain", { text, level });
      return data.data as string;
    },
  });
}

export function useChat() {
  return useMutation({
    mutationFn: async ({
      fileId,
      messages,
    }: {
      fileId: string;
      messages: { role: "user" | "assistant"; content: string }[];
    }) => {
      const { data } = await api.post("/ai/chat", { fileId, messages });
      return data.data as string;
    },
  });
}

export function useQuizzes() {
  return useQuery<Quiz[]>({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data } = await api.get("/quizzes");
      return data.data;
    },
  });
}

export function useQuizzesByFile(fileId: string) {
  return useQuery<Quiz[]>({
    queryKey: ["quizzes", fileId],
    queryFn: async () => {
      const { data } = await api.get(`/quizzes/file/${fileId}`);
      return data.data;
    },
    enabled: !!fileId,
  });
}

export function useSaveQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, score }: { id: string; score: number }) => {
      const { data } = await api.patch(`/quizzes/${id}/attempt`, { score });
      return data.data as Quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quizzes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useFlashcards(fileId: string) {
  return useQuery<FlashcardDeck[]>({
    queryKey: ["flashcards", fileId],
    queryFn: async () => {
      const { data } = await api.get(`/flashcards/file/${fileId}`);
      return data.data;
    },
    enabled: !!fileId,
  });
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/flashcards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });
}

export function useCheatsheets(fileId: string) {
  return useQuery<import("../types").Cheatsheet[]>({
    queryKey: ["cheatsheets", fileId],
    queryFn: async () => {
      const { data } = await api.get(`/cheatsheets/file/${fileId}`);
      return data.data;
    },
    enabled: !!fileId,
  });
}

export function useDeleteCheatsheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cheatsheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cheatsheets"] });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; type: string; dataUrl: string; size: number; folderId?: string | null }) => {
      const { data: res } = await api.post("/upload/file", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useCreateBlankFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; folderId?: string | null }) => {
      const { data } = await api.post("/files/blank", body);
      return data.data as FileType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; folderId?: string | null; extractedText?: string }) => {
      const { data } = await api.patch(`/files/${id}`, body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useHighlights(fileId: string) {
  return useQuery<Highlight[]>({
    queryKey: ["highlights", fileId],
    queryFn: async () => {
      const { data } = await api.get(`/highlights/${fileId}`);
      return data.data;
    },
    enabled: !!fileId,
  });
}

export function useCreateHighlight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      fileId: string;
      text: string;
      color?: string;
      page?: number;
      position?: { x: number; y: number; width: number; height: number };
      note?: string;
    }) => {
      const { data } = await api.post("/highlights", body);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["highlights", variables.fileId] });
    },
  });
}

export function useUpdateHighlight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileId, ...body }: { id: string; fileId: string; color?: string; note?: string }) => {
      const { data } = await api.patch(`/highlights/${id}`, body);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["highlights", variables.fileId] });
    },
  });
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileId }: { id: string; fileId: string }) => {
      await api.delete(`/highlights/${id}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["highlights", variables.fileId] });
    },
  });
}

export function useNotes(fileId: string) {
  return useQuery<Note[]>({
    queryKey: ["notes", fileId],
    queryFn: async () => {
      const { data } = await api.get(`/notes/${fileId}`);
      return data.data;
    },
    enabled: !!fileId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { fileId: string; content: string }) => {
      const { data } = await api.post("/notes", body);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes", variables.fileId] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileId, content }: { id: string; fileId: string; content: string }) => {
      const { data } = await api.patch(`/notes/${id}`, { content });
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes", variables.fileId] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileId }: { id: string; fileId: string }) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes", variables.fileId] });
    },
  });
}

// --- Settings hooks ---

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data } = await api.patch("/auth/settings/profile", { name });
      return data.data as { id: string; email: string; name: string; hasApiKey: boolean; aiModel: string };
    },
    onSuccess: (userData) => {
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, name: userData.name, hasApiKey: userData.hasApiKey, aiModel: userData.aiModel } : null,
      }));
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update profile"));
    },
  });
}

export function useUpdateEmail() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data } = await api.patch("/auth/settings/email", { email, password });
      return data.data as { id: string; email: string; name: string; hasApiKey: boolean; aiModel: string };
    },
    onSuccess: (userData) => {
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, email: userData.email, name: userData.name, hasApiKey: userData.hasApiKey, aiModel: userData.aiModel } : null,
      }));
      toast.success("Email updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update email"));
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      await api.patch("/auth/settings/password", { currentPassword, newPassword });
    },
    onSuccess: () => {
      toast.success("Password changed");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to change password"));
    },
  });
}

export function useSaveApiKey() {
  return useMutation({
    mutationFn: async ({ apiKey }: { apiKey: string }) => {
      const { data } = await api.put("/auth/settings/api-key", { apiKey });
      return data.data as { hasApiKey: boolean };
    },
    onSuccess: (result) => {
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, hasApiKey: result.hasApiKey } : null,
      }));
      toast.success("API key saved");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to save API key"));
    },
  });
}

export function useUpdateAiModel() {
  return useMutation({
    mutationFn: async ({ aiModel }: { aiModel: string }) => {
      const { data } = await api.patch("/auth/settings/model", { aiModel });
      return data.data as { id: string; email: string; name: string; hasApiKey: boolean; aiModel: string };
    },
    onSuccess: (userData) => {
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, aiModel: userData.aiModel, hasApiKey: userData.hasApiKey } : null,
      }));
      toast.success("AI model updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update AI model"));
    },
  });
}

export function useTestApiKey() {
  return useMutation({
    mutationFn: async ({ apiKey }: { apiKey?: string }) => {
      const { data } = await api.post("/auth/settings/test-key", { apiKey });
      return data.data as { valid: boolean; label?: string };
    },
    onSuccess: (result) => {
      if (result.valid) toast.success("API key is valid");
      else toast.error("API key is invalid");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not verify API key"));
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async ({ confirmation, password }: { confirmation: string; password: string }) => {
      await api.delete("/auth/settings/account", { data: { confirmation, password } });
    },
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false });
      toast.success("Account deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete account"));
    },
  });
}
