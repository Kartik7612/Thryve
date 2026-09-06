import { createFileRoute } from "@tanstack/react-router";
import { ChatApp } from "@/components/ChatApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "THRYVE — Research, branding and brainstorming in one prompt" },
      {
        name: "description",
        content:
          "Ask one question and get sourced business research, production-ready logo SVGs, full brand books, and a sharp brainstorming partner.",
      },
      { property: "og:title", content: "THRYVE — One prompt. Real answers." },
      {
        property: "og:description",
        content:
          "Sourced business ideas, logo SVGs, brand books and lateral brainstorming — from a single chat box.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatApp,
});
