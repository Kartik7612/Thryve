import { createFileRoute, Link } from "@tanstack/react-router";
import { LOOP_STAGES } from "@/components/thryve/loop";
import { Eyebrow, Panel, Pill } from "@/components/thryve/primitives";
import { SEED_THOUGHT, seedSignals } from "@/lib/thryve-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "THRYVE — Think it. Prove it. Build it." },
      {
        name: "description",
        content:
          "THRYVE is an AI thinking-to-building workspace: turn a rough thought into evidence, a product thesis, and a build plan you can test.",
      },
      { property: "og:title", content: "THRYVE — Think it. Prove it. Build it." },
      {
        property: "og:description",
        content:
          "An AI co-founder that helps you explore, verify, and build. From rough idea to tested product.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-semibold tracking-tight">THRYVE</span>
        <nav className="flex items-center gap-3 text-sm">
          <a href="#loop" className="hidden text-muted-foreground hover:text-foreground sm:inline">
            The loop
          </a>
          <Link
            to="/workspace"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
          >
            Open workspace
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div className="rise">
          <Eyebrow>AI workspace for turning thoughts into real products</Eyebrow>
          <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
            Think it.
            <br />
            Prove it.
            <br />
            <span className="text-mossdark">Build it.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Most ideas die as a note. THRYVE reads the messy version of your thinking, finds what
            you're assuming, tells you what to verify, and holds you to the evidence until there's a
            product worth building.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/workspace"
              className="rounded-full bg-moss px-6 py-3 font-semibold text-cream shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5"
            >
              Start with a thought
            </Link>
            <Link
              to="/workspace/thesis"
              className="rounded-full border border-border px-6 py-3 font-semibold transition-colors hover:bg-sand"
            >
              See a live thesis
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Not a chatbot. Not a doc. A co-founder that argues with you.
          </p>
        </div>

        <Panel className="rise bg-card/80 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <Eyebrow>Raw thought</Eyebrow>
            <Pill tone="moss">reading…</Pill>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{SEED_THOUGHT}</p>
          <div className="my-5 h-px bg-border" />
          <Eyebrow>What THRYVE saw</Eyebrow>
          <ul className="mt-3 space-y-2.5">
            {seedSignals.slice(0, 4).map((s) => (
              <li key={s.id} className="flex gap-3 rounded-2xl bg-sand/60 p-3">
                <Pill tone="solid" className="h-fit uppercase">
                  {s.kind}
                </Pill>
                <span className="text-sm leading-relaxed">{s.text}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section id="loop" className="border-y border-border bg-surface/60 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>The core loop</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight tracking-tight">
            Seven moves, then you think again — with more evidence than last time.
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LOOP_STAGES.map((s, i) => (
              <Link
                key={s.key}
                to={s.to}
                className="group rounded-3xl border border-border bg-card/60 p-5 transition-all hover:-translate-y-1 hover:border-moss/40"
              >
                <span className="text-[11px] font-bold text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 font-display text-xl tracking-tight">{s.label}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "It disagrees with you",
              d: "Every branch can be challenged. THRYVE writes the strongest counter-argument, not encouragement.",
            },
            {
              t: "Confidence is earned",
              d: "Hypotheses move only when evidence lands. Supporting, challenging, or inconclusive — all of it counts.",
            },
            {
              t: "The thesis is alive",
              d: "Your product argument rewrites itself as research and tests come back. No stale strategy doc.",
            },
          ].map((c) => (
            <Panel key={c.t} tone="sand">
              <p className="font-display text-xl tracking-tight">{c.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-mossdark/80">{c.d}</p>
            </Panel>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-base text-foreground">THRYVE</span>
          <span>Think it. Prove it. Build it.</span>
        </div>
      </footer>
    </main>
  );
}
