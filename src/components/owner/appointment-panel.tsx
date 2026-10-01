import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronRight, FileText, MapPin, Video, Maximize2, Minimize2 } from "lucide-react";
import { Tag } from "@/components/ui/tag";
import { Stepper } from "@/components/ui/stepper";
import { FollowUps, MeetingPicker, MoreActions, RequestDocument } from "./follow-ups";
import { STEPS, meetingAhead, stageOf, stepOf } from "@/lib/lifecycle";
import { useOwnerCtx } from "./ctx";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { APPT_SELECT, fmtLong, fmtTime, missingOf, type Appt } from "./lib";
import { ErrorNote, StatusPill } from "./ui";
import { ReviewGallery } from "./review-gallery";
import { AiTag, CloseoutBlock, DocReview, FinishForm } from "./closeout";
import { reviewDocument } from "@/lib/owner.functions";
import type { ApptPanelTarget } from "./drawer-context";
import { cn } from "@/lib/utils";

/** One appointment: when, who, how ready, and the two things Claire can do. Nothing else. */
export function AppointmentPanel({ target, onClose }: { target: ApptPanelTarget | null; onClose: () => void }) {
  // Opens as a focused window; Expand turns it into a full workspace (details left, what's happening right), like Magnific's asset view.
  const [expanded, setExpanded] = useState(false);
  return (
    <Dialog open={!!target} onOpenChange={(o) => { if (!o) { onClose(); setExpanded(false); } }}>
      <DialogContent className={`block gap-0 overflow-y-auto p-0 transition-[max-width,height] duration-300 ease-expo ${expanded ? "h-[94dvh] max-h-[94dvh] max-w-[min(1180px,calc(100vw-32px))]" : "max-h-[92dvh] max-w-[680px]"}`}>
        <button type="button" onClick={() => setExpanded((e) => !e)} aria-label={expanded ? "Shrink window" : "Expand window"} title={expanded ? "Shrink" : "Expand"}
          className="absolute right-14 top-4 z-10 hidden size-8 place-items-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-tint-1 hover:text-deep-ink sm:grid">
          {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
        {target && <AppointmentContent id={target.appointmentId} onClose={onClose} expanded={expanded} />}
      </DialogContent>
    </Dialog>
  );
}

function AppointmentContent({ id, onClose, expanded }: { id: string; onClose: () => void; expanded: boolean }) {
  const [gallery, setGallery] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [picking, setPicking] = useState<"move" | "follow_up" | null>(null);
  const now = useOwnerCtx().data?.now ?? new Date().toISOString();
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
  const stage = stageOf(a, now);
  const finished = stage === "sign_pay" || stage === "to_file" || stage === "filed";
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
      <header className="border-b border-border px-6 pb-5 pr-24 pt-6">
        <p className="text-xs text-muted-foreground">Appointment</p>
        <DialogTitle className="mt-1 t-owner text-deep-ink">{fmtLong(a.start_at)}, {fmtTime(a.start_at)}</DialogTitle>
        <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{a.services?.name}</span>
          <span className="inline-flex items-center gap-1">{a.meeting_type === "video" ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}{a.meeting_type === "video" ? "Video" : "In person"}</span>
          <StatusPill status={a.status} />
        </DialogDescription>
        {stage !== "cancelled" && <Stepper steps={STEPS} current={stepOf(stage)} className="mt-4" />}
        {a.clients && (
          <Link to="/owner/clients/$id" params={{ id: a.clients.id }} onClick={onClose}
            className="mt-4 flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors duration-150 hover:bg-surface-2">
            <span className="grid size-8 place-items-center rounded-full bg-fill-neutral text-xs font-medium text-deep-ink">{a.clients.name.charAt(0)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-deep-ink">{a.clients.name}</span><span className="block truncate text-xs text-muted-foreground">{a.clients.email}</span></span>
            <span className="text-xs text-muted-foreground">Client</span><ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        )}
      </header>

      <div className={expanded ? "grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:divide-x lg:divide-border" : ""}>
      <div className="min-w-0">
      <section className="px-6 py-5">
        <DocsWrap collapsed={finished} count={items.filter((i) => i.status === "uploaded").length}>
        {a.status !== "completed" && <div className="flex items-center gap-3">
          <ReadyRing value={a.ready_score} size={40} stroke={4} />
          <div><p className="text-sm font-medium text-deep-ink">{a.ready_score >= 100 ? "Ready" : `${a.ready_score}% ready`}</p><p className="text-xs text-muted-foreground">{missing ? `${missing} document${missing === 1 ? "" : "s"} missing` : "Every document is in"}</p></div>
        </div>}
        {(() => { const n = items.filter((i) => i.status === "uploaded").length; return <div className="mt-4 flex flex-wrap gap-2">
          {n > 0 && (() => { const eyes = items.filter((i) => i.status === "uploaded" && i.review_status === "pending" && i.ai_check !== "warning" && i.ai_check !== "ok").length; return <Button size="sm" variant={eyes ? "default" : "secondary"} onClick={() => setGallery(true)}>{eyes ? `Check ${eyes} document${eyes === 1 ? "" : "s"}` : `View documents (${n})`}</Button>; })()}
          {looksRight.length >= 2 && <Button size="sm" variant="secondary" disabled={accepting} onClick={acceptAll}>{accepting ? "Accepting…" : "Accept all that look right"}</Button>}
        </div>; })()}
        {(() => {
          const eyes = items.filter((i) => i.status === "uploaded" && i.review_status === "pending" && i.ai_check !== "warning" && i.ai_check !== "ok");
          const received = items.filter((i) => i.status === "uploaded" && !eyes.includes(i));
          const open = items.filter((i) => i.status !== "uploaded");
          const group = (title: string, list: typeof items, tone?: "warn") => list.length > 0 && (
            <div className="mt-4">
              <p className={cn("mb-1.5 t-label", tone === "warn" && "text-alert-warning-fg")}>{title} · {list.length}</p>
              <ul className="divide-y divide-line-1 overflow-hidden rounded-xl border border-line-1">
                {list.map((i) => (
                  <li key={i.id} className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2.5 text-sm">
                      <button type="button" disabled={i.status !== "uploaded"} onClick={() => setGallery(true)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left disabled:cursor-default">
                        <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", i.status === "uploaded" ? "bg-fill-neutral text-deep-ink" : "border border-dashed border-line-2 text-muted-foreground")}><FileText className="size-3.5" /></span>
                        <span className={cn("min-w-0 truncate", i.status === "uploaded" ? "text-deep-ink" : "text-muted-foreground")}>{i.document_name}</span>
                      </button>
                      {i.status === "uploaded" ? <AiTag i={i} /> : <Tag tone={i.status === "not_applicable" ? "neutral" : "warning"}>{i.status === "not_applicable" ? "Doesn't apply" : "Missing"}</Tag>}
                    </div>
                    {i.ai_note && i.status === "uploaded" && i.review_status !== "accepted" && <p className={cn("mt-1 pl-[38px] text-xs", i.ai_check === "warning" || i.ai_check === "kept" ? "text-alert-warning-fg" : "text-muted-foreground")}>{i.ai_note}</p>}
                    {eyes.includes(i) && <div className="mt-2 pl-[38px]"><DocReview i={i} inline /></div>}
                    {i.review_status === "needs_fix" && <div className="pl-[38px]"><DocReview i={i} /></div>}
                  </li>
                ))}
              </ul>
            </div>
          );
          return <>{group("Needs your eyes", eyes, "warn")}{group("Received", received)}{group("Still to come", open)}<RequestDocument a={a} /></>;
        })()}
        </DocsWrap>
        <ReviewGallery open={gallery} onOpenChange={setGallery} title={a.clients?.name ?? "Client"} items={items} onAcceptAll={acceptAll} accepting={accepting} />
      </section>
      </div>
      <div className="min-w-0">
      <CloseoutBlock a={a} />
      <FollowUps a={a} now={now} />
      </div>
      </div>

      <footer className="sticky bottom-0 rounded-b-2xl border-t border-border bg-sheet px-6 py-4">
        {finishing ? <FinishForm a={a} onBack={() => setFinishing(false)} onDone={() => { setFinishing(false); onClose(); void qc.invalidateQueries({ queryKey: ["owner"] }); }} />
          : picking ? <MeetingPicker a={a} mode={picking} onBack={() => setPicking(null)} onDone={() => { setPicking(null); void qc.invalidateQueries({ queryKey: ["owner"] }); }} />
          : (
            <div className="flex items-center gap-2">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                {meetingAhead(stage) && <>
                  <Button variant="secondary" className="sm:col-span-2" onClick={() => setPicking("move")}>Reschedule</Button>
                </>}
                {(stage === "meeting" || stage === "wrap_up") && <>
                  <Button onClick={() => setFinishing(true)}>Finish appointment</Button>
                  <Button variant="secondary" onClick={() => setPicking("follow_up")}>Needs another meeting</Button>
                </>}
                {(finished || stage === "cancelled" || stage === "no_show") && <p className="text-xs text-muted-foreground sm:col-span-2">{stage === "filed" ? "Return filed. Nothing left to do." : stage === "to_file" ? "Signed and paid. Mark it filed above when it's submitted." : stage === "sign_pay" ? "Waiting for the client to sign and pay." : stage === "no_show" ? "Marked as a no-show." : "This appointment was cancelled."}</p>}
              </div>
              <MoreActions a={a} onClosed={onClose} canNoShow={stage === "meeting" || stage === "wrap_up"} />
            </div>
          )}
      </footer>
    </div>
  );
}


/** After the return is finished, documents step back: one collapsed line, open on demand. */
function DocsWrap({ collapsed, count, children }: { collapsed: boolean; count: number; children: React.ReactNode }) {
  if (!collapsed) return <>{children}</>;
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-medium text-deep-ink [&::-webkit-details-marker]:hidden">
        Documents ({count} received)<ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div>{children}</div>
    </details>
  );
}
