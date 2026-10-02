import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — THRYVE" },
      { name: "description", content: "Your THRYVE projects." },
      { property: "og:title", content: "Projects — THRYVE" },
      { property: "og:description", content: "Your THRYVE projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="grid min-h-screen place-items-center bg-background px-5 text-center">
      <div>
        <h1 className="font-display text-3xl">Projects</h1>
        <p className="mt-2 text-sm text-muted-foreground">The full project area is coming next.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent">Back to chat</Link>
      </div>
    </div>
  ),
});
