import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, Loader2, Menu, Mic, PanelLeft, Square } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SourcesPanel, extractSources } from "@/components/SourcesPanel";
import { useDictation } from "@/lib/use-dictation";
import {
  deleteThread,
  getThread,
  loadThreads,
  newThreadId,
  titleFrom,
  upsertThread,
  type Msg,
  type Thread,
} from "@/lib/chat-storage";

const SUGGESTIONS = [
  "Research the market for home energy",
  "Find 3 business ideas with sources",
  "Design a logo for Ember Coffee",
  "Build a brand book for a fintech",
  "Challenge my repair-shop marketplace",
  "Validate demand for an AI tutor",
];

export function ChatApp({ threadId }: { threadId?: string | undefined }) {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [stick, setStick] = useState(true);
  const idRef = useRef<string>(threadId ?? newThreadId());
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const dictation = useDictation((text) => {
    setValue((v) => (v ? `${v.trim()} ${text}` : text));
    inputRef.current?.focus();
  });

  useEffect(() => {
    setThreads(loadThreads());
    idRef.current = threadId ?? newThreadId();
    setMessages(threadId ? (getThread(threadId)?.messages ?? []) : []);
    setError(null);
    inputRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    if (!stick) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, stick]);

  // Let the reader scroll freely: stop auto-following as soon as they move up,
  // resume once they come back near the bottom.
  useEffect(() => {
    const onScroll = () => {
      const el = document.scrollingElement ?? document.documentElement;
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setStick(distance < 120);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const persist = (msgs: Msg[]) => {
    if (msgs.length === 0) return;
    setThreads(
      upsertThread({
        id: idRef.current,
        title: titleFrom(msgs[0]?.content ?? ""),
        updatedAt: Date.now(),
        messages: msgs,
      }),
    );
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

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setValue("");
    setError(null);
    const isFirst = messages.length === 0;
    const next: Msg[] = [...messages, { role: "user", content: prompt }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);
    setStick(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          res.status === 402
            ? "The AI credits for this app have run out. Add credits to keep going."
            : detail || "The request failed.",
        );
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        acc += decoder.decode(chunk, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
      const final: Msg[] = [
        ...next,
        {
          role: "assistant",
          content: acc.trim() || "_No answer came back. Try rephrasing that._",
        },
      ];
      setMessages(final);
      persist(final);
      if (isFirst && !threadId) {
        void navigate({ to: "/c/$threadId", params: { threadId: idRef.current } });
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setMessages((m) => m.filter((x, i) => !(i === m.length - 1 && !x.content)));
      } else {
        setError((e as Error).message);
        setMessages(next);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-screen bg-background">
      <ChatSidebar
        threads={threads}
        activeId={threadId}
        open={sidebar}
        onClose={() => setSidebar(false)}
        onDelete={(id) => {
          setThreads(deleteThread(id));
          if (id === threadId) void navigate({ to: "/" });
        }}
      />

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebar(true)}
              className="text-muted-foreground transition-colors hover:text-foreground md:hidden"
              aria-label="Open chats"
            >
              <Menu className="h-5 w-5" />
            </button>
            <PanelLeft className="hidden h-4 w-4 text-muted-foreground md:block" />
            <span className="text-sm text-muted-foreground">
              {empty ? "New chat" : titleFrom(messages[0]?.content ?? "")}
            </span>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Think it. Prove it. Build it.
          </span>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className={empty ? "flex flex-1 flex-col justify-center" : "flex-1"}>
              {empty ? (
                <div className="mx-auto w-full max-w-2xl px-5">
                  <h1 className="rise text-center font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    What are you working on?
                  </h1>
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    Sourced research, business ideas, logo SVGs, brand books — or just think out
                    loud.
                  </p>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-3xl px-5 py-8">
                  {messages.map((m, i) =>
                    m.role === "user" ? (
                      <div key={i} className="mb-6 flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-secondary px-4 py-3 text-[0.95rem] text-secondary-foreground">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="mb-8">
                        {m.content ? (
                          <Markdown content={m.content} />
                        ) : (
                          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
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
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-6 pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(value);
                }}
                className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] transition-colors focus-within:border-accent"
              >
                <textarea
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(value);
                    }
                  }}
                  rows={2}
                  placeholder="Ask anything — research, a logo, a brand book, or a half-formed idea…"
                  className="w-full resize-none bg-transparent px-2 py-1 text-[0.95rem] leading-relaxed outline-none placeholder:text-muted-foreground"
                />
                <div className="flex items-center justify-between gap-3 px-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {dictation.recording
                      ? "Listening… tap the mic to stop"
                      : dictation.transcribing
                        ? "Writing down what you said…"
                        : (dictation.error ?? "Enter to send · Shift+Enter for a new line")}
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
                      {dictation.transcribing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </button>
                    {busy ? (
                      <button
                        type="button"
                        onClick={() => abortRef.current?.abort()}
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
                        onClick={() => void send(s)}
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
