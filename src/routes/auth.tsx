import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — THRYVE" },
      { name: "description", content: "Sign in to THRYVE to save chats and projects across devices." },
      { property: "og:title", content: "Sign in — THRYVE" },
      { property: "og:description", content: "Save your evidence-first research and projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (user) void navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
        });
        if (error) throw error;
        if (!data.session)
          setMsg({ ok: true, text: "Check your email to confirm your account, then sign in." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg({ ok: true, text: "If that email has an account, a reset link is on its way." });
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setMsg(null);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg({ ok: false, text: r.error.message });
  };

  const input =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent";

  return (
    <div className="grid min-h-screen place-items-center bg-background px-5">
      <div className="rise w-full max-w-sm">
        <Link to="/" className="font-display text-2xl tracking-tight">
          THRYVE
        </Link>
        <h1 className="mt-6 font-display text-3xl tracking-tight">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Think it. Prove it. Build it.</p>

        {mode !== "forgot" ? (
          <button
            onClick={google}
            className="mt-6 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-accent/60"
          >
            Continue with Google
          </button>
        ) : null}

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "signup" ? (
            <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          ) : null}
          <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== "forgot" ? (
            <input className={input} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          ) : null}
          <button
            disabled={busy}
            className="w-full rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-opacity disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        {msg ? (
          <p className={`mt-4 text-sm ${msg.ok ? "text-muted-foreground" : "text-destructive"}`}>{msg.text}</p>
        ) : null}

        <div className="mt-6 flex justify-between text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              <button onClick={() => setMode("signup")} className="hover:text-foreground">Create account</button>
              <button onClick={() => setMode("forgot")} className="hover:text-foreground">Forgot password?</button>
            </>
          ) : (
            <button onClick={() => setMode("signin")} className="hover:text-foreground">Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}
