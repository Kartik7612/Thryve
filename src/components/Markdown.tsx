import { memo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  const el = node as { props?: { children?: ReactNode } };
  return el.props ? textOf(el.props.children) : "";
}

function CodeBlock({ children, className }: { children: ReactNode; className?: string | undefined }) {
  const code = textOf(children).replace(/\n$/, "");
  const lang = /language-(\w+)/.exec(className ?? "")?.[1] ?? "";
  const [copied, setCopied] = useState(false);
  const isSvg = lang === "svg" || code.trimStart().startsWith("<svg");

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {lang || "code"}
        </span>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {isSvg ? (
        <div
          className="grid place-items-center border-b border-border bg-card p-6 [&>svg]:max-h-40 [&>svg]:w-auto"
          // Rendered SVG comes from the assistant's own code block, shown as a live preview.
          dangerouslySetInnerHTML={{ __html: code }}
        />
      ) : null}
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <div className="text-[0.95rem] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mt-6 mb-3 font-display text-2xl tracking-tight" {...p} />,
          h2: (p) => <h2 className="mt-6 mb-2 font-display text-xl tracking-tight" {...p} />,
          h3: (p) => <h3 className="mt-5 mb-2 font-semibold" {...p} />,
          p: (p) => <p className="my-3" {...p} />,
          ul: (p) => <ul className="my-3 list-disc space-y-1.5 pl-5" {...p} />,
          ol: (p) => <ol className="my-3 list-decimal space-y-1.5 pl-5" {...p} />,
          strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
          a: (p) => (
            <a
              className="text-moss underline underline-offset-4 hover:opacity-80"
              target="_blank"
              rel="noreferrer noopener"
              {...p}
            />
          ),
          blockquote: (p) => (
            <blockquote className="my-4 border-l-2 border-moss/50 pl-4 text-muted-foreground" {...p} />
          ),
          hr: () => <hr className="my-6 border-border" />,
          table: (p) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm" {...p} />
            </div>
          ),
          th: (p) => <th className="border-b border-border px-3 py-2 text-left font-semibold" {...p} />,
          td: (p) => <td className="border-b border-border/60 px-3 py-2 align-top" {...p} />,
          code: ({ className, children, ...rest }) => {
            const isBlock = typeof className === "string" && className.includes("language-");
            const raw = textOf(children);
            if (isBlock || raw.includes("\n")) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code className="rounded bg-surface px-1.5 py-0.5 text-[0.85em]" {...rest}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
