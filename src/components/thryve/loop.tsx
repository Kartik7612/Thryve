import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const LOOP_STAGES = [
  { key: "think", label: "Think", to: "/workspace", blurb: "Dump raw, unstructured thoughts." },
  { key: "brainstorm", label: "Brainstorm", to: "/workspace/brainstorm", blurb: "Branch it, challenge it, refine it." },
  { key: "research", label: "Research", to: "/workspace/research", blurb: "Answer the questions you found." },
  { key: "validate", label: "Validate", to: "/workspace/validate", blurb: "Turn guesses into testable bets." },
  { key: "thesis", label: "Thesis", to: "/workspace/thesis", blurb: "A living argument for the product." },
  { key: "build", label: "Build", to: "/workspace/build", blurb: "Thesis becomes a real product." },
  { key: "test", label: "Test", to: "/workspace/test", blurb: "Put it in front of real people." },
] as const;

export function LoopRail() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="THRYVE core loop" className="flex flex-col gap-1">
      {LOOP_STAGES.map((stage, i) => {
        const active =
          stage.to === "/workspace" ? pathname === "/workspace" : pathname === stage.to;
        return (
          <div key={stage.key} className="relative">
            <Link
              to={stage.to}
              className={cn(
                "group flex items-center gap-3 rounded-full px-3 py-2 transition-colors",
                active ? "bg-sand text-foreground" : "text-muted-foreground hover:bg-sand/60 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors",
                  active ? "bg-moss text-cream" : "bg-sand text-mossdark group-hover:bg-moss/25",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-semibold tracking-tight">{stage.label}</span>
            </Link>
            {i < LOOP_STAGES.length - 1 ? (
              <span aria-hidden className="ml-[23px] block h-2 w-px bg-border" />
            ) : null}
          </div>
        );
      })}
      <div className="ml-[23px] mt-1 flex items-center gap-2 text-[11px] italic text-muted-foreground">
        <span aria-hidden>↺</span> then think again
      </div>
    </nav>
  );
}

export function LoopStrip({ current }: { current?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
      {LOOP_STAGES.map((s, i) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <Link
            to={s.to}
            className={cn(
              "rounded-full px-2.5 py-1 transition-colors",
              current === s.key ? "bg-moss text-cream" : "bg-sand/70 text-mossdark hover:bg-sand",
            )}
          >
            {s.label}
          </Link>
          {i < LOOP_STAGES.length - 1 ? <span className="text-muted-foreground">→</span> : <span className="text-muted-foreground">↺</span>}
        </span>
      ))}
    </div>
  );
}
