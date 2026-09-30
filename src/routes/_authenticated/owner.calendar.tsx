import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerCtx } from "@/components/owner/ctx";
import { addDays, apptsRange, et, etToIso, fmtTime, readiness, readinessStyle, ymdLabel } from "@/components/owner/lib";
import { ErrorNote, PageHead } from "@/components/owner/ui";
import { ownerMoveAppointment } from "@/lib/owner.functions";
import { useClientDrawer } from "@/components/owner/drawer-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/owner/calendar")({ head: () => ({ meta: [{ title: "Calendar — Hartwell Tax & Bookkeeping" }, { name: "robots", content: "noindex" }] }), component: CalendarPage });

const START = 9 * 60, END = 18 * 60, PX = 1.1; // px per minute
const mondayOf = (ymd: string) => {
  const dow = new Date(`${ymd}T12:00:00Z`).getUTCDay();
  return addDays(ymd, dow === 0 ? -6 : 1 - dow);
};

function CalendarPage() {
  const now = useOwnerCtx().data!.now;
  const openClient = useClientDrawer();
  const [week, setWeek] = useState(() => mondayOf(et(now).ymd));
  const days = Array.from({ length: 6 }, (_, i) => addDays(week, i));
  const q = useQuery(apptsRange(etToIso(week, 0), etToIso(addDays(week, 7), 0)));
  const [pending, setPending] = useState<{ id: string; name: string; ymd: string; mins: number } | null>(null);
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
    const clamped = Math.min(mins, END - 15);
    setPending({ id, name: a.clients?.name ?? "this client", ymd, mins: clamped });
  };
  const fmtMins = (m: number) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "am" : "pm"}`;
  const nowMins = et(now).minutes;

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
      <p className="mb-3 hidden text-xs text-muted-foreground md:block">Drag an appointment to move it. You confirm before the client is emailed.</p>

      {/* Desktop week grid */}
      <div className=" hidden overflow-hidden md:block">
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
              className={cn("relative border-l border-border ", drag && "bg-fill-neutral/30", d === today && "bg-marigold/5")}
              style={{ backgroundImage: "linear-gradient(to bottom, rgba(16,16,16,0.06) 1px, transparent 1px)", backgroundSize: `100% ${60 * PX}px` }}>
              {q.isLoading && <Skeleton className="absolute inset-x-1 top-2 h-16 rounded-lg" />}
              {d === today && nowMins > START && nowMins < END && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-10 h-px bg-ink" style={{ top: (nowMins - START) * PX }} />}
              {byDay(d).map((a) => {
                const { minutes } = et(a.start_at);
                const h = (new Date(a.end_at).getTime() - new Date(a.start_at).getTime()) / 60000;
                return (
                  <button key={a.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.id); setDrag(a.id); }} onDragEnd={() => setDrag(null)}
                    onClick={() => a.clients && openClient({ clientId: a.clients.id, appointmentId: a.id })}
                    className={cn("absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-left text-[11px] leading-tight transition-colors duration-150 hover:bg-fill-subtle",
                      readinessStyle[readiness(a.ready_score)], a.status === "completed" && "opacity-60", drag === a.id && "opacity-40")}
                    style={{ top: (minutes - START) * PX, height: Math.max(22, h * PX - 2) }}>
                    <span className="tabular block font-medium">{fmtTime(a.start_at)}, {a.ready_score}%</span>
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
                    <button onClick={() => a.clients && openClient({ clientId: a.clients.id, appointmentId: a.id })} className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left", readinessStyle[readiness(a.ready_score)])}>
                      <span className="tabular w-16 text-xs font-medium">{fmtTime(a.start_at)}</span>
                      <span className="flex-1 truncate text-sm text-deep-ink">{a.clients?.name}</span>
                      <span className="tabular text-xs">{a.ready_score}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : q.isLoading ? <div aria-hidden="true" className="h-12 rounded-xl bg-muted" /> : <p className="text-sm text-muted-foreground/70">Nothing booked</p>}
          </section>
        ))}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) setPending(null); }}>
        <AlertDialogContent className="max-w-sm rounded-2xl border-border bg-sheet">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans text-base font-medium">Move {pending?.name}?</AlertDialogTitle>
            <AlertDialogDescription>{pending ? `New time: ${ymdLabel(pending.ymd)} at ${fmtMins(pending.mins)}. The client is emailed the new time automatically.` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pending) mv.mutate({ id: pending.id, start: etToIso(pending.ymd, pending.mins) }); setPending(null); }}>Move and notify</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
