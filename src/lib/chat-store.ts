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
    .select("id,title,recap,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    recap: typeof c.recap === "string" && c.recap ? c.recap : undefined,
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
  extra: { mode: string; projectId: string | null; title?: string },
) {
  if (!userId) {
    upLocal({ id, title: extra.title ?? titleFrom(all[0]?.content ?? ""), updatedAt: Date.now(), messages: all });
    return;
  }
  const conversation: Record<string, unknown> = {
    id,
    owner_id: userId,
    mode: extra.mode,
    project_id: extra.projectId,
    updated_at: new Date().toISOString(),
  };
  // Name the chat only when it is created, so AI-generated titles survive.
  if (extra.title) conversation.title = extra.title;
  await supabase.from("conversations").upsert(conversation);
  await supabase.from("messages").insert({
    conversation_id: id,
    owner_id: userId,
    role: msg.role,
    content: msg.content,
    mode: extra.mode,
  });
}

export async function removeThread(userId: string | null, id: string) {
  if (!userId) { delLocal(id); return; }
  await supabase.from("messages").delete().eq("conversation_id", id);
  await supabase.from("conversations").delete().eq("id", id);
}

/** Store the AI-generated chat name and the "in 30 seconds" recap. */
export async function saveMeta(
  userId: string | null,
  id: string,
  meta: { title?: string; recap?: string },
) {
  if (!userId) {
    const t = getLocal(id);
    if (t) upLocal({ ...t, title: meta.title?.trim() || t.title, recap: meta.recap || t.recap });
    return;
  }
  const patch: Record<string, string> = {};
  if (meta.title?.trim()) patch.title = meta.title.trim().slice(0, 80);
  if (meta.recap) patch.recap = meta.recap;
  if (!Object.keys(patch).length) return;
  await supabase.from("conversations").update(patch).eq("id", id);
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

// Every visible change must swap in a NEW run object: useSyncExternalStore
// re-renders only when its snapshot changes identity, so mutating the stored
// run in place would leave the UI on "Thinking…" forever.
const updateRun = (id: string, patch: Partial<Run>) => {
  const r = runs.get(id);
  if (!r) return;
  runs.set(id, { ...r, ...patch });
  emit();
};

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
  runs.set(id, { messages: [...history, { role: "assistant", content: "" }], busy: true, error: null, controller });
  emit();
  const meta = {
    mode: opts.mode,
    projectId: opts.projectId,
    // First message of the chat names the conversation; later saves must not
    // overwrite an AI-generated title.
    title: history.length === 1 ? titleFrom(history[0]?.content ?? "") : undefined,
  };
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
        updateRun(id, { messages: [...history, { role: "assistant", content: acc }] });
        last = now;
      }
    }
    const answer: Msg = { role: "assistant", content: acc.trim() || "_No answer came back. Try rephrasing that._" };
    await saveMessage(opts.userId, id, [...history, answer], answer, meta).catch(() => {});
    updateRun(id, { messages: [...history, answer] });
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      const partial = getRun(id)?.messages[getRun(id)!.messages.length - 1]?.content ?? "";
      if (partial) await saveMessage(opts.userId, id, getRun(id)!.messages, { role: "assistant", content: partial }, meta).catch(() => {});
    } else {
      updateRun(id, { error: (e as Error).message, messages: history });
    }
  } finally {
    updateRun(id, { busy: false });
    opts.onSaved();
  }
}

export const clearRun = (id: string) => {
  const r = runs.get(id);
  if (r && !r.busy) runs.delete(id);
};
