import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CalendarDays, Inbox, LogOut, Settings, Sun, Users, Bell, Search, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useOwnerCtx } from "@/components/owner/ctx";
import { needsYou } from "@/components/owner/lib";
import { DemoTools } from "@/components/owner/demo";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({
    meta: [
      { title: "Practice — Patel Tax & Bookkeeping" },
      { name: "description", content: "Priya's practice app: today, calendar, clients and follow-ups." },
      { property: "og:title", content: "Practice — Patel Tax & Bookkeeping" },
      { property: "og:description", content: "Priya's practice app: today, calendar, clients and follow-ups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const ctx = useOwnerCtx();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const needs = useQuery({ ...needsYou(ctx.data?.now ?? new Date().toISOString()), enabled: !!ctx.data?.isOwner });
  const count = needs.data?.length ?? 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCommandOpen((v) => !v); }
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          <h1 className="font-sans text-3xl text-deep-ink">This area is for Priya only.</h1>
          <p className="mt-2 text-sm text-muted-foreground">You're signed in with an account that doesn't have access.</p>
          <Button className="mt-6" variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </main>
    );
  }

   const link = "flex h-10 items-center gap-3 rounded-[8px] px-3 text-[13px] text-graphite transition-colors hover:bg-control hover:text-deep-ink";
   const active = { className: "bg-control text-deep-ink font-medium" };

  return (
     <div className="min-h-screen bg-canvas md:flex">
       <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col px-3 py-5 transition-[width] md:flex ${collapsed ? "w-16" : "w-[232px]"}`}>
          <div className="flex items-center justify-between gap-1 px-2"><Link to="/" className="min-w-0 truncate text-lg font-semibold text-evergreen">{collapsed ? "P" : "Patel Tax"}</Link><Button variant="ghost" size="icon" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="size-8 shrink-0" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button></div>
          {!collapsed && <div className="mt-3 px-2 text-xs text-graphite">Priya Patel, EA</div>}
         {!collapsed && <div className="mt-5 px-1"><Button variant="dark" size="sm" className="w-full justify-start" asChild><Link to="/owner/calendar"><Plus /> New appointment</Link></Button></div>}
         <nav className="mt-6 space-y-1">
          {NAV.map((n) => (
             <Link key={n.to} to={n.to} title={collapsed ? n.label : undefined} className={`${link} ${collapsed ? "justify-center px-0" : ""}`} activeProps={active} activeOptions={{ exact: "exact" in n }}>
              <n.icon className="h-4 w-4" />
               {!collapsed && <span className="flex-1">{n.label}</span>}
               {n.to === "/owner/needs" && count > 0 && <span className="tabular rounded-full bg-evergreen-tint px-2 text-xs font-medium text-evergreen">{count}</span>}
            </Link>
          ))}
        </nav>
         <Button variant="ghost" onClick={signOut} title="Sign out" className={`${link} mt-auto justify-start`}><LogOut className="h-4 w-4" />{!collapsed && "Sign out"}</Button>
      </aside>

       <div className="min-w-0 flex-1 p-2 md:p-3 md:pl-0">
         <div className="min-h-[calc(100vh-24px)] rounded-[20px] bg-paper pb-20 md:pb-0">
         <header className="sticky top-0 z-20 border-b border-line bg-paper/95 px-5 py-3 backdrop-blur md:rounded-t-[20px]">
           <div className="flex items-center justify-between gap-3">
             <span className="text-lg font-semibold text-evergreen md:hidden">Patel Tax</span>
             <Button variant="neutral" className="hidden h-9 min-w-48 justify-between text-graphite md:flex" onClick={() => setCommandOpen(true)}><span className="flex items-center gap-2"><Search className="size-4" /> Search</span><span className="text-xs">⌘K</span></Button>
              <span className="hidden text-sm text-graphite md:block">{NAV.find((n) => n.to === location.pathname)?.label ?? "Practice"}</span>
             <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setCommandOpen(true)} className="md:hidden"><Search /></Button>
             <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="md:hidden"><LogOut /></Button>
           </div>
        </header>
         <main className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">
          <Outlet />
        </main>
         </div>
      </div>
      <DemoTools />
       <nav className="fixed inset-x-2 bottom-2 z-30 grid grid-cols-5 rounded-[14px] border border-line bg-paper p-1 shadow-[var(--shadow-2)] md:hidden" aria-label="Practice navigation">{[...NAV.slice(0, 3), NAV[3], { to: "/owner/settings", label: "More", icon: Settings }].map((n) => <Link key={n.to} to={n.to} className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[8px] text-[10px] text-graphite" activeProps={{ className: "bg-control text-evergreen font-semibold" }} activeOptions={{ exact: n.to === "/owner" }}><n.icon className="size-4" />{n.label}</Link>)}</nav>
       {commandOpen && <div className="fixed inset-0 z-50 grid place-items-start bg-deep-ink/35 px-4 pt-[15vh]" role="presentation" onMouseDown={() => setCommandOpen(false)}><div className="mx-auto w-full max-w-lg rounded-[20px] bg-paper p-3 shadow-[var(--shadow-3)]" role="dialog" aria-modal="true" aria-label="Quick navigation" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-center gap-2 border-b border-line px-3 py-3"><Search className="size-4 text-graphite" /><span className="text-sm text-graphite">Go to a page</span><Button variant="ghost" size="sm" className="ml-auto" onClick={() => setCommandOpen(false)}>Close</Button></div><div className="py-2">{NAV.map((n) => <Link key={n.to} to={n.to} onClick={() => setCommandOpen(false)} className="flex h-11 items-center gap-3 rounded-[8px] px-3 text-sm hover:bg-control"><n.icon className="size-4 text-graphite" />{n.label}</Link>)}</div></div></div>}
    </div>
  );
}
