import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CreditCard, FileSearch, Plus, Search, Send, Users, type LucideIcon } from "lucide-react";
import { useOwnerCtx } from "@/components/owner/ctx";
import { addDays, apptsRange, et, etToIso, fmtLong, needsYou, readyToFile } from "@/components/owner/lib";
import { ApptList, Empty, ErrorNote, LoadingRows, NeedsList } from "@/components/owner/ui";
import { useApptPanel } from "@/components/owner/drawer-context";
import { openNewAppointment } from "@/components/owner/new-appointment";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/_authenticated/owner/")({ head: () => ({ meta: [{ title: "Today — Hartwell Tax & Bookkeeping" }, { name: "description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:title", content: "Today — Hartwell Tax & Bookkeeping" }, { property: "og:description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Today });

type Shortcut = { label: string; icon: LucideIcon; rgb: string; count?: number | undefined; onClick: () => void; disabled?: boolean };

/** Layout follows magnific.com/app Home: greeting, spotlight search, shortcut tiles, then the work in two columns. */
function Today() {
  const now = useOwnerCtx().data!.now;
  const navigate = useNavigate();
  const openAppt = useApptPanel();
  const { ymd, minutes } = et(now);
  const q = useQuery(apptsRange(etToIso(ymd, 0), etToIso(addDays(ymd, 1), 0)));
  const upcoming = useQuery(apptsRange(etToIso(addDays(ymd, 1), 0), etToIso(addDays(ymd, 15), 0)));
  const needs = useQuery(needsYou(now));
  const toFile = useQuery(readyToFile());
  const hi = minutes < 12 * 60 ? "Good morning" : minutes < 17 * 60 ? "Good afternoon" : "Good evening";
  const review = needs.data?.filter((i) => i.kind === "review") ?? [];
  const unpaid = needs.data?.filter((i) => i.kind === "unpaid") ?? [];
  const reviewCount = review.reduce((sum, i) => sum + (i.kind === "review" ? i.count : 0), 0);
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const shortcuts: Shortcut[] = [
    { label: "New appointment", icon: Plus, rgb: "47,84,235", onClick: openNewAppointment },
    { label: "Calendar", icon: CalendarDays, rgb: "124,92,219", onClick: () => navigate({ to: "/owner/calendar" }) },
    { label: "Clients", icon: Users, rgb: "13,148,136", onClick: () => navigate({ to: "/owner/clients" }) },
    { label: "Documents to check", icon: FileSearch, rgb: "217,119,6", count: reviewCount, disabled: !reviewCount, onClick: () => { const r = review[0]; if (r) openAppt({ appointmentId: r.id }); } },
    { label: "Unpaid", icon: CreditCard, rgb: "194,58,32", count: unpaid.length, disabled: !unpaid.length, onClick: () => scrollTo("today-needs") },
    { label: "Ready to file", icon: Send, rgb: "23,128,79", count: toFile.data?.length ?? 0, disabled: !toFile.data?.length, onClick: () => scrollTo("today-to-file") },
  ];
  const openPalette = () => window.dispatchEvent(new Event("owner:palette"));

  return (
    <div className="pb-6">
      <header className="enter-tile pt-4 text-center sm:pt-8">
        <h1 className="font-serif text-[26px] font-medium leading-9 text-deep-ink sm:text-[28px] sm:leading-[42px]">{hi}, Claire.</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{fmtLong(now)}</p>
      </header>

      <button type="button" onClick={openPalette} style={{ animationDelay: "80ms" }}
        className="enter-spot mx-auto mt-6 flex h-12 w-full max-w-[600px] items-center gap-3 rounded-xl border border-line-1 bg-sheet px-4 text-left text-sm text-muted-foreground shadow-[0_2px_5px_rgba(55,73,87,0.08)] transition-colors duration-150 hover:border-line-2">
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate">Find a client, or jump to a page</span>
        <kbd className="hidden rounded border border-line-1 px-1.5 text-[11px] leading-5 sm:inline">⌘K</kbd>
      </button>

      <ul className="mx-auto mt-8 grid max-w-[760px] grid-cols-3 gap-1 sm:grid-cols-6">
        {shortcuts.map((s, i) => (
          <li key={s.label} className="enter-tile" style={{ animationDelay: `${160 + i * 80}ms` }}>
            <button type="button" onClick={s.onClick} disabled={s.disabled}
              className="group relative flex w-full flex-col items-center gap-2.5 rounded-2xl px-1 py-3 text-center transition-colors duration-200 hover:bg-tint-0 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent">
              <span className="grid size-12 place-items-center rounded-lg transition-transform duration-200 ease-pop group-hover:scale-110 group-disabled:scale-100" style={{ backgroundColor: `rgba(${s.rgb},0.1)`, color: `rgb(${s.rgb})` }}>
                <s.icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="text-[12.5px] font-medium leading-4 text-deep-ink">{s.label}</span>
              {!!s.count && <span className="tabular absolute right-3 top-1.5 grid min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[10px] font-semibold leading-5 text-white">{s.count}</span>}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-6">
        <div className="min-w-0 space-y-8">
          <section id="today-needs" className="scroll-mt-20">
            <div className="mb-3 flex items-center gap-2"><h2 className="t-sub">Needs you</h2>{!!needs.data?.length && <Tag>{needs.data.length}</Tag>}</div>
            {needs.isLoading && <LoadingRows n={3} />}
            {needs.isError && <ErrorNote onRetry={() => needs.refetch()} />}
            {needs.data && !needs.data.length && <Empty title="Nothing needs you.">Every appointment is on track. Exceptions show up here.</Empty>}
            {needs.data && !!needs.data.length && <NeedsList items={needs.data} />}
          </section>
          {!!toFile.data?.length && (
            <section id="today-to-file" className="scroll-mt-20">
              <div className="mb-3 flex items-center gap-2"><h2 className="t-sub">Ready to file</h2><Tag tone="success">{toFile.data.length}</Tag></div>
              <ApptList appts={toFile.data} showDate />
            </section>
          )}
        </div>
        <div className="min-w-0 space-y-8">
          <section id="today-appointments" className="scroll-mt-20">
            <div className="mb-3 flex items-center gap-2"><h2 className="t-sub">Today's schedule</h2>{!!q.data?.length && <Tag>{q.data.filter((a) => a.status !== "no_show").length}</Tag>}</div>
            {q.isLoading && <LoadingRows />}
            {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
            {q.data && !q.data.length && <Empty title="A quiet day.">Nothing on the calendar. New bookings show up here on their own.</Empty>}
            {q.data && !!q.data.length && <ApptList appts={q.data} />}
          </section>
          <section>
            <h2 className="mb-3 t-sub">Next up</h2>
            {upcoming.isLoading && <LoadingRows n={3} />}
            {upcoming.isError && <ErrorNote onRetry={() => upcoming.refetch()} />}
            {upcoming.data && !upcoming.data.length && <p className="text-sm text-muted-foreground">No appointments in the next two weeks.</p>}
            {upcoming.data && !!upcoming.data.length && <ApptList appts={upcoming.data.slice(0, 5)} showDate />}
          </section>
        </div>
      </div>
    </div>
  );
}
