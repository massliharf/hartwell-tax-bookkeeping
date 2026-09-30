import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, ChevronRight, MapPin, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { APPT_SELECT, fmtLong, fmtTime, missingOf, type Appt } from "./lib";
import { ApptActionButtons, ErrorNote, StatusPill } from "./ui";
import { ReviewGallery } from "./review-gallery";
import { AiTag, CloseoutBlock, DocReview, FinishForm } from "./closeout";
import { reviewDocument } from "@/lib/owner.functions";
import type { ApptPanelTarget } from "./drawer-context";
import { cn } from "@/lib/utils";

/** One appointment: when, who, how ready, and the two things Claire can do. Nothing else. */
export function AppointmentPanel({ target, onClose }: { target: ApptPanelTarget | null; onClose: () => void }) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="block max-h-[92dvh] max-w-[520px] gap-0 overflow-y-auto p-0">
        {target && <AppointmentContent id={target.appointmentId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function AppointmentContent({ id, onClose }: { id: string; onClose: () => void }) {
  const [gallery, setGallery] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const review = useServerFn(reviewDocument);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["owner", "appt", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select(APPT_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as Appt | null;
    },
  });
  if (q.isLoading) return <div className="space-y-4 p-6"><DialogTitle className="sr-only">Appointment</DialogTitle><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56" /><Skeleton className="h-40 w-full rounded-2xl" /></div>;
  if (q.isError) return <div className="p-6"><ErrorNote onRetry={() => q.refetch()} /></div>;
  const a = q.data;
  if (!a) return <p className="p-6 text-sm text-muted-foreground">This appointment couldn't be found.</p>;
  const items = [...a.checklist_items].sort((x, y) => x.sort_order - y.sort_order);
  const missing = missingOf(a).length;
  const looksRight = items.filter(i => i.status === "uploaded" && i.review_status === "pending" && i.ai_check === "ok");
  const acceptAll = async () => {
    setAccepting(true);
    try {
      for (const i of looksRight) {
        const result = await review({ data: { itemId: i.id, decision: "accepted" } });
        if (!result.ok) throw new Error("Review failed");
      }
      toast.success("Documents accepted.");
      await qc.invalidateQueries({ queryKey: ["owner"] });
    } catch { toast.error("Some documents couldn't be accepted. Please try again."); await qc.invalidateQueries({ queryKey: ["owner"] }); }
    finally { setAccepting(false); }
  };

  return (
    <div className="flex flex-col">
      <header className="border-b border-border px-6 pb-5 pr-14 pt-6">
        <p className="text-xs text-muted-foreground">Appointment</p>
        <DialogTitle className="mt-1 t-owner text-deep-ink">{fmtLong(a.start_at)}, {fmtTime(a.start_at)}</DialogTitle>
        <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{a.services?.name}</span>
          <span className="inline-flex items-center gap-1">{a.meeting_type === "video" ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}{a.meeting_type === "video" ? "Video" : "In person"}</span>
          <StatusPill status={a.status} />
        </DialogDescription>
        {a.clients && (
          <Link to="/owner/clients/$id" params={{ id: a.clients.id }} onClick={onClose}
            className="mt-4 flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors duration-150 hover:bg-surface-2">
            <span className="grid size-8 place-items-center rounded-full bg-fill-neutral text-xs font-medium text-deep-ink">{a.clients.name.charAt(0)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-deep-ink">{a.clients.name}</span><span className="block truncate text-xs text-muted-foreground">{a.clients.email}</span></span>
            <span className="text-xs text-muted-foreground">Client</span><ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        )}
      </header>

      <section className="px-6 py-5">
        {a.status !== "completed" && <div className="flex items-center gap-3">
          <ReadyRing value={a.ready_score} size={40} stroke={4} />
          <div><p className="text-sm font-medium text-deep-ink">{a.ready_score >= 100 ? "Ready" : `${a.ready_score}% ready`}</p><p className="text-xs text-muted-foreground">{missing ? `${missing} document${missing === 1 ? "" : "s"} missing` : "Every document is in"}</p></div>
        </div>}
        {(() => { const n = items.filter((i) => i.status === "uploaded").length; return <div className="mt-4 flex flex-wrap gap-2">
          {n > 0 && (() => { const eyes = items.filter((i) => i.status === "uploaded" && i.review_status === "pending" && i.ai_check !== "warning" && i.ai_check !== "ok").length; return <Button size="sm" variant={eyes ? "default" : "secondary"} onClick={() => setGallery(true)}>{eyes ? `Check ${eyes} document${eyes === 1 ? "" : "s"}` : `View documents (${n})`}</Button>; })()}
          {looksRight.length >= 2 && <Button size="sm" variant="secondary" disabled={accepting} onClick={acceptAll}>{accepting ? "Accepting…" : "Accept all that look right"}</Button>}
        </div>; })()}
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {items.map((i) => (
            <li key={i.id} className="px-4 py-2.5"><div className="flex flex-wrap items-center gap-2.5 text-sm">
              {i.status === "uploaded"
                ? <span className="grid size-4 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-2.5" strokeWidth={3} /></span>
                : <span className={cn("size-4 rounded-full border", i.status === "not_applicable" ? "border-border bg-fill-subtle" : "border-warning/60")} />}
              <span className={cn("min-w-[100px] flex-1", i.status === "uploaded" ? "text-deep-ink" : "text-muted-foreground")}>{i.document_name}</span>
              <AiTag i={i} />
              {i.status === "uploaded" && i.review_status === "pending" && <div className="order-last w-full sm:order-none sm:w-auto"><DocReview i={i} inline /></div>}
              {i.status !== "uploaded" && <span className={cn("text-xs", i.status === "not_applicable" ? "text-muted-foreground" : "text-warning")}>{i.status === "not_applicable" ? "Doesn't apply" : "Missing"}</span>}
            </div>{i.ai_note && <p className={cn("mt-1 pl-6 text-xs", i.ai_check === "warning" || i.ai_check === "kept" ? "text-warning" : "text-muted-foreground")}>{i.ai_note}</p>}{!(i.status === "uploaded" && i.review_status === "pending") && <DocReview i={i} />}</li>
          ))}
        </ul>
        <ReviewGallery open={gallery} onOpenChange={setGallery} title={a.clients?.name ?? "Client"} items={items} onAcceptAll={acceptAll} accepting={accepting} />
      </section>
      <CloseoutBlock a={a} />

      <footer className="sticky bottom-0 rounded-b-2xl border-t border-border bg-sheet px-6 py-4">
        {finishing ? <FinishForm a={a} onBack={() => setFinishing(false)} onDone={() => { setFinishing(false); onClose(); void qc.invalidateQueries({ queryKey: ["owner"] }); }} /> : <ApptActionButtons a={a} onDone={onClose} onFinish={() => setFinishing(true)} />}
        {!finishing && !(a.status === "booked" || a.status === "confirmed") && <p className="text-center text-xs text-muted-foreground">{a.filed_at ? "Return filed. Nothing left to do." : a.status === "completed" ? "Appointment finished." : "This appointment is closed."}</p>}
      </footer>
    </div>
  );
}
