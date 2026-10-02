import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — THRYVE" },
      { name: "description", content: "Choose a new password for your THRYVE account." },
      { property: "og:title", content: "Set a new password — THRYVE" },
      { property: "og:description", content: "Choose a new password for your THRYVE account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    void navigate({ to: "/" });
  };
  return (
    <div className="grid min-h-screen place-items-center bg-background px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <h1 className="font-display text-3xl tracking-tight">Set a new password</h1>
        <input
          type="password"
          required
          minLength={6}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="New password"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button className="w-full rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground">
          Save password
        </button>
        {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
      </form>
    </div>
  );
}
