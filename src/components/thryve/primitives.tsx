import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { confidenceLabel } from "@/lib/thryve-ai";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("label-eyebrow", className)}>{children}</p>;
}

export function Panel({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "sand" | "ink";
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-6",
        tone === "default" && "border-border bg-card/60",
        tone === "sand" && "border-transparent bg-sand",
        tone === "ink" && "border-transparent bg-ink text-cream",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  action,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  action?: ReactNode;
}) {
  return (
    <header className="rise flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight">{title}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">{lede}</p>
      </div>
      {action}
    </header>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const tone = value >= 55 ? "bg-moss" : value >= 35 ? "bg-clay" : "bg-destructive";
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{confidenceLabel(value)}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
        <div className={cn("meter h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = "quiet",
  className,
}: {
  children: ReactNode;
  tone?: "quiet" | "moss" | "clay" | "solid";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tone === "quiet" && "bg-sand text-mossdark",
        tone === "moss" && "bg-moss/15 text-mossdark",
        tone === "clay" && "bg-clay/20 text-foreground",
        tone === "solid" && "bg-ink text-cream",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/30 px-6 py-14 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-full bg-sand">
        <span className="size-3 rounded-full bg-moss" />
      </div>
      <p className="mt-4 font-display text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{hint}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
