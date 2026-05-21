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
import { Label } from "../components/ui/label";
import { Loader2, Check, X, ShieldAlert, KeyRound, UserRound, LockKeyhole, Mail } from "lucide-react";

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="app-panel p-5">
        <p className="font-mono text-[11px] font-extrabold uppercase text-muted-foreground">Account center</p>
        <h1 className="app-section-title text-3xl sm:text-4xl">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
          Manage identity, security, and the AI connection used across your study workspace.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ProfileSection user={user} />
        <EmailSection user={user} />
        <PasswordSection />
        <ApiKeySection />
        <ModelSection />
        <DangerZone navigate={navigate} />
      </div>
    </div>
  );
}

function SectionHeader({ title, description, icon: Icon }: { title: string; description?: string; icon?: typeof UserRound }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border-2 border-border bg-accent-soft shadow-neoSm">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div>
        <h3 className="text-base font-extrabold">{title}</h3>
        {description && <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function MutationStatus({ success, error, successText }: { success: boolean; error: unknown; successText: string }) {
  if (success) return <span className="status-pill bg-success-soft">{successText}</span>;
  if (error) {
    return (
      <span className="status-pill bg-danger-soft">
        {(error as Error).message || "Failed"}
      </span>
    );
  }
  return null;
}

function ProfileSection({ user }: { user: { id: string; email: string; name: string; hasApiKey: boolean; aiModel: string } | null }) {
  const [name, setName] = useState(user?.name || "");
  const mutation = useUpdateProfile();

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  return (
    <div className="app-panel space-y-4 p-4">
      <SectionHeader title="Profile" description="Your display name across Lumio." icon={UserRound} />
      <div className="space-y-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => mutation.mutate({ name })}
          disabled={mutation.isPending || !name.trim()}
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Save
        </Button>
        <MutationStatus success={mutation.isSuccess} error={mutation.isError ? mutation.error : null} successText="Saved" />
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
    <div className="app-panel space-y-4 p-4">
      <SectionHeader title="Email" description="Requires your current password before it changes." icon={Mail} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="settings-email">Email address</Label>
          <Input
            id="settings-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-password">Current password</Label>
          <Input
            id="email-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Current password"
            type="password"
            className="text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => mutation.mutate({ email, password })}
          disabled={mutation.isPending || !email.trim() || !password}
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Update Email
        </Button>
        <MutationStatus success={mutation.isSuccess} error={mutation.isError ? mutation.error : null} successText="Email updated" />
      </div>
    </div>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const mutation = useChangePassword();

  return (
    <div className="app-panel space-y-4 p-4">
      <SectionHeader title="Password" description="Use at least 8 characters." icon={LockKeyhole} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            type="password"
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            type="password"
            className="text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => mutation.mutate({ currentPassword, newPassword })}
          disabled={mutation.isPending || !currentPassword || newPassword.length < 8}
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Change Password
        </Button>
        <MutationStatus success={mutation.isSuccess} error={mutation.isError ? mutation.error : null} successText="Password changed" />
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
    <div className="app-panel space-y-4 p-4">
      <SectionHeader
        title="OpenRouter API Key"
        description={user?.hasApiKey ? "A key is saved and encrypted server-side." : "Add a key before using AI study tools."}
        icon={KeyRound}
      />
      <div className="space-y-2">
        <Label htmlFor="openrouter-key">API key</Label>
        <Input
          id="openrouter-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-..."
          type="password"
          className="text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
        <MutationStatus success={saveMutation.isSuccess} error={saveMutation.isError ? saveMutation.error : null} successText="Key saved" />
      </div>
      {testResult && (
        <div className={`status-pill w-fit ${testResult.valid ? "bg-success-soft" : "bg-danger-soft"}`}>
          {testResult.valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {testResult.valid ? `Valid - ${testResult.label || "Key works"}` : "Invalid key"}
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
    <div className="app-panel space-y-4 p-4">
      <SectionHeader
        title="AI Model"
        description="Enter the OpenRouter model name used for summaries, quizzes, flashcards, cheatsheets, explanations, and chat."
        icon={KeyRound}
      />
      <div className="space-y-2">
        <Label htmlFor="ai-model">Model name</Label>
        <Input
          id="ai-model"
          value={aiModel}
          onChange={(e) => setAiModel(e.target.value)}
          placeholder="openai/gpt-4o-mini"
          className="text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => mutation.mutate({ aiModel })}
          disabled={mutation.isPending || !aiModel.trim() || aiModel === user?.aiModel}
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Save Model
        </Button>
        <MutationStatus success={mutation.isSuccess} error={mutation.isError ? mutation.error : null} successText="Model saved" />
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
    <div className="space-y-4 rounded-neoXl border-[3px] border-border bg-danger-soft p-4 shadow-neoMd lg:col-span-2">
      <div className="flex items-center gap-2 text-destructive">
        <ShieldAlert className="h-4 w-4" />
        <h3 className="text-base font-semibold">Danger Zone</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Delete your account and all associated data. This cannot be undone.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="delete-confirm">Confirmation</Label>
          <Input
            id="delete-confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delete-password">Password</Label>
          <Input
            id="delete-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            type="password"
            className="text-sm"
          />
        </div>
      </div>
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
