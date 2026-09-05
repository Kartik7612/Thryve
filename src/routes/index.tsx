import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Markdown } from "@/components/Markdown";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "THRYVE — Research, branding and brainstorming in one prompt" },
      {
        name: "description",
        content:
          "Ask one question and get sourced business research, production-ready logo SVGs, full brand books, and a sharp brainstorming partner.",
      },
      { property: "og:title", content: "THRYVE — One prompt. Real answers." },
      {
        property: "og:description",
        content:
          "Sourced business ideas, logo SVGs, brand books and lateral brainstorming — from a single chat box.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Chat,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Find 3 business ideas in home energy, with sources",
  "Design a logo for a coffee roastery called Ember",
  "Build a brand book for a fintech aimed at freelancers",
  "Challenge my idea: a marketplace for local repair shops",
];

function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setValue("");
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: prompt }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);

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
      if (!acc.trim()) {
        setMessages([
          ...next,
          { role: "assistant", content: "_No answer came back. Try rephrasing that._" },
        ]);
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
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur">
        <span className="font-display text-lg font-semibold tracking-tight">THRYVE</span>
        {!empty ? (
          <button
            onClick={() => {
              abortRef.current?.abort();
              setMessages([]);
              setError(null);
            }}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            New chat
          </button>
        ) : (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Think it. Prove it. Build it.
          </span>
        )}
      </header>

      <div className={empty ? "flex flex-1 flex-col justify-center" : "flex-1"}>
        {empty ? (
          <div className="mx-auto w-full max-w-2xl px-5">
            <h1 className="rise text-center font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              What are you working on?
            </h1>
            <p className="mt-3 text-center text-muted-foreground">
              Sourced research, business ideas, logo SVGs, brand books — or just think out loud.
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl px-5 py-8">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="mb-6 flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-surface px-4 py-3 text-[0.95rem]">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="mb-8">
                  {m.content ? (
                    <Markdown content={m.content} />
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-moss" />
                      Thinking…
                    </span>
                  )}
                </div>
              ),
            )}
            {error ? (
              <p className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent px-5 pb-6 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(value);
          }}
          className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] transition-colors focus-within:border-moss"
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
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">Enter to send · Shift+Enter for a new line</span>
            {busy ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                aria-label="Stop"
                className="grid h-9 w-9 place-items-center rounded-full bg-moss text-cream"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!value.trim()}
                aria-label="Send"
                className="grid h-9 w-9 place-items-center rounded-full bg-moss text-cream transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {empty ? (
          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-moss/50 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
