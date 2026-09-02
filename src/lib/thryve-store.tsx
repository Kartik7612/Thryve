import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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

export function ThryveProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [thinking, setThinking] = useState(false);

  const logActivity = useCallback((stage: LoopStage, text: string) => {
    setState((s) => ({
      ...s,
      activity: [{ id: uid(), stage, text, at: "just now" }, ...s.activity].slice(0, 12),
    }));
  }, []);

  const submitThought = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setThinking(true);
      window.setTimeout(() => {
        const signals = extractSignals(text);
        setState((s) => ({
          ...s,
          thought: text,
          signals,
          branches: generateBranches(text),
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
      }, 900);
    },
    [],
  );

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
    setState((s) => ({
      ...s,
      branches: s.branches.map((b) =>
        b.id === id ? { ...b, challenged: true, note: challengeBranch(b) } : b,
      ),
    }));
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

  const reset = useCallback(() => setState(initialState), []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      competitors: seedCompetitors,
      scenarios: seedScenarios,
      thinking,
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
