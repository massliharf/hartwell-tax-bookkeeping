import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useOwnerCtx } from "@/components/owner/ctx";
import { addDays, apptsRange, et, etToIso, fmtLong, needsYou } from "@/components/owner/lib";
import { ApptCard, Empty, ErrorNote, LoadingRows, NeedsList } from "@/components/owner/ui";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/owner/")({ head: () => ({ meta: [{ title: "Today — Hartwell Tax & Bookkeeping" }, { name: "description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:title", content: "Today — Hartwell Tax & Bookkeeping" }, { property: "og:description", content: "Today at Hartwell Tax & Bookkeeping." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Today });
function Today() {
  const now = useOwnerCtx().data!.now;
  const { ymd, minutes } = et(now);
  const q = useQuery(apptsRange(etToIso(ymd, 0), etToIso(addDays(ymd, 1), 0)));
  const upcoming = useQuery(apptsRange(etToIso(addDays(ymd, 1), 0), etToIso(addDays(ymd, 15), 0)));
  const needs = useQuery(needsYou(now));
  const hi = minutes < 12 * 60 ? "Good morning" : minutes < 17 * 60 ? "Good afternoon" : "Good evening";
  const appts = (q.data ?? []).filter(a => a.status !== "no_show");
  return <>
    <header className="mb-6"><h1 className="t-owner text-deep-ink">{hi}, Claire.</h1><p className="mt-1 text-xs text-muted-foreground">{fmtLong(now)}</p></header>
    <div className="mb-8 grid grid-cols-3 gap-2">{[
      { label: "Appointments today", value: q.data ? appts.length : null },
      { label: "Ready", value: q.data ? appts.filter(a => a.ready_score >= 100).length : null },
    ].map(tile => <div key={tile.label} className="min-h-[72px] rounded-lg border border-border bg-surface-2 p-2.5 sm:p-3"><p className="text-xs text-muted-foreground">{tile.label}</p>{tile.value === null ? <Skeleton className="mt-2 h-6 w-10" /> : <p className="tabular mt-1 text-xl font-medium text-deep-ink">{tile.value}</p>}</div>)}<button type="button" onClick={() => document.getElementById("today-needs")?.scrollIntoView({ behavior: "smooth" })} className="min-h-[72px] rounded-lg border border-border bg-surface-2 p-2.5 text-left transition-colors duration-150 hover:bg-fill-subtle sm:p-3"><span className="block text-xs text-muted-foreground">Needs you</span>{needs.data ? <span className="tabular mt-1 block text-xl font-medium text-deep-ink">{needs.data.length}</span> : <Skeleton className="mt-2 h-6 w-10" />}</button></div>
    {needs.isError && <ErrorNote onRetry={() => needs.refetch()} />}
    {needs.data && needs.data.length > 0 && <section id="today-needs" className="mb-8 scroll-mt-20"><h2 className="mb-3 font-sans text-xl font-medium text-deep-ink">Needs you</h2><NeedsList items={needs.data} /></section>}
    <section className="mb-8"><h2 className="mb-3 font-sans text-xl font-medium text-deep-ink">Today</h2>{q.isLoading && <LoadingRows />}{q.isError && <ErrorNote onRetry={() => q.refetch()} />}{q.data && !q.data.length && <Empty title="A quiet day.">Nothing on the calendar. New bookings will show up here on their own.</Empty>}{q.data && !!q.data.length && <div className="overflow-hidden rounded-2xl border border-border">{q.data.map(a => <ApptCard key={a.id} a={a} />)}</div>}</section>
    <section><h2 className="mb-3 font-sans text-xl font-medium text-deep-ink">Next up</h2>{upcoming.isLoading && <LoadingRows n={3} />}{upcoming.isError && <ErrorNote onRetry={() => upcoming.refetch()} />}{upcoming.data && !upcoming.data.length && <p className="text-sm text-muted-foreground">No upcoming appointments in the next two weeks.</p>}{upcoming.data && !!upcoming.data.length && <div className="overflow-hidden rounded-2xl border border-border">{upcoming.data.slice(0, 3).map(a => <ApptCard key={a.id} a={a} showDate />)}</div>}</section>
  </>;
}
