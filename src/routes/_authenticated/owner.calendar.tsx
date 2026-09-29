import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useOwnerCtx } from "@/components/owner/ctx";
import { addDays, apptsRange, et, etToIso, fmtLong, fmtTime, missingOf, readiness, readinessStyle, ymdLabel, type Appt } from "@/components/owner/lib";
import { ErrorNote, MeetingTag, PageHead, StatusPill, useApptActions } from "@/components/owner/ui";
import { ownerMoveAppointment } from "@/lib/owner.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/owner/calendar")({ head: () => ({ meta: [{ title: "Calendar — Hartwell Tax & Bookkeeping" }, { name: "robots", content: "noindex" }] }), component: CalendarPage });

const START = 9 * 60, END = 18 * 60, PX = 1.1; // px per minute
const mondayOf = (ymd: string) => {
  const dow = new Date(`${ymd}T12:00:00Z`).getUTCDay();
  return addDays(ymd, dow === 0 ? -6 : 1 - dow);
};

function CalendarPage() {
  const now = useOwnerCtx().data!.now;
  const [week, setWeek] = useState(() => mondayOf(et(now).ymd));
  const days = Array.from({ length: 6 }, (_, i) => addDays(week, i));
  const q = useQuery(apptsRange(etToIso(week, 0), etToIso(addDays(week, 7), 0)));
  const [openId, setOpenId] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const qc = useQueryClient();
  const move = useServerFn(ownerMoveAppointment);
  const mv = useMutation({
    mutationFn: (v: { id: string; start: string }) => move({ data: v }),
    onSuccess: (r) => {
      if (r.ok) toast.success("Moved. The client has been emailed the new time.");
      else toast.error(r.error ?? "That time isn't free.");
      qc.invalidateQueries({ queryKey: ["owner"] });
    },
    onError: () => toast.error("Couldn't move it. Try again."),
  });
  const byDay = (d: string) => (q.data ?? []).filter((a) => et(a.start_at).ymd === d);
  const selected = q.data?.find((a) => a.id === openId) ?? null;
  const today = et(now).ymd;

  const onDrop = (e: React.DragEvent<HTMLDivElement>, ymd: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDrag(null);
    if (!id) return;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const mins = START + Math.max(0, Math.round(y / PX / 15) * 15);
    const a = q.data?.find((x) => x.id === id);
    if (!a || (et(a.start_at).ymd === ymd && et(a.start_at).minutes === mins)) return;
    mv.mutate({ id, start: etToIso(ymd, mins) });
  };

  return (
    <>
      <PageHead eyebrow="Calendar" title={`Week of ${ymdLabel(week)}`}>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="icon" variant="outline" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}><ChevronLeft /></Button>
          <Button size="sm" variant="ghost" onClick={() => setWeek(mondayOf(today))}>This week</Button>
          <Button size="icon" variant="outline" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}><ChevronRight /></Button>
          <Legend />
        </div>
      </PageHead>
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
      <p className="mb-3 hidden text-xs text-muted-foreground md:block">Drag an appointment to move it. The client is emailed automatically.</p>

      {/* Desktop week grid */}
      <div className="sheet-stack hidden overflow-hidden md:block">
        <div className="grid grid-cols-[52px_repeat(6,1fr)] border-b border-border bg-sheet">
          <div />
          {days.map((d) => (
            <div key={d} className={cn("px-2 py-3 text-center text-xs font-medium text-muted-foreground", d === today && "text-ink")}>{ymdLabel(d)}</div>
          ))}
        </div>
        <div className="grid grid-cols-[52px_repeat(6,1fr)]" style={{ height: (END - START) * PX }}>
          <div className="relative">
            {Array.from({ length: (END - START) / 60 }, (_, i) => (
              <span key={i} className="tabular absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: i * 60 * PX }}>{i === 0 ? "" : `${((9 + i - 1) % 12) + 1}${9 + i < 12 ? "a" : "p"}`}</span>
            ))}
          </div>
          {days.map((d) => (
            <div key={d} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, d)}
              className={cn("relative border-l border-border ledger transition-colors", drag && "bg-fill-neutral/30", d === today && "bg-marigold/5")}
              style={{ backgroundSize: `100% ${60 * PX}px` }}>
              {byDay(d).map((a) => {
                const { minutes } = et(a.start_at);
                const h = (new Date(a.end_at).getTime() - new Date(a.start_at).getTime()) / 60000;
                return (
                  <button key={a.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.id); setDrag(a.id); }} onDragEnd={() => setDrag(null)}
                    onClick={() => setOpenId(a.id)}
                    className={cn("absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-left text-[11px] leading-tight transition-transform hover:-translate-y-px",
                      readinessStyle[readiness(a.ready_score)], a.status === "completed" && "opacity-60", drag === a.id && "opacity-40")}
                    style={{ top: (minutes - START) * PX, height: Math.max(22, h * PX - 2) }}>
                    <span className="tabular block font-medium">{fmtTime(a.start_at)} · {a.ready_score}%</span>
                    <span className="block truncate text-deep-ink">{a.clients?.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: day by day */}
      <div className="space-y-6 md:hidden">
        {days.map((d) => (
          <section key={d}>
            <h2 className={cn("mb-2 text-sm font-medium text-muted-foreground", d === today && "text-ink")}>{ymdLabel(d)}</h2>
            {byDay(d).length ? (
              <ul className="space-y-2">
                {byDay(d).map((a) => (
                  <li key={a.id}>
                    <button onClick={() => setOpenId(a.id)} className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left", readinessStyle[readiness(a.ready_score)])}>
                      <span className="tabular w-16 text-xs font-medium">{fmtTime(a.start_at)}</span>
                      <span className="flex-1 truncate text-sm text-deep-ink">{a.clients?.name}</span>
                      <span className="tabular text-xs">{a.ready_score}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground/70">{q.isLoading ? "…" : "Nothing booked"}</p>}
          </section>
        ))}
      </div>

      <Detail a={selected} onClose={() => setOpenId(null)} />
    </>
  );
}

function Legend() {
  return (
    <div className="flex gap-3 text-xs text-muted-foreground">
      {(["ready", "partial", "none"] as const).map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className={cn("h-3 w-3 rounded border", readinessStyle[k])} />
          {k === "ready" ? "Ready" : k === "partial" ? "Partly ready" : "Not started"}
        </span>
      ))}
    </div>
  );
}

function Detail({ a, onClose }: { a: Appt | null; onClose: () => void }) {
  const { complete, noShow } = useApptActions();
  const open = a && (a.status === "booked" || a.status === "confirmed");
  return (
    <Dialog open={!!a} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-paper sm:rounded-2xl">
        {a && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl font-normal">{a.clients?.name}</DialogTitle>
              <DialogDescription>{a.services?.name} · {fmtLong(a.start_at)}, {fmtTime(a.start_at)}–{fmtTime(a.end_at)}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-4">
              <ReadyRing value={a.ready_score} size={72} stroke={6} />
              <div className="space-y-1"><MeetingTag type={a.meeting_type} /><div><StatusPill status={a.status} /></div></div>
            </div>
            <ul className="divide-y divide-border rounded-xl border border-border bg-sheet">
              {a.checklist_items.sort((x, y) => x.sort_order - y.sort_order).map((i) => (
                <li key={i.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-deep-ink">{i.document_name}</span>
                  <span className={cn("text-xs", i.status === "uploaded" ? "text-success" : i.status === "not_applicable" ? "text-muted-foreground" : "text-warning")}>
                    {i.status === "uploaded" ? "Received" : i.status === "not_applicable" ? "Doesn't apply" : "Missing"}
                  </span>
                </li>
              ))}
            </ul>
            {missingOf(a).length === 0 && <p className="text-sm text-success">Every required document is in.</p>}
            <div className="flex flex-wrap gap-2">
              {open && <Button size="sm" onClick={() => complete.mutate(a.id, { onSuccess: onClose })}>Mark complete</Button>}
              {open && <Button size="sm" variant="outline" onClick={() => noShow.mutate(a.id, { onSuccess: onClose })}>No-show</Button>}
              {a.clients && <Button size="sm" variant="ghost" asChild><Link to="/owner/clients/$id" params={{ id: a.clients.id }}>Client details</Link></Button>}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
