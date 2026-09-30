import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ClientDrawer } from "@/components/owner/client-drawer";
import { ClientDrawerContext, type ClientDrawerTarget } from "@/components/owner/drawer-context";
import { useLocation } from "@tanstack/react-router";
import { BarChart3, CalendarDays, Inbox, LogOut, Settings, Sun, Users, Bell, PanelLeft, MoreHorizontal, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerCtx } from "@/components/owner/ctx";
import { needsYou } from "@/components/owner/lib";
import { DemoTools } from "@/components/owner/demo";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({
    meta: [
      { title: "Practice — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Claire's practice app: today, calendar, clients and follow-ups." },
      { property: "og:title", content: "Practice — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "Claire's practice app: today, calendar, clients and follow-ups." },
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
  const path = useLocation({ select: (l) => l.pathname.replace(/\/$/, "") || "/" });
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [clientTarget, setClientTarget] = useState<ClientDrawerTarget | null>(null);
  const [paletteTerm, setPaletteTerm] = useState("");
  const clients = useQuery({ queryKey: ["owner", "clients"], enabled: !!ctx.data?.isOwner && paletteOpen, queryFn: async () => { const { data, error } = await supabase.from("clients").select("id, name, email, phone, is_returning, appointments(start_at, status)").order("name"); if (error) throw error; return data ?? []; } });
  useEffect(() => { setCollapsed(localStorage.getItem("owner-sidebar") === "1"); }, []);
  const toggle = () => setCollapsed((c) => { localStorage.setItem("owner-sidebar", c ? "0" : "1"); return !c; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

   if (ctx.isLoading) return <div role="status" aria-label="Opening your day" className="min-h-screen bg-paper sm:flex sm:gap-2 sm:bg-canvas sm:p-2"><div className="hidden w-56 shrink-0 rounded-2xl bg-sheet p-5 sm:block"><Skeleton className="h-8 w-36" /><div className="mt-10 space-y-2">{Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div></div><div className="min-w-0 flex-1"><div className="h-[60px]" /><main className="min-h-[calc(100vh-76px)] rounded-2xl bg-sheet p-6"><Skeleton className="h-9 w-60 max-w-full" /><Skeleton className="mt-3 h-5 w-40" /><div className="mt-10 space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div></main></div></div>;
  if (!ctx.data?.isOwner) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-sans text-lg font-normal text-deep-ink">This area is for Claire only.</h1>
          <p className="mt-2 text-sm text-muted-foreground">You're signed in with an account that doesn't have access.</p>
          <Button className="mt-6" variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </main>
    );
  }

  const current = NAV.find((n) => ("exact" in n ? path === n.to : path.startsWith(n.to))) ?? NAV[0];
  const mobileMain = NAV.slice(0, 4);
  const mobileMore = NAV.slice(4);
  const item = "flex h-8 items-center gap-2.5 rounded-lg pr-2 text-xs text-sidebar-foreground transition-colors duration-150 hover:bg-fill-subtle";

  return (
    <ClientDrawerContext.Provider value={setClientTarget}><div className="min-h-screen bg-paper sm:flex sm:gap-2 sm:bg-canvas sm:p-2">
      <aside className={`sticky top-2 hidden h-[calc(100vh-16px)] shrink-0 flex-col gap-4 rounded-2xl bg-sheet py-4  sm:flex ${collapsed ? "w-[72px] px-5" : "w-56 px-5"}`}>
        <div className="flex h-8 items-center justify-between">
          {!collapsed && <Link to="/" className="truncate text-sm font-semibold text-deep-ink">Hartwell Tax</Link>}
          <button onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-fill-subtle">
            <PanelLeft className="size-3.5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} title={collapsed ? n.label : undefined} className={item} activeProps={{ className: "bg-fill-selected text-deep-ink" }} activeOptions={{ exact: "exact" in n }}>
              <span className="relative grid size-8 shrink-0 place-items-center"><n.icon className="size-3.5" />
                {collapsed && n.to === "/owner/needs" && count > 0 && <span className="absolute right-0.5 top-0.5 grid size-3.5 place-items-center rounded-full bg-ink text-[8px] font-bold text-primary-foreground">{count}</span>}
              </span>
              {!collapsed && <span className="flex-1 truncate">{n.label}</span>}
              {!collapsed && n.to === "/owner/needs" && count > 0 && <span className="tabular grid size-3.5 place-items-center rounded-full bg-ink text-[8px] font-bold text-primary-foreground">{count}</span>}
            </Link>
          ))}
        </nav>
        <div className="h-px bg-border" />
        <div className="flex-1" />
        <div className={`flex ${collapsed ? "flex-col" : ""} gap-1`}>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-9 w-full justify-start gap-2 px-1" title="Claire Hartwell"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-fill-neutral text-xs">CH</span>{!collapsed && <span className="truncate text-xs">Claire Hartwell</span>}</Button></DropdownMenuTrigger><DropdownMenuContent side="top" align="start" className="w-56 rounded-2xl shadow-lift"><DropdownMenuItem onSelect={signOut}><LogOut className="size-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between bg-paper px-6 sm:static sm:bg-transparent sm:px-4">
          <span className="text-sm font-semibold text-deep-ink sm:hidden">Hartwell Tax</span>
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <span>Practice</span><span>›</span><span className="text-deep-ink">{current.label}</span>
          </nav>
          <span className="text-xs text-deep-ink sm:hidden">{current.label}</span>
          <button onClick={signOut} aria-label="Sign out" className="grid size-10 place-items-center rounded-[10px] bg-fill-neutral sm:hidden"><LogOut className="size-4" /></button>
        </header>
        <main className="min-h-[calc(100vh-76px)] rounded-t-2xl bg-sheet px-6 pb-28 pt-6 sm:rounded-2xl sm:px-6 sm:py-4 sm:pb-10">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[63px] items-center justify-around rounded-t-2xl bg-surface-2 px-5 py-3 sm:hidden" style={{ boxShadow: "0 -1px 0 rgba(16,16,16,0.05)" }}>
        {mobileMain.map((n) => (
          <Link key={n.to} to={n.to} className="relative flex flex-col items-center gap-0.5 text-[10px] leading-[15px] text-muted-foreground" activeProps={{ className: "text-deep-ink" }} activeOptions={{ exact: "exact" in n }}>
            <n.icon className="size-5" />{n.label}
            {n.to === "/owner/needs" && count > 0 && <span className="absolute -top-1 right-1 grid size-3.5 place-items-center rounded-full bg-ink text-[8px] font-bold text-primary-foreground">{count}</span>}
          </Link>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger className={`flex flex-col items-center gap-0.5 text-[10px] leading-[15px] ${mobileMore.some((n) => n.to === current.to) ? "text-deep-ink" : "text-muted-foreground"}`}>
            <MoreHorizontal className="size-5" />More
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 rounded-2xl py-2">
            {mobileMore.map((n) => (
              <DropdownMenuItem key={n.to} asChild className="h-8 gap-2.5 rounded-lg text-xs">
                <Link to={n.to}><n.icon className="size-3.5" />{n.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search pages or clients…" value={paletteTerm} onValueChange={setPaletteTerm} />
        <CommandList>
          <CommandEmpty>No page found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {NAV.map((n) => (
              <CommandItem key={n.to} onSelect={() => { setPaletteOpen(false); navigate({ to: n.to }); }} className="h-10 gap-3 rounded-lg text-[15px]">
                <span className="grid size-7 place-items-center rounded-lg bg-fill-neutral"><n.icon className="size-3.5" /></span>{n.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <DemoTools />
    </div>
  );
}
