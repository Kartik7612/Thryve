import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ThoughtInput = z.object({ thought: z.string().min(1).max(6000) });

const CO_FOUNDER = `You are THRYVE — an AI co-founder, not an assistant.
You are sceptical, specific and allergic to generic startup advice.
You never flatter. You name what is actually being claimed, what is being
assumed without evidence, and where the reasoning contradicts itself.
Write in plain, concrete language. No emojis, no bullet symbols in the text
fields, no hedging filler. Every line must be something the founder could act on
or argue with.`;

const SIGNAL_KINDS = [
  "problem",
  "opportunity",
  "assumption",
  "question",
  "contradiction",
  "user",
  "idea",
  "direction",
] as const;

const CATEGORIES = [
  "Core Problem",
  "Target Users",
  "Possible Solutions",
  "Alternative Directions",
  "Risks",
  "Unanswered Questions",
  "Potential Differentiators",
] as const;

export const analyzeThought = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ThoughtInput.parse(data))
  .handler(async ({ data }) => {
    const { generateJson } = await import("./ai-gateway.server");
    const result = await generateJson<{
      signals: { kind: (typeof SIGNAL_KINDS)[number]; text: string }[];
    }>({
      instructions: `${CO_FOUNDER}

Read the founder's raw brain-dump and extract the signals hiding inside it.
Return 6 to 10 signals. Always include at least one assumption, one question
the founder has not asked themselves, and one contradiction or tension in the
thinking. Each text is one sentence, under 30 words, referring to the specifics
of their idea rather than startups in general.`,
      input: data.thought,
      schemaName: "thryve_signals",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["signals"],
        properties: {
          signals: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["kind", "text"],
              properties: {
                kind: { type: "string", enum: [...SIGNAL_KINDS] },
                text: { type: "string" },
              },
            },
          },
        },
      },
    });
    return result.signals.slice(0, 12);
  });

export const expandBranches = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ThoughtInput.parse(data))
  .handler(async ({ data }) => {
    const { generateJson } = await import("./ai-gateway.server");
    const result = await generateJson<{
      branches: { category: (typeof CATEGORIES)[number]; text: string }[];
    }>({
      instructions: `${CO_FOUNDER}

Branch the founder's idea into the directions it could actually go.
Produce exactly two branches for each of these categories: ${CATEGORIES.join(", ")}.
Each branch is one concrete, falsifiable sentence under 32 words, specific to
this idea. Alternative Directions must genuinely conflict with the obvious plan.`,
      input: data.thought,
      schemaName: "thryve_branches",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["branches"],
        properties: {
          branches: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["category", "text"],
              properties: {
                category: { type: "string", enum: [...CATEGORIES] },
                text: { type: "string" },
              },
            },
          },
        },
      },
    });
    return result.branches;
  });

const ChallengeInput = z.object({
  thought: z.string().max(6000),
  branch: z.string().min(1).max(1000),
});

export const challengeBranchAI = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChallengeInput.parse(data))
  .handler(async ({ data }) => {
    const { generateJson } = await import("./ai-gateway.server");
    const result = await generateJson<{ counter: string }>({
      instructions: `${CO_FOUNDER}

Write the single strongest counter-argument to the branch below — the version a
sharp investor or a competitor would use. Two sentences maximum. End with the
specific evidence that would settle the disagreement.`,
      input: `Idea context: ${data.thought}\n\nBranch to challenge: ${data.branch}`,
      schemaName: "thryve_challenge",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["counter"],
        properties: { counter: { type: "string" } },
      },
    });
    return result.counter;
  });
