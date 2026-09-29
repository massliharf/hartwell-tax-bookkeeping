import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, FileText, MapPin, Video, X } from "lucide-react";
import { toast } from "sonner";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getDocumentUrl } from "@/lib/portal.functions";
import { markComplete, markNoShow } from "@/lib/owner.functions";
import { fmtLong, fmtTime, missingOf, type Appt, type Item } from "./lib";
import { cn } from "@/lib/utils";

export function PageHead({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>}
      <h1 className="mt-1 font-serif text-4xl leading-tight text-deep-ink md:text-5xl">{title}</h1>
      {children && <div className="mt-2 text-muted-foreground">{children}</div>}
    </header>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="sheet-stack ledger mx-auto max-w-md px-8 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success"><Check className="h-6 w-6" /></span>
      <h2 className="mt-4 font-serif text-3xl text-deep-ink">{title}</h2>
      {children && <p className="mt-2 text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}

export function LoadingRows({ n = 3 }: { n?: number }) {
  return <div className="space-y-4">{Array.from({ length: n }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-sheet" />)}</div>;
}

export function ErrorNote({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5 text-sm text-deep-ink">
      This didn't load. {onRetry && <button onClick={onRetry} className="font-medium underline underline-offset-4">Try again</button>}
    </div>
  );
}

export function MeetingTag({ type }: { type: Appt["meeting_type"] }) {
  return type === "video"
    ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Video className="h-3.5 w-3.5" />Video</span>
    : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />In person</span>;
}

export function useApptActions() {
  const qc = useQueryClient();
  const complete = useServerFn(markComplete);
  const noShow = useServerFn(markNoShow);
  const done = () => qc.invalidateQueries({ queryKey: ["owner"] });
  return {
    complete: useMutation({ mutationFn: (id: string) => complete({ data: { id } }), onSuccess: () => { toast.success("Marked complete. Signature request is on its way."); done(); }, onError: () => toast.error("Couldn't save that. Try again.") }),
    noShow: useMutation({ mutationFn: (id: string) => noShow({ data: { id } }), onSuccess: () => { toast("Marked as no-show."); done(); }, onError: () => toast.error("Couldn't save that. Try again.") }),
  };
}

const STATUS_LABEL: Record<string, string> = { booked: "Booked", confirmed: "Confirmed", completed: "Completed", no_show: "No-show", cancelled: "Cancelled", rescheduled: "Moved" };

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium",
      status === "confirmed" && "bg-success/10 text-success",
      status === "completed" && "bg-ink/10 text-ink",
      status === "no_show" && "bg-warning/10 text-warning",
      (status === "booked" || status === "cancelled") && "bg-muted text-muted-foreground")}>{STATUS_LABEL[status] ?? status}</span>
  );
}

/** One appointment as a paper card: time, client, ring, missing docs, actions. */
export function ApptCard({ a, showDate = false }: { a: Appt; showDate?: boolean }) {
  const [docs, setDocs] = useState(false);
  const { complete, noShow } = useApptActions();
  const missing = missingOf(a);
  const uploaded = a.checklist_items.filter((i) => i.file_path);
  const open = a.status === "booked" || a.status === "confirmed";
  return (
    <article className="sheet-stack p-5 md:p-6">
      <div className="flex gap-4">
        <ReadyRing value={a.ready_score} size={64} stroke={6} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="tabular text-sm font-medium text-ink">{showDate ? `${fmtLong(a.start_at)} · ` : ""}{fmtTime(a.start_at)}–{fmtTime(a.end_at)}</p>
            <MeetingTag type={a.meeting_type} />
            <StatusPill status={a.status} />
          </div>
          <h3 className="mt-1 truncate font-serif text-2xl text-deep-ink">
            {a.clients ? <Link to="/owner/clients/$id" params={{ id: a.clients.id }} className="hover:underline underline-offset-4">{a.clients.name}</Link> : "Client"}
          </h3>
          <p className="text-sm text-muted-foreground">{a.services?.name}</p>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        {missing.length ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-warning">Still missing · {missing.length}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {missing.map((m) => <li key={m.id} className="rounded-full border border-border bg-paper px-3 py-1 text-xs text-deep-ink">{m.document_name}</li>)}
            </ul>
          </>
        ) : <p className="flex items-center gap-2 text-sm text-success"><Check className="h-4 w-4" />Every document is in.</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {open && <Button size="sm" onClick={() => complete.mutate(a.id)} disabled={complete.isPending}>Mark complete</Button>}
        {open && <Button size="sm" variant="outline" onClick={() => noShow.mutate(a.id)} disabled={noShow.isPending}>No-show</Button>}
        <Button size="sm" variant="ghost" onClick={() => setDocs(true)} disabled={!uploaded.length}>
          <FileText />Open documents{uploaded.length ? ` (${uploaded.length})` : ""}
        </Button>
      </div>
      <DocViewer open={docs} onOpenChange={setDocs} title={a.clients?.name ?? "Documents"} items={a.checklist_items} />
    </article>
  );
}

/** Clean viewer for uploaded files; each opens through a 60-second signed link. */
export function DocViewer({ open, onOpenChange, title, items }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; items: Item[] }) {
  const getUrl = useServerFn(getDocumentUrl);
  const files = items.filter((i) => i.file_path).sort((x, y) => x.sort_order - y.sort_order);
  const [sel, setSel] = useState<{ id: string; url: string | null; loading: boolean; path: string } | null>(null);
  const pick = async (i: Item) => {
    setSel({ id: i.id, url: null, loading: true, path: i.file_path! });
    try {
      const r = await getUrl({ data: { itemId: i.id } });
      setSel({ id: i.id, url: r.url, loading: false, path: i.file_path! });
    } catch { setSel({ id: i.id, url: null, loading: false, path: i.file_path! }); }
  };
  const isPdf = sel?.path.toLowerCase().endsWith(".pdf");
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSel(null); }}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto bg-paper p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="font-serif text-2xl font-normal">{title}</DialogTitle>
          <DialogDescription>Private files. Links expire after a minute.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-0 md:grid-cols-[220px_1fr]">
          <ul className="max-h-[60vh] overflow-auto border-b border-border p-3 md:border-b-0 md:border-r">
            {files.map((f) => (
              <li key={f.id}>
                <button onClick={() => pick(f)} className={cn("w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-sage", sel?.id === f.id && "bg-sage")}>
                  <span className="block text-deep-ink">{f.document_name}</span>
                  {f.uploaded_at && <span className="text-xs text-muted-foreground">Received {fmtLong(f.uploaded_at)}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="grid min-h-[50vh] place-items-center bg-sheet p-4">
            {!sel && <p className="text-sm text-muted-foreground">Choose a document to view it.</p>}
            {sel?.loading && <p className="text-sm text-muted-foreground">Opening…</p>}
            {sel && !sel.loading && !sel.url && <p className="text-sm text-warning">This file couldn't be opened.</p>}
            {sel?.url && (isPdf
              ? <iframe title="Document" src={sel.url} className="h-[60vh] w-full rounded-xl border border-border bg-card" />
              : <img src={sel.url} alt="Uploaded document" className="max-h-[60vh] rounded-xl border border-border object-contain" />)}
            {sel?.url && <a href={sel.url} target="_blank" rel="noreferrer" className="mt-3 text-xs text-ink underline underline-offset-4">Open in a new tab</a>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CloseX({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} aria-label="Close" className="rounded-full p-1 hover:bg-sage"><X className="h-4 w-4" /></button>;
}
