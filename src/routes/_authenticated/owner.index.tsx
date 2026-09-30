import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useOwnerCtx } from "@/components/owner/ctx";
import { addDays, apptsRange, et, etToIso, fmtLong, needsYou, readyToFile } from "@/components/owner/lib";
import { ApptList, Empty, ErrorNote, LoadingRows, NeedsList, PageHead } from "@/components/owner/ui";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/owner/")({ head: () => ({ meta: [{ title: "Today — Hartwell Tax & Bookkeeping" }, { name: "description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:title", content: "Today — Hartwell Tax & Bookkeeping" }, { property: "og:description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Today });
function Today() {
  const now = useOwnerCtx().data!.now;
  const { ymd, minutes } = et(now);
  const q = useQuery(apptsRange(etToIso(ymd, 0), etToIso(addDays(ymd, 1), 0)));
  const upcoming = useQuery(apptsRange(etToIso(addDays(ymd, 1), 0), etToIso(addDays(ymd, 15), 0)));
  const needs = useQuery(needsYou(now));
  const toFile = useQuery(readyToFile());
  const hi = minutes < 12 * 60 ? "Good morning" : minutes < 17 * 60 ? "Good afternoon" : "Good evening";
  const appts = (q.data ?? []).filter(a => a.status !== "no_show");
  return <>
    <PageHead title={`${hi}, Claire.`} meta={fmtLong(now)} />
    <div className="mb-8 grid grid-cols-3 gap-2">{[
      { label: "Today", value: q.data ? appts.length : null },
      { label: "Ready", value: q.data ? appts.filter(a => a.ready_score >= 100).length : null },
    ].map(tile => <div key={tile.label} className="min-h-[72px] rounded-lg border border-border bg-surface-2 p-2.5 sm:p-3"><p className="text-xs text-muted-foreground">{tile.label}</p>{tile.value === null ? <Skeleton className="mt-2 h-6 w-10" /> : <p className="tabular mt-1 text-xl font-medium text-deep-ink">{tile.value}</p>}</div>)}<button type="button" onClick={() => document.getElementById("today-needs")?.scrollIntoView({ behavior: "smooth" })} className="min-h-[72px] rounded-lg border border-border bg-surface-2 p-2.5 text-left transition-colors duration-150 hover:bg-fill-subtle sm:p-3"><span className="block text-xs text-muted-foreground">Needs you</span>{needs.data ? <span className="tabular mt-1 block text-xl font-medium text-deep-ink">{needs.data.length}</span> : <Skeleton className="mt-2 h-6 w-10" />}</button></div>
    {needs.isError && <ErrorNote onRetry={() => needs.refetch()} />}
    {needs.data && needs.data.length > 0 && <section id="today-needs" className="mb-8 scroll-mt-20"><h2 className="mb-3 text-sm font-medium text-deep-ink">Needs you</h2><NeedsList items={needs.data} /></section>}
    {toFile.data && toFile.data.length > 0 && <section className="mb-8"><h2 className="mb-3 text-sm font-medium text-deep-ink">Ready to file</h2><p className="-mt-2 mb-3 text-xs text-muted-foreground">Signed and paid. Open one to mark it filed.</p><ApptList appts={toFile.data} showDate /></section>}
    <section className="mb-8"><h2 className="mb-3 text-sm font-medium text-deep-ink">Today</h2>{q.isLoading && <LoadingRows />}{q.isError && <ErrorNote onRetry={() => q.refetch()} />}{q.data && !q.data.length && <Empty title="A quiet day.">Nothing on the calendar. New bookings will show up here on their own.</Empty>}{q.data && !!q.data.length && <ApptList appts={q.data} />}</section>
    <section><h2 className="mb-3 text-sm font-medium text-deep-ink">Next up</h2>{upcoming.isLoading && <LoadingRows n={3} />}{upcoming.isError && <ErrorNote onRetry={() => upcoming.refetch()} />}{upcoming.data && !upcoming.data.length && <p className="text-sm text-muted-foreground">No upcoming appointments in the next two weeks.</p>}{upcoming.data && !!upcoming.data.length && <ApptList appts={upcoming.data.slice(0, 5)} showDate />}</section>
  </>;
}
