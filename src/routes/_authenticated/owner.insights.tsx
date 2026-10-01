import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useOwnerCtx } from "@/components/owner/ctx";
import { et, etToIso } from "@/components/owner/lib";
import { ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";
import { MessageLog } from "@/components/owner/messages";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/owner/insights")({ head: () => ({ meta: [{ title: "Report — Hartwell Tax & Bookkeeping" }, { name: "robots", content: "noindex" }] }), component: Insights });

// Baselines from the practice before the new system (from the brief / Claire's estimate).
const BEFORE = { ready: 65, noShow: 12, msgsPerBooking: 6 };
const DAY = 86400e3;
const WEEKS = 5;

type Pt = { w: string; v: number };

function Insights() {
  const now = useOwnerCtx().data!.now;
  const q = useQuery({
    queryKey: ["owner", "insights2", now.slice(0, 13)],
    queryFn: async () => {
      const t = new Date(now).getTime();
      const from = new Date(t - WEEKS * 7 * DAY).toISOString();
      const monthStart = etToIso(`${et(now).ymd.slice(0, 8)}01`, 0);
      const [m, a, o, paid, owed] = await Promise.all([
        supabase.from("messages").select("type, minutes_saved, sent_at, appointment_id").gte("sent_at", from).lte("sent_at", now),
        supabase.from("appointments").select("id, start_at, created_at, status, ready_score, signature_status, signed_at, needs_attention, attention_reason").gte("start_at", from),
        supabase.from("waitlist_offers").select("status, created_at").in("status", ["claimed", "claimed_seen"]).gte("created_at", from),
        supabase.from("appointments").select("fee_cents, paid_at").not("paid_at", "is", null).gte("paid_at", monthStart).lte("paid_at", now),
        supabase.from("appointments").select("fee_cents").eq("status", "completed").is("paid_at", null).not("fee_cents", "is", null),
      ]);
      if (m.error ?? a.error ?? o.error ?? paid.error ?? owed.error) throw m.error ?? a.error ?? o.error ?? paid.error ?? owed.error;
      const sum = (r: { fee_cents: number | null }[]) => r.reduce((x, y) => x + (y.fee_cents ?? 0), 0);
      return { t, msgs: m.data ?? [], appts: a.data ?? [], offers: o.data ?? [], collected: sum(paid.data ?? []), owed: sum(owed.data ?? []), owedN: owed.data?.length ?? 0 };
    },
  });
  if (q.isLoading) return <div role="status" aria-label="Loading insights"><Skeleton className="h-4 w-36" /><Skeleton className="mt-4 h-12 w-80 max-w-full" /><Skeleton className="mt-4 h-5 w-64 max-w-full" /><div className="mt-8 grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="rounded-2xl border border-border bg-sheet p-5"><Skeleton className="h-5 w-44 max-w-full" /><Skeleton className="mt-3 h-9 w-24" /><Skeleton className="mt-5 h-32 w-full rounded-lg" /></div>)}</div><Skeleton className="mt-8 h-48 w-full rounded-2xl" /></div>;
  if (q.isError || !q.data) return <ErrorNote onRetry={() => q.refetch()} />;
  const { t, msgs, appts, offers, collected, owed, owedN } = q.data;
  const usd = (c: number) => `$${Math.round(c / 100).toLocaleString("en-US")}`;

  // Week buckets, oldest first
  const wk = (iso: string) => Math.floor((t - new Date(iso).getTime()) / (7 * DAY));
  const label = (i: number) => (i === 0 ? "This wk" : `${i}w ago`);
  const series = (fn: (i: number) => number): Pt[] => Array.from({ length: WEEKS }, (_, k) => WEEKS - 1 - k).map((i) => ({ w: label(i), v: fn(i) }));
  const in30 = (iso: string | null) => !!iso && t - new Date(iso).getTime() <= 30 * DAY && new Date(iso).getTime() <= t;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  const minutes30 = msgs.filter((x) => in30(x.sent_at)).reduce((s, x) => s + x.minutes_saved, 0);
  // Same rounding as the Today strip (one decimal), so the two never disagree.
  const hours30 = Math.round((minutes30 / 60) * 10) / 10;

  const held = appts.filter((x) => (x.status === "completed" || x.status === "no_show") && new Date(x.start_at).getTime() <= t);
  const completed = held.filter((x) => x.status === "completed");
  const ready = series((i) => { const c = completed.filter((x) => wk(x.start_at) === i); return pct(c.filter((x) => x.ready_score >= 100).length, c.length); });
  const ready30 = pct(completed.filter((x) => in30(x.start_at) && x.ready_score >= 100).length, completed.filter((x) => in30(x.start_at)).length);

  const startById = new Map(appts.map((x) => [x.id, x.start_at]));
  const avoidedMsgs = msgs.filter((x) => x.type === "reschedule_offer" && x.appointment_id && startById.get(x.appointment_id) && new Date(startById.get(x.appointment_id)!).getTime() - new Date(x.sent_at).getTime() > 49 * 3600e3);
  const avoided = series((i) => avoidedMsgs.filter((x) => wk(x.sent_at) === i).length);
  const avoided30 = avoidedMsgs.filter((x) => in30(x.sent_at)).length;

  const refilled = series((i) => offers.filter((x) => wk(x.created_at) === i).length);
  const refilled30 = offers.filter((x) => in30(x.created_at)).length;

  const booked = appts.filter((x) => new Date(x.created_at).getTime() <= t && x.status !== "cancelled");
  const hands = (x: (typeof appts)[number]) => !x.needs_attention && x.attention_reason !== "handled";
  const zero = series((i) => { const b = booked.filter((x) => wk(x.created_at) === i); return pct(b.filter(hands).length, b.length); });
  const zero30 = pct(booked.filter((x) => in30(x.created_at) && hands(x)).length, booked.filter((x) => in30(x.created_at)).length);

  const noShow = series((i) => { const h = held.filter((x) => wk(x.start_at) === i); return pct(h.filter((x) => x.status === "no_show").length, h.length); });
  const h30 = held.filter((x) => in30(x.start_at));
  const noShow30 = pct(h30.filter((x) => x.status === "no_show").length, h30.length);

  const signedList = appts.filter((x) => x.signature_status === "signed" && x.signed_at);
  const signed = series((i) => signedList.filter((x) => wk(x.signed_at!) === i).length);
  const signed30 = signedList.filter((x) => in30(x.signed_at)).length;

  const inTen = Math.max(0, Math.min(10, Math.round(ready30 / 10)));

  return (
    <>
      <Hero hours={hours30} minutes={minutes30} />
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-border p-5"><p className="text-xs font-medium text-muted-foreground">Collected this month</p><p className="tabular mt-1 text-2xl font-medium leading-8 text-deep-ink">{usd(collected)}</p></article>
        <article className="rounded-2xl border border-border p-5"><p className="text-xs font-medium text-muted-foreground">Waiting for payment</p><p className="tabular mt-1 text-2xl font-medium leading-8 text-deep-ink">{usd(owed)}</p><p className="text-xs text-muted-foreground">{owedN} return{owedN === 1 ? "" : "s"}</p></article>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric title="Arrived fully ready" value={`${ready30}%`} note={`before: ~${BEFORE.ready}%`} good={ready30 >= BEFORE.ready}>
          <AreaSpark data={ready} baseline={BEFORE.ready} max={100} suffix="%" />
        </Metric>
        <Metric title="Moved instead of wasted" value={String(avoided30)} note="moved after the document check">
          <Bars data={avoided} />
        </Metric>
        <Metric title="Times filled from the waitlist" value={String(refilled30)} note="freed times claimed by someone waiting">
          <Bars data={refilled} tone="marigold" />
        </Metric>
        <Metric title="Booked without you" value={`${zero30}%`} note="no call or email from you">
          <AreaSpark data={zero} max={100} suffix="%" />
        </Metric>
        <Metric title="No-show rate" value={`${noShow30}%`} note={`before: ~${BEFORE.noShow}%`} good={noShow30 <= BEFORE.noShow}>
          <AreaSpark data={noShow} baseline={BEFORE.noShow} max={Math.max(25, ...noShow.map((p) => p.v))} suffix="%" tone="marigold" />
        </Metric>
        <Metric title="Signatures collected automatically" value={String(signed30)} note="Form 8879, signed online">
          <Bars data={signed} />
        </Metric>
      </div>

      <section className="mt-6 grid overflow-hidden rounded-2xl border border-border md:grid-cols-2">
        <div className="bg-surface-2 p-6 md:p-8">
          <p className="text-xs font-medium text-muted-foreground">Before</p>
          <p className="mt-3 text-lg leading-7 text-muted-foreground">
            {BEFORE.msgsPerBooking} messages per booking.<br />1 in 3 clients unprepared.
          </p>
        </div>
        <div className="relative bg-primary p-6 text-primary-foreground md:p-8">
          <p className="text-xs font-medium text-primary-foreground/70">Now</p>
          <p className="mt-3 text-lg leading-7">
            0 messages from you.<br />{inTen} in 10 ready.
          </p>
        </div>
      </section>
      <p className="mt-3 text-xs text-muted-foreground">"Before" figures are your typical numbers before online scheduling.</p>
      <div className="mt-10"><MessageLog /></div>
    </>
  );
}

function Hero({ hours, minutes }: { hours: number; minutes: number }) {
  return (
    <>
      <PageHead title="Report" meta="Last 30 days, and every message sent for you" />
      <section className="relative overflow-hidden rounded-[22px] bg-ink-900 p-6 text-white sm:p-8">
        <p className="text-[13px] font-medium text-white/70">Hours given back to you</p>
        <p className="tabular mt-3 font-serif text-[64px] font-semibold leading-none tracking-[-0.04em]">{hours}<span className="ml-3 font-sans text-lg font-normal tracking-normal text-white/70">hour{hours === 1 ? "" : "s"}</span></p>
        <p className="tabular mt-4 max-w-md text-sm leading-6 text-white/75">{minutes.toLocaleString()} minutes of confirmations, reminders, follow-ups and payment chases that went out on their own instead of by hand.</p>
      </section>
    </>
  );
}

function Metric({ title, value, note, good, children }: { title: string; value: string; note: string; good?: boolean; children: ReactNode }) {
  return (
    <article className="flex flex-col rounded-2xl border border-border p-5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="tabular mt-1 text-2xl font-medium leading-8 text-deep-ink">{value}</p>
      <p className={`text-xs ${good === undefined ? "text-muted-foreground" : good ? "text-success" : "text-alert-warning-fg"}`}>{note}</p>
      <div className="mt-4 h-24">{children}</div>
    </article>
  );
}

const tip = (suffix = "") => (
  <Tooltip cursor={false}
    contentStyle={{ background: "var(--sheet)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-sheet)" }}
    labelStyle={{ color: "var(--muted-foreground)" }} formatter={(v: number) => [`${v}${suffix}`, ""]} separator="" />
);
const axis = <XAxis dataKey="w" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" />;

function AreaSpark({ data, baseline, max, suffix, tone = "ink" }: { data: Pt[]; baseline?: number; max: number; suffix?: string; tone?: "ink" | "marigold" }) {
  const c = tone === "ink" ? "var(--ink-green)" : "var(--marigold)";
  const id = `g-${tone}-${baseline ?? "x"}-${max}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={0.22} />
            <stop offset="100%" stopColor={c} stopOpacity={0} />
          </linearGradient>
        </defs>
        {axis}
        {baseline !== undefined && <ReferenceLine y={baseline} stroke="var(--muted-foreground)" strokeOpacity={0.45} strokeDasharray="3 4" />}
        <Area type="monotone" dataKey="v" stroke={c} strokeWidth={2} fill={`url(#${id})`} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
        {tip(suffix)}
        <YAxis hide domain={[0, max]} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
function Bars({ data, tone = "ink" }: { data: Pt[]; tone?: "ink" | "marigold" }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
        {axis}
        <Bar dataKey="v" radius={[6, 6, 2, 2]} fill={tone === "ink" ? "var(--ink-green)" : "var(--marigold)"} fillOpacity={0.85} maxBarSize={28} isAnimationActive={false} />
        {tip()}
      </BarChart>
    </ResponsiveContainer>
  );
}
