import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, Check, ChevronDown, CreditCard, FileText, Loader2, Lock, MapPin, Upload, Video, Users, CalendarClock, X, PenLine, Link as LinkIcon, Hourglass, RotateCcw, Copy, CalendarPlus } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tag } from "@/components/ui/tag";
import { Stepper } from "@/components/ui/stepper";
import { DIRECTIONS, MAP_EMBED, OFFICE, OFFICE_ADDRESS, downloadIcs, joinState } from "@/lib/meeting";
import { INTRO_STEPS, STEPS, introStepOf, isIntroAppt, meetingAhead, stageOf, stepOf, type Stage } from "@/lib/lifecycle";
import { Checkout } from "@/components/booking/Checkout";
import { IntakeQuestions } from "@/components/booking/IntakeQuestions";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { BookingShell, ResultPanel } from "@/components/booking/BookingShell";
import {
  cancelAppointment, confirmAttendance, confirmUpload, createUploadUrl, getAppointmentByToken,
  keepFlaggedFile, markNotApplicable, rescheduleAppointment, saveIntake, signForm8879, testPay, undoNotApplicable,
} from "@/lib/portal.functions";
import { getAvailabilityWindow } from "@/lib/booking.functions";
import { userTz, fmtDateLong, fmtDayChip, fmtTime, toIntakePayload, type Answers, intakeComplete } from "@/lib/intake";
import { docGuide } from "@/lib/doc-guide";

export const Route = createFileRoute("/a/$token")({
  validateSearch: z.object({ booked: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Your appointment — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Manage your appointment and upload your documents privately." },
      { property: "og:title", content: "Your appointment — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "Your private appointment page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalPage,
});

const ADDRESS = "412 Bloomfield Avenue, Montclair, NJ 07042";
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("412 Bloomfield Avenue, Montclair, NJ 07042")}`;
const MAX = 15 * 1024 * 1024;
const EXTS = ["pdf", "jpg", "jpeg", "png", "heic", "heif"];
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** Friendly checks before a file leaves the phone. Returns an error message or null. */
async function checkFile(f: File): Promise<string | null> {
  const ext = (f.name.split(".").pop() ?? "").toLowerCase();
  if (!EXTS.includes(ext) && !["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif"].includes(f.type)) return "Please use a PDF, JPG, PNG or HEIC file.";
  if (f.size === 0) return "That file looks empty. Please try another one.";
  if (f.size > MAX) return "That file is over 15MB. A phone photo usually works.";
  if (ext === "pdf" || f.type === "application/pdf") {
    const head = await f.slice(0, Math.min(f.size, 2 * 1024 * 1024)).text();
    const tail = await f.slice(Math.max(0, f.size - 64 * 1024)).text();
    if (/\/Encrypt\b/.test(head) || /\/Encrypt\b/.test(tail)) return "This PDF is password-protected. Please save a copy without a password, or take a photo instead.";
  } else if (["jpg", "jpeg", "png"].includes(ext) || f.type === "image/jpeg" || f.type === "image/png") {
    try {
      const bmp = await createImageBitmap(f);
      const short = Math.min(bmp.width, bmp.height); bmp.close();
      if (short < 1000) return "This photo is a bit small to read. Please take it closer, or use your phone's full camera resolution.";
    } catch { return "We couldn't open this image. Please try another photo."; }
  }
  return null;
}

type Appt = {
  service_id: string; start_at: string; end_at: string; meeting_type: "in_person" | "video"; status: string;
  ready_score: number; signature_status: string; services: { name: string; slug?: string } | null; intake_answers?: Record<string, unknown> | null; clients: { name: string; email?: string } | null;
  fee_cents: number | null; client_note: string | null; paid_at: string | null; filed_at: string | null;
  created_at?: string; finished_at?: string | null; signed_at?: string | null;
};
type Item = { id: string; uploaded_at?: string | null; document_name: string; description: string | null; required: boolean; status: string; na_reason: string | null; ai_check: string | null; ai_note: string | null; review_status: string; fix_reason: string | null; fix_note: string | null };

function PortalPage() {
  const { token } = Route.useParams();
  const { booked } = Route.useSearch();
  const fetchAppt = useServerFn(getAppointmentByToken);
  const q = useQuery({ queryKey: ["portal", token], queryFn: () => fetchAppt({ data: { token } }), retry: false });
  const refresh = () => q.refetch();

  if (q.isError) {
    return (
      <BookingShell>
        <ResultPanel icon={<RotateCcw />} tone="warning" title="Your appointment didn't load." actions={<><Button size="lg" onClick={() => q.refetch()}>Try again</Button><Button asChild size="lg" variant="secondary"><a href="tel:+19735550142">Call (973) 555-0142</a></Button></>}>
          It's on our side, not yours. Try again in a moment.
        </ResultPanel>
      </BookingShell>
    );
  }
  if (q.data && !q.data.appointment) {
    return (
      <BookingShell>
        <ResultPanel icon={<LinkIcon />} tone="warning" title="This link isn't working." actions={<><Button asChild size="lg"><Link to="/book/returning">Email me a new link</Link></Button><Button asChild size="lg" variant="secondary"><Link to="/">Back to home</Link></Button></>}>
          It may be old or mistyped. We can email you a fresh one.
        </ResultPanel>
      </BookingShell>
    );
  }
  if (!q.data?.appointment) {
     return <BookingShell><div role="status" aria-label="Loading appointment" className="mx-auto max-w-2xl space-y-10"><div><Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-9 w-48" /><Skeleton className="mt-3 h-5 w-72 max-w-full" /></div><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-10 w-60" /><div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-16 rounded-2xl" /><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl" /></div></div></BookingShell>;
  }

  const a = q.data.appointment as Appt;
  const items = q.data.checklist as Item[];
  const nowIso = q.data.now!;
  const stage = stageOf(a, nowIso);
  const cancelled = stage === "cancelled";
  const ahead = meetingAhead(stage);
  const after = stage === "wrap_up" || stage === "sign_pay" || stage === "to_file" || stage === "filed";
  const intro = isIntroAppt(a);
  const first = a.clients?.name?.split(" ")[0] ?? "there";
  const todo = items.filter((i) => i.required && (i.status === "missing" || i.review_status === "needs_fix")).length;
  const fixItems = items.filter((i) => i.review_status === "needs_fix");
  const doneCount = items.filter((i) => i.status !== "missing" && i.review_status !== "needs_fix").length;
  const day = new Date(a.start_at).toLocaleDateString("en-US", { weekday: "long", timeZone: userTz() });
  const introSub: Partial<Record<Stage, string>> = {
    documents: `Your free call with Claire is ${day}. You don't need any documents.`, ready: `Your free call with Claire is ${day}. You don't need any documents.`,
    meeting: "Your call is starting. Click Join below.", wrap_up: "Your free call with Claire has ended.", filed: "Your free call with Claire is complete.",
  };
  const sub: Record<Stage, string> = {
    documents: a.intake_answers?.["intake_pending"] ? "You're booked. Answer a few quick questions so we know which documents to ask for." : todo ? `${todo} document${todo === 1 ? "" : "s"} left to upload. Everything else is set.` : "Everything is set.",
    ready: `We have all your documents. See you ${day}.`,
    meeting: a.meeting_type === "video" ? "Your appointment is now. Join the call below." : "Your appointment is now. See you at 412 Bloomfield Avenue.",
    wrap_up: "Thanks for coming in. We're finishing your return now.",
    sign_pay: a.signature_status === "signed" ? "Thanks for signing. Once you pay, we'll file your return." : "Your return is ready. Review it, sign and pay, and we'll file it.",
    to_file: "Thank you. We'll file your return today.",
    filed: "Your return has been filed with the IRS.",
    cancelled: "This appointment was cancelled.",
    no_show: "We missed you at your appointment. Choose a new time below.",
  };
  const checklist = (
    <section>
       <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="t-card text-deep-ink">Your document checklist</h2>
        <span className="tabular text-sm text-muted-foreground">{doneCount} of {items.length} done</span>
      </div>
       <p className="mb-3 flex items-start gap-2 rounded-xl bg-fill-neutral/70 px-3 py-2.5 text-[13px] leading-5 text-deep-ink/85">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> Only Claire can see your files. We never ask for your Social Security number online.
      </p>
       <ul className="space-y-2">{items.map((i) => <DocCard key={i.id} token={token} item={i} onChange={refresh} />)}</ul>
       <p className="mt-3 text-xs text-muted-foreground">PDF or photo (JPG, PNG, HEIC), up to 15MB each.</p>
    </section>
  );
  const sentDocs = (
     <details className="rounded-2xl border border-border bg-sheet p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-deep-ink [&::-webkit-details-marker]:hidden">
        Documents you sent ({doneCount})<ChevronDown className="size-4 text-muted-foreground" />
      </summary>
       <ul className="mt-3 space-y-2">{items.filter((i) => i.status !== "missing" && i.review_status !== "needs_fix").map((i) => <DocCard key={i.id} token={token} item={i} onChange={refresh} />)}</ul>
    </details>
  );

  return (
    <BookingShell>
      <div className="reveal-children mx-auto max-w-2xl space-y-10">
         <div>
           <p className="text-[13px] text-muted-foreground">Your appointment</p>
           <h1 className="mt-2 t-page text-deep-ink">{booked && ahead ? `You're booked, ${first}.` : `Hello, ${first}.`}</h1>
           <p className="mt-2 text-deep-ink/70">{booked && ahead ? "We've emailed you a confirmation. Your appointment details and next steps are below." : (intro && introSub[stage]) || sub[stage]}</p>
         </div>
        {!cancelled && (intro ? <Stepper steps={INTRO_STEPS} current={introStepOf(stage)} label="Call progress" /> : <Stepper steps={STEPS} current={stepOf(stage)} label="Appointment progress" />)}

        {/* 1. Before the meeting: when and where, confirm/move/cancel, then the checklist. */}
        {ahead && <>
          {!!a.intake_answers?.["intake_pending"] && <IntakeCard token={token} slug={a.services?.slug ?? null} onDone={refresh} />}
          <AppointmentCard appt={a} mode="upcoming" videoLink={q.data.videoLink ?? null} nowIso={nowIso} />
          <Actions token={token} appt={a} onChange={refresh} />
          {intro || a.intake_answers?.["intake_pending"] || items.length === 0 ? null : stage === "ready" ? sentDocs : checklist}
        </>}

        {/* 2. The meeting itself. */}
        {stage === "meeting" && <>
          <AppointmentCard appt={a} mode="now" videoLink={q.data.videoLink ?? null} nowIso={nowIso} />
          {intro || items.length === 0 ? null : todo > 0 ? checklist : sentDocs}
        </>}

        {/* 3. After the meeting, before Claire finishes. */}
        {intro && (stage === "wrap_up" || stage === "filed") && <>
          <AppointmentCard appt={a} mode="past" videoLink={null} nowIso={nowIso} />
          <StatusCard icon={<CalendarClock />} title="Need a full appointment?" action={<Button asChild size="lg"><Link to="/book">Schedule an appointment</Link></Button>}>
            If Claire suggested a tax return, a letter review or another service, you can schedule it here. Your details are already filled in. We've also emailed you this link.
          </StatusCard>
        </>}
        {!intro && stage === "wrap_up" && <>
          <StatusCard icon={<Hourglass />} title="We're finishing your return.">We'll email you when it's ready to review, sign and pay, usually the same day.</StatusCard>
           {fixItems.length > 0 && <div><h2 className="mb-3 t-card text-deep-ink">Documents to upload again</h2><ul className="space-y-2">{fixItems.map((i) => <DocCard key={i.id} token={token} item={i} onChange={refresh} />)}</ul></div>}
        </>}

        {/* 4. Sign and pay, then done. */}
        {!intro && stage === "filed" && <AppointmentCard appt={a} mode="past" videoLink={null} nowIso={nowIso} />}
        {!intro && (stage === "sign_pay" || stage === "to_file" || stage === "filed") && <CloseoutSection token={token} appt={a} onDone={refresh} clientEmail={a.clients?.email ?? ""} />}

        {/* Side exits. */}
        {(cancelled || stage === "no_show") && (
          <StatusCard icon={<CalendarClock />} title={cancelled ? "Pick a new time whenever you're ready." : "Let's find you a new time."} action={<Button asChild size="lg"><Link to="/book">Pick a new time</Link></Button>}>
            Your documents and answers are saved, so scheduling again only takes a minute.
          </StatusCard>
        )}

        {after && doneCount > 0 && sentDocs}
      </div>
    </BookingShell>
  );
}

function StatusCard({ icon, title, children, action }: { icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-sheet p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tint-1 text-deep-ink [&_svg]:size-5">{icon}</span>
        <div className="min-w-0">
          <h2 className="t-card text-deep-ink">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{children}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </section>
  );
}


/* ---------- Intake (phone-in bookings) ---------- */
function IntakeCard({ token, slug, onDone }: { token: string; slug: string | null; onDone: () => void }) {
  const save = useServerFn(saveIntake);
  const [ans, setAns] = useState<Answers>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const done = intakeComplete(slug, ans);
  const submit = async () => {
    setBusy(true); setErr(null);
    try { const r = await save({ data: { token, intake: toIntakePayload(slug ?? "individual", ans) } }); if (!r.ok) throw new Error(); toast.success("Thanks. Your document list is ready below."); onDone(); }
    catch { setErr("We couldn't save your answers. Please try again."); }
    finally { setBusy(false); }
  };
  return (
    <section className="rounded-2xl border border-border bg-sheet p-5 sm:p-6">
      <h2 className="t-card text-deep-ink">Tell us about your year.</h2>
      <p className="mt-1 text-sm text-muted-foreground">Your answers tell us which documents to ask you for.</p>
      <div className="mt-5"><IntakeQuestions slug={slug} answers={ans} onChange={setAns} /></div>
      {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
      <Button className="mt-5" disabled={!done || busy} onClick={submit}>{busy ? "Saving…" : "Save answers"}</Button>
    </section>
  );
}

/* ---------- Appointment card ---------- */
function AppointmentCard({ appt, mode, videoLink, nowIso }: { appt: Appt; mode: "upcoming" | "now" | "past"; videoLink: string | null; nowIso: string }) {
  const video = appt.meeting_type === "video";
  const intro = isIntroAppt(appt);
  const join = joinState(appt.start_at, appt.end_at, nowIso);
  const [copied, setCopied] = useState(false);
  const copy = async () => { if (!videoLink) return; try { await navigator.clipboard.writeText(videoLink); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* the link is visible to copy by hand */ } };
  const icsTitle = `Hartwell Tax: ${appt.services?.name ?? "Appointment"}`;
  return (
    <div className="sheet-stack overflow-hidden p-0">
      {/* When */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">{appt.services?.name}</p>
            {mode === "past" ? <Tag tone="success">Completed</Tag> : mode === "now" ? <Tag tone="accent">Happening now</Tag> : appt.status === "confirmed" && <Tag tone="success">Confirmed</Tag>}
          </div>
          <p className="mt-1 t-card text-deep-ink">{fmtDateLong(appt.start_at)}</p>
          <p className="tabular mt-1 text-deep-ink/80">{fmtTime(appt.start_at)} – {fmtTime(appt.end_at)}</p>
        </div>
        {mode !== "past" && !intro && !appt.intake_answers?.["intake_pending"] && <ReadyRing value={appt.ready_score} size={76} />}
      </div>

      {/* Where: a working link for video, the office for in person */}
      {mode === "past" ? null : video ? (
        <div className="border-t border-border bg-surface-2 px-6 py-5">
          <p className="flex items-center gap-2 text-sm font-medium text-deep-ink"><Video className="size-4" />Video call{intro ? " with Claire" : ""}</p>
          <p className="mt-1 text-sm text-muted-foreground">{join === "open" ? "Your call is open." : "Join opens 10 minutes before."}</p>
          {videoLink && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {join === "open" ? <Button size="lg" asChild><a href={videoLink} target="_blank" rel="noreferrer"><Video /> Join call</a></Button>
                : <Button size="lg" variant="secondary" disabled><Video /> Join call</Button>}
              <Button size="sm" variant="ghost" onClick={copy}>{copied ? <><Check />Copied</> : <><Copy />Copy link</>}</Button>
              <Button size="sm" variant="ghost" onClick={() => downloadIcs(icsTitle, appt.start_at, appt.end_at, videoLink, `Join: ${videoLink}`)}><CalendarPlus />Add to calendar</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid border-t border-border sm:grid-cols-[1.1fr_1fr]">
          <div className="px-6 py-5">
            <p className="flex items-center gap-2 text-sm font-medium text-deep-ink"><MapPin className="size-4" />In person</p>
            <p className="mt-1 text-sm text-deep-ink">{OFFICE.line1}<br />{OFFICE.line2}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{OFFICE.parking}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" asChild><a href={DIRECTIONS} target="_blank" rel="noreferrer"><MapPin /> Directions</a></Button>
              <Button size="sm" variant="ghost" onClick={() => downloadIcs(icsTitle, appt.start_at, appt.end_at, OFFICE_ADDRESS, `Directions: ${DIRECTIONS}`)}><CalendarPlus />Add to calendar</Button>
            </div>
          </div>
          <iframe title={`Map of ${OFFICE_ADDRESS}`} src={MAP_EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-40 w-full border-0 border-t border-border sm:h-full sm:min-h-[180px] sm:border-l sm:border-t-0" />
        </div>
      )}
    </div>
  );
}

/* ---------- Confirm / reschedule / cancel ---------- */
function Actions({ token, appt, onChange }: { token: string; appt: Appt; onChange: () => void }) {
  const confirm = useServerFn(confirmAttendance);
  const cancel = useServerFn(cancelAppointment);
  const [busy, setBusy] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const run = async (k: string, fn: () => Promise<unknown>) => { setBusy(k); try { await fn(); await onChange(); } finally { setBusy(null); } };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1">
        {appt.status === "confirmed" ? (
          <span className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-alert-success px-3 text-sm font-medium text-alert-success-fg"><Check className="size-4" /> You're confirmed</span>
        ) : (
          <Button size="lg" onClick={() => run("confirm", () => confirm({ data: { token } }))} disabled={!!busy}>
            {busy === "confirm" ? <Loader2 className="animate-spin" /> : <Check />} I'll be there
          </Button>
        )}
        <Button size="lg" variant="secondary" onClick={() => setPicking((p) => !p)}><CalendarClock /> Reschedule</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button size="lg" variant="secondary" className="text-alert-negative-fg">Cancel</Button></AlertDialogTrigger>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
              <AlertDialogDescription>That's fine. If another time would work better, you can reschedule instead.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep my appointment</AlertDialogCancel>
              <AlertDialogAction className="bg-alert-negative text-alert-negative-fg hover:bg-[#FCE1DB] active:bg-[#F9C7BE]" onClick={() => run("cancel", () => cancel({ data: { token } }))}>Yes, cancel</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {picking && <ReschedulePicker token={token} serviceId={appt.service_id} onDone={async () => { setPicking(false); await onChange(); }} onClose={() => setPicking(false)} />}
    </div>
  );
}

function ReschedulePicker({ token, serviceId, onDone, onClose }: { token: string; serviceId: string; onDone: () => void; onClose: () => void }) {
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const move = useServerFn(rescheduleAppointment);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["availability", serviceId], queryFn: () => fetchWindow({ data: { serviceId, days: 14 } }) });
  const [date, setDate] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [alts, setAlts] = useState<string[] | null>(null);
  // Same 30-minute starts as the booking page, so days and times always agree.
  const days = (q.data?.days ?? []).map((d) => ({ ...d, slots: d.slots.filter((x) => new Date(x).getUTCMinutes() % 30 === 0) }));
  const sel = date ?? days.find((d) => d.slots.length)?.date;
  const day = days.find((d) => d.date === sel);

  const pick = async (s: string) => {
    setBusy(s); setAlts(null);
    const r = await move({ data: { token, start: s } }).catch(() => ({ ok: false as const, alternatives: [] as string[] }));
    setBusy(null);
    qc.invalidateQueries({ queryKey: ["availability", serviceId] });
    if (r.ok) onDone(); else setAlts(r.alternatives);
  };

  return (
    <div className="overflow-hidden">
      <div className="rounded-2xl bg-surface-2 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="t-card text-deep-ink">Pick a new time</p>
          <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full hover:bg-fill-subtle"><X className="size-4" /></button>
        </div>
         {q.isLoading && <div className="space-y-4"><div className="flex gap-2 overflow-hidden">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 w-[68px] shrink-0 rounded-lg" />)}</div><div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}</div></div>}
        {q.data?.error && <p className="text-sm">{q.data.error}</p>}
        {days.length > 0 && (
          <>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
              {days.map((d) => {
                const c = fmtDayChip(d.date);
                const active = d.date === sel;
                const off = d.closed || d.slots.length === 0;
                return (
                  <button key={d.date} disabled={off} onClick={() => setDate(d.date)}
                    aria-pressed={active} className={`flex w-[68px] shrink-0 flex-col items-center rounded-lg px-2 py-2 transition-colors duration-150 ${active ? "bg-primary text-primary-foreground" : off ? "text-muted-foreground/50" : "bg-fill-neutral text-deep-ink hover:bg-fill-selected"}`}>
                    <span className="text-[10px] opacity-70">{c.dow} {c.month}</span>
                    <span className="tabular text-lg font-medium leading-tight">{c.day}</span>
                    <span className="text-[10px] opacity-70">{d.closed ? "Closed" : d.slots.length === 0 ? "Full" : `${d.slots.length} open`}</span>
                  </button>
                );
              })}
            </div>
            {day && (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {day.slots.map((s) => (
                  <Button key={s} variant="secondary" disabled={!!busy} onClick={() => pick(s)} className="tabular h-11 text-sm">
                    {busy === s ? <Loader2 className="animate-spin" /> : fmtTime(s)}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
        {alts && (
          <div className="mt-4 text-sm">
            <p className="font-medium text-deep-ink">That time was taken a moment ago.</p>
            {alts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {alts.map((s) => (
                  <Button key={s} variant="secondary" onClick={() => pick(s)} className="tabular">
                    {fmtDateLong(s).split(",")[0]} {fmtTime(s)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Choose a new time. Your documents and checklist stay the same.</p>
      </div>
    </div>
  );
}

/* ---------- Checklist card ---------- */
function DocCard({ token, item, onChange }: { token: string; item: Item; onChange: () => Promise<unknown> | void }) {
  const getUrl = useServerFn(createUploadUrl);
  const confirm = useServerFn(confirmUpload);
  const markNa = useServerFn(markNotApplicable);
  const undoNa = useServerFn(undoNotApplicable);
  const keep = useServerFn(keepFlaggedFile);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [naOpen, setNaOpen] = useState(false);
  const [reason, setReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const upload = async (f?: File | null) => {
    if (!f) return;
    setErr(null);
    const problem = await checkFile(f);
    if (problem) return setErr(problem);
    setBusy(true);
    try {
      const { path, token: t } = await getUrl({ data: { token, itemId: item.id, fileName: f.name || "photo.jpg", size: f.size } });
      const up = await supabase.storage.from("client-documents").uploadToSignedUrl(path, t, f, { contentType: f.type || "application/octet-stream" });
      if (up.error) throw up.error;
      await confirm({ data: { token, itemId: item.id, path } });
      await onChange();
    } catch (e) { setErr(e instanceof Error && /15MB|empty|PDF, JPG/.test(e.message) ? e.message : "The upload didn't go through. Please try again."); }
    setBusy(false);
  };

  const saveNa = async () => {
    setBusy(true);
    try { await markNa({ data: { token, itemId: item.id, reason } }); setNaOpen(false); await onChange(); } catch { setErr("Couldn't save that. Please try again."); }
    setBusy(false);
  };

  return (
    <li>
        {item.status === "uploaded" && item.review_status === "needs_fix" ? (
           <div key="fix" className="rounded-2xl border border-warning/40 bg-sheet p-4">
             <div className="flex items-start gap-3">
               <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning"><AlertTriangle className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-deep-ink">{item.document_name}</p><Tag tone="warning">Needs a fix</Tag></div>
                <p className="mt-1 text-sm text-deep-ink/75">{item.fix_reason}{item.fix_note ? `. Claire says: ${item.fix_note}` : "."}</p>
              </div>
            </div>
             <Button size="sm" className="mt-2.5" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} Replace file</Button>
          </div>
        ) : item.status === "uploaded" && item.ai_check === "warning" ? (
           <div key="warn" className="rounded-2xl border border-warning/40 bg-sheet p-4">
             <div className="flex items-start gap-3">
               <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning"><AlertTriangle className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-deep-ink">{item.document_name}</p>
                <p className="mt-1 text-sm text-deep-ink/75">{item.ai_note || "This might not be the right document."}</p>
              </div>
            </div>
             <div className="mt-2.5 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} Replace file</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); try { await keep({ data: { token, itemId: item.id } }); await onChange(); } catch { setErr("Couldn't save that. Please try again."); } setBusy(false); }}>Keep this file</Button>
            </div>
          </div>
        ) : item.status === "uploaded" ? (
           <div key="up" className="flex items-center gap-3 rounded-2xl border border-success/30 bg-sheet p-3.5 sm:p-4">
            <span
               className="grid size-8 shrink-0 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-4" strokeWidth={3} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-deep-ink">{item.document_name}</p>
              <p className="text-sm text-success">{busy ? "Checking…" : "Received"}</p>
            </div>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>Replace</Button>
          </div>
        ) : item.status === "not_applicable" ? (
           <div key="na" className="flex items-center gap-3 rounded-2xl bg-surface-2/70 p-3.5 sm:p-4">
             <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><X className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-deep-ink/70">{item.document_name}</p>
              <p className="truncate text-sm text-muted-foreground">Doesn't apply: {item.na_reason}</p>
            </div>
            <button disabled={busy} onClick={async () => { setBusy(true); await undoNa({ data: { token, itemId: item.id } }); await onChange(); setBusy(false); }}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-ink">Undo</button>
          </div>
        ) : (
          <div key="missing"
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files?.[0]); }}
             className={`sheet-stack p-3.5 sm:p-4 ${drag ? "ring-2 ring-ring" : ""}`}>
             <div className="flex items-start gap-3">
               <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><FileText className="size-4" strokeWidth={1.75} /></span>
              <div className="min-w-0 flex-1">
                 <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-deep-ink">{item.document_name}</p>
                  {!item.required && <Tag>If you have it</Tag>}
                </div>
                 <p className="mt-0.5 text-[13px] leading-5 text-deep-ink/70">{docGuide(item.document_name, item.description)}</p>
              </div>
               {!naOpen && <Button size="sm" variant="ghost" className="hidden shrink-0 px-2 sm:inline-flex" onClick={() => setNaOpen(true)}>Doesn't apply to me</Button>}
            </div>
            {naOpen ? (
               <div className="mt-2.5 space-y-2">
                <Input autoFocus aria-label="Why this doesn't apply" placeholder="For example: I didn't have a mortgage this year." maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className="h-10" />
                <div className="flex gap-2">
                  <Button size="sm" disabled={reason.trim().length < 2 || busy} onClick={saveNa}>Mark as not needed</Button>
                  <Button size="sm" variant="ghost" onClick={() => setNaOpen(false)}>Never mind</Button>
                </div>
              </div>
            ) : (
               <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} Upload</Button>
                <Button size="sm" variant="outline" onClick={() => camRef.current?.click()} disabled={busy}><Camera /> Take a photo</Button>
                 <span className="hidden text-xs text-muted-foreground sm:inline">Or drag a file here.</span>
                 <Button size="sm" variant="ghost" className="min-h-8 w-full justify-start px-0 sm:hidden" onClick={() => setNaOpen(true)}>Doesn't apply to me</Button>
              </div>
            )}
          </div>
        )}
      {err && <p className="mt-2 text-sm text-destructive" role="alert">{err}</p>}
      <input ref={fileRef} type="file" className="sr-only" aria-label={`Upload ${item.document_name}`} accept="application/pdf,image/jpeg,image/png,image/heic,image/heif,.heic,.heif" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={camRef} type="file" className="sr-only" aria-label={`Take a photo of ${item.document_name}`} accept="image/jpeg,image/png" capture="environment" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
    </li>
  );
}

/* ---------- Review, sign and pay ---------- */
function CloseoutSection({ token, appt, onDone, clientEmail }: { token: string; appt: Appt; onDone: () => void; clientEmail: string }) {
  const pay = useServerFn(testPay);
  const [checkout, setCheckout] = useState(false);
  const signed = appt.signature_status === "signed";
  const paid = !!appt.paid_at;
  if (appt.filed_at) return (
    <section className="rounded-2xl border border-success/30 bg-sheet p-6">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-5" strokeWidth={3} /></span><h2 className="t-card text-deep-ink">Your return has been filed with the IRS.</h2></div>
      <p className="mt-3 text-sm text-deep-ink/75">Any refund comes directly from the IRS. Thank you for choosing Hartwell Tax.</p>
    </section>
  );
  if (signed && paid) return (
    <section className="rounded-2xl border border-success/30 bg-sheet p-6">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-5" strokeWidth={3} /></span><h2 className="t-card text-deep-ink">All done. We'll file your return today.</h2></div>
      <p className="mt-3 text-sm text-deep-ink/75">Signed and paid ({money(appt.fee_cents!)}). You'll get an email once it's filed.</p>
    </section>
  );
  // Two tasks at the same level, in order. Done tasks collapse to one line; the next one is open; later ones wait.
  const Task = ({ n, title, state, meta, children }: { n: number; title: string; state: "done" | "now" | "later"; meta?: string; children?: React.ReactNode }) => (
    <li className={`rounded-xl border ${state === "now" ? "border-ink/40 bg-sheet" : "border-line-1 bg-surface-2"}`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${state === "done" ? "bg-success text-white" : state === "now" ? "bg-ink text-white" : "border border-line-2 text-muted-foreground"}`}>
          {state === "done" ? <Check className="size-4" strokeWidth={3} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[15px] font-medium ${state === "later" ? "text-muted-foreground" : "text-deep-ink"}`}>{title}</p>
          {meta && <p className="text-[13px] text-muted-foreground">{meta}</p>}
        </div>
      </div>
      {state === "now" && children && <div className="border-t border-line-1 px-4 pb-5 pt-4">{children}</div>}
    </li>
  );
  return (
    <section className="rounded-2xl border border-border bg-sheet p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="t-card text-deep-ink">Review, sign and pay</h2>
          
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{appt.services?.name}</p>
          <p className="tabular text-xl font-semibold text-deep-ink">{money(appt.fee_cents!)}</p>
        </div>
      </div>
      {appt.client_note && <p className="mt-4 rounded-lg bg-canvas px-4 py-3 text-sm text-deep-ink/85"><span className="font-medium text-deep-ink">A note from Claire: </span>{appt.client_note}</p>}
      <ol className="mt-5 space-y-2">
        <Task n={1} title="Sign your filing authorization (Form 8879)" state={signed ? "done" : "now"} meta={signed ? "Signed. Thank you." : "Lets us file your return with the IRS for you."}>
          <SignSection token={token} appt={appt} onDone={onDone} embedded />
        </Task>
        <Task n={2} title={`Pay ${money(appt.fee_cents!)}`} state={paid ? "done" : signed ? "now" : "later"} meta={paid ? "Paid. A receipt is in your inbox." : signed ? "By card. You'll get a receipt by email." : "Available once you've signed."}>
          <Button size="lg" onClick={() => setCheckout(true)}><CreditCard />Pay {money(appt.fee_cents!)}</Button>
          <Checkout open={checkout} onOpenChange={setCheckout} amountCents={appt.fee_cents!} item={`${appt.services?.name ?? "Tax return"}, tax year ${new Date().getFullYear() - 1}`} email={clientEmail}
            onPay={async () => { const r = await pay({ data: { token } }); return !!r.ok; }} onDone={() => { void onDone(); }} />
        </Task>
      </ol>
    </section>
  );
}

/* ---------- Form 8879 e-sign ---------- */
function SignSection({ token, appt, onDone, embedded = false }: { token: string; appt: Appt; onDone: () => void; embedded?: boolean }) {
  const sign = useServerFn(signForm8879);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const ok = name.trim().length >= 2 && agree;

  return (
    <section className={embedded ? "" : "sheet-stack p-6"}>
      {!embedded && <><Tag tone="warning">One last step</Tag><h2 className="mt-2 t-card text-deep-ink">Sign your filing authorization (Form 8879)</h2></>}
      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-canvas p-4 text-sm">
        <div><dt className="text-muted-foreground">Taxpayer</dt><dd className="font-medium text-deep-ink">{appt.clients?.name}</dd></div>
        <div><dt className="text-muted-foreground">Tax year</dt><dd className="tabular font-medium text-deep-ink">2025</dd></div>
        <div><dt className="text-muted-foreground">Service</dt><dd className="font-medium text-deep-ink">{appt.services?.name}</dd></div>
        <div><dt className="text-muted-foreground">Preparer</dt><dd className="font-medium text-deep-ink">Claire Hartwell, EA</dd></div>
      </dl>
      <form className="mt-5 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); if (!ok) return; setBusy(true); setErr(false);
        try { const r = await sign({ data: { token, fullName: name, agree: true } }); if (!r.ok) setErr(true); await onDone(); } catch { setErr(true); }
        setBusy(false);
      }}>
        <div>
          <label htmlFor="sig" className="text-sm font-medium text-deep-ink">Type your full legal name</label>
          <Input id="sig" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder={appt.clients?.name ?? ""} className="mt-1.5 h-12 bg-sheet text-lg" />
        </div>
        <label className="flex items-start gap-3 text-sm text-deep-ink/80">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5 size-5" aria-label="I authorize Claire to file my return" />
          I've reviewed my return with Claire and authorize her to file it electronically. Typing my name counts as my signature.
        </label>
        {err && <p className="text-sm text-destructive">We couldn't save your signature. Please try again.</p>}
        <Button type="submit" size="lg" disabled={!ok || busy}>{busy ? <Loader2 className="animate-spin" /> : <PenLine />} Sign Form 8879</Button>
      </form>
    </section>
  );
}
