import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import { getApiErrorMessage } from "./lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Something went wrong"));
    },
  }),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
