import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { useOwnerCtx } from "@/components/owner/ctx";
import { ErrorNote, LoadingRows } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/insights")({ component: Insights });

// Baselines from the practice before the new system (from the brief / Priya's estimate).
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
      const [m, a, o] = await Promise.all([
        supabase.from("messages").select("type, minutes_saved, sent_at, appointment_id").gte("sent_at", from).lte("sent_at", now),
        supabase.from("appointments").select("id, start_at, created_at, status, ready_score, signature_status, signed_at, needs_attention, attention_reason").gte("start_at", from),
        supabase.from("waitlist_offers").select("status, created_at").in("status", ["claimed", "claimed_seen"]).gte("created_at", from),
      ]);
      if (m.error ?? a.error ?? o.error) throw m.error ?? a.error ?? o.error;
      return { t, msgs: m.data ?? [], appts: a.data ?? [], offers: o.data ?? [] };
    },
  });
  if (q.isLoading) return <LoadingRows n={4} />;
  if (q.isError || !q.data) return <ErrorNote onRetry={() => q.refetch()} />;
  const { t, msgs, appts, offers } = q.data;

  // Week buckets, oldest first
  const wk = (iso: string) => Math.floor((t - new Date(iso).getTime()) / (7 * DAY));
  const label = (i: number) => (i === 0 ? "This wk" : `${i}w ago`);
  const series = (fn: (i: number) => number): Pt[] => Array.from({ length: WEEKS }, (_, k) => WEEKS - 1 - k).map((i) => ({ w: label(i), v: fn(i) }));
  const in30 = (iso: string | null) => !!iso && t - new Date(iso).getTime() <= 30 * DAY && new Date(iso).getTime() <= t;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  const minutes30 = msgs.filter((x) => in30(x.sent_at)).reduce((s, x) => s + x.minutes_saved, 0);
  const hours30 = Math.round(minutes30 / 60);

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

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Metric title="Arrived fully ready" value={`${ready30}%`} note={`before: ~${BEFORE.ready}%`} good={ready30 >= BEFORE.ready}>
          <AreaSpark data={ready} baseline={BEFORE.ready} max={100} suffix="%" />
        </Metric>
        <Metric title="Wasted appointments avoided" value={String(avoided30)} note="moved after the readiness check">
          <Bars data={avoided} />
        </Metric>
        <Metric title="Slots refilled from the waitlist" value={String(refilled30)} note="freed times claimed by someone waiting">
          <Bars data={refilled} tone="marigold" />
        </Metric>
        <Metric title="Booked with zero involvement" value={`${zero30}%`} note="no call, no email from you">
          <AreaSpark data={zero} max={100} suffix="%" />
        </Metric>
        <Metric title="No-show rate" value={`${noShow30}%`} note={`before: ~${BEFORE.noShow}%`} good={noShow30 <= BEFORE.noShow}>
          <AreaSpark data={noShow} baseline={BEFORE.noShow} max={Math.max(25, ...noShow.map((p) => p.v))} suffix="%" tone="marigold" />
        </Metric>
        <Metric title="Signatures collected automatically" value={String(signed30)} note="Form 8879, signed online">
          <Bars data={signed} />
        </Metric>
      </div>

      <section className="mt-12 grid overflow-hidden rounded-2xl border border-border shadow-sheet md:grid-cols-2">
        <div className="bg-paper-deep/60 p-7 md:p-9">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Before</p>
          <p className="mt-4 font-serif text-3xl leading-snug text-deep-ink/60 md:text-4xl">
            {BEFORE.msgsPerBooking} messages per booking.<br />1 in 3 clients unprepared.
          </p>
        </div>
        <div className="relative bg-ink p-7 text-primary-foreground md:p-9">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-marigold">Now</p>
          <p className="mt-4 font-serif text-3xl leading-snug md:text-4xl">
            0 messages from you.<br />{inTen} in 10 ready.
          </p>
          <div className="absolute right-6 top-6 hidden sm:block"><ReadyRing value={ready30} size={56} stroke={5} label="Ready" /></div>
        </div>
      </section>
      <p className="mt-3 text-xs text-muted-foreground">Last 30 days. "Before" figures are the practice's typical numbers before online booking.</p>
    </>
  );
}

function Hero({ hours, minutes }: { hours: number; minutes: number }) {
  const reduce = useReducedMotion();
  return (
    <header className="ledger relative overflow-hidden rounded-3xl border border-border bg-sheet px-7 py-12 shadow-sheet md:px-12 md:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Insights · last 30 days</p>
      <motion.h1 initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 font-serif text-5xl leading-[1.02] text-deep-ink md:text-7xl">
        <span className="tabular text-ink">{hours}</span> hour{hours === 1 ? "" : "s"} given back<br className="hidden sm:block" /> this month.
      </motion.h1>
      <p className="tabular mt-4 max-w-md text-muted-foreground">{minutes.toLocaleString()} minutes of messages, reminders and follow-ups you didn't have to write.</p>
      <motion.span aria-hidden initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-8 block h-1 w-24 origin-left rounded-full bg-marigold" />
    </header>
  );
}

function Metric({ title, value, note, good, children }: { title: string; value: string; note: string; good?: boolean; children: ReactNode }) {
  return (
    <article className="sheet-stack flex flex-col p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="tabular mt-1 font-serif text-5xl text-deep-ink">{value}</p>
      <p className={`text-xs ${good === undefined ? "text-muted-foreground" : good ? "text-success" : "text-warning"}`}>{note}</p>
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
        <Area type="monotone" dataKey="v" stroke={c} strokeWidth={2} fill={`url(#${id})`} dot={false} activeDot={{ r: 3 }} isAnimationActive />
        {tip(suffix)}
        <YDomain max={max} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
// Fixed y-domain without drawing an axis
import { YAxis } from "recharts";
function YDomain({ max }: { max: number }) {
  return <YAxis hide domain={[0, max]} />;
}

function Bars({ data, tone = "ink" }: { data: Pt[]; tone?: "ink" | "marigold" }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
        {axis}
        <Bar dataKey="v" radius={[6, 6, 2, 2]} fill={tone === "ink" ? "var(--ink-green)" : "var(--marigold)"} fillOpacity={0.85} maxBarSize={28} />
        {tip()}
      </BarChart>
    </ResponsiveContainer>
  );
}
