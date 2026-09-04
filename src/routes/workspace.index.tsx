import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoopStrip } from "@/components/thryve/loop";
import { Eyebrow, PageHeader, Panel, Pill } from "@/components/thryve/primitives";
import { useThryve } from "@/lib/thryve-store";

export const Route = createFileRoute("/workspace/")({
  head: () => ({
    meta: [
      { title: "Think — THRYVE workspace" },
      {
        name: "description",
        content: "Dump the unstructured version of your idea. THRYVE extracts the signals inside it.",
      },
      { property: "og:title", content: "Think — THRYVE workspace" },
      {
        property: "og:description",
        content: "Raw thinking in, structured signals out: problems, assumptions, questions, contradictions.",
      },
    ],
  }),
  component: ThinkPage,
});

const KIND_TONE: Record<string, "quiet" | "moss" | "clay" | "solid"> = {
  problem: "clay",
  assumption: "clay",
  contradiction: "solid",
  opportunity: "moss",
  question: "moss",
};

function ThinkPage() {
  const { thought, signals, thinking, submitThought, activity, aiError } = useThryve();
  const [draft, setDraft] = useState(thought);

  useEffect(() => {
    setDraft(thought);
  }, [thought]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Stage 01 · Think"
        title="Say it badly. That's the point."
        lede="Write the messy version — half-formed, contradictory, unfinished. THRYVE reads it the way a co-founder would and pulls out what's actually being claimed."
      />

      <LoopStrip current="think" />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <Panel>
          <Eyebrow>Your thought</Eyebrow>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={10}
            placeholder="I have a rough idea about…"
            className="mt-3 w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed outline-none transition-colors focus:border-moss"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => submitThought(draft)}
              disabled={thinking || !draft.trim()}
              className="rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-cream transition-opacity disabled:opacity-50"
            >
              {thinking ? "Thinking…" : "Read my thinking"}
            </button>
            <span className="text-xs text-muted-foreground">
              {draft.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          {aiError ? (
            <p className="mt-3 rounded-2xl bg-clay/15 p-3 text-xs leading-relaxed text-mossdark">
              {aiError}
            </p>
          ) : null}
        </Panel>

        <Panel tone="sand">
          <div className="flex items-center justify-between">
            <Eyebrow>Extracted signals</Eyebrow>
            <Pill tone="solid">{signals.length}</Pill>
          </div>
          <ul className="mt-4 space-y-2.5">
            {thinking
              ? [0, 1, 2, 3].map((i) => (
                  <li key={i} className="h-14 animate-pulse rounded-2xl bg-cream/70" />
                ))
              : signals.map((s) => (
                  <li key={s.id} className="rise rounded-2xl bg-cream/80 p-3">
                    <Pill tone={KIND_TONE[s.kind] ?? "quiet"} className="uppercase">
                      {s.kind}
                    </Pill>
                    <p className="mt-2 text-sm leading-relaxed">{s.text}</p>
                  </li>
                ))}
          </ul>
          <Link
            to="/workspace/brainstorm"
            className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream"
          >
            Branch this thinking →
          </Link>
        </Panel>
      </div>

      <Panel>
        <Eyebrow>Loop activity</Eyebrow>
        <ul className="mt-3 divide-y divide-border">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="flex items-center gap-3">
                <Pill tone="quiet" className="uppercase">
                  {a.stage}
                </Pill>
                {a.text}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{a.at}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
