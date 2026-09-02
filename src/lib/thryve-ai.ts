import type {
  Branch,
  BranchCategory,
  Hypothesis,
  Signal,
  SignalKind,
} from "./thryve-types";

export const uid = () => Math.random().toString(36).slice(2, 10);

const clean = (s: string) => s.trim().replace(/\s+/g, " ");

function sentences(input: string): string[] {
  return clean(input)
    .split(/(?<=[.!?;])\s+|\n+/)
    .map(clean)
    .filter((s) => s.length > 3);
}

const QUESTION_HINTS = ["who", "what", "how", "why", "when", "where", "should", "could", "would", "?"];
const ASSUMPTION_HINTS = ["i think", "probably", "i assume", "should be", "obviously", "surely", "must", "i believe", "likely"];
const PROBLEM_HINTS = ["struggle", "hard", "difficult", "no way", "can't", "cannot", "broken", "waste", "lack", "missing", "pain", "fail"];
const OPPORTUNITY_HINTS = ["nobody", "no one", "gap", "opportunity", "could own", "untapped", "first"];
const USER_HINTS = ["student", "founder", "teacher", "team", "developer", "designer", "customer", "user", "org", "company", "people"];
const CONTRA_HINTS = [" but ", "however", "although", "though", "on the other hand"];

function classify(text: string): SignalKind {
  const t = ` ${text.toLowerCase()} `;
  const has = (list: string[]) => list.some((h) => t.includes(h));
  if (t.includes("?") || QUESTION_HINTS.slice(0, 6).some((h) => t.trimStart().startsWith(` ${h} `))) return "question";
  if (has(CONTRA_HINTS)) return "contradiction";
  if (has(ASSUMPTION_HINTS)) return "assumption";
  if (has(PROBLEM_HINTS)) return "problem";
  if (has(OPPORTUNITY_HINTS)) return "opportunity";
  if (has(USER_HINTS)) return "user";
  return "idea";
}

/**
 * Deterministic "reasoning" pass: extracts structured signals from an
 * unstructured brain-dump, then adds the reflective signals a co-founder
 * would raise (a question, a contradiction, an interesting direction).
 */
export function extractSignals(input: string): Signal[] {
  const parts = sentences(input);
  if (parts.length === 0) return [];

  const signals: Signal[] = parts.slice(0, 8).map((text) => ({
    id: uid(),
    kind: classify(text),
    text: text.charAt(0).toUpperCase() + text.slice(1),
  }));

  const subject = keyPhrase(input);
  const kinds = new Set(signals.map((s) => s.kind));

  if (!kinds.has("question")) {
    signals.push({
      id: uid(),
      kind: "question",
      text: `What would have to be true about ${subject} for this to work at all?`,
    });
  }
  if (!kinds.has("contradiction")) {
    signals.push({
      id: uid(),
      kind: "contradiction",
      text: `Demand and supply here pull apart: ${subject} only has value once the other side already exists.`,
    });
  }
  if (!kinds.has("assumption")) {
    signals.push({
      id: uid(),
      kind: "assumption",
      text: `You're assuming the people closest to ${subject} recognise it as a problem worth paying attention to.`,
    });
  }
  signals.push({
    id: uid(),
    kind: "direction",
    text: `Interesting direction: start with the narrowest slice of ${subject} where you can produce proof in two weeks.`,
  });

  return signals;
}

const STOP = new Set([
  "i","have","a","an","the","for","that","this","to","of","and","is","it","in","on","with","my","we","are","be","but","not","idea","rough","about","think","thinking","really","just","some","platform","help","helps",
]);

export function keyPhrase(input: string): string {
  const words = clean(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(" ")
    .filter((w) => w.length > 3 && !STOP.has(w));
  const top = words.slice(0, 3);
  return top.length ? top.join(" ") : "this idea";
}

const CATEGORIES: BranchCategory[] = [
  "Core Problem",
  "Target Users",
  "Possible Solutions",
  "Alternative Directions",
  "Risks",
  "Unanswered Questions",
  "Potential Differentiators",
];

export function generateBranches(input: string): Branch[] {
  const subject = keyPhrase(input);
  const templates: Record<BranchCategory, string[]> = {
    "Core Problem": [
      `The people affected by ${subject} have no reliable path to a solution today.`,
      `The work around ${subject} is done manually and invisibly, so nobody measures the cost.`,
    ],
    "Target Users": [
      `The person who feels ${subject} weekly — not the person who signs the cheque.`,
      `An adjacent group who currently improvises a workaround.`,
    ],
    "Possible Solutions": [
      `A thin coordination layer that makes ${subject} legible before anyone builds tooling.`,
      `An opinionated workflow that ships one outcome rather than a general platform.`,
    ],
    "Alternative Directions": [
      `Sell to the institution instead of the individual.`,
      `Narrow to a single vertical until density is real, then widen.`,
    ],
    Risks: [
      `Cold start: without a critical mass, ${subject} feels empty on day one.`,
      `The behaviour change required may be larger than the pain removed.`,
    ],
    "Unanswered Questions": [
      `Who pays, and out of which existing budget?`,
      `What is the smallest proof that would change your mind?`,
    ],
    "Potential Differentiators": [
      `Evidence attached to every claim, not a pitch.`,
      `Accountability built into the workflow rather than bolted on.`,
    ],
  };

  return CATEGORIES.flatMap((category) =>
    templates[category].map((text) => ({ id: uid(), category, text })),
  );
}

const CHALLENGES = [
  "If this disappeared tomorrow, what would people go back to — and why is that actually worse?",
  "The strongest version of the opposite argument: the pain is real but not frequent enough to build a habit around.",
  "This assumes the bottleneck is discovery. What if the bottleneck is trust?",
  "Two incumbents already touch this. Name the thing they structurally cannot copy.",
  "Your success case requires both sides to show up. Which side would you sacrifice if forced?",
  "What evidence would make you abandon this within a month? If none exists, this isn't falsifiable yet.",
];

export function challengeBranch(branch: Branch): string {
  const index = Math.abs(hash(branch.id + branch.text)) % CHALLENGES.length;
  return CHALLENGES[index];
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function hypothesisFromAssumption(text: string): Hypothesis {
  const statement = text
    .replace(/^you're assuming that /i, "")
    .replace(/^you're assuming /i, "")
    .replace(/^i (think|assume|believe) /i, "");
  return {
    id: uid(),
    statement: statement.charAt(0).toUpperCase() + statement.slice(1),
    fromAssumption: text,
    confidence: 25,
    methods: ["Interview", "Survey", "Landing-page test"],
    evidence: [],
  };
}

/** Confidence is a weighted read of the evidence attached to a hypothesis. */
export function recomputeConfidence(h: Hypothesis): number {
  if (h.evidence.length === 0) return Math.min(h.confidence, 30);
  const score = h.evidence.reduce((acc, e) => {
    if (e.stance === "supports") return acc + 22;
    if (e.stance === "challenges") return acc - 20;
    return acc + 2;
  }, 30);
  return Math.max(4, Math.min(96, Math.round(score)));
}

export function confidenceLabel(value: number): string {
  if (value >= 75) return "Strong";
  if (value >= 55) return "Leaning true";
  if (value >= 35) return "Unresolved";
  if (value >= 20) return "Weak";
  return "Likely false";
}
