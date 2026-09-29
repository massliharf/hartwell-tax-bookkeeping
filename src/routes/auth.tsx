import { ensureDemoAccount } from "@/lib/demo.functions";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOwnerAccount, ownerSetupStatus } from "@/lib/owner.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Owner sign in — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Sign in to the Hartwell Tax & Bookkeeping practice app." },
      { property: "og:title", content: "Owner sign in — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "Sign in to the Hartwell Tax & Bookkeeping practice app." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const status = useServerFn(ownerSetupStatus);
  const create = useServerFn(createOwnerAccount);
  const ensureDemo = useServerFn(ensureDemoAccount);
  const { data } = useQuery({ queryKey: ["owner-setup"], queryFn: () => status() });
  const setup = data && !data.hasOwner;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const isDemo = email.trim().toLowerCase() === DEMO_EMAIL;
      if (isDemo) await ensureDemo();
      else if (setup) {
        const r = await create({ data: { email, password } });
        if (!r.ok) { setErr(r.error); return; }
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setErr("That email and password don't match."); return; }
      navigate({ to: "/owner" });
    } catch {
      setErr(setup ? "Use a valid email and a password of at least 10 characters." : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-serif text-2xl text-ink">Hartwell Tax &amp; Bookkeeping</Link>
        <form onSubmit={submit} className="sheet-stack mt-8 space-y-5 p-7">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-fill-neutral text-ink"><Lock className="h-4 w-4" /></span>
          <div>
            <h1 className="font-serif text-xl leading-[30px] tracking-[-0.2px] text-deep-ink">{setup ? "Set up your account" : "Welcome back, Claire"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {setup ? "This is a one-time step. After this, only you can sign in." : "Sign in to see your day."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" autoComplete={setup ? "new-password" : "current-password"} minLength={setup ? 10 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} />
            {setup && <p className="text-xs text-muted-foreground">At least 10 characters.</p>}
          </div>
          {err && <p className="text-sm text-warning" role="alert">{err}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy || !data}>{busy ? "One moment…" : setup ? "Create account" : "Sign in"}</Button>
        </form>
        <button type="button" onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); }}
          className="mt-4 w-full rounded-2xl border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground hover:bg-fill-subtle/50">
          Demo access: <span className="tabular text-deep-ink">{DEMO_EMAIL}</span> / <span className="tabular text-deep-ink">{DEMO_PASSWORD}</span>
          <span className="block text-xs">Tap to fill in.</span>
        </button>
      </div>
    </main>
  );
}
