import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LoopStrip } from "@/components/thryve/loop";
import { Eyebrow, PageHeader, Panel, Pill } from "@/components/thryve/primitives";
import { useThryve } from "@/lib/thryve-store";

export const Route = createFileRoute("/workspace/test")({
  head: () => ({
    meta: [
      { title: "Test — THRYVE workspace" },
      {
        name: "description",
        content: "Run scenarios with real people, capture feedback, and feed what you learn back into the loop.",
      },
      { property: "og:title", content: "Test — THRYVE workspace" },
      {
        property: "og:description",
        content: "Test scenarios, success metrics, failure points and tester feedback — then think again.",
      },
    ],
  }),
  component: TestPage,
});

function TestPage() {
  const { scenarios, feedback, addFeedback } = useThryve();
  const [who, setWho] = useState("");
  const [quote, setQuote] = useState("");

  const negative = feedback.filter((f) => f.sentiment === "negative").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Stage 07 · Test"
        title="Real people, defined failure points."
        lede="Every scenario names how it fails before it runs. Feedback that contradicts the thesis is routed back to the hypothesis it threatens."
        action={<Pill tone={negative ? "clay" : "moss"}>{feedback.length} responses</Pill>}
      />

      <LoopStrip current="test" />

      <div className="grid gap-5 md:grid-cols-3">
        {scenarios.map((s) => (
          <Panel key={s.id} className="rise">
            <Eyebrow>Scenario</Eyebrow>
            <p className="mt-2 font-display text-xl leading-snug tracking-tight">{s.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.goal}</p>
            <p className="mt-3 rounded-2xl bg-moss/10 p-3 text-xs text-mossdark">
              Success · {s.successMetric}
            </p>
            <p className="mt-2 rounded-2xl bg-clay/15 p-3 text-xs">Fails when · {s.failurePoint}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Panel>
          <Eyebrow>Tester feedback</Eyebrow>
          <ul className="mt-4 space-y-3">
            {feedback.map((f) => (
              <li key={f.id} className="rounded-2xl bg-sand/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{f.who}</span>
                  <Pill
                    tone={f.sentiment === "negative" ? "clay" : f.sentiment === "positive" ? "moss" : "quiet"}
                  >
                    {f.sentiment}
                  </Pill>
                </div>
                <p className="mt-2 text-sm leading-relaxed">“{f.quote}”</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel tone="sand">
          <Eyebrow>Log a response</Eyebrow>
          <input
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="Who tested it?"
            className="mt-3 w-full rounded-2xl border border-border bg-cream px-4 py-2 text-sm outline-none focus:border-moss"
          />
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={4}
            placeholder="What did they say, in their words?"
            className="mt-2 w-full resize-none rounded-2xl border border-border bg-cream px-4 py-2 text-sm outline-none focus:border-moss"
          />
          <button
            onClick={() => {
              addFeedback(who, quote);
              setWho("");
              setQuote("");
            }}
            className="mt-3 w-full rounded-full bg-moss px-4 py-2.5 text-sm font-semibold text-cream"
          >
            Analyse feedback
          </button>
          <p className="mt-3 text-xs text-mossdark/80">
            THRYVE reads sentiment and flags responses that undercut a live hypothesis.
          </p>
        </Panel>
      </div>

      <Panel tone="ink" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Eyebrow className="opacity-70">Close the loop</Eyebrow>
          <p className="mt-2 font-display text-2xl tracking-tight">
            You know more than you did. Think again.
          </p>
        </div>
        <Link
          to="/workspace"
          className="w-fit rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-ink"
        >
          ↺ Back to Think
        </Link>
      </Panel>
    </div>
  );
}
