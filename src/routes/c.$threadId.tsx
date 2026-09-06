import { createFileRoute } from "@tanstack/react-router";
import { ChatApp } from "@/components/ChatApp";

export const Route = createFileRoute("/c/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat — THRYVE" },
      {
        name: "description",
        content:
          "Continue a THRYVE conversation: sourced market research, business ideas, logo SVGs and brand books in one chat.",
      },
      { property: "og:title", content: "Chat — THRYVE" },
      {
        property: "og:description",
        content: "Pick up a saved THRYVE conversation right where you left it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { threadId } = Route.useParams();
  return <ChatApp key={threadId} threadId={threadId} />;
}
