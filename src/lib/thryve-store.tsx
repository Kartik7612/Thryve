import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  challengeBranch,
  extractSignals,
  generateBranches,
  hypothesisFromAssumption,
  recomputeConfidence,
  uid,
} from "./thryve-ai";
import { analyzeThought, challengeBranchAI, expandBranches } from "./thryve-ai.functions";
import {
  SEED_THOUGHT,
  seedActivity,
  seedBranches,
  seedCompetitors,
  seedFeedback,
  seedHypotheses,
  seedNextInvestigations,
  seedResearch,
  seedScenarios,
  seedSignals,
  seedUnknowns,
} from "./thryve-data";
import type {
  ActivityEntry,
  Branch,
  BranchCategory,
  EvidenceStance,
  Feedback,
  Hypothesis,
  LoopStage,
  ResearchNote,
  Signal,
  ValidationMethod,
} from "./thryve-types";

const STORAGE_KEY = "thryve:state:v1";
export const PENDING_KEY = "thryve:pending-thought";

type State = {
  thought: string;
  signals: Signal[];
  branches: Branch[];
  research: ResearchNote[];
  unknowns: string[];
  nextInvestigations: string[];
  hypotheses: Hypothesis[];
  feedback: Feedback[];
  activity: ActivityEntry[];
  buildStarted: boolean;
};

const initialState: State = {
  thought: SEED_THOUGHT,
  signals: seedSignals,
  branches: seedBranches,
  research: seedResearch,
  unknowns: seedUnknowns,
  nextInvestigations: seedNextInvestigations,
  hypotheses: seedHypotheses,
  feedback: seedFeedback,
  activity: seedActivity,
  buildStarted: false,
};

type Store = State & {
  competitors: typeof seedCompetitors;
  scenarios: typeof seedScenarios;
  thinking: boolean;
  aiError: string | null;
  challengingId: string | null;
  submitThought: (text: string) => void;
  addBranch: (category: BranchCategory, text: string) => void;
  updateBranch: (id: string, text: string) => void;
  removeBranch: (id: string) => void;
  mergeBranches: (ids: string[]) => void;
  challenge: (id: string) => void;
  promoteToHypothesis: (signalId: string) => void;
  addEvidence: (
    hypothesisId: string,
    method: ValidationMethod,
    result: string,
    stance: EvidenceStance,
  ) => void;
  addResearchNote: (note: Omit<ResearchNote, "id">) => void;
  addFeedback: (who: string, quote: string) => void;
  startBuild: () => void;
  logActivity: (stage: LoopStage, text: string) => void;
  reset: () => void;
};

const ThryveContext = createContext<Store | null>(null);

function errorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("429")) return "THRYVE is rate limited right now — try again in a moment.";
  if (raw.includes("402")) return "AI credits are exhausted for this workspace.";
  return "THRYVE couldn't reach its reasoning engine, so it fell back to local analysis.";
}

export function ThryveProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [thinking, setThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [challengingId, setChallengingId] = useState<string | null>(null);
  const hydrated = useRef(false);

  const logActivity = useCallback((stage: LoopStage, text: string) => {
    setState((s) => ({
      ...s,
      activity: [{ id: uid(), stage, text, at: "just now" }, ...s.activity].slice(0, 12),
    }));
  }, []);

  const submitThought = useCallback((text: string) => {
    const thought = text.trim();
    if (!thought) return;
    setThinking(true);
    setAiError(null);
    setState((s) => ({ ...s, thought }));

    void (async () => {
      let signals: Signal[];
      let branches: Branch[];
      try {
        const [rawSignals, rawBranches] = await Promise.all([
          analyzeThought({ data: { thought } }),
          expandBranches({ data: { thought } }),
        ]);
        signals = rawSignals.map((s) => ({ id: uid(), kind: s.kind, text: s.text }));
        branches = rawBranches.map((b) => ({ id: uid(), category: b.category, text: b.text }));
      } catch (err) {
        setAiError(errorMessage(err));
        signals = extractSignals(thought);
        branches = generateBranches(thought);
      }

      setState((s) => ({
        ...s,
        thought,
        signals,
        branches,
        activity: [
          {
            id: uid(),
            stage: "think" as LoopStage,
            text: `Read a new thought and extracted ${signals.length} signals`,
            at: "just now",
          },
          ...s.activity,
        ].slice(0, 12),
      }));
      setThinking(false);
    })();
  }, []);

  // Restore from this browser, then pick up a thought handed over by the landing page.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...initialState, ...(JSON.parse(saved) as Partial<State>) });
      const pending = window.localStorage.getItem(PENDING_KEY);
      if (pending?.trim()) {
        window.localStorage.removeItem(PENDING_KEY);
        submitThought(pending);
      }
    } catch {
      /* corrupted storage — keep the seed session */
    }
  }, [submitThought]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode */
    }
  }, [state]);

  const addBranch = useCallback((category: BranchCategory, text: string) => {
    if (!text.trim()) return;
    setState((s) => ({ ...s, branches: [...s.branches, { id: uid(), category, text: text.trim() }] }));
  }, []);

  const updateBranch = useCallback((id: string, text: string) => {
    setState((s) => ({
      ...s,
      branches: s.branches.map((b) => (b.id === id ? { ...b, text } : b)),
    }));
  }, []);

  const removeBranch = useCallback((id: string) => {
    setState((s) => ({ ...s, branches: s.branches.filter((b) => b.id !== id) }));
  }, []);

  const mergeBranches = useCallback((ids: string[]) => {
    if (ids.length < 2) return;
    setState((s) => {
      const picked = s.branches.filter((b) => ids.includes(b.id));
      if (picked.length < 2) return s;
      const merged: Branch = {
        id: uid(),
        category: picked[0].category,
        text: picked.map((b) => b.text.replace(/\.$/, "")).join(" — and — ") + ".",
      };
      const firstIndex = s.branches.findIndex((b) => b.id === picked[0].id);
      const rest = s.branches.filter((b) => !ids.includes(b.id));
      rest.splice(Math.max(firstIndex, 0), 0, merged);
      return { ...s, branches: rest };
    });
  }, []);

  const challenge = useCallback((id: string) => {
    setChallengingId(id);
    setState((current) => {
      const branch = current.branches.find((b) => b.id === id);
      if (branch) {
        void (async () => {
          let note: string;
          try {
            note = await challengeBranchAI({
              data: { thought: current.thought, branch: branch.text },
            });
          } catch {
            note = challengeBranch(branch);
          }
          setState((s) => ({
            ...s,
            branches: s.branches.map((b) => (b.id === id ? { ...b, challenged: true, note } : b)),
          }));
          setChallengingId(null);
        })();
      } else {
        setChallengingId(null);
      }
      return current;
    });
  }, []);

  const promoteToHypothesis = useCallback((signalId: string) => {
    setState((s) => {
      const signal = s.signals.find((x) => x.id === signalId);
      if (!signal) return s;
      if (s.hypotheses.some((h) => h.fromAssumption === signal.text)) return s;
      return {
        ...s,
        hypotheses: [...s.hypotheses, hypothesisFromAssumption(signal.text)],
        activity: [
          { id: uid(), stage: "validate" as LoopStage, text: "New hypothesis created from an assumption", at: "just now" },
          ...s.activity,
        ].slice(0, 12),
      };
    });
  }, []);

  const addEvidence = useCallback(
    (hypothesisId: string, method: ValidationMethod, result: string, stance: EvidenceStance) => {
      if (!result.trim()) return;
      setState((s) => ({
        ...s,
        hypotheses: s.hypotheses.map((h) => {
          if (h.id !== hypothesisId) return h;
          const next = {
            ...h,
            evidence: [...h.evidence, { id: uid(), method, result: result.trim(), stance }],
          };
          return { ...next, confidence: recomputeConfidence(next) };
        }),
        activity: [
          { id: uid(), stage: "validate" as LoopStage, text: `Recorded ${stance} evidence from a ${method.toLowerCase()}`, at: "just now" },
          ...s.activity,
        ].slice(0, 12),
      }));
    },
    [],
  );

  const addResearchNote = useCallback((note: Omit<ResearchNote, "id">) => {
    setState((s) => ({
      ...s,
      research: [{ ...note, id: uid() }, ...s.research],
      activity: [
        { id: uid(), stage: "research" as LoopStage, text: `Added evidence: ${note.title}`, at: "just now" },
        ...s.activity,
      ].slice(0, 12),
    }));
  }, []);

  const addFeedback = useCallback((who: string, quote: string) => {
    if (!quote.trim()) return;
    const negative = /can't|won't|confus|too |never|hard|unclear|no /i.test(quote);
    setState((s) => ({
      ...s,
      feedback: [
        { id: uid(), who: who.trim() || "Anonymous tester", quote: quote.trim(), sentiment: negative ? "negative" : "positive" },
        ...s.feedback,
      ],
      activity: [
        { id: uid(), stage: "test" as LoopStage, text: "New tester feedback analysed", at: "just now" },
        ...s.activity,
      ].slice(0, 12),
    }));
  }, []);

  const startBuild = useCallback(() => {
    setState((s) => ({
      ...s,
      buildStarted: true,
      activity: [
        { id: uid(), stage: "build" as LoopStage, text: "Generated build spec from the product thesis", at: "just now" },
        ...s.activity,
      ].slice(0, 12),
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      competitors: seedCompetitors,
      scenarios: seedScenarios,
      thinking,
      aiError,
      challengingId,
      submitThought,
      addBranch,
      updateBranch,
      removeBranch,
      mergeBranches,
      challenge,
      promoteToHypothesis,
      addEvidence,
      addResearchNote,
      addFeedback,
      startBuild,
      logActivity,
      reset,
    }),
    [
      state,
      thinking,
      aiError,
      challengingId,
      submitThought,
      addBranch,
      updateBranch,
      removeBranch,
      mergeBranches,
      challenge,
      promoteToHypothesis,
      addEvidence,
      addResearchNote,
      addFeedback,
      startBuild,
      logActivity,
      reset,
    ],
  );

  return <ThryveContext.Provider value={value}>{children}</ThryveContext.Provider>;
}

export function useThryve() {
  const ctx = useContext(ThryveContext);
  if (!ctx) throw new Error("useThryve must be used inside ThryveProvider");
  return ctx;
}

export function useEvidenceStrength() {
  const { hypotheses } = useThryve();
  const tested = hypotheses.filter((h) => h.evidence.length > 0).length;
  const avg = hypotheses.length
    ? Math.round(hypotheses.reduce((a, h) => a + h.confidence, 0) / hypotheses.length)
    : 0;
  return { tested, total: hypotheses.length, avg, thesisReady: tested >= 2 && avg >= 35 };
}
