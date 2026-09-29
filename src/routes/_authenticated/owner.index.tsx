import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useOwnerCtx } from "@/components/owner/ctx";
import { addDays, apptsRange, et, etToIso, fmtLong } from "@/components/owner/lib";
import { ApptCard, Empty, ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/")({ head: () => ({ meta: [{ title: "Today — Patel Tax & Bookkeeping" }] }), component: Today });

function Today() {
  const now = useOwnerCtx().data!.now;
  const { ymd, minutes } = et(now);
  const q = useQuery(apptsRange(etToIso(ymd, 0), etToIso(addDays(ymd, 1), 0)));
  const hi = minutes < 12 * 60 ? "Good morning" : minutes < 17 * 60 ? "Good afternoon" : "Good evening";
  const appts = (q.data ?? []).filter((a) => a.status !== "no_show");
  const ready = appts.filter((a) => a.ready_score >= 100).length;

  return (
    <>
      <PageHead eyebrow={fmtLong(now)} title={`${hi}, Priya.`}>
        {q.data && (appts.length
          ? <p>{appts.length} appointment{appts.length === 1 ? "" : "s"} today, {ready} ready.</p>
          : <p>No appointments today.</p>)}
      </PageHead>
      {q.isLoading && <LoadingRows />}
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
      {q.data && !q.data.length && <Empty title="A quiet day.">Nothing on the calendar. New bookings will show up here on their own.</Empty>}
      <div className="space-y-6">{q.data?.map((a) => <ApptCard key={a.id} a={a} />)}</div>
    </>
  );
}
