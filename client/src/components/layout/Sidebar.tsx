import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, ScrollText, Settings, PanelLeftClose } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { useUIStore } from "../../store/uiStore";
import FolderTree from "../files/FolderTree";
import { cn } from "../../lib/utils";

interface SidebarProps {
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onUploadToFolder: (folderId: string | null) => void;
  onClose?: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-11 items-center gap-2.5 rounded-md border-2 px-3 py-2 text-sm font-extrabold transition-[background-color,box-shadow,transform,color]",
    isActive
      ? "border-border bg-accent text-accent-foreground shadow-neoSm"
      : "border-transparent text-muted-foreground hover:border-border hover:bg-accent-soft hover:text-foreground"
  );

export default function Sidebar({ activeFolderId, onSelectFolder, onUploadToFolder, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose?.();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex shrink-0 items-center justify-between border-b-2 border-border px-4 py-3">
        <NavLink to="/app" className="font-heading text-xl font-black tracking-tight" onClick={onClose}>
          Lumio
        </NavLink>
        <button
          onClick={onClose ?? toggleSidebar}
          className="rounded-md border-2 border-transparent p-1 hover:border-border hover:bg-accent lg:hidden"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {user && (
        <div className="shrink-0 border-b-2 border-border bg-primary-soft px-4 py-3">
          <p className="truncate text-sm font-extrabold">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      )}

      <nav className="shrink-0 space-y-1.5 px-2 py-3">
        <NavLink to="/app" end className={navLinkClass} onClick={onClose}>
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>
        <NavLink to="/app/quizzes" className={navLinkClass} onClick={onClose}>
          <ScrollText className="h-4 w-4" />
          Quizzes
        </NavLink>
        <NavLink to="/app/settings" className={navLinkClass} onClick={onClose}>
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </nav>

      <div className="flex-1 min-h-0">
        <FolderTree
          activeFolderId={activeFolderId}
          onSelect={onSelectFolder}
          onUploadToFolder={onUploadToFolder}
        />
      </div>

      {user && (
        <div className="shrink-0 border-t-2 border-border p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-md border-2 border-transparent px-3 py-2 text-sm font-extrabold text-muted-foreground transition-[background-color,box-shadow,transform,color] hover:border-border hover:bg-accent-soft hover:text-foreground"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
