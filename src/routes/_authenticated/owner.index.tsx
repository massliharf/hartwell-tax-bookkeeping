import { NewAppointmentButton } from "@/components/owner/new-appointment";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useOwnerCtx } from "@/components/owner/ctx";
import { addDays, apptsRange, et, etToIso, fmtLong, needsYou, readyToFile } from "@/components/owner/lib";
import { ApptList, Empty, ErrorNote, LoadingRows, NeedsList, PageHead } from "@/components/owner/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useApptPanel } from "@/components/owner/drawer-context";

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
  const openAppt = useApptPanel();
  const review = needs.data?.filter(i => i.kind === "review") ?? [];
  const unpaid = needs.data?.filter(i => i.kind === "unpaid") ?? [];
  const otherNeeds = needs.data?.filter(i => i.kind !== "review" && i.kind !== "unpaid") ?? [];
  const tiles = [
    { label: "Today", value: q.data ? appts.length : null, target: "today-appointments", tone: undefined as undefined | "warn" | "ok", firstId: appts[0]?.id },
    { label: "Documents to check", value: needs.data ? review.reduce((sum, i) => sum + (i.kind === "review" ? i.count : 0), 0) : null, target: "today-review", tone: "warn", firstId: review[0]?.kind === "review" ? review[0].appt.id : undefined },
    { label: "Unpaid", value: needs.data ? unpaid.length : null, target: "today-unpaid", tone: "warn", firstId: unpaid[0]?.kind === "unpaid" ? unpaid[0].appt.id : undefined },
    { label: "Ready to file", value: toFile.data ? toFile.data.length : null, target: "today-to-file", tone: "ok", firstId: toFile.data?.[0]?.id },
  ];
  return <>
    <div className="enter-title"><PageHead title={`${hi}, Claire.`} meta={fmtLong(now)} actions={<NewAppointmentButton />} /></div>
    <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">{tiles.map((tile, ti) => <Button key={tile.label} style={{ animationDelay: `${ti * 80}ms` }} variant="ghost" disabled={tile.value === 0} onClick={() => { if (tile.firstId && !document.getElementById(tile.target)) openAppt({ appointmentId: tile.firstId }); else document.getElementById(tile.target)?.scrollIntoView({ behavior: "smooth" }); }} className="enter-tile h-auto min-h-[84px] flex-col items-start justify-between gap-2 rounded-xl border border-border bg-sheet p-3.5 text-left hover:bg-surface-2 disabled:bg-sheet disabled:opacity-60"><span className="flex w-full items-center justify-between gap-2 whitespace-normal text-xs text-muted-foreground">{tile.label}{!!tile.value && tile.tone && <span aria-hidden className={`size-2 shrink-0 rounded-full ${tile.tone === "warn" ? "bg-marigold" : "bg-success"}`} />}</span>{tile.value === null ? <Skeleton className="h-7 w-10" /> : <span className="tabular text-2xl font-medium leading-7 text-deep-ink">{tile.value}</span>}</Button>)}</div>
    {needs.isError && <ErrorNote onRetry={() => needs.refetch()} />}
    {review.length > 0 && <section id="today-review" className="mb-8 scroll-mt-20"><h2 className="mb-3 text-sm font-medium text-deep-ink">Documents to check</h2><NeedsList items={review} /></section>}
    {unpaid.length > 0 && <section id="today-unpaid" className="mb-8 scroll-mt-20"><h2 className="mb-3 text-sm font-medium text-deep-ink">Unpaid</h2><NeedsList items={unpaid} /></section>}
    {otherNeeds.length > 0 && <section id="today-needs" className="mb-8 scroll-mt-20"><h2 className="mb-3 text-sm font-medium text-deep-ink">Needs you</h2><NeedsList items={otherNeeds} /></section>}
    {toFile.data && toFile.data.length > 0 && <section id="today-to-file" className="mb-8 scroll-mt-20"><h2 className="mb-3 text-sm font-medium text-deep-ink">Ready to file</h2><p className="-mt-2 mb-3 text-xs text-muted-foreground">Signed and paid. Open one to mark it filed.</p><ApptList appts={toFile.data} showDate /></section>}
    <section id="today-appointments" className="mb-8 scroll-mt-20"><h2 className="mb-3 text-sm font-medium text-deep-ink">Today</h2>{q.isLoading && <LoadingRows />}{q.isError && <ErrorNote onRetry={() => q.refetch()} />}{q.data && !q.data.length && <Empty title="A quiet day.">Nothing on the calendar. New bookings will show up here on their own.</Empty>}{q.data && !!q.data.length && <ApptList appts={q.data} />}</section>
    <section><h2 className="mb-3 text-sm font-medium text-deep-ink">Next up</h2>{upcoming.isLoading && <LoadingRows n={3} />}{upcoming.isError && <ErrorNote onRetry={() => upcoming.refetch()} />}{upcoming.data && !upcoming.data.length && <p className="text-sm text-muted-foreground">No upcoming appointments in the next two weeks.</p>}{upcoming.data && !!upcoming.data.length && <ApptList appts={upcoming.data.slice(0, 5)} showDate />}</section>
  </>;
}
