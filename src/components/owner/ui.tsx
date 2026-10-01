import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, CreditCard, FileSearch, MailX, PenLine, Sparkles, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { Tag } from "@/components/ui/tag";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getDocumentUrl } from "@/lib/portal.functions";
import { markNoShow, dismissAttention, nudgeSignature, remindPayment } from "@/lib/owner.functions";
import { fmtDay, fmtLong, fmtStamp, fmtTime, missingOf, money, type Appt, type Item, type NeedItem } from "./lib";
import { useApptPanel } from "./drawer-context";
import { cn } from "@/lib/utils";
import { useOwnerCtx } from "./ctx";
import { isIntroAppt, stageOf } from "@/lib/lifecycle";

export function PageHead({ title, meta, actions, children }: { eyebrow?: string; title: ReactNode; meta?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="t-owner text-deep-ink">{title}</h1>
        {(meta || children) && <div className="mt-1 text-xs text-muted-foreground">{meta ?? children}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="mx-auto max-w-md py-12 text-center"><Check className="mx-auto size-6 text-muted-foreground" /><h2 className="mt-3 t-sub">{title}</h2>{children && <p className="mt-2 text-sm text-muted-foreground">{children}</p>}</div>;
}
export function LoadingRows({ n = 3 }: { n?: number }) {
  return <div role="status" aria-label="Loading" className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-2">{Array.from({ length: n }, (_, i) => <div key={i} className="flex h-16 items-center gap-3 px-3"><Skeleton className="size-10 shrink-0 rounded-full" /><Skeleton className="h-4 w-16 shrink-0" /><div className="min-w-0 flex-1"><Skeleton className="h-4 w-32 max-w-full" /><Skeleton className="mt-1 h-3 w-40 max-w-full" /></div><Skeleton className="hidden h-6 w-16 sm:block" /><Skeleton className="size-8 shrink-0" /></div>)}</div>;
}
export function ErrorNote({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-lg border border-warning/40 bg-warning/10 p-5 text-sm text-deep-ink">This didn't load. {onRetry && <Button size="sm" variant="ghost" onClick={onRetry}>Try again</Button>}</div>;
}
export function MeetingTag({ type }: { type: Appt["meeting_type"] }) { return <span>{type === "video" ? "Video" : "In person"}</span>; }

function useStatusMutation(fn: (args: { data: { id: string } }) => Promise<unknown>, status: string, success: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["owner"] });
      const previous = qc.getQueriesData({ queryKey: ["owner"] });
      qc.setQueriesData<Appt[]>({ queryKey: ["owner", "appts"] }, (old) => old?.map((a) => (a.id === id ? { ...a, status } : a)));
      qc.setQueriesData<{ appts: Appt[] }>({ queryKey: ["owner", "client"] }, (old) => (old?.appts ? { ...old, appts: old.appts.map((a) => (a.id === id ? { ...a, status } : a)) } : old));
      return { previous };
    },
    onSuccess: () => { toast.success(success); void qc.invalidateQueries({ queryKey: ["owner"] }); },
    onError: (_error, _id, context) => { context?.previous.forEach(([key, data]) => qc.setQueryData(key, data)); toast.error("Couldn't save that. Try again."); },
  });
}

export function useApptActions() {
  const noShow = useStatusMutation(useServerFn(markNoShow), "no_show", "Marked as no-show.");
  return { noShow };
}
const STATUS_LABEL: Record<string, string> = { booked: "Booked", confirmed: "Confirmed", completed: "Completed", no_show: "No-show", cancelled: "Cancelled", rescheduled: "Moved" };
export function StatusPill({ status }: { status: string }) {
  const tone = status === "confirmed" ? "success" : status === "no_show" || status === "cancelled" ? "danger" : "neutral";
  return <Tag tone={tone}>{STATUS_LABEL[status] ?? status}</Tag>;
}

/** Open appointment actions: Finish appointment (fee + note) and No-show (confirmed first). */
export function ApptActionButtons({ a, onDone, onFinish }: { a: Appt; onDone?: () => void; onFinish: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const { noShow } = useApptActions();
  const open = a.status === "booked" || a.status === "confirmed";
  const name = a.clients?.name ?? "this client";
  if (!open) return null;
  return <>
    <div className="grid grid-cols-2 gap-2">
      <Button disabled={noShow.isPending} onClick={onFinish}>Finish appointment</Button>
      <Button variant="secondary" disabled={noShow.isPending} onClick={() => setConfirm(true)}>{noShow.isPending ? "Saving…" : "No-show"}</Button>
    </div>
    <AlertDialog open={confirm} onOpenChange={setConfirm}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Mark {name} as a no-show?</AlertDialogTitle>
          <AlertDialogDescription>The appointment is closed and the client gets a link to book again.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-alert-negative text-alert-negative-fg hover:bg-[#FCE1DB] active:bg-[#F9C7BE]" onClick={() => noShow.mutate(a.id, { onSuccess: () => onDone?.() })}>Mark no-show</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}

/** Readiness shown the same way everywhere: small ring + percentage. */
export function Readiness({ value }: { value: number }) {
  return <span className="flex w-[58px] shrink-0 items-center gap-1.5"><ReadyRing value={value} size={20} stroke={3} /><span className="tabular text-[11px] text-muted-foreground">{value}%</span></span>;
}

/** One tag per row saying where the appointment is in its lifecycle (src/lib/lifecycle.ts). */
export function AppointmentStage({ a }: { a: Appt }) {
  const now = useOwnerCtx().data?.now ?? new Date().toISOString();
  const st = stageOf(a, now);
  if (isIntroAppt(a)) return st === "filed" ? <Tag tone="success">Done</Tag> : st === "meeting" ? <Tag tone="accent">Now</Tag> : st === "wrap_up" ? <Tag tone="warning">Mark done</Tag> : <Tag>Free call</Tag>;
  if (st === "documents" || st === "ready") return <Readiness value={a.ready_score} />;
  if (st === "meeting") return <Tag tone="accent">Now</Tag>;
  if (st === "wrap_up") return <Tag tone="warning">Finish up</Tag>;
  if (st === "sign_pay") return <Tag tone="warning">{a.signature_status !== "signed" ? "Waiting for signature" : "Unpaid"}</Tag>;
  if (st === "to_file") return <Tag tone="success">Ready to file</Tag>;
  if (st === "filed") return <Tag tone="success">Filed</Tag>;
  return <Tag tone="danger">{st === "no_show" ? "No-show" : "Cancelled"}</Tag>;
}

/** THE appointment row. Used on Today, Calendar (mobile), client pages and search. Click opens the appointment panel. */
export function ApptRow({ a, showDate = false, showClient = true }: { a: Appt; showDate?: boolean; showClient?: boolean }) {
  const openAppt = useApptPanel();
  const done = !!a.filed_at || a.status === "no_show" || a.status === "cancelled";
  return (
    <button type="button" onClick={() => openAppt({ appointmentId: a.id })}
      className={cn("flex min-h-14 w-full items-center gap-3 border-b border-border px-3 py-2 text-left transition-colors duration-150 last:border-0 hover:bg-surface-2", done && "opacity-60")}>
      <span className={cn("tabular shrink-0 text-[13px] font-medium text-deep-ink", showDate ? "w-[92px]" : "w-[76px]")}>{showDate ? fmtDay(a.start_at) : fmtTime(a.start_at)}{showDate && <span className="block text-[11px] font-normal text-muted-foreground">{fmtTime(a.start_at)}</span>}</span>
      <ServiceIcon service={a.services?.name} size={32} className="hidden sm:grid" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-deep-ink">{showClient ? a.clients?.name ?? "Client" : a.services?.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{showClient ? a.services?.name : a.meeting_type === "video" ? "Video" : "In person"}</span>
      </span>
      <span className="shrink-0"><AppointmentStage a={a} /></span>
      {(a.status === "booked" || a.status === "confirmed") && Date.parse(a.end_at) > Date.now() && <span className="hidden w-[84px] justify-end sm:flex"><StatusPill status={a.status} /></span>}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

export function ApptList({ appts, showDate = false, showClient = true }: { appts: Appt[]; showDate?: boolean; showClient?: boolean }) {
  return <div className="overflow-hidden rounded-2xl border border-border">{appts.map((a, i) => <div key={a.id} className="enter-item" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}><ApptRow a={a} showDate={showDate} showClient={showClient} /></div>)}</div>;
}

export function NeedRow({ it, onAct, busy, idx = 0 }: { it: NeedItem; onAct: () => void; busy: boolean; idx?: number }) {
  const openAppt = useApptPanel();
  let icon: ReactNode, title: string, reason: string, action: string, appointmentId: string | undefined;
  if (it.kind === "review") { icon = <FileSearch />; title = `${it.count} document${it.count === 1 ? " needs" : "s need"} your eyes`; reason = `Everything else was checked automatically. Starting with ${it.appt.clients?.name}, ${fmtDay(it.appt.start_at)}.`; action = "Open"; appointmentId = it.appt.id; }
  else if (it.kind === "unpaid") { icon = <CreditCard />; title = `${it.appt.clients?.name} hasn't paid yet`; reason = `${it.appt.fee_cents ? money(it.appt.fee_cents) : "Fee"} due since ${fmtDay(it.appt.finished_at ?? it.appt.end_at)}. Three reminders already went out.`; action = "Send reminder"; appointmentId = it.appt.id; }
  else if (it.kind === "low") { icon = <AlertTriangle />; title = `${it.appt.clients?.name} is ${it.appt.ready_score}% ready`; reason = `${fmtDay(it.appt.start_at)} at ${fmtTime(it.appt.start_at)}. ${missingOf(it.appt).length} documents missing, a later time was offered.`; action = "Keep appointment"; appointmentId = it.appt.id; }
  else if (it.kind === "signature") { icon = <PenLine />; title = `${it.appt.clients?.name} hasn't signed Form 8879`; reason = `Appointment was ${fmtDay(it.appt.start_at)}. Automatic reminders already went out.`; action = "Send reminder"; appointmentId = it.appt.id; }
  else if (it.kind === "wrap") { icon = <CalendarCheck />; title = `${it.appt.clients?.name}: meeting has ended`; reason = `${fmtDay(it.appt.start_at)} at ${fmtTime(it.appt.start_at)}. Finish the return, or book another meeting if you ran out of time.`; action = "Open"; appointmentId = it.appt.id; }
  else if (it.kind === "failed") { icon = <MailX />; title = `An email didn't arrive`; reason = `${it.msg.subject ?? "Message"} to ${it.msg.recipient} on ${fmtStamp(it.msg.sent_at)}.`; action = "Dismiss"; }
  else { icon = <Sparkles />; title = `${it.offer.name} took a freed slot`; reason = `${it.offer.service}, ${fmtDay(it.offer.slot_start)} at ${fmtTime(it.offer.slot_start)}. Nothing to do.`; action = "Dismiss"; }
  return (
    <li style={{ animationDelay: `${idx * 40}ms` }} className="enter-item flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-3 py-2.5 last:border-0 sm:flex-nowrap">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink [&_svg]:size-4">{icon}</span>
      <button type="button" disabled={!appointmentId} onClick={() => appointmentId && openAppt({ appointmentId })} className="min-w-0 flex-1 basis-[calc(100%-44px)] text-left disabled:cursor-default sm:basis-auto">
        <span className="block line-clamp-2 text-sm font-medium text-deep-ink sm:truncate">{title}</span>
        <span className="block truncate text-xs text-muted-foreground" title={reason}>{reason}</span>
      </button>
      <Button size="sm" variant="secondary" disabled={busy} onClick={onAct} className="ml-11 shrink-0 sm:ml-0">{busy ? "Saving…" : action}</Button>
    </li>
  );
}
export function NeedsList({ items }: { items: NeedItem[] }) {
  const qc = useQueryClient(); const dismiss = useServerFn(dismissAttention), nudge = useServerFn(nudgeSignature), payNudge = useServerFn(remindPayment); const openAppt = useApptPanel();
  const [all, setAll] = useState(false);
  const act = useMutation({ mutationFn: async (it: NeedItem) => { if (it.kind === "review" || it.kind === "wrap") { openAppt({ appointmentId: it.id }); return { ok: true, silent: true }; } if (it.kind === "unpaid") return payNudge({ data: { id: it.id } }); if (it.kind === "signature") return nudge({ data: { id: it.id } }); return dismiss({ data: { kind: it.kind === "low" ? "appointment" : it.kind === "failed" ? "message" : "offer", id: it.id } }); }, onSuccess: (r, it) => { if (!r.ok) { toast.error("Couldn't do that. Try again."); return; } if ("silent" in r) return; toast.success(it.kind === "signature" || it.kind === "unpaid" ? "Reminder sent." : "Done."); void qc.invalidateQueries({ queryKey: ["owner"] }); }, onError: () => toast.error("Couldn't do that. Try again.") });
  const shown = all ? items : items.slice(0, 3);
  return <div>
    <ul className="overflow-hidden rounded-2xl border border-border">{shown.map((it, i) => <NeedRow idx={i} key={`${it.kind}-${it.id}`} it={it} busy={act.isPending && act.variables?.id === it.id} onAct={() => act.mutate(it)} />)}</ul>
    {items.length > 3 && <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAll(v => !v)}>{all ? "Show less" : `Show all ${items.length}`}</Button>}
  </div>;
}

/** A fresh one-minute signed URL is requested for each selected private file. */
export function DocViewer({ open, onOpenChange, title, items, startId }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; items: Item[]; startId?: string | undefined }) {
  const getUrl = useServerFn(getDocumentUrl);
  const files = items.filter(i => i.file_path).sort((x, y) => x.sort_order - y.sort_order);
  const [sel, setSel] = useState<{ id: string; url: string | null; loading: boolean; path: string } | null>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => { if (open) { const i = startId ? files.findIndex((f) => f.id === startId) : 0; setIndex(Math.max(0, i)); } }, [open, startId]); // eslint-disable-line react-hooks/exhaustive-deps
  const fileKey = files.map((f) => `${f.id}:${f.file_path ?? ""}`).join("|");
  const current = files[Math.min(index, Math.max(files.length - 1, 0))];
  const currentId = current?.id;
  const currentPath = current?.file_path ?? null;
  useEffect(() => {
    if (!open || !currentId || !currentPath) { setSel(null); if (!open) setIndex(0); return; }
    let live = true;
    setSel({ id: currentId, url: null, loading: true, path: currentPath });
    getUrl({ data: { itemId: currentId } })
      .then((r) => { if (live) setSel({ id: currentId, url: r.url, loading: false, path: currentPath }); })
      .catch(() => { if (live) setSel({ id: currentId, url: null, loading: false, path: currentPath }); });
    return () => { live = false; };
  }, [open, currentId, currentPath, fileKey, getUrl]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] max-w-4xl overflow-auto bg-sheet p-0 sm:rounded-2xl"><DialogHeader className="border-b border-border px-6 py-4"><DialogTitle className="font-sans text-lg font-normal">{title}</DialogTitle><DialogDescription>Private files. Links expire after a minute.</DialogDescription></DialogHeader><div className="grid md:grid-cols-[220px_1fr]"><ul className="max-h-[60vh] overflow-auto border-b border-border p-3 md:border-b-0 md:border-r">{files.map((f, i) => <li key={f.id}><Button variant="ghost" onClick={() => setIndex(i)} className={cn("h-auto w-full justify-start whitespace-normal py-2 text-left", index === i && "bg-fill-selected")}><span><span className="block text-sm text-deep-ink">{f.document_name}</span>{f.uploaded_at && <span className="text-xs text-muted-foreground">Received {fmtLong(f.uploaded_at)}</span>}</span></Button></li>)}</ul><div className="min-h-[50vh] bg-sheet p-4"><div className="flex items-center justify-end gap-2 pb-2"><Button size="icon" variant="outline" aria-label="Previous document" disabled={index === 0} onClick={() => setIndex(i => i - 1)}><ChevronLeft /></Button><span className="tabular text-xs text-muted-foreground">{files.length ? index + 1 : 0} / {files.length}</span><Button size="icon" variant="outline" aria-label="Next document" disabled={index >= files.length - 1} onClick={() => setIndex(i => i + 1)}><ChevronRight /></Button></div><div className="grid min-h-[40vh] place-items-center">{sel?.loading && <Skeleton className="h-[40vh] w-full" />}{sel && !sel.loading && !sel.url && <p className="text-sm text-warning">This file couldn't be opened.</p>}{sel?.url && (sel.path.toLowerCase().endsWith(".pdf") ? <iframe title="Document" src={sel.url} className="h-[55vh] w-full rounded-lg border border-border" /> : <img src={sel.url} alt="Uploaded document" className="max-h-[55vh] rounded-lg border border-border object-contain" />)}{sel?.url && <a href={sel.url} target="_blank" rel="noreferrer" className="mt-3 text-xs text-ink underline">Open in a new tab</a>}</div></div></div></DialogContent></Dialog>;
}
