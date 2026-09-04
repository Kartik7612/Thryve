import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { LOOP_STAGES } from "@/components/thryve/loop";
import { PENDING_KEY } from "@/lib/thryve-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "THRYVE — Think it. Prove it. Build it." },
      {
        name: "description",
        content:
          "THRYVE is an AI co-founder for brainstorming: dump a rough thought and it extracts the signals, branches the idea, and argues back with evidence.",
      },
      { property: "og:title", content: "THRYVE — Think it. Prove it. Build it." },
      {
        property: "og:description",
        content:
          "Start with a half-formed thought. THRYVE reads it like a co-founder and turns it into something you can prove.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const PROMPTS = [
  "A way for students to find real product problems to build",
  "Tools for solo founders who can't afford a design team",
  "Something that makes local repair shops findable online",
  "A better handover between sales and support teams",
  "An app that turns messy research notes into decisions",
  "Helping small farms sell direct without a middleman",
];

function Landing() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const start = (text: string) => {
    const thought = text.trim();
    if (!thought) return;
    try {
      window.localStorage.setItem(PENDING_KEY, thought);
    } catch {
      /* ignore */
    }
    void navigate({ to: "/workspace" });
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-semibold tracking-tight">THRYVE</span>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Think it. Prove it. Build it.
        </span>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-24">
        <h1 className="rise text-center font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          What are you thinking about?
        </h1>
        <p className="mt-4 text-center text-base leading-relaxed text-muted-foreground">
          Say it badly. THRYVE reads the messy version, finds what you're assuming, and starts
          arguing with you like a co-founder would.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(value);
          }}
          className="rise mt-8 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition-colors focus-within:border-moss"
        >
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                start(value);
              }
            }}
            rows={3}
            placeholder="I have a rough idea about…"
            className="w-full resize-none bg-transparent px-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-2 flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">Enter to start · Shift+Enter for a new line</span>
            <button
              type="submit"
              disabled={!value.trim()}
              aria-label="Start thinking"
              className="grid h-10 w-10 place-items-center rounded-full bg-moss text-cream transition-opacity disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => start(p)}
              className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-moss/50 hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {LOOP_STAGES.map((s, i) => (
            <span key={s.key} className="flex items-center gap-3">
              {i > 0 ? <span className="text-border">·</span> : null}
              {s.label}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
