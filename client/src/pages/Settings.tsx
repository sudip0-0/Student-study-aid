import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useUpdateProfile,
  useUpdateEmail,
  useChangePassword,
  useSaveApiKey,
  useUpdateAiModel,
  useTestApiKey,
  useDeleteAccount,
} from "../hooks";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Loader2, Check, X, ShieldAlert } from "lucide-react";

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">Settings</h2>
      <ProfileSection user={user} />
      <EmailSection user={user} />
      <PasswordSection />
      <ApiKeySection />
      <ModelSection />
      <DangerZone navigate={navigate} />
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

function ProfileSection({ user }: { user: { id: string; email: string; name: string; hasApiKey: boolean; aiModel: string } | null }) {
  const [name, setName] = useState(user?.name || "");
  const mutation = useUpdateProfile();

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <SectionHeader title="Profile" description="Your display name" />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="h-9 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => mutation.mutate({ name })}
          disabled={mutation.isPending || !name.trim()}
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Save
        </Button>
        {mutation.isSuccess && <span className="text-xs text-green-600">Saved</span>}
        {mutation.isError && (
          <span className="text-xs text-destructive">
            {(mutation.error as Error).message || "Failed"}
          </span>
        )}
      </div>
    </div>
  );
}

function EmailSection({ user }: { user: { email: string } | null }) {
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const mutation = useUpdateEmail();

  useEffect(() => {
    setEmail(user?.email || "");
  }, [user?.email]);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <SectionHeader title="Email" description="Requires current password" />
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        type="email"
        className="h-9 text-sm"
      />
      <Input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Current password"
        type="password"
        className="h-9 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => mutation.mutate({ email, password })}
          disabled={mutation.isPending || !email.trim() || !password}
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Update Email
        </Button>
        {mutation.isSuccess && <span className="text-xs text-green-600">Email updated</span>}
        {mutation.isError && (
          <span className="text-xs text-destructive">
            {(mutation.error as Error).message || "Failed"}
          </span>
        )}
      </div>
    </div>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const mutation = useChangePassword();

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <SectionHeader title="Password" description="Min 8 characters" />
      <Input
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Current password"
        type="password"
        className="h-9 text-sm"
      />
      <Input
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New password (min 8 chars)"
        type="password"
        className="h-9 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => mutation.mutate({ currentPassword, newPassword })}
          disabled={mutation.isPending || !currentPassword || newPassword.length < 8}
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Change Password
        </Button>
        {mutation.isSuccess && <span className="text-xs text-green-600">Password changed</span>}
        {mutation.isError && (
          <span className="text-xs text-destructive">
            {(mutation.error as Error).message || "Failed"}
          </span>
        )}
      </div>
    </div>
  );
}

function ApiKeySection() {
  const user = useAuthStore((s) => s.user);
  const [apiKey, setApiKey] = useState("");
  const saveMutation = useSaveApiKey();
  const testMutation = useTestApiKey();
  const [testResult, setTestResult] = useState<{ valid: boolean; label?: string } | null>(null);

  const handleTest = () => {
    setTestResult(null);
    testMutation.mutate(
      { apiKey: apiKey || undefined },
      {
        onSuccess: (data) => setTestResult(data),
        onError: () => setTestResult({ valid: false, label: "Could not verify" }),
      }
    );
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <SectionHeader
        title="OpenRouter API Key"
        description={user?.hasApiKey ? "Key is set" : "No key configured"}
      />
      <Input
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-or-..."
        type="password"
        className="h-9 text-sm"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={() => saveMutation.mutate({ apiKey })}
          disabled={saveMutation.isPending || !apiKey.trim()}
        >
          {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Save Key
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={testMutation.isPending}
        >
          {testMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Test Key
        </Button>
        {saveMutation.isSuccess && <span className="text-xs text-green-600">Key saved</span>}
        {saveMutation.isError && (
          <span className="text-xs text-destructive">
            {(saveMutation.error as Error).message || "Failed"}
          </span>
        )}
      </div>
      {testResult && (
        <div className={`flex items-center gap-1.5 text-xs ${testResult.valid ? "text-green-600" : "text-destructive"}`}>
          {testResult.valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {testResult.valid ? `Valid — ${testResult.label || "Key works"}` : "Invalid key"}
        </div>
      )}
    </div>
  );
}

function ModelSection() {
  const user = useAuthStore((s) => s.user);
  const [aiModel, setAiModel] = useState(user?.aiModel || "openai/gpt-4o-mini");
  const mutation = useUpdateAiModel();

  useEffect(() => {
    setAiModel(user?.aiModel || "openai/gpt-4o-mini");
  }, [user?.aiModel]);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <SectionHeader
        title="AI Model"
        description="Enter the OpenRouter model name used for summaries, quizzes, flashcards, cheatsheets, explanations, and chat."
      />
      <Input
        value={aiModel}
        onChange={(e) => setAiModel(e.target.value)}
        placeholder="openai/gpt-4o-mini"
        className="h-9 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => mutation.mutate({ aiModel })}
          disabled={mutation.isPending || !aiModel.trim() || aiModel === user?.aiModel}
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Save Model
        </Button>
        {mutation.isSuccess && <span className="text-xs text-green-600">Model saved</span>}
        {mutation.isError && (
          <span className="text-xs text-destructive">
            {(mutation.error as Error).message || "Failed"}
          </span>
        )}
      </div>
    </div>
  );
}

function DangerZone({ navigate }: { navigate: (path: string) => void }) {
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useDeleteAccount();

  const handleDelete = () => {
    mutation.mutate(
      { confirmation: confirm, password },
      {
        onSuccess: () => navigate("/login"),
      }
    );
  };

  return (
    <div className="border border-destructive/30 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-destructive">
        <ShieldAlert className="h-4 w-4" />
        <h3 className="text-base font-semibold">Danger Zone</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Delete your account and all associated data. This cannot be undone.
      </p>
      <Input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Type DELETE to confirm"
        className="h-9 text-sm"
      />
      <Input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password"
        type="password"
        className="h-9 text-sm"
      />
      <Button
        size="sm"
        variant="destructive"
        onClick={handleDelete}
        disabled={mutation.isPending || confirm !== "DELETE" || !password}
      >
        {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
        Delete Account
      </Button>
      {mutation.isError && (
        <p className="text-xs text-destructive">
          {(mutation.error as Error).message || "Failed to delete account"}
        </p>
      )}
    </div>
  );
}
