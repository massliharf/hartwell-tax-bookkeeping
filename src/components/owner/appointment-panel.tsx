import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronRight, FileText, MapPin, Video, Maximize2, Minimize2, X } from "lucide-react";
import { Tag } from "@/components/ui/tag";
import { Stepper } from "@/components/ui/stepper";
import { FollowUps, MeetingPicker, MoreActions, RequestDocument } from "./follow-ups";
import { NowBanner } from "./now";
import { meetingLink } from "@/lib/meeting";
import { useOwnerMutation } from "./closeout";
import { INTRO_STEPS, STEPS, introStepOf, isIntroAppt, meetingAhead, stageOf, stepOf } from "@/lib/lifecycle";
import { completeIntroCall } from "@/lib/owner.functions";
import { useOwnerCtx } from "./ctx";
import { supabase } from "@/integrations/supabase/client";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { APPT_SELECT, fmtLong, fmtTime, missingOf, money, type Appt } from "./lib";
import { ErrorNote, StatusPill } from "./ui";
import { ReviewGallery } from "./review-gallery";
import { AiTag, CloseoutBlock, DocReview, FinishForm } from "./closeout";
import { MeetingNotes } from "./meeting-notes";
import { reviewDocument } from "@/lib/owner.functions";
import type { ApptPanelTarget } from "./drawer-context";
import { cn } from "@/lib/utils";
import { useDocked } from "./use-docked";
export { useDocked } from "./use-docked";
import * as DialogPrimitive from "@radix-ui/react-dialog";

/** One appointment: when, who, how ready, and the two things Claire can do. Nothing else. */

/**
 * One appointment. On wide screens it docks as a right panel beside the page (the page makes room, nothing is covered,
 * clicking another appointment just switches it); Expand widens it into a two-column workspace. On phones it's a sheet.
 */
export function AppointmentPanel({ target, onClose, expanded, setExpanded }: { target: ApptPanelTarget | null; onClose: () => void; expanded: boolean; setExpanded: (v: boolean) => void }) {
  const docked = useDocked();
  const close = () => { onClose(); setExpanded(false); };
  const expandBtn = (
    <button type="button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Shrink panel" : "Expand panel"} title={expanded ? "Shrink" : "Expand"}
      className="absolute right-14 top-4 z-10 hidden size-8 place-items-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-tint-1 hover:text-deep-ink sm:grid">
      {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
    </button>
  );
  if (docked) {
    return (
      <DialogPrimitive.Root open={!!target} modal={false} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content onInteractOutside={(e) => e.preventDefault()} onOpenAutoFocus={(e) => e.preventDefault()}
            className={`panel-in fixed bottom-2 right-2 top-2 z-40 flex flex-col overflow-hidden rounded-2xl bg-sheet transition-[width] duration-300 ease-expo ${expanded ? "w-[760px]" : "w-[440px]"}`}>
            {expandBtn}
            <DialogPrimitive.Close aria-label="Close panel" className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-tint-1 hover:text-deep-ink"><X className="size-4" /></DialogPrimitive.Close>
            <div className="min-h-0 flex-1 overflow-y-auto">{target && <AppointmentContent key={target.appointmentId} id={target.appointmentId} onClose={close} expanded={expanded} />}</div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }
  // Phones and narrow windows: a bottom sheet with a grab handle, over a light overlay.
  return (
    <DialogPrimitive.Root open={!!target} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay-light backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content onOpenAutoFocus={(e) => e.preventDefault()} className="sheet-up fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[20px] bg-sheet sm:mx-auto sm:w-[680px]">
          <div className="flex justify-center pb-1 pt-2.5" aria-hidden="true"><span className="h-1 w-10 rounded-full bg-line-2" /></div>
          <DialogPrimitive.Close aria-label="Close" className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-tint-1 hover:text-deep-ink"><X className="size-4" /></DialogPrimitive.Close>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{target && <AppointmentContent key={target.appointmentId} id={target.appointmentId} onClose={close} expanded={false} />}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function AppointmentContent({ id, onClose, expanded }: { id: string; onClose: () => void; expanded: boolean }) {
  const [gallery, setGallery] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [picking, setPicking] = useState<"move" | "follow_up" | null>(null);
  const [tab, setTab] = useState<"overview" | "documents" | "activity" | "notes">("overview");
  const now = useOwnerCtx().data?.now ?? new Date().toISOString();
  const [accepting, setAccepting] = useState(false);
  const videoSetting = useQuery({ queryKey: ["owner", "video-link-value"], queryFn: async () => (await supabase.from("settings").select("video_link").eq("id", 1).maybeSingle()).data?.video_link ?? null });
  const completeIntro = useServerFn(completeIntroCall);
  const introDone = useOwnerMutation((id: string) => completeIntro({ data: { id } }), "Call marked done.");
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
  const intro = isIntroAppt(a);

  const missing = missingOf(a).length;
  const eyesCount = a.checklist_items.filter((i) => i.status === "uploaded" && i.review_status === "pending" && i.ai_check !== "warning" && i.ai_check !== "ok").length;
  const docsIn = items.filter((i) => i.status !== "missing").length;
  const tabs: { id: "overview" | "documents" | "activity" | "notes"; label: string; count?: number | undefined; warn?: boolean }[] = [
    { id: "overview", label: "Overview" },
    ...(intro ? [] : [{ id: "documents" as const, label: "Documents", count: eyesCount || (items.length - docsIn) || undefined, warn: eyesCount > 0 }]),
    { id: "activity", label: "Messages" },
    ...(a.meeting_type === "video" ? [{ id: "notes" as const, label: "Notes" }] : []),
  ];
  const facts: [string, string, ("documents" | "activity" | null)?][] = [
    ["Service", a.services?.name ?? "Appointment"],
    ["When", `${fmtLong(a.start_at)}, ${fmtTime(a.start_at)} – ${fmtTime(a.end_at)}`],
    ["Where", a.meeting_type === "video" ? "Video call" : "412 Bloomfield Ave"],
    ...(intro ? [] : [["Documents", `${docsIn} of ${items.length} in${eyesCount ? `, ${eyesCount} to check` : ""}`, "documents"] as [string, string, "documents"]]),
    ...(a.fee_cents != null ? [["Fee", money(a.fee_cents)] as [string, string]] : []),
  ];
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
    <div className="flex min-h-full flex-col">
      {/* 1. Who, when, where (information). */}
      <header className="border-b border-border px-5 pb-5 pt-5 sm:px-6">
        <div className="flex items-start gap-3 pr-20">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fill-neutral text-sm font-semibold text-deep-ink">{a.clients?.name.charAt(0) ?? "?"}</span>
          <div className="min-w-0">
            <DialogTitle className="truncate text-[18px] font-semibold leading-6 text-deep-ink">{a.clients?.name ?? "Appointment"}</DialogTitle>
            <DialogDescription className="tabular text-sm text-muted-foreground">{fmtLong(a.start_at)}, {fmtTime(a.start_at)} – {fmtTime(a.end_at)}</DialogDescription>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 items-center rounded-lg bg-tint-1 px-2.5 text-xs font-medium text-deep-ink">{a.services?.name}</span>
          {a.meeting_type === "video"
            ? <Button size="sm" asChild><a href={meetingLink(videoSetting.data, a.id)} target="_blank" rel="noreferrer"><Video />Join video call</a></Button>
            : <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-tint-1 px-2.5 text-xs font-medium text-deep-ink"><MapPin className="size-3.5" />In person</span>}
          {a.clients && <Button size="sm" variant="ghost" asChild><Link to="/owner/clients/$id" params={{ id: a.clients.id }} onClick={onClose}>Client profile<ChevronRight /></Link></Button>}
        </div>
        {/* 2. Where it is, and whose move it is (status + the one decision the footer doesn't carry). */}
        {stage !== "cancelled" && (intro ? <Stepper steps={INTRO_STEPS} current={introStepOf(stage)} className="mt-5" /> : <Stepper steps={STEPS} current={stepOf(stage)} className="mt-5" />)}
        <NowBanner a={a} nowIso={now} className="mt-4" action={
          eyesCount > 0 ? <Button size="sm" onClick={() => setGallery(true)}>Check {eyesCount} document{eyesCount === 1 ? "" : "s"}</Button> : null} />
      </header>

      {/* 3. One thing at a time: tabs keep documents, history and notes apart. */}
      <div role="tablist" aria-label="Appointment details" className="sticky top-0 z-10 flex gap-1 border-b border-border bg-sheet px-4 sm:px-5">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={cn("relative flex h-11 items-center gap-1.5 px-2 text-[13px] font-medium transition-colors duration-150", tab === t.id ? "text-deep-ink" : "text-muted-foreground hover:text-deep-ink")}>
            {t.label}{t.count != null && <span className={cn("tabular rounded-full px-1.5 text-[11px] leading-4", t.warn ? "bg-alert-warning text-alert-warning-fg" : "bg-tint-1 text-muted-foreground")}>{t.count}</span>}
            {tab === t.id && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-deep-ink" />}
          </button>
        ))}
      </div>

      <div key={tab} className="enter">
        {tab === "overview" && (
          <>
            <section className="px-5 py-5 sm:px-6">
              <h3 className="t-sub">At a glance</h3>
              <dl className="mt-3 divide-y divide-line-1 overflow-hidden rounded-xl border border-line-1 text-sm">
                {facts.map(([k, v, go]) => (
                  <div key={k} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 px-3 py-2.5">
                    <dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 text-deep-ink">{v}</dd>
                    {go ? <button type="button" onClick={() => setTab(go)} className="text-xs font-medium text-ink hover:underline">View</button> : <span />}
                  </div>
                ))}
              </dl>
              {intro && <p className="mt-3 text-sm text-muted-foreground">No documents for this one. After the call, mark it done; {a.clients?.name.split(" ")[0] ?? "the client"} gets a link to schedule the appointment you suggested.</p>}
            </section>
            <CloseoutBlock a={a} />
          </>
        )}
        {tab === "documents" && !intro && (
          <>
      {/* 3. Documents: summary, then the list; row actions only where a decision is needed. */}
      {intro ? <section className="hidden"><h3 className="t-sub">Free 15-minute call</h3><p className="mt-1 text-sm text-muted-foreground">No documents for this one. After the call, mark it done; {a.clients?.name.split(" ")[0] ?? "the client"} gets a link to schedule the appointment you suggested.</p></section> : <section className="px-6 py-5">
        <DocsWrap collapsed={false} count={items.filter((i) => i.status === "uploaded").length}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ReadyRing value={a.ready_score} size={36} stroke={4} />
            <div>
              <h3 className="t-sub">Documents</h3>
              <p className="text-xs text-muted-foreground">{items.filter((i) => i.status !== "missing").length} of {items.length} in{missing ? `, ${missing} missing` : ""}{eyesCount ? `, ${eyesCount} need${eyesCount === 1 ? "s" : ""} your eyes` : ""}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {items.some((i) => i.status === "uploaded") && <Button size="sm" variant="secondary" onClick={() => setGallery(true)}>Open viewer</Button>}
            {looksRight.length >= 2 && <Button size="sm" variant="secondary" disabled={accepting} onClick={acceptAll}>{accepting ? "Accepting…" : "Accept all that look right"}</Button>}
          </div>
        </div>
        {(() => {
          const eyes = items.filter((i) => i.status === "uploaded" && i.review_status === "pending" && i.ai_check !== "warning" && i.ai_check !== "ok");
          const received = items.filter((i) => i.status === "uploaded" && !eyes.includes(i));
          const open = items.filter((i) => i.status !== "uploaded");
          const group = (title: string, list: typeof items, tone?: "warn") => list.length > 0 && (
             <div className="mt-3">
               <p className={cn("mb-1 t-label", tone === "warn" && "text-alert-warning-fg")}>{title} · {list.length}</p>
              <ul className="divide-y divide-line-1 overflow-hidden rounded-xl border border-line-1">
                {list.map((i) => (
                   <li key={i.id} className="px-3 py-1.5">
                     <div className="flex flex-wrap items-center gap-2 text-sm">
                      <button type="button" disabled={i.status !== "uploaded"} onClick={() => setGallery(true)}
                         className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default">
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
      </section>}
          </>
        )}
        {tab === "activity" && <FollowUps a={a} now={now} />}
        {tab === "notes" && <MeetingNotes a={a} now={now} />}
      </div>
      <ReviewGallery open={gallery} onOpenChange={setGallery} title={a.clients?.name ?? "Client"} items={items} onAcceptAll={acceptAll} accepting={accepting} />

      <footer className="sticky bottom-0 z-20 mt-auto max-h-[70dvh] overflow-y-auto overscroll-contain border-t border-border bg-sheet px-5 py-4 sm:px-6">
        {finishing ? <FinishForm a={a} onBack={() => setFinishing(false)} onDone={() => { setFinishing(false); onClose(); void qc.invalidateQueries({ queryKey: ["owner"] }); }} />
          : picking ? <MeetingPicker a={a} mode={picking} onBack={() => setPicking(null)} onDone={() => { setPicking(null); void qc.invalidateQueries({ queryKey: ["owner"] }); }} />
          : (
            <div className="flex items-center gap-2">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                {meetingAhead(stage) && <>
                  <Button variant="secondary" className="sm:col-span-2" onClick={() => setPicking("move")}>Reschedule</Button>
                </>}
                {intro && (stage === "meeting" || stage === "wrap_up") && <Button className="sm:col-span-2" disabled={introDone.isPending} onClick={() => introDone.mutate(a.id)}>{introDone.isPending ? "Saving…" : "Mark call done"}</Button>}
                {!intro && (stage === "meeting" || stage === "wrap_up") && <>
                  <Button onClick={() => setFinishing(true)}>Finish appointment</Button>
                  <Button variant="secondary" onClick={() => setPicking("follow_up")}>Needs another meeting</Button>
                </>}
                {(finished || stage === "cancelled" || stage === "no_show") && <p className="text-xs text-muted-foreground sm:col-span-2">{intro && stage === "filed" ? "Call done." : stage === "filed" ? "Return filed. Nothing left to do." : stage === "to_file" ? "Signed and paid. Mark it filed above when it's submitted." : stage === "sign_pay" ? "Waiting for the client to sign and pay." : stage === "no_show" ? "Marked as a no-show." : "This appointment was cancelled."}</p>}
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
