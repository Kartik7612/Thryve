import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FolderKanban, LogOut, MessageSquare, Plus, Trash2, X } from "lucide-react";
import type { Thread } from "@/lib/chat-storage";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function ChatSidebar({
  threads,
  activeId,
  open,
  onClose,
  onDelete,
}: {
  threads: Thread[];
  activeId?: string | undefined;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };
  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden" onClick={onClose} aria-hidden />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border/60 bg-card transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-display text-xl tracking-tight">THRYVE</span>
          <button onClick={onClose} className="text-muted-foreground md:hidden" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5 px-3">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-accent/60"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Link>
          <Link
            to="/projects"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <FolderKanban className="h-4 w-4" />
            Projects
          </Link>
        </div>

        <p className="label-eyebrow px-4 pb-2 pt-5">Past chats</p>
        <nav className="thin-scroll flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {threads.length === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            threads.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-2 rounded-xl px-2 transition-colors ${
                  t.id === activeId ? "bg-secondary" : "hover:bg-secondary/60"
                }`}
              >
                <Link
                  to="/c/$threadId"
                  params={{ threadId: t.id }}
                  onClick={onClose}
                  className="flex min-w-0 flex-1 items-center gap-2 py-2 text-sm"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.title}</span>
                </Link>
                <button
                  onClick={() => onDelete(t.id)}
                  aria-label={`Delete ${t.title}`}
                  className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </nav>

        <div className="border-t border-border/60 p-3">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              <button onClick={() => void signOut()} aria-label="Sign out" className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="block rounded-xl bg-accent px-3 py-2 text-center text-sm text-accent-foreground">
              Sign in to sync chats
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
