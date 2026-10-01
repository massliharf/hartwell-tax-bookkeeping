import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus } from "lucide-react";
import { useOwnerCtx } from "@/components/owner/ctx";
import { supabase } from "@/integrations/supabase/client";
import { addDays, apptsRange, et, etToIso, fmtLong, needsYou, readyToFile } from "@/components/owner/lib";
import { ApptList, Empty, ErrorNote, LoadingRows, NeedsList } from "@/components/owner/ui";
import { NewAppointmentButton, openNewAppointment } from "@/components/owner/new-appointment";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/_authenticated/owner/")({ head: () => ({ meta: [{ title: "Today — Hartwell Tax & Bookkeeping" }, { name: "description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:title", content: "Today — Hartwell Tax & Bookkeeping" }, { property: "og:description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Today });


/** Home base: what went out on its own, what needs Claire, and today. Navigation, search and New appointment live in the sidebar. */
function Today() {
  const now = useOwnerCtx().data!.now;
  const { ymd, minutes } = et(now);
  const q = useQuery(apptsRange(etToIso(ymd, 0), etToIso(addDays(ymd, 1), 0)));
  const needs = useQuery(needsYou(now));
  const toFile = useQuery(readyToFile());
  const hi = minutes < 12 * 60 ? "Good morning" : minutes < 17 * 60 ? "Good afternoon" : "Good evening";
  return (
    <div className="reveal-children pb-6">
      <header className="flex items-start justify-between gap-3 pt-2 sm:pt-4">
        <div>
        <h1 className="font-serif text-[26px] font-medium leading-9 text-deep-ink sm:text-[28px] sm:leading-[42px]">{hi}, Claire.</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{fmtLong(now)}</p>
        </div>
        <div className="sm:hidden"><NewAppointmentButton /></div>
      </header>

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
            {q.data && <TodaySchedule appts={q.data} now={now} ymd={ymd} />}
          </section>
        </div>
      </div>
    </div>
  );
}

/** Owner-effort, up front: what this week would have cost Claire by hand, from real messages and appointments. */
function SavedBanner({ now }: { now: string }) {
  const q = useQuery({
    queryKey: ["owner", "saved-week", now.slice(0, 13)],
    queryFn: async () => {
      const t = Date.parse(now);
      const from = new Date(t - 7 * 86400e3).toISOString();
      const [m, o, a] = await Promise.all([
        supabase.from("messages").select("type, minutes_saved, sent_at, appointment_id").gte("sent_at", from).lte("sent_at", now),
        supabase.from("waitlist_offers").select("status, created_at").in("status", ["claimed", "claimed_seen"]).gte("created_at", from),
        supabase.from("appointments").select("id, start_at").gte("start_at", from),
      ]);
      if (m.error ?? o.error ?? a.error) throw m.error ?? o.error ?? a.error;
      const msgs = m.data ?? [];
      const startById = new Map((a.data ?? []).map((x) => [x.id, x.start_at]));
      const reminders = msgs.filter((x) => ["docs_reminder_7d", "readiness_check_48h", "final_reminder_24h", "signature_reminder", "payment_reminder"].includes(x.type)).length;
      const confirmed = msgs.filter((x) => x.type === "booking_confirmation").length;
      // A later time was offered more than 49 hours before the appointment and taken: an empty chair avoided.
      const avoided = msgs.filter((x) => x.type === "reschedule_offer" && x.appointment_id && startById.get(x.appointment_id) && Date.parse(startById.get(x.appointment_id)!) - Date.parse(x.sent_at) > 49 * 3600e3).length;
      const minutes = msgs.reduce((n, x) => n + (x.minutes_saved ?? 0), 0);
      return { count: msgs.length, confirmed, reminders, avoided, refilled: o.data?.length ?? 0, minutes };
    },
  });
  if (!q.data || q.data.count === 0) return null;
  const h = q.data.minutes / 60;
  const hours = h >= 1 ? `${Math.round(h * 10) / 10}h` : `${q.data.minutes}m`;
  const stats: [string, string][] = [
    [String(q.data.confirmed), `appointment${q.data.confirmed === 1 ? "" : "s"} confirmed without you`],
    [String(q.data.reminders), `reminder${q.data.reminders === 1 ? "" : "s"} sent`],
    [String(q.data.avoided + q.data.refilled), "empty chairs avoided"],
    [hours, "given back to you"],
  ];
  return (
    <Link to="/owner/insights" className="group mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-ink-900 text-white transition-opacity duration-150 hover:opacity-95 sm:grid-cols-4" aria-label="This week, handled automatically. Open the report.">
      {stats.map(([v, l]) => (
        <span key={l} className="flex flex-col gap-1 px-4 py-4 sm:px-5">
          <span className="tabular font-serif text-[28px] font-semibold leading-none tracking-[-0.03em]">{v}</span>
          <span className="text-[12px] leading-4 text-white/75">{l}</span>
        </span>
      ))}
      <span className="col-span-2 flex items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-[12px] text-white/75 sm:col-span-4 sm:px-5">This week, handled without you.<ChevronRight className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" /></span>
    </Link>
  );
}

/**
 * Today, in order: what's done (dimmed), a "Now" line, what's next, and the open time Claire could still fill.
 * Open time uses the opening hours in Settings; clicking it starts a new appointment.
 */
function TodaySchedule({ appts, now, ymd }: { appts: import("@/components/owner/lib").Appt[]; now: string; ymd: string }) {
  const hours = useQuery({ queryKey: ["owner", "hours"], queryFn: async () => ((await supabase.from("settings").select("hours").eq("id", 1).maybeSingle()).data?.hours ?? {}) as Record<string, [string, string] | null> });
  const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const h = hours.data?.[DOW[new Date(`${ymd}T12:00:00Z`).getUTCDay()]!];
  const nowMin = et(now).minutes;
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const fmt = (m: number) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "AM" : "PM"}`;
  const list = [...appts].filter((a) => a.status !== "cancelled").sort((x, y) => x.start_at.localeCompare(y.start_at));
  const past = list.filter((a) => Date.parse(a.end_at) <= Date.parse(now));
  const ahead = list.filter((a) => Date.parse(a.end_at) > Date.parse(now));
  // Gaps of 45+ minutes between now and closing.
  const gaps: { from: number; to: number }[] = [];
  if (h) {
    let cur = Math.max(toMin(h[0]), Math.ceil(nowMin / 15) * 15);
    const close = toMin(h[1]);
    for (const a of ahead) {
      const s0 = et(a.start_at).minutes, e0 = s0 + (Date.parse(a.end_at) - Date.parse(a.start_at)) / 60000;
      if (s0 - cur >= 45) gaps.push({ from: cur, to: s0 });
      cur = Math.max(cur, e0);
    }
    if (close - cur >= 45) gaps.push({ from: cur, to: close });
  }
  type Row = { kind: "appt"; a: (typeof list)[number]; at: number } | { kind: "gap"; from: number; to: number; at: number };
  const rows: Row[] = [...ahead.map((a) => ({ kind: "appt" as const, a, at: et(a.start_at).minutes })), ...gaps.map((g) => ({ kind: "gap" as const, ...g, at: g.from }))].sort((x, y) => x.at - y.at);
  if (!list.length && !gaps.length) return <Empty title="A quiet day.">Nothing on the calendar. New appointments show up here on their own.</Empty>;
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {past.map((a, i) => <div key={a.id} className="enter-item border-b border-border opacity-60 last:border-0" style={{ animationDelay: `${150 + i * 30}ms` }}><ApptList appts={[a]} bare /></div>)}
      {past.length > 0 && rows.length > 0 && (
        <div className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-destructive" aria-label={`Now, ${fmt(nowMin)}`}>
          <span className="size-1.5 rounded-full bg-destructive" />Now, {fmt(nowMin)}<span className="h-px flex-1 bg-destructive/30" />
        </div>
      )}
      {rows.map((r, i) => r.kind === "appt"
        ? <div key={r.a.id} className="enter-item border-b border-border last:border-0" style={{ animationDelay: `${150 + (past.length + i) * 30}ms` }}><ApptList appts={[r.a]} bare /></div>
        : (
          <button key={`gap-${r.from}`} type="button" onClick={() => openNewAppointment()} style={{ animationDelay: `${150 + (past.length + i) * 30}ms` }}
            className="enter-item group flex min-h-12 w-full items-center gap-3 border-b border-dashed border-line-2 px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors duration-150 last:border-0 hover:bg-ink-50 hover:text-ink">
            <span className="tabular w-[76px] shrink-0">{fmt(r.from)}</span>
            <span className="flex-1">Open until {fmt(r.to)}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-ink opacity-0 transition-opacity duration-150 group-hover:opacity-100"><Plus className="size-3.5" />Add</span>
          </button>
        ))}
    </div>
  );
}
