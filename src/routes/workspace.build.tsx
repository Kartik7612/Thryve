import { createFileRoute, Link } from "@tanstack/react-router";
import { LoopStrip } from "@/components/thryve/loop";
import { Eyebrow, EmptyState, PageHeader, Panel, Pill } from "@/components/thryve/primitives";
import { useThryve } from "@/lib/thryve-store";

export const Route = createFileRoute("/workspace/build")({
  head: () => ({
    meta: [
      { title: "Build — THRYVE workspace" },
      {
        name: "description",
        content: "A build spec generated from the thesis: scope, the slice that proves the risk, and what is deliberately excluded.",
      },
      { property: "og:title", content: "Build — THRYVE workspace" },
      {
        property: "og:description",
        content: "Thesis becomes a real product plan — MVP scope, milestones, and non-goals.",
      },
    ],
  }),
  component: BuildPage,
});

const SPEC = [
  {
    title: "Core flow",
    items: [
      "Org submits a brief through a rubric-guided form",
      "Mentor co-signs scope and commits to weekly checkpoints",
      "Team claims the brief and gets a semester timeline",
    ],
  },
  {
    title: "Proves which risk",
    items: [
      "Supply: can 10 orgs produce a passing brief in under 25 minutes?",
      "Accountability: are mentors still responding in week 4?",
    ],
  },
  {
    title: "Deliberately not building",
    items: ["Open public feed", "Payments", "Grading integrations", "Mobile app"],
  },
];

const MILESTONES = [
  { week: "Week 1", work: "Rubric + brief intake form, hand-run vetting" },
  { week: "Week 2", work: "Mentor co-sign flow and checkpoint reminders" },
  { week: "Week 3", work: "Team claim + timeline view, seeded with 10 briefs" },
  { week: "Week 4", work: "Instrument drop-off, run scenario tests" },
];

function BuildPage() {
  const { buildStarted, startBuild } = useThryve();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Stage 06 · Build"
        title="Build the smallest thing that can be wrong."
        lede="The spec comes straight from the thesis: whatever claim is weakest determines what ships first."
        action={
          !buildStarted ? (
            <button
              onClick={startBuild}
              className="rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-cream"
            >
              Generate build spec
            </button>
          ) : (
            <Pill tone="moss">Spec generated</Pill>
          )
        }
      />

      <LoopStrip current="build" />

      {!buildStarted ? (
        <EmptyState
          title="No build spec yet"
          hint="THRYVE will convert the current thesis into scope, milestones and explicit non-goals. Regenerate any time the evidence changes."
          action={
            <button
              onClick={startBuild}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream"
            >
              Generate from thesis
            </button>
          }
        />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            {SPEC.map((s) => (
              <Panel key={s.title} className="rise">
                <Eyebrow>{s.title}</Eyebrow>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                  {s.items.map((i) => (
                    <li key={i} className="rounded-2xl bg-sand/50 p-3">
                      {i}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>

          <Panel>
            <Eyebrow>Four-week plan</Eyebrow>
            <ul className="mt-3 divide-y divide-border">
              {MILESTONES.map((m) => (
                <li key={m.week} className="flex flex-wrap gap-3 py-3 text-sm">
                  <Pill tone="solid">{m.week}</Pill>
                  <span className="leading-relaxed">{m.work}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}

      <Link
        to="/workspace/test"
        className="inline-flex rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-cream"
      >
        Put it in front of people →
      </Link>
    </div>
  );
}
