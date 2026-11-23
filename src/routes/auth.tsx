import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LockKeyhole } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ redirect: z.string().optional() });

/** Only same-origin paths are allowed as a post-login destination. */
function safePath(raw: string | undefined) {
  if (!raw) return "/dashboard";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname.startsWith("/auth")) return "/dashboard";
    return url.pathname + url.search;
  } catch {
    return "/dashboard";
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Staff sign in — RESQ AI" },
      { name: "description", content: "Sign in for RESQ AI command staff: admins and responders." },
      { property: "og:title", content: "Staff sign in — RESQ AI" },
      { property: "og:description", content: "Sign in for RESQ AI command staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "Wrong email or password." : signInError.message);
      return;
    }
    void navigate({ to: safePath(search.redirect), replace: true });
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-secondary">
          <LockKeyhole aria-hidden className="size-5 text-primary" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Command staff sign in</h1>
          <p className="text-sm text-muted-foreground">Live Map and Command Dashboard are for admins and responders.</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-surface p-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div aria-live="assertive" className="min-h-5 text-sm text-sev-critical">{error}</div>
        <Button type="submit" className="w-full" disabled={busy || !email || !password}>
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />} Sign in
        </Button>
        <p className="text-xs text-muted-foreground">Staff accounts are created by an admin. Reporting an emergency never needs an account.</p>
      </form>
    </div>
  );
}
