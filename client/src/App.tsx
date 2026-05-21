import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Study from "./pages/Study";
import Quizzes from "./pages/Quizzes";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AppShell from "./components/layout/AppShell";

function App() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      void fetchMe();
    }
  }, [fetchMe, isInitialized, isInitializing]);

  if (!isInitialized || isInitializing) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-sm font-bold text-muted-foreground">
        <div className="neo-box px-5 py-3">Loading Lumio...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="study/:fileId" element={<Study />} />
          <Route path="quizzes" element={<Quizzes />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
