import { supabase } from "@/integrations/supabase/client";
import {
  deleteThread as delLocal,
  getThread as getLocal,
  loadThreads as loadLocal,
  titleFrom,
  upsertThread as upLocal,
  type Msg,
  type Thread,
} from "@/lib/chat-storage";

export type { Msg, Thread };

/* ---------- persistence: cloud when signed in, browser otherwise ---------- */

export async function listThreads(userId: string | null): Promise<Thread[]> {
  if (!userId) return loadLocal();
  const { data } = await supabase
    .from("conversations")
    .select("id,title,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: new Date(c.updated_at).getTime(),
    messages: [],
  }));
}

export async function loadMessages(userId: string | null, id: string): Promise<Msg[]> {
  if (!userId) return getLocal(id)?.messages ?? [];
  const { data } = await supabase
    .from("messages")
    .select("role,content")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  return (data ?? []).map((m) => ({ role: m.role as Msg["role"], content: m.content }));
}

export async function saveMessage(
  userId: string | null,
  id: string,
  all: Msg[],
  msg: Msg,
  extra: { mode: string; projectId: string | null },
) {
  if (!userId) {
    upLocal({ id, title: titleFrom(all[0]?.content ?? ""), updatedAt: Date.now(), messages: all });
    return;
  }
  await supabase.from("conversations").upsert({
    id,
    owner_id: userId,
    title: titleFrom(all[0]?.content ?? ""),
    mode: extra.mode,
    project_id: extra.projectId,
    updated_at: new Date().toISOString(),
  });
  await supabase.from("messages").insert({
    conversation_id: id,
    owner_id: userId,
    role: msg.role,
    content: msg.content,
    mode: extra.mode,
  });
}

export async function removeThread(userId: string | null, id: string) {
  if (!userId) return delLocal(id);
  await supabase.from("messages").delete().eq("conversation_id", id);
  await supabase.from("conversations").delete().eq("id", id);
}

/** One-time move of browser chats into the account; local copy kept until success. */
export async function migrateLocal(userId: string) {
  const key = `thryve:migrated:${userId}`;
  if (localStorage.getItem(key)) return;
  for (const t of loadLocal()) {
    const { error } = await supabase.from("conversations").upsert({
      id: /^[0-9a-f-]{36}$/.test(t.id) ? t.id : crypto.randomUUID(),
      owner_id: userId,
      title: t.title,
      updated_at: new Date(t.updatedAt).toISOString(),
    }).select("id").single().then(async (r) => {
      if (r.error || !r.data) return r;
      return supabase.from("messages").insert(
        t.messages.map((m) => ({ conversation_id: r.data.id, owner_id: userId, role: m.role, content: m.content })),
      );
    });
    if (error) return;
  }
  localStorage.setItem(key, "1");
}

/* ---------- live generations survive chat switching ---------- */

type Run = { messages: Msg[]; busy: boolean; error: string | null; controller: AbortController };
const runs = new Map<string, Run>();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const subscribeRuns = (f: () => void) => {
  subs.add(f);
  return () => void subs.delete(f);
};
export const getRun = (id: string) => runs.get(id);
export const stopRun = (id: string) => runs.get(id)?.controller.abort();

export async function startRun(opts: {
  id: string;
  history: Msg[];
  userId: string | null;
  mode: string;
  projectId: string | null;
  context: string;
  onSaved: () => void;
}) {
  const { id, history } = opts;
  const controller = new AbortController();
  const run: Run = { messages: [...history, { role: "assistant", content: "" }], busy: true, error: null, controller };
  runs.set(id, run);
  emit();
  const meta = { mode: opts.mode, projectId: opts.projectId };
  // Save the prompt first so the chat shows up in the list right away.
  await saveMessage(opts.userId, id, history, history[history.length - 1]!, meta).catch(() => {});
  opts.onSaved();
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, mode: opts.mode, context: opts.context }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        res.status === 402
          ? "The AI credits for this app have run out. Add credits to keep going."
          : res.status === 429
            ? "Too many requests right now — wait a moment and try again."
            : detail.slice(0, 300) || "The request failed.",
      );
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let acc = "";
    let last = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      const now = performance.now();
      if (now - last > 50) {
        run.messages = [...history, { role: "assistant", content: acc }];
        last = now;
        emit();
      }
    }
    const answer: Msg = { role: "assistant", content: acc.trim() || "_No answer came back. Try rephrasing that._" };
    run.messages = [...history, answer];
    await saveMessage(opts.userId, id, run.messages, answer, meta).catch(() => {});
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      const partial = run.messages[run.messages.length - 1]?.content ?? "";
      run.messages = partial ? run.messages : history;
      if (partial) await saveMessage(opts.userId, id, run.messages, { role: "assistant", content: partial }, meta).catch(() => {});
    } else {
      run.error = (e as Error).message;
      run.messages = history;
    }
  } finally {
    run.busy = false;
    emit();
    opts.onSaved();
  }
}

export const clearRun = (id: string) => {
  const r = runs.get(id);
  if (r && !r.busy) runs.delete(id);
};
