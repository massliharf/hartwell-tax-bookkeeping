import { ensureDemoAccount } from "@/lib/demo.functions";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Loader2, Lock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOwnerAccount, ownerSetupStatus } from "@/lib/owner.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Hartwell Tax owner dashboard" },
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

  const useDemo = () => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setErr(null); };
  const points = [
    ["Clients schedule themselves", "From live open times. Confirmations and calendar invites go out on their own."],
    ["Documents arrive checked", "Each upload is checked on arrival. Only the ones that need your eyes reach you."],
    ["Reminders, signatures and payments run on their own", "You see the exceptions, and the hours it gave back."],
  ];
  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[1fr_1.1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-10 text-white lg:flex xl:p-14">
        <LogoMark size={560} tone="light" className="pointer-events-none absolute -right-32 -top-32 opacity-[0.06]" />
        <Link to="/" aria-label="Hartwell Tax & Bookkeeping, home" className="relative inline-flex min-h-10 items-center self-start"><Logo tone="light" sub="Owner dashboard" /></Link>
        <div className="relative max-w-md">
          <h2 className="t-section text-white">The front desk you never had to hire.</h2>
          <ul className="mt-10 space-y-6">
            {points.map(([t, d]) => (
              <li key={t} className="flex gap-3.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white/10">
                  <Check className="size-3.5" strokeWidth={2.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium leading-6">{t}</p>
                  <p className="mt-1 text-sm leading-6 text-white/60">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex flex-wrap gap-x-5 gap-y-1.5 border-t border-white/10 pt-5 text-xs text-white/50">
          <span>412 Bloomfield Avenue, Montclair, NJ</span>
          <span>(973) 555-0142</span>
          <span>claire@hartwelltax.com</span>
          <span>Mon to Fri 9 to 6, Sat 10 to 2</span>
        </div>
      </section>

      <section className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" aria-label="Hartwell Tax & Bookkeeping, home" className="inline-flex min-h-10 items-center lg:hidden"><Logo sub="Owner dashboard" /></Link>
          <Link to="/" className="inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-deep-ink">Back to the website</Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="t-owner text-deep-ink">{setup ? "Set up Hartwell Tax" : "Sign in to Hartwell Tax"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{setup ? "A one-time step. After this, only you can sign in." : "Your day, your clients and everything that went out on its own."}</p>
          {!setup && (
            <button type="button" onClick={useDemo} className="mt-8 flex w-full items-center justify-between gap-3 rounded-xl border border-line-1 bg-sheet px-4 py-3 text-left transition-colors duration-150 hover:border-line-2 hover:bg-surface-2">
              <span>
                <span className="block text-sm font-medium text-deep-ink">Use the demo account</span>
                <span className="tabular block text-xs text-muted-foreground">{DEMO_EMAIL}</span>
              </span>
              <span className="text-xs font-medium text-ink">Fill in</span>
            </button>
          )}
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate={false}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" autoComplete={setup ? "new-password" : "current-password"} minLength={setup ? 10 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!err} />
              {setup && <p className="text-xs text-muted-foreground">At least 10 characters.</p>}
            </div>
            {err && <p className="rounded-lg bg-alert-negative px-3 py-2 text-sm text-alert-negative-fg" role="alert">{err}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy || !data}>{busy ? <><Loader2 className="animate-spin" />Signing in…</> : !data ? "One moment…" : setup ? "Create account" : "Sign in"}</Button>
          </form>
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Lock className="size-3.5" />Only the owner can sign in here. Clients use the link in their email.</p>
        </div>
      </section>
    </main>
  );
}
