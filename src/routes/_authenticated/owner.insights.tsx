import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { useOwnerCtx } from "@/components/owner/ctx";
import { MSG_LABEL } from "@/components/owner/lib";
import { ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/insights")({ component: Insights });

function Insights() {
  const now = useOwnerCtx().data!.now;
  const q = useQuery({
    queryKey: ["owner", "insights", now.slice(0, 13)],
    queryFn: async () => {
      const t = new Date(now).getTime();
      const ago30 = new Date(t - 30 * 86400e3).toISOString();
      const in14 = new Date(t + 14 * 86400e3).toISOString();
      const [m, up, past] = await Promise.all([
        supabase.from("messages").select("type, minutes_saved, sent_at"),
        supabase.from("appointments").select("ready_score").in("status", ["booked", "confirmed"]).gt("start_at", now).lte("start_at", in14),
        supabase.from("appointments").select("status, signature_status").gte("start_at", ago30).lte("start_at", now).in("status", ["completed", "no_show"]),
      ]);
      if (m.error ?? up.error ?? past.error) throw m.error ?? up.error ?? past.error;
      return { msgs: m.data ?? [], up: up.data ?? [], past: past.data ?? [], weekAgo: new Date(t - 7 * 86400e3).toISOString() };
    },
  });
  if (q.isLoading) return <LoadingRows />;
  if (q.isError || !q.data) return <ErrorNote onRetry={() => q.refetch()} />;
  const { msgs, up, past, weekAgo } = q.data;
  const total = msgs.reduce((s, x) => s + x.minutes_saved, 0);
  const week = msgs.filter((x) => x.sent_at >= weekAgo).reduce((s, x) => s + x.minutes_saved, 0);
  const avgReady = up.length ? Math.round(up.reduce((s, x) => s + x.ready_score, 0) / up.length) : 0;
  const fullyReady = up.filter((x) => x.ready_score >= 100).length;
  const noShows = past.filter((x) => x.status === "no_show").length;
  const signed = past.filter((x) => x.status === "completed" && x.signature_status === "signed").length;
  const completed = past.filter((x) => x.status === "completed").length;
  const byType = Object.entries(msgs.reduce<Record<string, number>>((acc, x) => ({ ...acc, [x.type]: (acc[x.type] ?? 0) + x.minutes_saved }), {})).sort((a, b) => b[1] - a[1]);
  const max = byType[0]?.[1] ?? 1;
  const hrs = (min: number) => (min / 60).toFixed(1).replace(/\.0$/, "");

  return (
    <>
      <PageHead eyebrow="Insights" title={<>You've got <span className="text-ink">{hrs(total)} hours</span> back.</>}>
        <p className="tabular">{hrs(week)} hours this week, from messages you didn't have to write.</p>
      </PageHead>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sheet-stack flex items-center gap-4 p-5">
          <ReadyRing value={avgReady} size={64} stroke={6} label="Average ready" />
          <div><p className="text-sm text-muted-foreground">Average readiness</p><p className="tabular text-sm text-deep-ink">next 2 weeks · {up.length} appts</p></div>
        </div>
        <Stat label="Fully ready" value={`${fullyReady} of ${up.length}`} note="upcoming appointments" />
        <Stat label="No-shows" value={String(noShows)} note={`last 30 days · ${signed}/${completed} signed`} />
      </div>
      <section className="sheet-stack mt-8 p-6">
        <h2 className="font-serif text-2xl text-deep-ink">Where the time came from</h2>
        <ul className="mt-5 space-y-3">
          {byType.map(([t, min]) => (
            <li key={t} className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-sm sm:grid-cols-[180px_1fr_70px]">
              <span className="truncate text-deep-ink">{MSG_LABEL[t] ?? t}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-sage"><span className="block h-full rounded-full bg-ink" style={{ width: `${(min / max) * 100}%` }} /></span>
              <span className="tabular text-right text-muted-foreground">{min} min</span>
            </li>
          ))}
          {!byType.length && <li className="text-sm text-muted-foreground">Nothing yet. Time saved shows up as messages go out.</li>}
        </ul>
      </section>
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="sheet-stack p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="tabular mt-1 font-serif text-4xl text-deep-ink">{value}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
