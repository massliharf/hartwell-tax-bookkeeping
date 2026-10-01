import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppointmentPanel } from "@/components/owner/appointment-panel";
import { ApptPanelContext, type ApptPanelTarget } from "@/components/owner/drawer-context";
import { useLocation } from "@tanstack/react-router";
import { BarChart3, CalendarDays, FlaskConical, Inbox, LogOut, Settings, Smartphone, Sun, Users, PanelLeft, MoreHorizontal, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerCtx } from "@/components/owner/ctx";
import { needsYou } from "@/components/owner/lib";
import { DemoTools } from "@/components/owner/demo";
import { Logo } from "@/components/brand/Logo";
import { NewAppointmentButton } from "@/components/owner/new-appointment";

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
  { to: "/owner/insights", label: "Report", icon: BarChart3 },
  { to: "/owner/settings", label: "Settings", icon: Settings },
] as const;
const PAGES = NAV;

function OwnerLayout() {
  const ctx = useOwnerCtx();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const needs = useQuery({ ...needsYou(ctx.data?.now ?? new Date().toISOString()), enabled: !!ctx.data?.isOwner });
  const count = needs.data?.length ?? 0;
  const path = useLocation({ select: (l) => l.pathname.replace(/\/$/, "") || "/" });
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [panel, setPanel] = useState<ApptPanelTarget | null>(null);
  const [paletteTerm, setPaletteTerm] = useState("");
  const clients = useQuery({ queryKey: ["owner", "clients"], enabled: !!ctx.data?.isOwner && paletteOpen, queryFn: async () => { const { data, error } = await supabase.from("clients").select("id, name, email, phone, is_returning, appointments(start_at, status)").order("name"); if (error) throw error; return data ?? []; } });
  const [email, setEmail] = useState("");
  useEffect(() => { setCollapsed(localStorage.getItem("owner-sidebar") === "1"); void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? "")); }, []);
  const toggle = () => setCollapsed((c) => { localStorage.setItem("owner-sidebar", c ? "0" : "1"); return !c; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); } };
    const onOpen = () => setPaletteOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("owner:palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("owner:palette", onOpen); };
  }, []);

  const signOut = async () => {
    await qc.cancelQueries();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
    qc.clear();
  };

  if (ctx.isLoading) return <div role="status" aria-label="Opening your day" className="min-h-screen bg-paper sm:flex sm:gap-2 sm:bg-canvas sm:p-2"><div className="hidden w-56 shrink-0 rounded-2xl bg-sheet p-5 sm:block"><Skeleton className="h-8 w-36" /><div className="mt-10 space-y-2">{Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div></div><div className="min-w-0 flex-1"><div className="h-[60px]" /><main className="min-h-[calc(100vh-76px)] rounded-2xl bg-sheet p-6"><Skeleton className="h-9 w-60 max-w-full" /><Skeleton className="mt-3 h-5 w-40" /><div className="mt-10 space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div></main></div></div>;
  if (!ctx.data?.isOwner) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
        <div className="max-w-sm">
          <h1 className="t-page text-deep-ink">This area is for Claire only.</h1>
          <p className="mt-2 text-sm text-muted-foreground">You're signed in with an account that doesn't have access.</p>
          <Button className="mt-6" variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </main>
    );
  }

  const current = PAGES.find((n) => ("exact" in n ? path === n.to : path.startsWith(n.to))) ?? PAGES[0];
  const mobileMain = NAV.slice(0, 4);
  const mobileMore = NAV.slice(4);
  const item = `flex h-8 items-center gap-2.5 rounded-lg text-[13px] text-body transition-colors duration-150 hover:bg-tint-1 ${collapsed ? "justify-center px-0" : "px-2"}`;
  const wide = path === "/owner" || path.startsWith("/owner/calendar") || path.startsWith("/owner/clients") || path.startsWith("/owner/settings") || path.startsWith("/owner/insights");

  return (
    <ApptPanelContext.Provider value={setPanel}><TooltipProvider delayDuration={200}><div className="min-h-screen bg-paper sm:flex sm:bg-canvas sm:py-2 sm:pr-2">
      {/* DESIGN_SYSTEM v2 §5: the sidebar sits on the canvas (no card); the main panel is the white card. */}
      <aside className={`sticky top-2 hidden h-[calc(100vh-16px)] shrink-0 flex-col gap-3 transition-[width,padding] duration-300 ease-expo sm:flex ${collapsed ? "w-[60px] px-2" : "w-[220px] px-3"}`}>
        <div className={`flex h-9 items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? null : <Link to="/owner" aria-label="Hartwell practice home" className="min-w-0"><Logo size={28} sub="Practice" /></Link>}
          <Button size="icon" variant="ghost" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}><PanelLeft className="size-4" /></Button>
        </div>
        <div className="flex flex-col gap-0.5">
          <NewAppointmentButton compact={collapsed} row listen />
          <button type="button" onClick={() => setPaletteOpen(true)} title={collapsed ? "Search" : undefined} className={item}>
            <Search className="size-4 shrink-0" strokeWidth={1.75} />{!collapsed && <><span className="flex-1 text-left">Search</span><kbd className="rounded border border-line-1 px-1 text-[10px] leading-4 text-muted-foreground">⌘K</kbd></>}
          </button>
        </div>
        <nav className="flex flex-col gap-0.5" aria-label="Main">
          {NAV.map((n) => (
            <div key={n.to} className="contents">
              <Link to={n.to} title={collapsed ? n.label : undefined} className={item} activeProps={{ className: "bg-tint-2 font-medium text-deep-ink" }} activeOptions={{ exact: "exact" in n }}>
                <span className="relative grid size-5 shrink-0 place-items-center"><n.icon className="size-4" strokeWidth={1.75} />
                  {collapsed && n.to === "/owner" && count > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[9px] font-bold leading-4 text-white">{count}</span>}
                </span>
                {!collapsed && <span className="flex-1 truncate">{n.label}</span>}
                {!collapsed && n.to === "/owner" && count > 0 && <span className="tabular grid min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[10px] font-semibold leading-5 text-white">{count}</span>}
              </Link>
            </div>
          ))}
        </nav>
        <div className="flex-1" />
        <DemoTools rows collapsed={collapsed} />
        <div className={`flex items-center gap-2 border-t border-line-1 pt-3 ${collapsed ? "flex-col" : ""}`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill-neutral text-xs font-medium text-deep-ink" title={collapsed ? `Claire Hartwell, ${email}` : undefined}>CH</span>
          {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-deep-ink">Claire Hartwell</span><span className="block truncate text-[11px] text-muted-foreground">{email}</span></span>}
          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" aria-label="Sign out" onClick={signOut}><LogOut className="size-4" /></Button></TooltipTrigger><TooltipContent side={collapsed ? "right" : "top"}>Sign out</TooltipContent></Tooltip>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line-0 bg-sheet px-5 sm:hidden">
          <span className="text-sm font-medium text-deep-ink">{current.label}</span>
          <Button size="icon" variant="ghost" aria-label="Search" onClick={() => setPaletteOpen(true)}><Search className="size-4" /></Button>
        </header>
        <main className="min-h-[calc(100vh-56px)] bg-sheet sm:min-h-[calc(100vh-16px)] sm:rounded-2xl">
          <div className="hidden h-14 items-center justify-between px-6 sm:flex">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <span>Practice</span><span aria-hidden="true">/</span><span className="text-deep-ink">{current.label}</span>
            </nav>

          </div>
          <div className="px-5 pb-28 pt-4 sm:px-8 sm:pb-12 sm:pt-2">
            <div className={wide ? "mx-auto max-w-6xl" : "mx-auto max-w-3xl"}>
              <div><Outlet /></div>
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[63px] items-center justify-around rounded-t-2xl bg-surface-2 px-5 py-3 sm:hidden" style={{ boxShadow: "0 -1px 0 rgba(16,16,16,0.05)" }}>
        {mobileMain.map((n) => (
          <Link key={n.to} to={n.to} className="relative flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 text-[10px] leading-[15px] text-muted-foreground" activeProps={{ className: "text-deep-ink" }} activeOptions={{ exact: "exact" in n }}>
            <n.icon className="size-5" />{n.label}
            {n.to === "/owner" && count > 0 && <span className="absolute -top-1 right-1 grid size-3.5 place-items-center rounded-full bg-ink text-[8px] font-bold text-primary-foreground">{count}</span>}
          </Link>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger className={`flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 text-[10px] leading-[15px] ${mobileMore.some((n) => n.to === current.to) ? "text-deep-ink" : "text-muted-foreground"}`}>
            <MoreHorizontal className="size-5" />More
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 rounded-2xl py-2">
            {mobileMore.map((n) => (
              <DropdownMenuItem key={n.to} asChild className="h-8 gap-2.5 rounded-lg text-xs">
                <Link to={n.to}><n.icon className="size-3.5" />{n.label}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event("owner:demo"))} className="h-8 gap-2.5 rounded-lg text-xs"><FlaskConical className="size-3.5" />Demo tools</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event("owner:phone"))} className="h-8 gap-2.5 rounded-lg text-xs"><Smartphone className="size-3.5" />Phone preview</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut} className="h-8 gap-2.5 rounded-lg text-xs"><LogOut className="size-3.5" />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search pages or clients…" value={paletteTerm} onValueChange={setPaletteTerm} />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map((n) => (
              <CommandItem key={n.to} onSelect={() => { setPaletteOpen(false); navigate({ to: n.to }); }} className="h-10 gap-3 rounded-lg text-[15px]">
                <span className="grid size-7 place-items-center rounded-lg bg-fill-neutral"><n.icon className="size-3.5" /></span>{n.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Clients">
            {(clients.data ?? [])
              .filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(paletteTerm.trim().toLowerCase()))
              .slice(0, 20)
              .map((c) => (
                <CommandItem key={c.id} value={`${c.name} ${c.email}`} onSelect={() => { setPaletteOpen(false); setPaletteTerm(""); navigate({ to: "/owner/clients/$id", params: { id: c.id } }); }} className="h-10 gap-3 rounded-lg text-[15px]">
                  <span className="grid size-7 place-items-center rounded-lg bg-fill-neutral"><Users className="size-3.5" /></span>
                  <span className="min-w-0 truncate">{c.name} <span className="text-xs text-muted-foreground">{c.email}</span></span>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <AppointmentPanel target={panel} onClose={() => setPanel(null)} />
    </div></TooltipProvider></ApptPanelContext.Provider>
  );
}
