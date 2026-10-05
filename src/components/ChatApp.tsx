import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, BookmarkPlus, FileText, Loader2, Menu, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/Markdown";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SourcesPanel, extractSources } from "@/components/SourcesPanel";
import { useDictation } from "@/lib/use-dictation";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { runProjectAI } from "@/lib/project-ai.functions";
import { newThreadId, titleFrom } from "@/lib/chat-storage";
import {
  clearRun,
  getRun,
  listThreads,
  loadMessages,
  migrateLocal,
  removeThread,
  startRun,
  stopRun,
  subscribeRuns,
  type Msg,
  type Thread,
} from "@/lib/chat-store";

export const MODES = [
  { id: "research", label: "Research" },
  { id: "brainstorm", label: "Brainstorm" },
  { id: "challenge", label: "Challenge" },
  { id: "debate", label: "Debate" },
  { id: "verify", label: "Verify" },
  { id: "decide", label: "Decide" },
  { id: "plan", label: "Plan" },
  { id: "build", label: "Build" },
] as const;

const SUGGESTIONS = [
  "Research the market for home energy",
  "Find 3 business ideas with sources",
  "Challenge my repair-shop marketplace",
  "Verify: remote work boosts productivity",
  "Design a logo for Ember Coffee",
  "Debate an AI tutor for kids",
];

type ProjectLite = { id: string; name: string; goal: string; context: unknown };

export function ChatApp({ threadId }: { threadId?: string | undefined }) {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const userId = user?.id ?? null;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [stored, setStored] = useState<Msg[]>([]);
  const [value, setValue] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [mode, setMode] = useState<string>("research");
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savingSummary, setSavingSummary] = useState(false);
  const idRef = useRef<string>(threadId ?? newThreadId());
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const runAI = useServerFn(runProjectAI);

  if (threadId && idRef.current !== threadId) idRef.current = threadId;

  const run = useSyncExternalStore(
    subscribeRuns,
    () => getRun(idRef.current),
    () => undefined,
  );
  const messages = run?.messages ?? stored;
  const busy = run?.busy ?? false;
  const error = run?.error ?? null;

  const dictation = useDictation((text) => {
    setValue((v) => (v ? `${v.trim()} ${text}` : text));
    inputRef.current?.focus();
  });

  const refreshThreads = useCallback(() => {
    void listThreads(userId).then(setThreads);
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    if (userId) {
      void migrateLocal(userId).then(refreshThreads);
      void supabase
        .from("projects")
        .select("id,name,goal,context")
        .order("updated_at", { ascending: false })
        .then(({ data }) => setProjects(data ?? []));
    } else {
      refreshThreads();
      setProjects([]);
    }
  }, [ready, userId, refreshThreads]);

  useEffect(() => {
    if (!threadId) idRef.current = newThreadId();
    setStored([]);
    stickRef.current = true;
    if (threadId && ready && !getRun(threadId)?.busy) {
      void loadMessages(userId, threadId).then(setStored);
    }
    inputRef.current?.focus();
  }, [threadId, ready, userId]);

  // Smooth follow while streaming, but never fight the reader's own scrolling.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: busy ? "auto" : "smooth" });
  }, [messages, busy]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const sources = useMemo(
    () =>
      extractSources(
        messages
          .filter((m) => m.role === "assistant")
          .map((m) => m.content)
          .join("\n"),
      ),
    [messages],
  );

  const project = projects.find((p) => p.id === projectId);
  const context = project
    ? `Project: ${project.name}\nGoal: ${project.goal}\n${JSON.stringify(project.context)}`
    : "";

  const send = (text: string) => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setValue("");
    stickRef.current = true;
    const id = idRef.current;
    const history: Msg[] = [...messages, { role: "user", content: prompt }];
    void startRun({
      id,
      history,
      userId,
      mode,
      projectId: projectId || null,
      context,
      onSaved: refreshThreads,
    }).then(() => {
      if (idRef.current === id) setStored(getRun(id)?.messages ?? history);
      clearRun(id);
    });
    if (!threadId) void navigate({ to: "/c/$threadId", params: { threadId: id } });
  };

  const saveToProject = async (i: number, content: string) => {
    if (!projectId) { toast("Pick a project first (top of the chat)."); return; }
    setSavingIdx(i);
    try {
      const r = await runAI({ data: { projectId, action: "extract", input: content.slice(0, 18000) } });
      toast.success(`Saved ${r.items} insights and ${r.tasks} tasks to ${project?.name}.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingIdx(null);
    }
  };

  const saveSummary = async () => {
    if (!projectId) { toast("Pick a project first (top of the chat)."); return; }
    if (!messages.length) return;
    setSavingSummary(true);
    try {
      const text = messages
        .map((m) => `${m.role === "user" ? "User" : "THRYVE"}: ${m.content}`)
        .join("\n\n")
        .slice(0, 18000);
      await runAI({
        data: {
          projectId,
          action: "summarize",
          input: text,
          conversationId: idRef.current,
          conversationTitle: titleFrom(messages[0]?.content ?? ""),
        },
      });
      toast.success(`Saved a chat summary to ${project?.name}.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingSummary(false);
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar
        threads={threads}
        activeId={threadId}
        open={sidebar}
        onClose={() => setSidebar(false)}
        onDelete={(id) => {
          void removeThread(userId, id).then(refreshThreads);
          if (id === threadId) void navigate({ to: "/" });
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-4 py-2.5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setSidebar(true)}
              className="text-muted-foreground transition-colors hover:text-foreground md:hidden"
              aria-label="Open chats"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate text-sm text-muted-foreground">
              {empty ? "New chat" : titleFrom(messages[0]?.content ?? "")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  aria-label="Active project"
                  className="max-w-[10rem] rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground outline-none"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {!empty ? (
                  <button
                    onClick={() => void saveSummary()}
                    disabled={savingSummary || busy}
                    title="Save a summary of this chat to the project"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/60 hover:text-foreground disabled:opacity-50"
                  >
                    {savingSummary ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                    Summarize to project
                  </button>
                ) : null}
              </>
            ) : (
              <Link to="/auth" className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent/60">
                Sign in
              </Link>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div
              ref={scrollRef}
              onScroll={onScroll}
              className={`thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain ${empty ? "flex flex-col justify-center" : ""}`}
            >
              {empty ? (
                <div className="mx-auto w-full max-w-2xl px-5">
                  <h1 className="rise text-center font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
                    What are you <em className="text-accent">working on?</em>
                  </h1>
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Evidence-first research, honest challenges, debates, plans — or just think out loud.
                  </p>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-3xl px-5 py-8">
                  {messages.map((m, i) =>
                    m.role === "user" ? (
                      <div key={i} className="msg-in mb-6 flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-secondary px-4 py-3 text-[0.95rem] text-secondary-foreground">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="msg-in group mb-8">
                        {m.content ? (
                          <>
                            <Markdown content={m.content} />
                            {user && !(busy && i === messages.length - 1) ? (
                              <button
                                onClick={() => void saveToProject(i, m.content)}
                                disabled={savingIdx === i}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 disabled:opacity-100"
                              >
                                {savingIdx === i ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <BookmarkPlus className="h-3 w-3" />
                                )}
                                Save insights to project
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-2.5 text-sm text-muted-foreground">
                            <img
                              src="/favicon.png"
                              alt=""
                              className="h-7 w-7 animate-[spin_2.4s_linear_infinite] rounded-full"
                            />
                            Thinking…
                          </span>
                        )}
                      </div>
                    ),
                  )}
                  {error ? (
                    <p className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="px-4 pb-5 pt-2">
              <div className="mx-auto mb-2 flex w-full max-w-3xl gap-1.5 overflow-x-auto thin-scroll">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                      mode === m.id
                        ? "bg-accent text-accent-foreground"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(value);
                }}
                className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] transition-colors focus-within:border-accent"
              >
                <textarea
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send(value);
                    }
                  }}
                  rows={2}
                  placeholder="Ask anything — research, a claim to verify, an idea to challenge…"
                  className="w-full resize-none bg-transparent px-2 py-1 text-[0.95rem] leading-relaxed outline-none placeholder:text-muted-foreground"
                />
                <div className="flex items-center justify-between gap-3 px-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {dictation.recording
                      ? "Listening… tap the mic to stop"
                      : dictation.transcribing
                        ? "Writing down what you said…"
                        : (dictation.error ??
                          (project ? `Using ${project.name} context` : "Enter to send · Shift+Enter for a new line"))}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={dictation.toggle}
                      disabled={dictation.transcribing}
                      aria-label={dictation.recording ? "Stop dictation" : "Dictate"}
                      className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${
                        dictation.recording
                          ? "animate-pulse border-destructive/50 bg-destructive/15 text-destructive"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {dictation.transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                    </button>
                    {busy ? (
                      <button
                        type="button"
                        onClick={() => stopRun(idRef.current)}
                        aria-label="Stop"
                        className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!value.trim()}
                        aria-label="Send"
                        className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground transition-opacity disabled:opacity-40"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {empty ? (
                <div className="marquee mx-auto mt-4 max-w-3xl">
                  <div className="marquee-track">
                    {[...SUGGESTIONS, ...SUGGESTIONS].map((s, i) => (
                      <button
                        key={`${s}-${i}`}
                        onClick={() => send(s)}
                        className="shrink-0 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/60 hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <SourcesPanel sources={sources} />
        </div>
      </main>
    </div>
  );
}
