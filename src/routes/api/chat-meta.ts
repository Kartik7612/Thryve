import { createFileRoute } from "@tanstack/react-router";

const ENDPOINT = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-5.6-sol";

const INSTRUCTIONS = `You name and recap a THRYVE chat. Reply with ONLY a JSON object, no other text:
{"title": "chat name, 2-6 words, specific and concrete, no quotes", "recap": ["bullet 1", "bullet 2"]}
Title rules: describe what the chat is actually about (topic + intent). Never "Chat", "Conversation" or "New chat".
Recap rules: 3-5 bullets, each max 16 words, covering what was asked, the key findings or conclusions, decisions made, and anything still open. Plain text, no markdown syntax, no bullet characters.`;

type Meta = { title?: string; recap?: string[] | string };

export const Route = createFileRoute("/api/chat-meta")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing AI key", { status: 500 });

        const body = (await request.json().catch(() => ({}))) as { text?: string };
        const text = (body.text ?? "").slice(0, 12000);
        if (!text.trim()) return Response.json({ error: "Nothing to summarize" }, { status: 400 });

        try {
          const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
              "X-Lovable-AIG-SDK": "fetch",
            },
            signal: request.signal,
            body: JSON.stringify({
              model: MODEL,
              store: false,
              instructions: INSTRUCTIONS,
              input: `CONVERSATION:\n${text}`,
              reasoning: { effort: "low" },
              text: { format: { type: "json_object" } },
            }),
          });
          if (!res.ok) return Response.json({ error: "AI unavailable" }, { status: 502 });

          const data = (await res.json()) as {
            output_text?: string;
            output?: { content?: { type?: string; text?: string }[] }[];
          };
          const raw =
            data.output_text ??
            (data.output ?? [])
              .flatMap((o) => o.content ?? [])
              .filter((c) => c.type === "output_text")
              .map((c) => c.text ?? "")
              .join("");
          const parsed = JSON.parse(raw) as Meta;

          const title = typeof parsed.title === "string" ? parsed.title.replace(/^["']|["']$/g, "").trim().slice(0, 80) : "";
          const bullets = Array.isArray(parsed.recap)
            ? parsed.recap
            : typeof parsed.recap === "string"
              ? [parsed.recap]
              : [];
          const recap = bullets
            .filter((b) => typeof b === "string" && b.trim())
            .map((b) => b.replace(/^[-•*\d.)\s]+/, "").trim().slice(0, 160))
            .filter(Boolean)
            .slice(0, 6)
            .join("\n");

          return Response.json({ title, recap });
        } catch {
          return Response.json({ error: "AI unavailable" }, { status: 502 });
        }
      },
    },
  },
});
