export type Msg = { role: "user" | "assistant"; content: string };

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Msg[];
};

const KEY = "thryve:threads:v1";

export function isBrowser() {
  return typeof window !== "undefined";
}

export function loadThreads(): Thread[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {
    /* quota */
  }
}

export function upsertThread(thread: Thread): Thread[] {
  const rest = loadThreads().filter((t) => t.id !== thread.id);
  const next = [thread, ...rest].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 100);
  saveThreads(next);
  return next;
}

export function deleteThread(id: string): Thread[] {
  const next = loadThreads().filter((t) => t.id !== id);
  saveThreads(next);
  return next;
}

export function getThread(id: string): Thread | undefined {
  return loadThreads().find((t) => t.id === id);
}

export function newThreadId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
}

export function titleFrom(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 46 ? `${clean.slice(0, 46)}…` : clean || "New chat";
}
