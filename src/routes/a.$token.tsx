import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, Check, ChevronDown, CreditCard, FileText, Loader2, Lock, MapPin, Upload, Video, Users, CalendarClock, X, PenLine, Link as LinkIcon } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Stepper } from "@/components/ui/stepper";
import { Checkout } from "@/components/booking/Checkout";
import { Segmented } from "@/components/ui/segmented";
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
import { fmtDateLong, fmtDayChip, fmtTime, questionsFor, toIntakePayload, type Answers } from "@/lib/intake";
import { docGuide } from "@/lib/doc-guide";

export const Route = createFileRoute("/a/$token")({
  head: () => ({
    meta: [
      { title: "Your appointment — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Manage your appointment and send your documents privately." },
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
};
type Item = { id: string; document_name: string; description: string | null; required: boolean; status: string; na_reason: string | null; ai_check: string | null; ai_note: string | null; review_status: string; fix_reason: string | null; fix_note: string | null };

function PortalPage() {
  const { token } = Route.useParams();
  const fetchAppt = useServerFn(getAppointmentByToken);
  const q = useQuery({ queryKey: ["portal", token], queryFn: () => fetchAppt({ data: { token } }), retry: false });
  const refresh = () => q.refetch();

  if (q.isError || (q.data && !q.data.appointment)) {
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
  const now = new Date(q.data.now!);
  const isPast = new Date(a.start_at) <= now;
  const cancelled = a.status === "cancelled";
  const open = ["booked", "confirmed"].includes(a.status) && !isPast;
  const first = a.clients?.name?.split(" ")[0] ?? "there";
  const todo = items.filter((i) => i.required && (i.status === "missing" || i.review_status === "needs_fix")).length;
  const closeout = a.status === "completed" && a.fee_cents != null;
  const postAppointment = a.status === "completed";
  const fixItems = items.filter((i) => i.review_status === "needs_fix");
  const sentItems = items.filter((i) => i.status === "uploaded" && i.review_status !== "needs_fix");
  const progress = a.filed_at ? 5 : postAppointment ? 4 : isPast ? 3 : items.every((i) => i.status !== "missing" && i.review_status !== "needs_fix") ? 2 : 1;

  return (
    <BookingShell>
      <div className="mx-auto max-w-2xl space-y-10">
        <div>
          <p className="text-[13px] text-muted-foreground">Your appointment</p>
          <h1 className="mt-2 t-page text-deep-ink">Hello, {first}.</h1>
          <p className="mt-2 text-deep-ink/70">
            {cancelled ? "This appointment was cancelled." : a.filed_at ? "Your return has been e-filed." : postAppointment ? a.signature_status === "signed" && a.paid_at ? "All done. Claire will file your return today." : "Your return is ready. Sign and pay to have it filed." : isPast ? "Thanks for coming in." : todo > 0 ? `${todo} document${todo === 1 ? "" : "s"} left to send. Everything else is set.` : "You're all set. Claire has everything she needs."}
          </p>
        </div>
        {!cancelled && <Stepper steps={["Booked", "Documents", "Appointment", "Sign and pay", "Filed"]} current={a.filed_at ? 4 : postAppointment ? 3 : isPast || progress >= 2 ? 2 : 1} label="Appointment progress" />}

        {closeout ? <CloseoutSection token={token} appt={a} onDone={refresh} clientEmail={a.clients?.email ?? ""} /> : a.signature_status === "pending" && <SignSection token={token} appt={a} onDone={refresh} />}

        <AppointmentCard appt={a} cancelled={cancelled} postAppointment={postAppointment} videoLink={q.data.videoLink ?? null} />
        {open && !!a.intake_answers?.["intake_pending"] && <IntakeCard token={token} slug={a.services?.slug ?? null} onDone={refresh} />}
        {open && <Actions token={token} appt={a} onChange={refresh} />}
        {cancelled && (
          <div className="rounded-2xl bg-surface-2 p-6">
            <p className="text-deep-ink/80">Whenever you're ready, you can pick a new time. It takes two minutes.</p>
            <Button asChild className="mt-4"><Link to="/book">Book a new time</Link></Button>
          </div>
        )}

        {!cancelled && items.length > 0 && (postAppointment ? <section className="space-y-4">
          {fixItems.length > 0 && !a.paid_at && !a.filed_at && <div><h2 className="mb-3 t-card text-deep-ink">Documents needing a fix</h2><ul className="space-y-4">{fixItems.map((i) => <DocCard key={i.id} token={token} item={i} onChange={refresh} />)}</ul></div>}
          <details className="rounded-2xl border border-border bg-sheet p-5"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-deep-ink [&::-webkit-details-marker]:hidden">Documents you sent ({sentItems.length}) <ChevronDown className="size-4" /></summary><p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><Lock className="size-4 shrink-0" /> Only Claire can see your files. We never ask for your Social Security number.</p><ul className="mt-4 space-y-3">{sentItems.map((i) => <DocCard key={i.id} token={token} item={i} onChange={refresh} />)}</ul></details>
        </section> : (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="t-card text-deep-ink">Your checklist</h2>
              <span className="tabular text-sm text-muted-foreground">{items.filter((i) => i.status !== "missing" && i.review_status !== "needs_fix").length} of {items.length} done</span>
            </div>
            <p className="mb-5 flex items-start gap-2 rounded-2xl bg-fill-neutral/70 p-4 text-sm text-deep-ink/85">
              <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> Only Claire can see your files. We never ask for your Social Security number.
            </p>
            <ul className="space-y-4">
              {items.map((i) => <DocCard key={i.id} token={token} item={i} onChange={refresh} />)}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">PDF, JPG, PNG or HEIC, up to 15MB each. Phone photos are perfect.</p>
          </section>
        ))}
      </div>
    </BookingShell>
  );
}

/* ---------- Intake (phone-in bookings) ---------- */
function IntakeCard({ token, slug, onDone }: { token: string; slug: string | null; onDone: () => void }) {
  const save = useServerFn(saveIntake);
  const qs = questionsFor(slug);
  const [ans, setAns] = useState<Answers>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const done = qs.every((x) => ans[x.key] !== undefined);
  const submit = async () => {
    setBusy(true); setErr(null);
    try { const r = await save({ data: { token, intake: toIntakePayload(slug ?? "individual", ans) } }); if (!r.ok) throw new Error(); onDone(); }
    catch { setErr("We couldn't save your answers. Please try again."); }
    finally { setBusy(false); }
  };
  return (
    <section className="rounded-2xl border border-border bg-sheet p-5 sm:p-6">
      <h2 className="t-sub">A few quick questions</h2>
      <p className="mt-1 text-sm text-muted-foreground">Claire booked this for you by phone. Your answers tell us exactly which documents to bring.</p>
      <div className="mt-5 space-y-4">
        {qs.map((x) => (
          <div key={x.key} className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-deep-ink">{x.label}</span>
            {x.type === "count" ? (
              <div className="flex gap-1">{[0, 1, 2, 3].map((n) => <Button key={n} size="sm" variant={ans[x.key] === n ? "dark" : "secondary"} aria-pressed={ans[x.key] === n} onClick={() => setAns({ ...ans, [x.key]: n })}>{n === 3 ? "3+" : n}</Button>)}</div>
            ) : (
              <Segmented label={x.label} value={ans[x.key] === true ? "yes" : ans[x.key] === false ? "no" : ("" as "yes" | "no")} onChange={(v) => setAns({ ...ans, [x.key]: v === "yes" })} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
            )}
          </div>
        ))}
      </div>
      {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
      <Button className="mt-5" disabled={!done || busy} onClick={submit}>{busy ? "Saving…" : "Save answers"}</Button>
    </section>
  );
}

/* ---------- Appointment card ---------- */
function AppointmentCard({ appt, cancelled, postAppointment, videoLink }: { appt: Appt; cancelled: boolean; postAppointment: boolean; videoLink: string | null }) {
  const video = appt.meeting_type === "video";
  return (
    <div className={`sheet-stack p-6 ${cancelled ? "opacity-70" : ""}`}>
         <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">{appt.services?.name}</p>
            {appt.status === "confirmed" && <Tag tone="success">Confirmed</Tag>}
            {cancelled && <Tag tone="danger">Cancelled</Tag>}
          </div>
          <p className={`mt-1 t-card text-deep-ink ${cancelled ? "line-through" : ""}`}>{fmtDateLong(appt.start_at)}</p>
          <p className="tabular mt-1 text-deep-ink/80">{fmtTime(appt.start_at)} – {fmtTime(appt.end_at)}</p>
        </div>
        {!cancelled && !postAppointment && <ReadyRing value={appt.ready_score} size={84} />}
      </div>
      {!cancelled && (
        <div className="mt-5 border-t border-border pt-4 text-sm">
          {video ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-deep-ink/80"><Video className="size-4 text-muted-foreground" /> {postAppointment ? "Video call" : videoLink ? "Video call. Join from here at your appointment time." : "Video call. Claire will send the link by email."}</span>
              {videoLink && !postAppointment && <Button size="sm" variant="outline" asChild><a href={videoLink} target="_blank" rel="noreferrer"><Video /> Join call</a></Button>}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-deep-ink/80"><Users className="size-4 text-muted-foreground" /> In person, {ADDRESS}</span>
              <Button size="sm" variant="outline" asChild><a href={MAP_URL} target="_blank" rel="noreferrer"><MapPin /> Open map</a></Button>
            </div>
          )}
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
              <AlertDialogDescription>That's completely fine. Your slot will be offered to someone on the waitlist. If another time would work better, you can reschedule instead.</AlertDialogDescription>
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
            <p className="font-medium text-deep-ink">That time was just taken.</p>
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
        <p className="mt-4 text-xs text-muted-foreground">Tap a time and you're moved. Your checklist stays the same.</p>
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
          <div key="fix" className="rounded-2xl border border-warning/40 bg-sheet p-5">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warning/10 text-warning"><AlertTriangle className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-deep-ink">{item.document_name}</p><Tag tone="warning">Needs a fix</Tag></div>
                <p className="mt-1 text-sm text-deep-ink/75">{item.fix_reason}{item.fix_note ? `. Claire says: ${item.fix_note}` : "."}</p>
              </div>
            </div>
            <Button size="sm" className="mt-4" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} Replace file</Button>
          </div>
        ) : item.status === "uploaded" && item.ai_check === "warning" ? (
          <div key="warn" className="rounded-2xl border border-warning/40 bg-sheet p-5">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warning/10 text-warning"><AlertTriangle className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-deep-ink">{item.document_name}</p>
                <p className="mt-1 text-sm text-deep-ink/75">{item.ai_note || "This might not be the right document."}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} Replace file</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); try { await keep({ data: { token, itemId: item.id } }); await onChange(); } catch { setErr("Couldn't save that. Please try again."); } setBusy(false); }}>Keep this file</Button>
            </div>
          </div>
        ) : item.status === "uploaded" ? (
          <div key="up" className="flex items-center gap-4 rounded-2xl border border-success/30 bg-sheet p-5">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-5" strokeWidth={3} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-deep-ink">{item.document_name}</p>
              <p className="text-sm text-success">{busy ? "Checking…" : "Received"}</p>
            </div>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>Replace</Button>
          </div>
        ) : item.status === "not_applicable" ? (
          <div key="na" className="flex items-center gap-4 rounded-2xl bg-surface-2/70 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><X className="size-4" /></span>
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
            className={`sheet-stack p-5 ${drag ? "ring-2 ring-ring" : ""}`}>
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><FileText className="size-5" strokeWidth={1.75} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-deep-ink">{item.document_name}</p>
                  {!item.required && <Tag>If you have it</Tag>}
                </div>
                <p className="mt-1 text-sm text-deep-ink/70">{docGuide(item.document_name, item.description)}</p>
              </div>
            </div>
            {naOpen ? (
              <div className="mt-4 space-y-2">
                <Input autoFocus placeholder="In one line, why doesn't this apply?" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className="h-10" />
                <div className="flex gap-2">
                  <Button size="sm" disabled={reason.trim().length < 2 || busy} onClick={saveNa}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setNaOpen(false)}>Never mind</Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} Upload</Button>
                <Button size="sm" variant="outline" onClick={() => camRef.current?.click()} disabled={busy}><Camera /> Take a photo</Button>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setNaOpen(true)}>Doesn't apply to me</Button>
              </div>
            )}
            <p className="mt-3 hidden text-xs text-muted-foreground sm:block">Or drag a file onto this card.</p>
          </div>
        )}
      {err && <p className="mt-2 text-sm text-destructive" role="alert">{err}</p>}
      <input ref={fileRef} type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png,image/heic,image/heif,.heic,.heif" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={camRef} type="file" className="sr-only" accept="image/jpeg,image/png" capture="environment" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
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
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-5" strokeWidth={3} /></span><h2 className="t-card text-deep-ink">Your return has been e-filed.</h2></div>
      <p className="mt-3 text-sm text-deep-ink/75">You'll hear from the IRS directly about any refund. Thank you.</p>
    </section>
  );
  if (signed && paid) return (
    <section className="rounded-2xl border border-success/30 bg-sheet p-6">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-5" strokeWidth={3} /></span><h2 className="t-card text-deep-ink">All done. Claire will file your return today.</h2></div>
      <p className="mt-3 text-sm text-deep-ink/75">Signed and paid ({money(appt.fee_cents!)}). You'll get an email once it's filed.</p>
    </section>
  );
  return (
    <section className="rounded-2xl border border-border bg-sheet p-6">
        <Tag tone="warning">One last step</Tag>
        <h2 className="mt-2 t-card text-deep-ink">Review, sign and pay</h2>
        <div className="mt-4 flex items-baseline justify-between gap-4 rounded-lg bg-canvas p-4">
          <span className="text-sm text-muted-foreground">Fee for {appt.services?.name}</span>
          <span className="tabular text-xl font-medium text-deep-ink">{money(appt.fee_cents!)}</span>
        </div>
        {appt.client_note && <p className="mt-4 text-sm text-deep-ink/80"><span className="font-medium text-deep-ink">A note from Claire: </span>{appt.client_note}</p>}
        <p className="mt-4 text-sm text-muted-foreground">Your return is filed as soon as it's signed and paid.</p>
        <div className="mt-5 border-t border-border pt-5"><Stepper steps={["Sign Form 8879", "Pay"]} current={signed ? 1 : 0} label="Sign and pay" className="max-w-xs" /></div>
      {!signed && <SignSection token={token} appt={appt} onDone={onDone} embedded />}
      {signed && !paid && (
        <div className="mt-5 border-t border-border pt-5">
          <h3 className="t-card text-deep-ink">Pay {money(appt.fee_cents!)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Pay by card. You'll get a receipt by email, and Claire files your return right after.</p>
          <Button size="lg" className="mt-4" onClick={() => setCheckout(true)}><CreditCard />Pay {money(appt.fee_cents!)}</Button>
          <Checkout open={checkout} onOpenChange={setCheckout} amountCents={appt.fee_cents!} item={`${appt.services?.name ?? "Tax return"}, tax year ${new Date().getFullYear() - 1}`} email={clientEmail}
            onPay={async () => { const r = await pay({ data: { token } }); return !!r.ok; }} onDone={() => { void onDone(); }} />
        </div>
      )}
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
    <section className={embedded ? "mt-5 border-t border-border pt-5" : "sheet-stack p-6"}>
      {!embedded && <Tag tone="warning">One last step</Tag>}
      <h2 className="mt-2 t-card text-deep-ink">Sign your e-file authorization (Form 8879)</h2>
      <p className="mt-2 text-sm text-deep-ink/75">Claire has finished your return. This form lets her file it with the IRS electronically on your behalf.</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-canvas p-4 text-sm">
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
          <Input id="sig" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1.5 h-12 bg-sheet text-xl" />
        </div>
        <label className="flex items-start gap-3 text-sm text-deep-ink/80">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
          I've reviewed my return with Claire and authorize her to file it electronically. Typing my name counts as my signature.
        </label>
        {err && <p className="text-sm text-destructive">We couldn't save your signature. Please try again.</p>}
        <Button type="submit" size="lg" disabled={!ok || busy}>{busy ? <Loader2 className="animate-spin" /> : <PenLine />} Sign</Button>
      </form>
    </section>
  );
}
