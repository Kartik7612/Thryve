import { ExternalLink, Loader2, Scale, CheckCircle2, XCircle } from "lucide-react";

export type Guardrails = { do: string[]; dont: string[] };

function Skeleton({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

/** Parsed from a fenced ```guardrails JSON block the model emits at the top of research answers. */
export function GuardrailsBlock({ raw }: { raw: string }) {
  let data: Guardrails | null = null;
  try {
    const parsed = JSON.parse(raw) as Guardrails;
    if (parsed && Array.isArray(parsed.do) && Array.isArray(parsed.dont)) data = parsed;
  } catch {
    data = null; // still streaming or malformed
  }
  if (!data) return <Skeleton label="Laying out research guardrails…" />;
  return (
    <div className="rise my-4 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5">
        <p className="label-eyebrow">Research guardrails — do this, avoid that</p>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2">
        <ul className="space-y-2 bg-surface px-4 py-3">
          {data.do.slice(0, 6).map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <ul className="space-y-2 bg-surface px-4 py-3">
          {data.dont.slice(0, 6).map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export type ContradictionSource = { url?: string; methodology?: string; strength?: string };
export type ContradictionSide = { claim?: string; sources?: ContradictionSource[] };
export type Contradictions = {
  conflict?: boolean;
  disputed?: string;
  sides?: ContradictionSide[];
  methodology_differences?: string;
  resolve_with?: string;
};

const strengthTone = (s?: string) =>
  s === "high"
    ? "border-moss/50 text-moss"
    : s === "low"
      ? "border-destructive/40 text-destructive"
      : "border-border text-muted-foreground";

/** Parsed from a fenced ```contradictions JSON block emitted when evidence is divided. */
export function ContradictionsBlock({ raw }: { raw: string }) {
  let data: Contradictions | null = null;
  try {
    const parsed = JSON.parse(raw) as Contradictions;
    if (parsed && typeof parsed === "object") data = parsed;
  } catch {
    data = null;
  }
  if (!data) return <Skeleton label="Running the contradiction detector…" />;
  if (!data.conflict) return null;
  return (
    <div className="rise my-4 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Scale className="h-4 w-4 text-accent" />
        <p className="text-xs font-semibold uppercase tracking-wide">Contradiction detector</p>
      </div>
      {data.disputed ? (
        <p className="px-4 pt-3 text-sm">
          <span className="font-semibold">Disputed: </span>
          {data.disputed}
        </p>
      ) : null}
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        {(data.sides ?? []).map((side, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3">
            <p className="text-sm font-medium">{side.claim}</p>
            <ul className="mt-2 space-y-2">
              {(side.sources ?? []).map((s, j) => (
                <li key={j} className="text-xs text-muted-foreground">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="break-all text-moss underline-offset-2 hover:underline"
                    >
                      {s.url.replace(/^https?:\/\//, "").slice(0, 70)}
                      <ExternalLink className="ml-1 inline h-3 w-3" />
                    </a>
                  ) : null}
                  {s.methodology ? <span className="mt-0.5 block">Method: {s.methodology}</span> : null}
                  {s.strength ? (
                    <span
                      className={`mt-1 inline-block rounded-full border px-2 py-0.5 ${strengthTone(s.strength)}`}
                    >
                      Evidence strength: {s.strength}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {data.methodology_differences ? (
        <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Why sources disagree: </span>
          {data.methodology_differences}
        </p>
      ) : null}
      {data.resolve_with ? (
        <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">What would settle it: </span>
          {data.resolve_with}
        </p>
      ) : null}
    </div>
  );
}
