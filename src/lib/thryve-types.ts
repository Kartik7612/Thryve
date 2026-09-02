export type SignalKind =
  | "idea"
  | "problem"
  | "assumption"
  | "opportunity"
  | "question"
  | "user"
  | "contradiction"
  | "direction";

export type Signal = {
  id: string;
  kind: SignalKind;
  text: string;
};

export type BranchCategory =
  | "Core Problem"
  | "Target Users"
  | "Possible Solutions"
  | "Alternative Directions"
  | "Risks"
  | "Unanswered Questions"
  | "Potential Differentiators";

export type Branch = {
  id: string;
  category: BranchCategory;
  text: string;
  note?: string;
  challenged?: boolean;
};

export type EvidenceStance = "supports" | "challenges" | "inconclusive";

export type ResearchNote = {
  id: string;
  title: string;
  detail: string;
  source: string;
  stance: EvidenceStance;
  answers?: string;
};

export type Competitor = {
  id: string;
  name: string;
  approach: string;
  gap: string;
};

export type ValidationMethod =
  | "Survey"
  | "Interview"
  | "Landing-page test"
  | "Prototype test"
  | "User feedback"
  | "Market experiment";

export type HypothesisEvidence = {
  id: string;
  method: ValidationMethod;
  result: string;
  stance: EvidenceStance;
};

export type Hypothesis = {
  id: string;
  statement: string;
  fromAssumption: string;
  confidence: number;
  methods: ValidationMethod[];
  evidence: HypothesisEvidence[];
};

export type Feedback = {
  id: string;
  who: string;
  quote: string;
  sentiment: "positive" | "negative" | "mixed";
};

export type TestScenario = {
  id: string;
  title: string;
  goal: string;
  successMetric: string;
  failurePoint: string;
};

export type LoopStage =
  | "think"
  | "research"
  | "validate"
  | "build"
  | "test"
  | "learn";

export type ActivityEntry = {
  id: string;
  stage: LoopStage;
  text: string;
  at: string;
};
