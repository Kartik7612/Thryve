import { createFileRoute, Link } from "@tanstack/react-router";
import { LoopStrip } from "@/components/thryve/loop";
import { ConfidenceMeter, Eyebrow, PageHeader, Panel, Pill } from "@/components/thryve/primitives";
import { useEvidenceStrength, useThryve } from "@/lib/thryve-store";
import { keyPhrase } from "@/lib/thryve-ai";

export const Route = createFileRoute("/workspace/thesis")({
  head: () => ({
    meta: [
      { title: "Product thesis — THRYVE workspace" },
      {
        name: "description",
        content: "A living argument for the product: what's true, what's still risky, and what it commits you to build.",
      },
      { property: "og:title", content: "Product thesis — THRYVE workspace" },
      {
        property: "og:description",
        content: "Your thesis rewrites itself as evidence lands. Strong claims, honest gaps.",
      },
    ],
  }),
  component: ThesisPage,
});

function ThesisPage() {
  const { thought, hypotheses, research, unknowns } = useThryve();
  const { avg, tested, total, thesisReady } = useEvidenceStrength();
  const subject = keyPhrase(thought);

  const strong = hypotheses.filter((h) => h.confidence >= 55);
  const weak = hypotheses.filter((h) => h.confidence < 35);
  const supporting = research.filter((r) => r.stance === "supports");
  const against = research.filter((r) => r.stance === "challenges");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Stage 05 · Thesis"
        title="The argument, as it stands today."
        lede="Not a pitch deck. A position you can defend, with the weak parts left visible on purpose."
        action={
          <Pill tone={thesisReady ? "moss" : "clay"}>
            {thesisReady ? "Defensible" : "Not yet defensible"}
          </Pill>
        }
      />

      <LoopStrip current="thesis" />

      <Panel tone="ink" className="p-8">
        <Eyebrow className="opacity-70">Thesis</Eyebrow>
        <p className="mt-3 font-display text-3xl leading-snug tracking-tight">
          {strong.length
            ? `Because ${strong[0].statement.replace(/\.$/, "").toLowerCase()}, there is room to build around ${subject} — provided the ${weak.length ? weak[0].statement.replace(/\.$/, "").toLowerCase() : "supply side"} problem is solved first.`
            : `There is a plausible product around ${subject}, but nothing in the evidence yet earns the right to build it.`}
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed opacity-80">
          {tested} of {total} hypotheses carry evidence, averaging {avg}% confidence.{" "}
          {supporting.length} findings support the direction, {against.length} actively push against
          it. The thesis is only as strong as the weakest claim it depends on.
        </p>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel>
          <Eyebrow>What we now believe</Eyebrow>
          <ul className="mt-4 space-y-4">
            {strong.length ? (
              strong.map((h) => (
                <li key={h.id}>
                  <p className="text-sm font-semibold leading-snug">{h.statement}</p>
                  <div className="mt-2">
                    <ConfidenceMeter value={h.confidence} />
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">
                Nothing has cleared 55% yet. Go back and run a test.
              </li>
            )}
          </ul>
        </Panel>

        <Panel>
          <Eyebrow>What could still kill it</Eyebrow>
          <ul className="mt-4 space-y-4">
            {weak.map((h) => (
              <li key={h.id}>
                <p className="text-sm font-semibold leading-snug">{h.statement}</p>
                <div className="mt-2">
                  <ConfidenceMeter value={h.confidence} />
                </div>
              </li>
            ))}
            {unknowns.slice(0, 2).map((u) => (
              <li key={u} className="text-sm text-muted-foreground">
                Unknown · {u}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel tone="sand">
        <Eyebrow>What this commits us to build</Eyebrow>
        <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <li>· The narrowest slice that proves the weakest claim, not the full platform.</li>
          <li>· A vetting rubric visible to both sides before anyone commits time.</li>
          <li>· Accountability built into the workflow, since evidence says drop-off is the risk.</li>
          <li>· One vertical until density is real.</li>
        </ul>
      </Panel>

      <Link
        to="/workspace/build"
        className="inline-flex rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-cream"
      >
        Turn the thesis into a build plan →
      </Link>
    </div>
  );
}
