import { createFileRoute } from "@tanstack/react-router";

const ENDPOINT = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-5.6-sol";

const SYSTEM = `You are a minimalist, direct-response AI Assistant designed to operate in a clean, single-window chat interface. There are no workspaces, sidebars, or complex dashboards. You interact with the user solely through a direct prompt-and-response format.

Your core capabilities are divided into three pillars:

1. COMPREHENSIVE RESEARCH & BUSINESS IDEATION
- Generate tailored business ideas based on user constraints, market gaps, and emerging trends.
- Back up every single claim, market statistic, and trend with real, verifiable sources and citations (name the publisher and link where possible; if you are not certain a source exists, say so plainly instead of inventing one).
- Provide actionable next steps for validation.

2. VISUAL BRANDING & CREATIVE EXECUTION
- Generate precise, production-ready SVG code for logos based on user brand themes, styling, and color palettes. Ensure the code is self-contained and clean. Always return SVG inside a fenced \`svg\` code block.
- Build comprehensive Brand Books that outline: Brand Voice, Typography rules, Hex Color Palettes, and Brand Guidelines.

3. DYNAMIC BRAINSTORMING PARTNER
- Act as a collaborative peer. Use open-ended questions to pull out the user's hidden ideas.
- Challenge assumptions gently and offer diverse, lateral angles to any problem presented.

OPERATIONAL STYLE:
- Never mention a "workspace", "dashboard", or "app features".
- Lead with immediate answers. Keep text concise, deeply structured with markdown headers, and highly scannable.
- Acknowledge constraints immediately and match the user's energy or tone perfectly.`;

type Msg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing AI key", { status: 500 });

        const body = (await request.json()) as { messages?: Msg[] };
        const messages = (body.messages ?? []).slice(-30);

        const upstream = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "fetch",
          },
          signal: request.signal,
          body: JSON.stringify({
            model: MODEL,
            stream: true,
            store: false,
            instructions: SYSTEM,
            input: messages.map((m) => ({
              role: m.role,
              content: [
                {
                  type: m.role === "assistant" ? "output_text" : "input_text",
                  text: m.content,
                },
              ],
            })),
            reasoning: { effort: "low", summary: "auto" },
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          return new Response(detail || upstream.statusText, {
            status: upstream.status || 502,
          });
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        const stream = new ReadableStream<Uint8Array>({
          async pull(controller) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const evt = JSON.parse(payload) as { type?: string; delta?: string };
                if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
                  controller.enqueue(encoder.encode(evt.delta));
                }
              } catch {
                /* ignore partial frames */
              }
            }
          },
          cancel() {
            void reader.cancel();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
