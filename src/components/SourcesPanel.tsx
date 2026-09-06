import { ExternalLink } from "lucide-react";

export type Source = { url: string; host: string; label: string };

export function extractSources(text: string): Source[] {
  const found = new Map<string, Source>();
  const re = /https?:\/\/[^\s)<>\]"']+/g;
  for (const raw of text.match(re) ?? []) {
    const url = raw.replace(/[.,;:]+$/, "");
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");
      if (!found.has(url)) {
        found.set(url, {
          url,
          host,
          label: host.split(".").slice(0, -1).join(".") || host,
        });
      }
    } catch {
      /* skip */
    }
  }
  return [...found.values()];
}

export function SourcesPanel({ sources }: { sources: Source[] }) {
  return (
    <aside className="hidden w-72 shrink-0 border-l border-border/60 lg:block">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6">
        <p className="label-eyebrow">Sources</p>
        {sources.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Links referenced in answers appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sources.map((s, i) => (
              <li key={s.url} className="rise" style={{ animationDelay: `${i * 40}ms` }}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 transition-colors hover:border-accent/60"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?sz=64&domain=${s.host}`}
                    alt=""
                    width={16}
                    height={16}
                    loading="lazy"
                    className="h-4 w-4 shrink-0 rounded"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{s.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {s.host}
                    </span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
