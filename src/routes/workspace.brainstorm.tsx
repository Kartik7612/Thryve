import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LoopStrip } from "@/components/thryve/loop";
import { Eyebrow, PageHeader, Panel, Pill } from "@/components/thryve/primitives";
import { useThryve } from "@/lib/thryve-store";
import type { BranchCategory } from "@/lib/thryve-types";

export const Route = createFileRoute("/workspace/brainstorm")({
  head: () => ({
    meta: [
      { title: "Brainstorm — THRYVE workspace" },
      {
        name: "description",
        content: "Branch the idea into problems, users, solutions, risks and differentiators — then let THRYVE challenge each one.",
      },
      { property: "og:title", content: "Brainstorm — THRYVE workspace" },
      {
        property: "og:description",
        content: "Expand, merge and stress-test every branch of your idea before committing to one.",
      },
    ],
  }),
  component: BrainstormPage,
});

const ORDER: BranchCategory[] = [
  "Core Problem",
  "Target Users",
  "Possible Solutions",
  "Alternative Directions",
  "Risks",
  "Unanswered Questions",
  "Potential Differentiators",
];

function BrainstormPage() {
  const { branches, addBranch, updateBranch, removeBranch, mergeBranches, challenge } = useThryve();
  const [selected, setSelected] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const grouped = useMemo(
    () => ORDER.map((c) => ({ category: c, items: branches.filter((b) => b.category === c) })),
    [branches],
  );

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Stage 02 · Brainstorm"
        title="Every branch is a claim you'll have to defend."
        lede="THRYVE expands your thought into the directions it could go, then argues against them. Merge what overlaps, kill what can't survive."
        action={
          <button
            onClick={() => {
              mergeBranches(selected);
              setSelected([]);
            }}
            disabled={selected.length < 2}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-40"
          >
            Merge {selected.length || ""} selected
          </button>
        }
      />

      <LoopStrip current="brainstorm" />

      <div className="grid gap-5 md:grid-cols-2">
        {grouped.map(({ category, items }) => (
          <Panel key={category}>
            <div className="flex items-center justify-between">
              <Eyebrow>{category}</Eyebrow>
              <Pill tone="quiet">{items.length}</Pill>
            </div>
            <ul className="mt-4 space-y-3">
              {items.map((b) => (
                <li
                  key={b.id}
                  className={
                    "rounded-2xl border p-3 transition-colors " +
                    (selected.includes(b.id) ? "border-moss bg-moss/10" : "border-border bg-sand/40")
                  }
                >
                  <textarea
                    value={b.text}
                    onChange={(e) => updateBranch(b.id, e.target.value)}
                    rows={2}
                    className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
                  />
                  {b.note ? (
                    <p className="mt-2 rounded-xl bg-ink p-3 text-xs leading-relaxed text-cream">
                      <span className="font-semibold">Counter-argument · </span>
                      {b.note}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <button onClick={() => toggle(b.id)} className="text-mossdark hover:underline">
                      {selected.includes(b.id) ? "Deselect" : "Select"}
                    </button>
                    <button
                      onClick={() => challenge(b.id)}
                      disabled={challengingId === b.id}
                      className="text-mossdark hover:underline disabled:opacity-50"
                    >
                      {challengingId === b.id ? "Thinking…" : "Challenge"}
                    </button>
                    <button
                      onClick={() => removeBranch(b.id)}
                      className="text-muted-foreground hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                value={drafts[category] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [category]: e.target.value }))}
                placeholder="Add a branch…"
                className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-moss"
              />
              <button
                onClick={() => {
                  addBranch(category, drafts[category] ?? "");
                  setDrafts((d) => ({ ...d, [category]: "" }));
                }}
                className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-mossdark"
              >
                Add
              </button>
            </div>
          </Panel>
        ))}
      </div>

      <Link
        to="/workspace/research"
        className="inline-flex rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-cream"
      >
        Take the open questions to research →
      </Link>
    </div>
  );
}
