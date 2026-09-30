import { NewAppointmentButton } from "@/components/owner/new-appointment";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerCtx } from "@/components/owner/ctx";
import { addDays, apptsRange, et, etToIso, fmtTime, readiness, ymdLabel, type Appt } from "@/components/owner/lib";
import { ApptList, ErrorNote, PageHead } from "@/components/owner/ui";
import { ownerMoveAppointment } from "@/lib/owner.functions";
import { useApptPanel } from "@/components/owner/drawer-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/owner/calendar")({ head: () => ({ meta: [{ title: "Calendar — Hartwell Tax & Bookkeeping" }, { name: "robots", content: "noindex" }] }), component: CalendarPage });

const START = 9 * 60, END = 18 * 60, PX = 1.2; // px per minute
const mondayOf = (ymd: string) => {
  const dow = new Date(`${ymd}T12:00:00Z`).getUTCDay();
  return addDays(ymd, dow === 0 ? -6 : 1 - dow);
};
const hourLabel = (h: number) => `${((h + 11) % 12) + 1} ${h < 12 ? "AM" : "PM"}`;
const ACCENT = { ready: "bg-success", partial: "bg-marigold", none: "bg-[#C8C8C8]" } as const;

/** Side-by-side lanes for appointments that overlap in time, so blocks never cover each other. */
function layoutDay(list: Appt[]) {
  const items = [...list].sort((a, b) => a.start_at.localeCompare(b.start_at));
  const out: { a: Appt; lane: number; lanes: number }[] = [];
  let group: { a: Appt; lane: number; end: number }[] = [];
  let groupEnd = 0;
  const flush = () => { const lanes = Math.max(1, ...group.map((g) => g.lane + 1)); group.forEach((g) => out.push({ a: g.a, lane: g.lane, lanes })); group = []; };
  for (const a of items) {
    const s = new Date(a.start_at).getTime(), e = new Date(a.end_at).getTime();
    if (group.length && s >= groupEnd) flush();
    const used = new Set(group.filter((g) => g.end > s).map((g) => g.lane));
    let lane = 0; while (used.has(lane)) lane++;
    group.push({ a, lane, end: e }); groupEnd = Math.max(groupEnd, e);
  }
  if (group.length) flush();
  return out;
}

function CalendarPage() {
  const now = useOwnerCtx().data!.now;
  const openAppt = useApptPanel();
  const today = et(now).ymd;
  const [week, setWeek] = useState(() => mondayOf(today));
  const [mobileDay, setMobileDay] = useState(today);
  const days = Array.from({ length: 6 }, (_, i) => addDays(week, i));
  const q = useQuery(apptsRange(etToIso(week, 0), etToIso(addDays(week, 7), 0)));
  const off = useQuery({ queryKey: ["owner", "time-off", week], queryFn: async () => { const { data, error } = await supabase.from("time_off").select("id, starts_at, ends_at, all_day, label").lt("starts_at", etToIso(addDays(week, 7), 0)).gt("ends_at", etToIso(week, 0)); if (error) throw error; return data ?? []; } });
  /** Time-off pieces clipped to one day's visible hours. */
  const offOn = (d: string) => (off.data ?? []).flatMap((o) => {
    const s = Math.max(new Date(o.starts_at).getTime(), new Date(etToIso(d, START)).getTime());
    const e = Math.min(new Date(o.ends_at).getTime(), new Date(etToIso(d, END)).getTime());
    return e > s ? [{ o, top: et(new Date(s).toISOString()).minutes, bottom: et(new Date(e).toISOString()).minutes || END }] : [];
  });
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
  const total = (q.data ?? []).length;
  const nowMins = et(now).minutes;
  const fmtMins = (m: number) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "AM" : "PM"}`;
  const goWeek = (w: string) => { setWeek(w); setMobileDay(w <= today && today < addDays(w, 6) ? today : w); };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, ymd: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDrag(null);
    if (!id) return;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const mins = Math.min(END - 15, START + Math.max(0, Math.round(y / PX / 15) * 15));
    const a = q.data?.find((x) => x.id === id);
    if (!a || (et(a.start_at).ymd === ymd && et(a.start_at).minutes === mins)) return;
    setPending({ id, name: a.clients?.name ?? "this client", ymd, mins });
  };

  const nav = (
    <>
      <NewAppointmentButton />
      <Button size="sm" variant="secondary" onClick={() => goWeek(mondayOf(today))}>Today</Button>
      <div className="flex">
        <Button size="icon" variant="ghost" aria-label="Previous week" onClick={() => goWeek(addDays(week, -7))}><ChevronLeft /></Button>
        <Button size="icon" variant="ghost" aria-label="Next week" onClick={() => goWeek(addDays(week, 7))}><ChevronRight /></Button>
      </div>
    </>
  );

  return (
    <>
      <PageHead title={`Week of ${ymdLabel(week)}`} meta={q.data ? `${total} appointment${total === 1 ? "" : "s"}, drag to reschedule` : "Loading…"} actions={nav} />
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}

      {/* Desktop week grid */}
      <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
        <div className="grid grid-cols-[56px_repeat(6,minmax(0,1fr))] border-b border-border bg-surface-2">
          <div />
          {days.map((d) => {
            const [wd, , num] = ymdLabel(d).replace(",", "").split(" ");
            const isToday = d === today;
            return (
              <div key={d} className="flex items-center justify-center gap-1.5 border-l border-border py-2.5 text-xs text-muted-foreground">
                <span>{wd}</span>
                <span className={cn("tabular grid size-6 place-items-center rounded-full text-xs font-medium", isToday ? "bg-deep-ink text-primary-foreground" : "text-deep-ink")}>{num}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[56px_repeat(6,minmax(0,1fr))]" style={{ height: (END - START) * PX }}>
          <div className="relative">
            {Array.from({ length: (END - START) / 60 }, (_, i) => (
              <span key={i} className="tabular absolute right-2 top-1 text-[11px] leading-none text-muted-foreground" style={{ top: i * 60 * PX + 4 }}>{hourLabel(9 + i)}</span>
            ))}
          </div>
          {days.map((d) => (
            <div key={d} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, d)}
              className={cn("relative border-l border-border transition-colors duration-150", drag && "bg-fill-subtle", d === today && "bg-surface-2")}
              style={{ backgroundImage: "linear-gradient(to bottom, rgba(16,16,16,0.06) 1px, transparent 1px)", backgroundSize: `100% ${60 * PX}px` }}>
              {q.isLoading && <Skeleton className="absolute inset-x-1.5 top-3 h-14 rounded-lg" />}
              {d === today && nowMins > START && nowMins < END && (
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-20 h-px bg-destructive" style={{ top: (nowMins - START) * PX }}>
                  <span className="absolute -left-1 -top-1 size-2 rounded-full bg-destructive" />
                </span>
              )}
              {offOn(d).map(({ o, top, bottom }) => (
                <div key={o.id} className="pointer-events-none absolute inset-x-0 z-[5] overflow-hidden border-y border-border px-2 py-1 text-[11px] text-muted-foreground"
                  style={{ top: (top - START) * PX, height: Math.max(18, (bottom - top) * PX), backgroundColor: "var(--fill-neutral)", backgroundImage: "repeating-linear-gradient(135deg, rgba(16,16,16,0.07) 0 6px, transparent 6px 12px)" }}>
                  <span className="rounded bg-sheet/90 px-1">{o.label || "Time off"}</span>
                </div>
              ))}
              {layoutDay(byDay(d)).map(({ a, lane, lanes }) => {
                const { minutes } = et(a.start_at);
                const dur = (new Date(a.end_at).getTime() - new Date(a.start_at).getTime()) / 60000;
                const h = Math.max(24, dur * PX - 3);
                const tall = h >= 46;
                const done = a.status === "completed" || a.status === "no_show";
                return (
                  <button key={a.id} draggable={!done} onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.id); setDrag(a.id); }} onDragEnd={() => setDrag(null)}
                    onClick={() => openAppt({ appointmentId: a.id })}
                    title={`${a.clients?.name ?? ""}, ${fmtTime(a.start_at)}, ${a.services?.name ?? ""}, ${a.ready_score}% ready`}
                    className={cn("absolute z-10 flex overflow-hidden rounded-lg border border-border bg-sheet text-left shadow-[0_1px_2px_rgba(16,16,16,0.04)] transition-colors duration-150 hover:bg-surface-2",
                      done && "bg-surface-2 opacity-60", drag === a.id && "opacity-40")}
                    style={{ top: (minutes - START) * PX + 1, height: h, left: `calc(${(lane / lanes) * 100}% + 4px)`, width: `calc(${100 / lanes}% - 8px)` }}>
                    <span className={cn("w-[3px] shrink-0", ACCENT[readiness(a.ready_score)])} />
                    <span className={cn("min-w-0 flex-1 px-2", tall ? "py-1.5" : "flex items-center")}>
                      <span className="block truncate text-xs font-medium leading-4 text-deep-ink">{tall ? a.clients?.name : `${fmtTime(a.start_at)} ${a.clients?.name ?? ""}`}</span>
                      {tall && <span className="tabular block truncate text-[11px] leading-4 text-muted-foreground">{fmtTime(a.start_at)}, {a.ready_score}% ready</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-border bg-surface-2 px-4 py-2.5 text-[11px] text-muted-foreground">
          {(["ready", "partial", "none"] as const).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5"><span className={cn("h-3 w-[3px] rounded-full", ACCENT[k])} />{k === "ready" ? "Ready" : k === "partial" ? "Partly ready" : "Not started"}</span>
          ))}
          <span className="ml-auto">Click an appointment to see its checklist</span>
        </div>
      </div>

      {/* Mobile: day picker + one list */}
      <div className="md:hidden">
        <div className="mb-4 grid grid-cols-6 gap-1">
          {days.map((d) => {
            const [wd, , num] = ymdLabel(d).replace(",", "").split(" ");
            const active = d === mobileDay;
            return (
              <button key={d} onClick={() => setMobileDay(d)} className={cn("flex h-14 flex-col items-center justify-center rounded-lg text-[11px] transition-colors duration-150", active ? "bg-deep-ink text-primary-foreground" : "bg-fill-subtle text-deep-ink")}>
                <span className={active ? "text-primary-foreground/70" : "text-muted-foreground"}>{wd}</span>
                <span className="tabular text-sm font-medium">{num}</span>
                <span className={cn("mt-0.5 size-1 rounded-full", byDay(d).length ? (active ? "bg-primary-foreground" : "bg-deep-ink") : "bg-transparent")} />
              </button>
            );
          })}
        </div>
        {offOn(mobileDay).map(({ o, top, bottom }) => <p key={o.id} className="mb-3 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground" style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(16,16,16,0.07) 0 6px, transparent 6px 12px)" }}>{o.label || "Time off"}, {o.all_day ? "all day" : `${fmtMins(top)} to ${fmtMins(bottom)}`}</p>)}
        {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : byDay(mobileDay).length ? (
          <ApptList appts={byDay(mobileDay)} />
        ) : <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">Nothing booked on {ymdLabel(mobileDay)}.</p>}
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
