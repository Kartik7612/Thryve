import { createFileRoute } from "@tanstack/react-router";

const ENDPOINT = "https://ai.gateway.lovable.dev/v1/audio/transcriptions";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing AI key", { status: 500 });

        const form = await request.formData();
        const file = form.get("audio");
        if (!(file instanceof File) || file.size < 2048) {
          return new Response("That recording was empty — please try again.", { status: 400 });
        }
        if (file.size > 20 * 1024 * 1024) {
          return new Response("That recording is too long.", { status: 413 });
        }

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-transcribe");
        upstream.append("file", file, "recording.wav");

        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return new Response(detail || res.statusText, { status: res.status });
        }

        const data = (await res.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
