import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LoopStrip } from "@/components/thryve/loop";
import {
  ConfidenceMeter,
  Eyebrow,
  PageHeader,
  Panel,
  Pill,
} from "@/components/thryve/primitives";
import { useEvidenceStrength, useThryve } from "@/lib/thryve-store";
import type { EvidenceStance, ValidationMethod } from "@/lib/thryve-types";

export const Route = createFileRoute("/workspace/validate")({
  head: () => ({
    meta: [
      { title: "Validate — THRYVE workspace" },
      {
        name: "description",
        content: "Convert assumptions into falsifiable hypotheses and move confidence only when real evidence lands.",
      },
      { property: "og:title", content: "Validate — THRYVE workspace" },
      {
        property: "og:description",
        content: "Hypotheses, validation methods and evidence-weighted confidence for your idea.",
      },
    ],
  }),
  component: ValidatePage,
});

const METHODS: ValidationMethod[] = [
  "Survey",
  "Interview",
  "Landing-page test",
  "Prototype test",
  "User feedback",
  "Market experiment",
];

function ValidatePage() {
  const { hypotheses, signals, promoteToHypothesis, addEvidence } = useThryve();
  const { tested, total, avg, thesisReady } = useEvidenceStrength();
  const [active, setActive] = useState<string | null>(null);
  const [entry, setEntry] = useState({
    method: "Interview" as ValidationMethod,
    result: "",
    stance: "supports" as EvidenceStance,
  });

  const assumptions = signals.filter((s) => s.kind === "assumption");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Stage 04 · Validate"
        title="A belief you can't disprove isn't a hypothesis."
        lede="Each assumption becomes a statement with a method attached. Confidence is computed from the evidence you record — nothing else moves it."
        action={
          <Panel tone="ink" className="min-w-[190px] p-4">
            <p className="text-xs uppercase tracking-[0.16em] opacity-70">Evidence strength</p>
            <p className="mt-1 font-display text-3xl">{avg}%</p>
            <p className="mt-1 text-xs opacity-70">
              {tested}/{total} hypotheses tested
            </p>
          </Panel>
        }
      />

      <LoopStrip current="validate" />

      {assumptions.length ? (
        <Panel tone="sand">
          <Eyebrow>Assumptions waiting to be promoted</Eyebrow>
          <ul className="mt-3 flex flex-wrap gap-2">
            {assumptions.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => promoteToHypothesis(a.id)}
                  className="rounded-full bg-cream px-4 py-2 text-left text-xs font-semibold text-mossdark transition-colors hover:bg-moss hover:text-cream"
                >
                  + {a.text}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {hypotheses.map((h) => (
          <Panel key={h.id} className="rise flex flex-col">
            <Eyebrow>From assumption</Eyebrow>
            <p className="mt-1 text-xs text-muted-foreground">{h.fromAssumption}</p>
            <p className="mt-3 font-display text-xl leading-snug tracking-tight">{h.statement}</p>
            <div className="mt-4">
              <ConfidenceMeter value={h.confidence} />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {h.methods.map((m) => (
                <Pill key={m} tone="quiet">
                  {m}
                </Pill>
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {h.evidence.map((e) => (
                <li key={e.id} className="rounded-2xl bg-sand/50 p-3 text-sm">
                  <Pill tone={e.stance === "supports" ? "moss" : e.stance === "challenges" ? "clay" : "quiet"}>
                    {e.method} · {e.stance}
                  </Pill>
                  <p className="mt-2 leading-relaxed">{e.result}</p>
                </li>
              ))}
              {h.evidence.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                  No evidence yet — confidence is capped until something is tested.
                </li>
              ) : null}
            </ul>

            {active === h.id ? (
              <div className="mt-4 space-y-2">
                <select
                  value={entry.method}
                  onChange={(e) => setEntry({ ...entry, method: e.target.value as ValidationMethod })}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <textarea
                  value={entry.result}
                  onChange={(e) => setEntry({ ...entry, result: e.target.value })}
                  rows={2}
                  placeholder="What came back?"
                  className="w-full resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-moss"
                />
                <div className="flex gap-2">
                  {(["supports", "challenges", "inconclusive"] as EvidenceStance[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setEntry({ ...entry, stance: s })}
                      className={
                        "flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold capitalize " +
                        (entry.stance === s ? "bg-ink text-cream" : "bg-sand text-mossdark")
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    addEvidence(h.id, entry.method, entry.result, entry.stance);
                    setEntry({ method: "Interview", result: "", stance: "supports" });
                    setActive(null);
                  }}
                  className="w-full rounded-full bg-moss px-4 py-2 text-sm font-semibold text-cream"
                >
                  Record evidence
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActive(h.id)}
                className="mt-4 self-start rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-sand"
              >
                Record evidence
              </button>
            )}
          </Panel>
        ))}
      </div>

      <Link
        to="/workspace/thesis"
        className={
          "inline-flex rounded-full px-5 py-2.5 text-sm font-semibold " +
          (thesisReady ? "bg-moss text-cream" : "bg-sand text-mossdark")
        }
      >
        {thesisReady ? "Write the product thesis →" : "Thesis is thin — see why →"}
      </Link>
    </div>
  );
}
