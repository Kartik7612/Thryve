import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Loader2, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — THRYVE" },
      { name: "description", content: "Your THRYVE projects and saved chat summaries." },
      { property: "og:title", content: "Projects — THRYVE" },
      { property: "og:description", content: "Your THRYVE projects and saved chat summaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectsPage,
});

type Project = { id: string; name: string; goal: string; stage: string; updated_at: string };
type Snippet = {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
  metadata: { conversation_id?: string; conversation_title?: string } | null;
};

function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("projects").select("id,name,goal,stage,updated_at").order("updated_at", { ascending: false }),
      supabase
        .from("project_items")
        .select("id,project_id,title,content,created_at,metadata")
        .eq("kind", "summary")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setProjects(p ?? []);
    setSnippets((s ?? []) as Snippet[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const createProject = async () => {
    const n = name.trim();
    if (!n || !user) return;
    setCreating(true);
    const { error } = await supabase.from("projects").insert({ name: n, owner_id: user.id });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    toast.success(`Project “${n}” created. Pick it at the top of the chat.`);
    void load();
  };

  const snippetsFor = (id: string) => snippets.filter((s) => s.project_id === id);

  return (
    <div className="thin-scroll min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-5 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Each project keeps a brain of summaries, insights and tasks from your chats.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to chat
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createProject();
          }}
          className="mt-8 flex items-center gap-2 rounded-3xl border border-border bg-card p-2 pl-4 shadow-[var(--shadow-soft)] focus-within:border-accent"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name a new project — e.g. “Ember Coffee launch”"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!name.trim() || creating}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity disabled:opacity-40"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            New project
          </button>
        </form>

        {loading ? (
          <p className="mt-12 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your projects…
          </p>
        ) : projects.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-xl">No projects yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create one above, then pick it at the top of the chat. Summaries you save will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {projects.map((p) => {
              const snips = snippetsFor(p.id);
              return (
                <section key={p.id} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-display text-2xl tracking-tight">{p.name}</h2>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                      {p.stage}
                    </span>
                  </div>
                  {p.goal ? <p className="mt-1 text-sm text-muted-foreground">{p.goal}</p> : null}

                  <div className="mt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Chat summaries · {snips.length}
                    </p>
                    {snips.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Nothing saved yet — in the chat, choose this project and tap “Summarize to project”.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {snips.map((s) => {
                          const convId = s.metadata?.conversation_id;
                          const card = (
                            <div className="group rounded-2xl border border-border bg-background/60 p-4 transition-colors hover:border-accent/60">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium leading-snug">{s.title}</p>
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              </div>
                              <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                                {s.content}
                              </p>
                              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent">
                                <MessageSquare className="h-3 w-3" />
                                {s.metadata?.conversation_title || "Open conversation"}
                              </p>
                            </div>
                          );
                          return (
                            <li key={s.id}>
                              {convId ? (
                                <Link to="/c/$threadId" params={{ threadId: convId }} className="block">
                                  {card}
                                </Link>
                              ) : (
                                card
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
