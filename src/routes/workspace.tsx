import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LOOP_STAGES, LoopRail } from "@/components/thryve/loop";
import { ThryveProvider, useThryve } from "@/lib/thryve-store";
import { Pill } from "@/components/thryve/primitives";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — THRYVE" },
      {
        name: "description",
        content:
          "The THRYVE workspace: think, brainstorm, research, validate, write a thesis, build and test in one loop.",
      },
      { property: "og:title", content: "Workspace — THRYVE" },
      {
        property: "og:description",
        content: "Move a rough idea through the THRYVE loop, from raw thought to tested build.",
      },
    ],
  }),
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <ThryveProvider>
      <Shell />
    </ThryveProvider>
  );
}

function Shell() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 lg:px-8">
        <aside className="sticky top-6 hidden h-fit w-60 shrink-0 lg:block">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight">
            THRYVE
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Think it. Prove it. Build it.</p>
          <div className="mt-6">
            <LoopRail />
          </div>
          <div className="mt-8 space-y-2">
            <button
              onClick={() => setOpen(true)}
              className="w-full rounded-full border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-sand"
            >
              Jump to… <span className="float-right font-mono">⌘K</span>
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              className="w-full rounded-full border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-sand"
            >
              {dark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <MobileNav onOpen={() => setOpen(true)} />
          <Outlet />
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-28 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="border-b border-border px-5 py-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Go to stage
            </p>
            <ul className="p-2">
              {LOOP_STAGES.map((s) => (
                <li key={s.key}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: s.to });
                    }}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-sand"
                  >
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-xs text-muted-foreground">{s.blurb}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileNav({ onOpen }: { onOpen: () => void }) {
  const { activity } = useThryve();
  return (
    <div className="mb-6 flex items-center justify-between lg:hidden">
      <Link to="/" className="font-display text-lg font-semibold tracking-tight">
        THRYVE
      </Link>
      <div className="flex items-center gap-2">
        <Pill tone="quiet">{activity.length} events</Pill>
        <button
          onClick={onOpen}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
        >
          Stages
        </button>
      </div>
    </div>
  );
}
