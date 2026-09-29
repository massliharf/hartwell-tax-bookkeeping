import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CalendarDays, Inbox, LogOut, Settings, Sun, Users, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useOwnerCtx } from "@/components/owner/ctx";
import { needsYou } from "@/components/owner/lib";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({
    meta: [
      { title: "Practice — Patel Tax & Bookkeeping" },
      { name: "description", content: "Priya's practice app: today, calendar, clients and follow-ups." },
      { property: "og:title", content: "Practice — Patel Tax & Bookkeeping" },
      { property: "og:description", content: "Priya's practice app: today, calendar, clients and follow-ups." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerLayout,
});

const NAV = [
  { to: "/owner", label: "Today", icon: Sun, exact: true },
  { to: "/owner/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/owner/clients", label: "Clients", icon: Users },
  { to: "/owner/needs", label: "Needs you", icon: Bell },
  { to: "/owner/outbox", label: "Outbox", icon: Inbox },
  { to: "/owner/insights", label: "Insights", icon: BarChart3 },
  { to: "/owner/settings", label: "Settings", icon: Settings },
] as const;

function OwnerLayout() {
  const ctx = useOwnerCtx();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const needs = useQuery({ ...needsYou(ctx.data?.now ?? new Date().toISOString()), enabled: !!ctx.data?.isOwner });
  const count = needs.data?.length ?? 0;

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (ctx.isLoading) return <div className="grid min-h-screen place-items-center bg-paper text-sm text-muted-foreground">Opening your day…</div>;
  if (!ctx.data?.isOwner) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-serif text-3xl text-deep-ink">This area is for Priya only.</h1>
          <p className="mt-2 text-sm text-muted-foreground">You're signed in with an account that doesn't have access.</p>
          <Button className="mt-6" variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </main>
    );
  }

  const link = "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-deep-ink/75 transition-colors hover:bg-sage hover:text-deep-ink";
  const active = { className: "bg-sheet text-ink font-medium shadow-sheet" };

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border px-4 py-6 md:flex">
        <Link to="/" className="px-3 font-serif text-xl leading-tight text-ink">Patel Tax<br />&amp; Bookkeeping</Link>
        <nav className="mt-8 space-y-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={link} activeProps={active} activeOptions={{ exact: "exact" in n }}>
              <n.icon className="h-4 w-4" />
              <span className="flex-1">{n.label}</span>
              {n.to === "/owner/needs" && count > 0 && <span className="tabular rounded-full bg-marigold px-2 text-xs font-medium text-deep-ink">{count}</span>}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className={`${link} mt-auto`}><LogOut className="h-4 w-4" />Sign out</button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-paper/90 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="font-serif text-lg text-ink">Patel Tax</span>
            <button onClick={signOut} aria-label="Sign out" className="rounded-full p-2 hover:bg-sage"><LogOut className="h-4 w-4" /></button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-deep-ink/75" activeProps={{ className: "bg-ink text-primary-foreground" }} activeOptions={{ exact: "exact" in n }}>
                {n.label}
                {n.to === "/owner/needs" && count > 0 && <span className="tabular rounded-full bg-marigold px-1.5 text-xs text-deep-ink">{count}</span>}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
