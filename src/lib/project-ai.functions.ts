import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ACTIONS = {
  brainstorm:
    'Generate 5 genuinely different approaches. items[].kind="idea"; content = concept, target user, why it could work, biggest risk (Markdown).',
  structure:
    'Structured thinking. items[].kind="insight" with titles exactly: Goal, Assumptions, Constraints, Options, Risks, Next steps.',
  challenge:
    'Critique hard. items[].kind="insight" titles prefixed "Weakness:", "Assumption:", "Counterargument:" or "Question:". Be honest, no padding.',
  debate:
    'Six independent perspectives then synthesis. items[].kind="perspective", titles exactly Creator, Skeptic, Customer, Competitor, Researcher, Investor, Synthesis.',
  verify:
    'Identify each factual claim in the input/project. items[].kind="claim"; confidence one of high|medium|low; metadata.status one of VERIFIED|SUPPORTED|PLAUSIBLE|UNCERTAIN|CONTRADICTED|UNVERIFIABLE; content: supporting vs conflicting evidence, source quality, real URLs only or say "I could not verify this."',
  research:
    'Structured research. items[].kind="research"; metadata.category one of fact|trend|competitor|opportunity|gap; confidence high|medium|low; include real source URLs in content only when you are confident they exist.',
  decide:
    'Compare the options in the input against the criteria in the input (or sensible ones). items[].kind="decision"; one item per option with content: score table vs criteria, pros, cons, risks, assumptions, unanswered questions; final item titled "Recommendation".',
  plan:
    'Action plan. Return tasks[] (6-12) with title, description, priority high|medium|low, milestone name, dependencies (titles of other tasks). items may be empty.',
  extract:
    'Extract from the conversation text in the input. items[].kind one of idea|decision|insight|research|question; tasks[] for action items.',
  evolve:
    'Rewrite the given idea as an improved next version based on the instruction. Return exactly one item kind="idea" and metadata.change_reason explaining what changed and why.',
} as const;

const Input = z.object({
  projectId: z.string().uuid(),
  action: z.enum(Object.keys(ACTIONS) as [keyof typeof ACTIONS, ...(keyof typeof ACTIONS)[]]),
  input: z.string().max(20000).default(""),
  itemId: z.string().uuid().optional(),
});

type AIItem = {
  kind: string;
  title: string;
  content: string;
  confidence?: string | null;
  metadata?: Record<string, unknown>;
};
type AITask = {
  title: string;
  description?: string;
  priority?: string;
  milestone?: string;
  dependencies?: string[];
};

export const runProjectAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured.");
    const sb = context.supabase;

    const { data: project, error: pe } = await sb
      .from("projects")
      .select("*")
      .eq("id", data.projectId)
      .single();
    if (pe || !project) throw new Error("Project not found.");
    const { data: items } = await sb
      .from("project_items")
      .select("kind,title,content,status")
      .eq("project_id", data.projectId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(40);

    let base: { title: string; content: string; version: number; id: string; parent_id: string | null } | null =
      null;
    if (data.itemId) {
      const { data: it } = await sb
        .from("project_items")
        .select("id,title,content,version,parent_id")
        .eq("id", data.itemId)
        .single();
      base = it;
    }

    const ctx = [
      `Project: ${project.name}`,
      `Goal: ${project.goal}`,
      `Stage: ${project.stage}`,
      `Context: ${JSON.stringify(project.context)}`,
      ...(items ?? []).map((i) => `- [${i.kind}] ${i.title}: ${i.content.slice(0, 300)}`),
    ].join("\n");

    const prompt = [
      `TASK: ${ACTIONS[data.action]}`,
      `Return ONLY JSON: {"items":[{"kind","title","content","confidence","metadata"}],"tasks":[{"title","description","priority","milestone","dependencies"}]}.`,
      "Be evidence-first: separate facts, assumptions, inference and speculation. Never invent citations.",
      `PROJECT CONTEXT:\n${ctx}`,
      base ? `IDEA TO EVOLVE (v${base.version}): ${base.title}\n${base.content}` : "",
      data.input ? `USER INPUT:\n${data.input}` : "",
    ].join("\n\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        store: false,
        input: prompt,
        reasoning: { effort: "low" },
        text: { format: { type: "json_object" } },
      }),
    });
    if (!res.ok) {
      if (res.status === 402) throw new Error("AI credits have run out. Add credits to continue.");
      if (res.status === 429) throw new Error("Too many requests — wait a moment and try again.");
      throw new Error("The AI request failed. Try again.");
    }
    const json = (await res.json()) as {
      output_text?: string;
      output?: { content?: { type?: string; text?: string }[] }[];
    };
    const text =
      json.output_text ??
      (json.output ?? [])
        .flatMap((o) => o.content ?? [])
        .filter((c) => c.type === "output_text")
        .map((c) => c.text ?? "")
        .join("");
    let parsed: { items?: AIItem[]; tasks?: AITask[] } = {};
    try {
      parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    } catch {
      throw new Error("The AI returned an unreadable answer. Try again.");
    }

    const rows = (parsed.items ?? []).slice(0, 20).map((i) => ({
      project_id: data.projectId,
      owner_id: context.userId,
      kind: String(i.kind || "insight").slice(0, 40),
      title: String(i.title || "Untitled").slice(0, 300),
      content: String(i.content || ""),
      confidence: i.confidence ? String(i.confidence).toLowerCase() : null,
      metadata: { ...(i.metadata ?? {}), source: data.action } as never,
      ...(base
        ? {
            parent_id: base.parent_id ?? base.id,
            version: base.version + 1,
            change_reason: String(i.metadata?.["change_reason"] ?? data.input ?? "").slice(0, 1000),
          }
        : {}),
    }));
    if (base && rows.length) {
      await sb.from("project_items").update({ status: "superseded" }).eq("id", base.id);
    }
    if (rows.length) {
      const { error } = await sb.from("project_items").insert(rows);
      if (error) throw new Error(error.message);
    }
    const tasks = (parsed.tasks ?? []).slice(0, 20).map((t) => ({
      project_id: data.projectId,
      owner_id: context.userId,
      title: String(t.title || "Task").slice(0, 300),
      description: String(t.description || ""),
      priority: ["high", "medium", "low"].includes(String(t.priority)) ? String(t.priority) : "medium",
      milestone: t.milestone ? String(t.milestone) : null,
      dependencies: (Array.isArray(t.dependencies) ? t.dependencies.map(String) : []) as never,
    }));
    if (tasks.length) {
      const { error } = await sb.from("tasks").insert(tasks);
      if (error) throw new Error(error.message);
    }
    return { items: rows.length, tasks: tasks.length };
  });
