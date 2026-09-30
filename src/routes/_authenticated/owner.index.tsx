import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, CalendarDays, CreditCard, FileSearch, Plus, Send, Users, type LucideIcon } from "lucide-react";
import { useOwnerCtx } from "@/components/owner/ctx";
import { supabase } from "@/integrations/supabase/client";
import { addDays, apptsRange, et, etToIso, fmtLong, needsYou, readyToFile } from "@/components/owner/lib";
import { ApptList, Empty, ErrorNote, LoadingRows, NeedsList } from "@/components/owner/ui";
import { useApptPanel } from "@/components/owner/drawer-context";
import { openNewAppointment } from "@/components/owner/new-appointment";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/_authenticated/owner/")({ head: () => ({ meta: [{ title: "Today — Hartwell Tax & Bookkeeping" }, { name: "description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:title", content: "Today — Hartwell Tax & Bookkeeping" }, { property: "og:description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Today });

type Shortcut = { label: string; icon: LucideIcon; rgb: string; count?: number | undefined; onClick: () => void; disabled?: boolean };

/** Home base: greeting, shortcuts, then the work in two columns. Search stays in the owner navigation. */
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
    { label: "New appointment", icon: Plus, rgb: "122,31,31", onClick: openNewAppointment },
    { label: "Calendar", icon: CalendarDays, rgb: "125,91,166", onClick: () => navigate({ to: "/owner/calendar" }) },
    { label: "Clients", icon: Users, rgb: "62,125,96", onClick: () => navigate({ to: "/owner/clients" }) },
    { label: "Documents to check", icon: FileSearch, rgb: "196,128,20", count: reviewCount, disabled: !reviewCount, onClick: () => { const r = review[0]; if (r) openAppt({ appointmentId: r.id }); } },
    { label: "Unpaid", icon: CreditCard, rgb: "179,38,30", count: unpaid.length, disabled: !unpaid.length, onClick: () => scrollTo("today-needs") },
    { label: "Ready to file", icon: Send, rgb: "30,107,69", count: toFile.data?.length ?? 0, disabled: !toFile.data?.length, onClick: () => scrollTo("today-to-file") },
  ];
  return (
    <div className="pb-6">
      <header className="pt-2 text-left sm:pt-4">
        <h1 className="font-serif text-[26px] font-medium leading-9 text-deep-ink sm:text-[28px] sm:leading-[42px]">{hi}, Claire.</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{fmtLong(now)}</p>
      </header>

      <ul className="mt-5 grid grid-cols-3 gap-1 sm:mt-6 sm:grid-cols-6 lg:max-w-[760px]">
        {shortcuts.map((s) => (
          <li key={s.label}>
            <button type="button" onClick={s.onClick} disabled={s.disabled}
              className="group relative flex w-full flex-col items-center gap-2.5 rounded-2xl px-1 py-3 text-center transition-colors duration-150 hover:bg-tint-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent">
              <span className="grid size-12 place-items-center rounded-lg" style={{ backgroundColor: `rgba(${s.rgb},0.1)`, color: `rgb(${s.rgb})` }}>
                <s.icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="text-[12.5px] font-medium leading-4 text-deep-ink">{s.label}</span>
              {!!s.count && <span className="tabular absolute right-3 top-1.5 grid min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[10px] font-semibold leading-5 text-white">{s.count}</span>}
            </button>
          </li>
        ))}
      </ul>

      <SavedBanner now={now} />

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-6">
        <div className="min-w-0 space-y-8">
          <section id="today-needs" className="scroll-mt-20">
            <div className="mb-3 flex items-center gap-2"><h2 className="t-sub">Needs you</h2>{!!needs.data?.length && <Tag tone="warning">{needs.data.length}</Tag>}</div>
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

/** Owner-effort, up front: what went out on its own this week, linking to the Report. */
function SavedBanner({ now }: { now: string }) {
  const q = useQuery({
    queryKey: ["owner", "saved-week", now.slice(0, 13)],
    queryFn: async () => {
      const from = new Date(Date.parse(now) - 7 * 86400e3).toISOString();
      const { data, error } = await supabase.from("messages").select("minutes_saved").gte("sent_at", from).lte("sent_at", now);
      if (error) throw error;
      return { count: data?.length ?? 0, minutes: (data ?? []).reduce((n, m) => n + (m.minutes_saved ?? 0), 0) };
    },
  });
  if (!q.data || q.data.count === 0) return null;
  const h = q.data.minutes / 60;
  return (
    <Link to="/owner/insights" className="enter-tile group mt-6 flex items-center gap-4 rounded-[22px] lg:max-w-[760px] bg-ink-900 px-5 py-4 text-white transition-opacity duration-150 hover:opacity-95" style={{ animationDelay: "650ms" }}>
      <span className="tabular font-serif text-[34px] font-semibold leading-none tracking-[-0.03em]">{h >= 1 ? `${Math.round(h * 10) / 10}h` : `${q.data.minutes}m`}</span>
      <span className="min-w-0 flex-1 text-sm leading-5 text-white/80"><span className="font-medium text-white">given back to you this week.</span> {q.data.count} confirmations, reminders and follow-ups went out on their own.</span>
      <ChevronRight className="size-4 shrink-0 text-white/60 transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}
