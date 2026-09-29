import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useOwnerCtx } from "@/components/owner/ctx";
import { addDays, apptsRange, et, etToIso, fmtLong, needsYou } from "@/components/owner/lib";
import { ApptCard, Empty, ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/")({ head: () => ({ meta: [{ title: "Today — Patel Tax & Bookkeeping" }, { name: "description", content: "Appointments and readiness for today." }, { property: "og:title", content: "Today — Patel Tax & Bookkeeping" }, { property: "og:description", content: "Appointments and readiness for today." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Today });

function Today() {
  const now = useOwnerCtx().data!.now;
  const { ymd, minutes } = et(now);
  const q = useQuery(apptsRange(etToIso(ymd, 0), etToIso(addDays(ymd, 1), 0)));
  const needs = useQuery(needsYou(now));
  const hi = minutes < 12 * 60 ? "Good morning" : minutes < 17 * 60 ? "Good afternoon" : "Good evening";
  const appts = (q.data ?? []).filter((a) => a.status !== "no_show");
  const ready = appts.filter((a) => a.ready_score >= 100).length;

  return (
    <>
       <PageHead eyebrow={fmtLong(now)} title={`${hi}, Priya.`} />
       <div className="mb-8 grid grid-cols-3 gap-3">{[["Appointments", appts.length], ["Ready", ready], ["Needs you", needs.data?.length ?? 0]].map(([label, count]) => <div key={label} className="rounded-[14px] bg-canvas p-4"><span className="tabular block text-3xl font-semibold text-deep-ink">{count}</span><span className="text-xs text-graphite sm:text-sm">{label}</span></div>)}</div>
      {q.isLoading && <LoadingRows />}
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
      {q.data && !q.data.length && <Empty title="A quiet day.">Nothing on the calendar. New bookings will show up here on their own.</Empty>}
       <div className="space-y-3">{q.data?.map((a) => <ApptCard key={a.id} a={a} />)}</div>
    </>
  );
}
