import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, FileText, MailX, MoreHorizontal, PenLine, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getDocumentUrl } from "@/lib/portal.functions";
import { markComplete, markNoShow, dismissAttention, nudgeSignature } from "@/lib/owner.functions";
import { fmtDay, fmtLong, fmtStamp, fmtTime, missingOf, type Appt, type Item, type NeedItem } from "./lib";
import { useClientDrawer } from "./drawer-context";
import { cn } from "@/lib/utils";

export function PageHead({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return <header className="mb-6"><h1 className="font-sans text-lg font-normal leading-[26px] text-deep-ink">{title}</h1>{eyebrow && <p className="mt-1 text-xs text-muted-foreground">{eyebrow}</p>}{children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}</header>;
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="mx-auto max-w-md py-12 text-center"><Check className="mx-auto size-6 text-ink" /><h2 className="mt-4 font-sans text-xl font-medium leading-[30px] text-deep-ink">{title}</h2>{children && <p className="mt-2 text-sm text-muted-foreground">{children}</p>}</div>;
}
export function LoadingRows({ n = 3 }: { n?: number }) {
  return <div role="status" aria-label="Loading" className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-2">{Array.from({ length: n }, (_, i) => <div key={i} className="flex h-16 items-center gap-3 px-3"><Skeleton className="size-10 shrink-0 rounded-full" /><Skeleton className="h-4 w-16 shrink-0" /><div className="min-w-0 flex-1"><Skeleton className="h-4 w-32 max-w-full" /><Skeleton className="mt-1 h-3 w-40 max-w-full" /></div><Skeleton className="hidden h-6 w-16 sm:block" /><Skeleton className="size-8 shrink-0" /></div>)}</div>;
}
export function ErrorNote({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-lg border border-warning/40 bg-warning/10 p-5 text-sm text-deep-ink">This didn't load. {onRetry && <Button size="sm" variant="ghost" onClick={onRetry}>Try again</Button>}</div>;
}
export function MeetingTag({ type }: { type: Appt["meeting_type"] }) { return <span>{type === "video" ? "Video" : "In person"}</span>; }

export function useApptActions() {
  const qc = useQueryClient();
  const complete = useServerFn(markComplete), noShow = useServerFn(markNoShow);
  const make = (fn: typeof complete, status: string, success: string) => useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["owner"] });
      const previous = qc.getQueriesData({ queryKey: ["owner"] });
      qc.setQueriesData<Appt[]>({ queryKey: ["owner", "appts"] }, old => old?.map(a => a.id === id ? { ...a, status } : a));
      qc.setQueriesData<{ appts: Appt[] }>({ queryKey: ["owner", "client"] }, old => old?.appts ? { ...old, appts: old.appts.map(a => a.id === id ? { ...a, status } : a) } : old);
      return { previous };
    },
    onSuccess: () => { toast.success(success); qc.invalidateQueries({ queryKey: ["owner"] }); },
    onError: (_error, _id, context) => { context?.previous.forEach(([key, data]) => qc.setQueryData(key, data)); toast.error("Couldn't save that. Try again."); },
  });
  return { complete: make(complete, "completed", "Marked complete. Signature request is on its way."), noShow: make(noShow, "no_show", "Marked as no-show.") };
}
const STATUS_LABEL: Record<string, string> = { booked: "Booked", confirmed: "Confirmed", completed: "Completed", no_show: "No-show", cancelled: "Cancelled", rescheduled: "Moved" };
export function StatusPill({ status }: { status: string }) {
  return <span className={cn("rounded border border-border bg-fill-subtle px-2 py-0.5 text-[10px] font-medium text-muted-foreground", status === "confirmed" && "border-success/20 bg-success/10 text-success", status === "no_show" && "border-warning/20 bg-warning/10 text-warning")}>{STATUS_LABEL[status] ?? status}</span>;
}

export function ApptActions({ a }: { a: Appt }) {
  const [confirm, setConfirm] = useState<"complete" | "noShow" | null>(null);
  const [docs, setDocs] = useState(false);
  const { complete, noShow } = useApptActions();
  const open = a.status === "booked" || a.status === "confirmed";
  const uploaded = a.checklist_items.filter(i => i.file_path);
  const pending = complete.isPending || noShow.isPending;
  const act = () => { if (confirm === "complete") complete.mutate(a.id); else if (confirm === "noShow") noShow.mutate(a.id); setConfirm(null); };
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Actions for ${a.clients?.name ?? "client"}`} title="Appointment actions" disabled={pending}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border bg-sheet shadow-lift">
        {open && <DropdownMenuItem onSelect={() => setConfirm("complete")}>Mark complete</DropdownMenuItem>}
        {open && <DropdownMenuItem onSelect={() => setConfirm("noShow")}>No-show</DropdownMenuItem>}
        <DropdownMenuItem disabled={!uploaded.length} onSelect={() => setDocs(true)}><FileText className="size-4" />Open documents{uploaded.length ? ` (${uploaded.length})` : ""}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Popover open={!!confirm} onOpenChange={v => { if (!v) setConfirm(null); }}><PopoverTrigger asChild><span className="sr-only" aria-hidden="true" /></PopoverTrigger><PopoverContent className="w-64 rounded-2xl border-border bg-sheet shadow-lift" align="end"><p className="text-sm text-deep-ink">{confirm === "complete" ? `Mark ${a.clients?.name ?? "client"} complete? A signature request will be sent.` : `Mark ${a.clients?.name ?? "client"} as a no-show?`}</p><div className="mt-3 flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button size="sm" disabled={pending} onClick={act}>{pending ? "Saving…" : "Confirm"}</Button></div></PopoverContent></Popover>
    <DocViewer open={docs} onOpenChange={setDocs} title={a.clients?.name ?? "Documents"} items={a.checklist_items} />
  </>;
}
export function ApptCard({ a, showDate = false, embedded = false }: { a: Appt; showDate?: boolean; embedded?: boolean }) {
  const openClient = useClientDrawer();
  const missing = missingOf(a).length;
  return <article className={cn("flex min-h-16 items-center gap-2 border-b border-border px-2 py-2 last:border-0 sm:gap-3 sm:px-3", !embedded && "bg-surface-2")}>
    <ReadyRing value={a.ready_score} size={40} stroke={4} label="" />
    <button type="button" disabled={!a.clients} onClick={() => a.clients && openClient({ clientId: a.clients.id, appointmentId: a.id })} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left transition-colors duration-150 hover:bg-fill-subtle sm:gap-3">
      <span className="tabular w-[68px] shrink-0 text-[13px] font-medium text-deep-ink">{showDate ? fmtDay(a.start_at) : fmtTime(a.start_at)}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-deep-ink">{a.clients?.name ?? "Client"}</span><span className="block truncate text-xs text-muted-foreground">{a.services?.name}, <MeetingTag type={a.meeting_type} />{showDate ? `, ${fmtTime(a.start_at)}` : ""}</span></span>
    </button>
    {missing > 0 && <span title={`${missing} missing documents`} className="hidden shrink-0 rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning sm:inline">{missing} missing</span>}
    <span className="hidden sm:inline"><StatusPill status={a.status} /></span>
    <ApptActions a={a} />
  </article>;
}

export function NeedRow({ it, onAct, busy }: { it: NeedItem; onAct: () => void; busy: boolean }) {
  const openClient = useClientDrawer();
  let icon: ReactNode, title: string, reason: string, action: string, clientId: string | undefined, appointmentId: string | undefined;
  if (it.kind === "low") { icon = <AlertTriangle className="size-5" />; title = `${it.appt.clients?.name}, ${it.appt.ready_score}% ready`; reason = `${it.appt.services?.name}, ${fmtDay(it.appt.start_at)} at ${fmtTime(it.appt.start_at)}. Missing ${missingOf(it.appt).map(m => m.document_name).join(", ") || "nothing required"}. They were offered later times.`; action = "Keep appointment"; clientId = it.appt.clients?.id; appointmentId = it.appt.id; }
  else if (it.kind === "signature") { icon = <PenLine className="size-5" />; title = `${it.appt.clients?.name} hasn't signed Form 8879`; reason = `Appointment was ${fmtDay(it.appt.start_at)}. Automatic reminders already went out.`; action = "Send another reminder"; clientId = it.appt.clients?.id; appointmentId = it.appt.id; }
  else if (it.kind === "failed") { icon = <MailX className="size-5" />; title = `An email didn't arrive: ${it.msg.subject}`; reason = `To ${it.msg.recipient} on ${fmtStamp(it.msg.sent_at)}. Check the address with the client.`; action = "Dismiss"; }
  else { icon = <Sparkles className="size-5" />; title = `${it.offer.name} took a freed slot`; reason = `${it.offer.service}, ${fmtDay(it.offer.slot_start)} at ${fmtTime(it.offer.slot_start)}. Just so you know, nothing to do.`; action = "Dismiss"; }
  return <li className="flex min-h-16 items-center gap-3 border-b border-border bg-surface-2 px-3 py-2 last:border-0"><span className="shrink-0 text-warning">{icon}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-deep-ink">{clientId ? <button className="text-left hover:text-ink hover:underline" onClick={() => openClient({ clientId, appointmentId })}>{title}</button> : title}</p><p className="truncate text-xs text-muted-foreground" title={reason}>{reason}</p></div><Button size="sm" disabled={busy} onClick={onAct} className="shrink-0">{busy ? "Saving…" : action}</Button></li>;
}
export function NeedsList({ items }: { items: NeedItem[] }) {
  const qc = useQueryClient(); const dismiss = useServerFn(dismissAttention), nudge = useServerFn(nudgeSignature);
  const act = useMutation({ mutationFn: async (it: NeedItem) => { if (it.kind === "signature") return nudge({ data: { id: it.id } }); return dismiss({ data: { kind: it.kind === "low" ? "appointment" : it.kind === "failed" ? "message" : "offer", id: it.id } }); }, onSuccess: (r, it) => { if (!r.ok) { toast.error("Couldn't do that. Try again."); return; } toast.success(it.kind === "signature" ? "Reminder sent." : "Done."); qc.invalidateQueries({ queryKey: ["owner"] }); }, onError: () => toast.error("Couldn't do that. Try again.") });
  return <ul className="overflow-hidden rounded-2xl border border-border">{items.map(it => <NeedRow key={`${it.kind}-${it.id}`} it={it} busy={act.isPending && act.variables?.id === it.id} onAct={() => act.mutate(it)} />)}</ul>;
}

/** A fresh one-minute signed URL is requested for each selected private file. */
export function DocViewer({ open, onOpenChange, title, items }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; items: Item[] }) {
  const getUrl = useServerFn(getDocumentUrl);
  const files = items.filter(i => i.file_path).sort((x, y) => x.sort_order - y.sort_order);
  const [sel, setSel] = useState<{ id: string; url: string | null; loading: boolean; path: string } | null>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!open || !files.length) { setSel(null); setIndex(0); return; }
    let current = true;
    const file = files[Math.min(index, files.length - 1)];
    if (!file?.file_path) return;
    setSel({ id: file.id, url: null, loading: true, path: file.file_path });
    getUrl({ data: { itemId: file.id } }).then(r => { if (current) setSel({ id: file.id, url: r.url, loading: false, path: file.file_path ?? "" }); }).catch(() => { if (current) setSel({ id: file.id, url: null, loading: false, path: file.file_path ?? "" }); });
    return () => { current = false; };
  // File identity, not the array instance, controls refresh.
  }, [open, index, files.map(f => f.id + f.file_path).join("|")]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] max-w-4xl overflow-auto bg-sheet p-0 sm:rounded-2xl"><DialogHeader className="border-b border-border px-6 py-4"><DialogTitle className="font-sans text-lg font-normal">{title}</DialogTitle><DialogDescription>Private files. Links expire after a minute.</DialogDescription></DialogHeader><div className="grid md:grid-cols-[220px_1fr]"><ul className="max-h-[60vh] overflow-auto border-b border-border p-3 md:border-b-0 md:border-r">{files.map((f, i) => <li key={f.id}><Button variant="ghost" onClick={() => setIndex(i)} className={cn("h-auto w-full justify-start whitespace-normal py-2 text-left", index === i && "bg-fill-selected")}><span><span className="block text-sm text-deep-ink">{f.document_name}</span>{f.uploaded_at && <span className="text-xs text-muted-foreground">Received {fmtLong(f.uploaded_at)}</span>}</span></Button></li>)}</ul><div className="min-h-[50vh] bg-sheet p-4"><div className="flex items-center justify-end gap-2 pb-2"><Button size="icon" variant="outline" aria-label="Previous document" disabled={index === 0} onClick={() => setIndex(i => i - 1)}><ChevronLeft /></Button><span className="tabular text-xs text-muted-foreground">{files.length ? index + 1 : 0} / {files.length}</span><Button size="icon" variant="outline" aria-label="Next document" disabled={index >= files.length - 1} onClick={() => setIndex(i => i + 1)}><ChevronRight /></Button></div><div className="grid min-h-[40vh] place-items-center">{sel?.loading && <Skeleton className="h-[40vh] w-full" />}{sel && !sel.loading && !sel.url && <p className="text-sm text-warning">This file couldn't be opened.</p>}{sel?.url && (sel.path.toLowerCase().endsWith(".pdf") ? <iframe title="Document" src={sel.url} className="h-[55vh] w-full rounded-lg border border-border" /> : <img src={sel.url} alt="Uploaded document" className="max-h-[55vh] rounded-lg border border-border object-contain" />)}{sel?.url && <a href={sel.url} target="_blank" rel="noreferrer" className="mt-3 text-xs text-ink underline">Open in a new tab</a>}</div></div></div></DialogContent></Dialog>;
}
