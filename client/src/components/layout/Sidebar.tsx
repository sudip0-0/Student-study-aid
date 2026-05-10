import { NavLink } from "react-router-dom";
import { LayoutDashboard, ScrollText, Settings, PanelLeftClose } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { useUIStore } from "../../store/uiStore";
import FolderTree from "../files/FolderTree";
import { cn } from "../../lib/utils";

interface SidebarProps {
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onUploadToFolder: (folderId: string | null) => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
    isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
  );

export default function Sidebar({ activeFolderId, onSelectFolder, onUploadToFolder }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <NavLink to="/" className="text-lg font-semibold tracking-tight">
          Lumio
        </NavLink>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-accent md:hidden"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {user && (
        <div className="px-4 py-3 border-b shrink-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      )}

      <nav className="px-2 py-2 space-y-0.5 shrink-0">
        <NavLink to="/" end className={navLinkClass}>
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>
        <NavLink to="/quizzes" className={navLinkClass}>
          <ScrollText className="h-4 w-4" />
          Quizzes
        </NavLink>
        <NavLink to="/settings" className={navLinkClass}>
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
    </div>
  );
}
