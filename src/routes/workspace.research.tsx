import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LoopStrip } from "@/components/thryve/loop";
import { Eyebrow, PageHeader, Panel, Pill } from "@/components/thryve/primitives";
import { useThryve } from "@/lib/thryve-store";
import type { EvidenceStance } from "@/lib/thryve-types";

export const Route = createFileRoute("/workspace/research")({
  head: () => ({
    meta: [
      { title: "Research — THRYVE workspace" },
      {
        name: "description",
        content: "Answer the open questions with evidence: findings that support, challenge or complicate the idea.",
      },
      { property: "og:title", content: "Research — THRYVE workspace" },
      {
        property: "og:description",
        content: "Evidence, competitor gaps, unknowns and the next investigations worth running.",
      },
    ],
  }),
  component: ResearchPage,
});

const STANCE_TONE: Record<EvidenceStance, "moss" | "clay" | "quiet"> = {
  supports: "moss",
  challenges: "clay",
  inconclusive: "quiet",
};

function ResearchPage() {
  const { research, competitors, unknowns, nextInvestigations, addResearchNote } = useThryve();
  const [form, setForm] = useState({
    title: "",
    detail: "",
    source: "",
    stance: "supports" as EvidenceStance,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Stage 03 · Research"
        title="Findings, not vibes."
        lede="Each note attaches to a question the brainstorm raised. Evidence that challenges the idea is worth more than evidence that flatters it."
      />

      <LoopStrip current="research" />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-4">
          {research.map((r) => (
            <Panel key={r.id} className="rise">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Pill tone={STANCE_TONE[r.stance]} className="uppercase">
                  {r.stance}
                </Pill>
                {r.answers ? (
                  <span className="text-xs text-muted-foreground">answers: {r.answers}</span>
                ) : null}
              </div>
              <p className="mt-3 font-display text-xl leading-snug tracking-tight">{r.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.detail}</p>
              <p className="mt-3 text-xs text-muted-foreground">Source · {r.source}</p>
            </Panel>
          ))}
        </div>

        <div className="space-y-5">
          <Panel tone="sand">
            <Eyebrow>Add evidence</Eyebrow>
            <div className="mt-3 space-y-2">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Finding"
                className="w-full rounded-2xl border border-border bg-cream px-4 py-2 text-sm outline-none focus:border-moss"
              />
              <textarea
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                rows={3}
                placeholder="What exactly did you learn?"
                className="w-full resize-none rounded-2xl border border-border bg-cream px-4 py-2 text-sm outline-none focus:border-moss"
              />
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Source"
                className="w-full rounded-2xl border border-border bg-cream px-4 py-2 text-sm outline-none focus:border-moss"
              />
              <div className="flex gap-2">
                {(["supports", "challenges", "inconclusive"] as EvidenceStance[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, stance: s })}
                    className={
                      "flex-1 rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors " +
                      (form.stance === s ? "bg-ink text-cream" : "bg-cream text-mossdark")
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!form.title.trim()) return;
                  addResearchNote({
                    title: form.title,
                    detail: form.detail,
                    source: form.source || "Manual entry",
                    stance: form.stance,
                  });
                  setForm({ title: "", detail: "", source: "", stance: "supports" });
                }}
                className="w-full rounded-full bg-moss px-4 py-2.5 text-sm font-semibold text-cream"
              >
                Save finding
              </button>
            </div>
          </Panel>

          <Panel>
            <Eyebrow>Competitor gaps</Eyebrow>
            <ul className="mt-3 space-y-3">
              {competitors.map((c) => (
                <li key={c.id} className="rounded-2xl bg-sand/50 p-3">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.approach}</p>
                  <p className="mt-1.5 text-xs text-mossdark">Gap · {c.gap}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <Eyebrow>Still unknown</Eyebrow>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {unknowns.map((u) => (
                <li key={u}>· {u}</li>
              ))}
            </ul>
            <div className="my-4 h-px bg-border" />
            <Eyebrow>Investigate next</Eyebrow>
            <ul className="mt-3 space-y-1.5 text-sm">
              {nextInvestigations.map((n) => (
                <li key={n}>→ {n}</li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Link
        to="/workspace/validate"
        className="inline-flex rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-cream"
      >
        Turn assumptions into testable bets →
      </Link>
    </div>
  );
}
