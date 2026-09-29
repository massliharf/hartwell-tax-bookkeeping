import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Check, FileText, Loader2, Lock, MapPin, Upload, Video, Users, CalendarClock, X, PenLine } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { BookingShell } from "@/components/booking/BookingShell";
import {
  cancelAppointment, confirmAttendance, confirmUpload, createUploadUrl, getAppointmentByToken,
  markNotApplicable, rescheduleAppointment, signForm8879, undoNotApplicable,
} from "@/lib/portal.functions";
import { getAvailabilityWindow } from "@/lib/booking.functions";
import { fmtDateLong, fmtDayChip, fmtTime } from "@/lib/intake";
import { docGuide } from "@/lib/doc-guide";

export const Route = createFileRoute("/a/$token")({
  head: () => ({
    meta: [
      { title: "Your appointment — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Manage your appointment and send your documents privately." },
      { property: "og:title", content: "Your appointment — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "Your private appointment page." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalPage,
});

const ADDRESS = "412 Bloomfield Avenue, Montclair, NJ 07042";
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("412 Bloomfield Avenue, Montclair, NJ 07042")}`;
const MAX = 15 * 1024 * 1024;
const TYPES = ["application/pdf", "image/jpeg", "image/png"];

type Appt = {
  service_id: string; start_at: string; end_at: string; meeting_type: "in_person" | "video"; status: string;
  ready_score: number; signature_status: string; services: { name: string } | null; clients: { name: string } | null;
};
type Item = { id: string; document_name: string; description: string | null; required: boolean; status: string; na_reason: string | null };

function PortalPage() {
  const { token } = Route.useParams();
  const fetchAppt = useServerFn(getAppointmentByToken);
  const q = useQuery({ queryKey: ["portal", token], queryFn: () => fetchAppt({ data: { token } }) });
  const refresh = () => q.refetch();

  if (q.isError || (q.data && !q.data.appointment)) {
    return (
      <BookingShell>
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl leading-9 sm:text-[28px] sm:leading-[42px] text-deep-ink">This link isn't working</h1>
          <p className="mt-3 text-deep-ink/70">Use the link in your confirmation email, or call the office at (973) 555-0142.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/">Back to home</Link></Button>
        </div>
      </BookingShell>
    );
  }
  if (!q.data?.appointment) {
    return <BookingShell><div className="mx-auto max-w-2xl space-y-4"><div className="h-56  rounded-2xl bg-[#F0F0F0]" /><div className="h-96  rounded-2xl bg-[#F0F0F0]" /></div></BookingShell>;
  }

  const a = q.data.appointment as Appt;
  const items = q.data.checklist as Item[];
  const now = new Date(q.data.now!);
  const isPast = new Date(a.start_at) <= now;
  const cancelled = a.status === "cancelled";
  const open = ["booked", "confirmed"].includes(a.status) && !isPast;
  const first = a.clients?.name?.split(" ")[0] ?? "there";
  const todo = items.filter((i) => i.required && i.status === "missing").length;

  return (
    <BookingShell>
      <div className="mx-auto max-w-2xl space-y-10">
        <div>
          <p className="text-xs font-medium text-ink/70">Your private page</p>
          <h1 className="mt-2 text-2xl leading-9 sm:text-[28px] sm:leading-[42px] text-deep-ink">Hello, {first}.</h1>
          <p className="mt-2 text-deep-ink/70">
            {cancelled ? "This appointment was cancelled." : isPast ? "Thanks for coming in." : todo > 0 ? `${todo} document${todo === 1 ? "" : "s"} left to send. Everything else is set.` : "You're all set. Claire has everything she needs."}
          </p>
        </div>

        {a.signature_status === "pending" && <SignSection token={token} appt={a} onDone={refresh} />}

        <AppointmentCard appt={a} cancelled={cancelled} />
        {open && <Actions token={token} appt={a} onChange={refresh} />}
        {cancelled && (
          <div className="rounded-2xl bg-surface-2 p-6">
            <p className="text-deep-ink/80">Whenever you're ready, you can pick a new time. It takes two minutes.</p>
            <Button asChild className="mt-4"><Link to="/book">Book a new time</Link></Button>
          </div>
        )}

        {!cancelled && items.length > 0 && (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-xl leading-[30px] tracking-[-0.2px] text-deep-ink">Your checklist</h2>
              <span className="tabular text-sm text-muted-foreground">{items.filter((i) => i.status !== "missing").length} of {items.length} done</span>
            </div>
            <p className="mb-5 flex items-start gap-2 rounded-2xl bg-fill-neutral/70 p-4 text-sm text-deep-ink/85">
              <Lock className="mt-0.5 size-4 shrink-0 text-ink" /> Only Claire can see your files. We never ask for your Social Security number.
            </p>
            <ul className="space-y-4">
              {items.map((i) => <DocCard key={i.id} token={token} item={i} onChange={refresh} />)}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">PDF, JPG or PNG, up to 15MB each. Phone photos are perfect.</p>
          </section>
        )}
      </div>
    </BookingShell>
  );
}

/* ---------- Appointment card ---------- */
function AppointmentCard({ appt, cancelled }: { appt: Appt; cancelled: boolean }) {
  const video = appt.meeting_type === "video";
  return (
    <div className={`sheet-stack p-6 ${cancelled ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">{appt.services?.name}</p>
            {appt.status === "confirmed" && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">Confirmed</span>}
            {cancelled && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Cancelled</span>}
          </div>
          <p className={`mt-1 font-serif text-xl leading-[30px] tracking-[-0.2px] text-deep-ink ${cancelled ? "line-through" : ""}`}>{fmtDateLong(appt.start_at)}</p>
          <p className="tabular mt-1 text-deep-ink/80">{fmtTime(appt.start_at)} – {fmtTime(appt.end_at)}</p>
        </div>
        {!cancelled && <ReadyRing value={appt.ready_score} size={84} />}
      </div>
      {!cancelled && (
        <div className="mt-5 border-t border-border pt-4 text-sm">
          {video ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-deep-ink/80"><Video className="size-4 text-ink" /> Video call. Your join link arrives by email the day before.</span>
              <Button size="sm" variant="outline" disabled><Video /> Join call</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-deep-ink/80"><Users className="size-4 text-ink" /> In person, {ADDRESS}</span>
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
      <div className="flex flex-wrap gap-2">
        {appt.status === "confirmed" ? (
          <span className="inline-flex h-10 items-center gap-2 rounded-full bg-success/15 px-4 text-sm font-medium text-success"><Check className="size-4" /> You'll be there</span>
        ) : (
          <Button onClick={() => run("confirm", () => confirm({ data: { token } }))} disabled={!!busy}>
            {busy === "confirm" ? <Loader2 className="" /> : <Check />} I'll be there
          </Button>
        )}
        <Button variant="outline" onClick={() => setPicking((p) => !p)}><CalendarClock /> Reschedule</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" className="text-muted-foreground">Cancel</Button></AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl bg-sheet">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-xl leading-[30px] tracking-[-0.2px]">Cancel this appointment?</AlertDialogTitle>
              <AlertDialogDescription>That's completely fine. Your slot will be offered to someone on the waitlist. If another time would work better, you can reschedule instead.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Keep my appointment</AlertDialogCancel>
              <AlertDialogAction className="rounded-full" onClick={() => run("cancel", () => cancel({ data: { token } }))}>Yes, cancel</AlertDialogAction>
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
  const days = q.data?.days ?? [];
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
          <p className="font-serif text-2xl text-deep-ink">Pick a new time</p>
          <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full hover:bg-fill-subtle"><X className="size-4" /></button>
        </div>
        {q.isLoading && <div className="h-32  rounded-lg bg-fill-neutral/50" />}
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
                    className={`flex w-[68px] shrink-0 flex-col items-center rounded-lg px-2 py-2 ${active ? "bg-fill-selected text-deep-ink" : off ? "text-muted-foreground/50" : "bg-fill-neutral hover:bg-[#DBDBDB]"}`}>
                    <span className="text-[10px] tracking-wider opacity-70">{c.dow}</span>
                    <span className="tabular text-lg font-medium leading-tight">{c.day}</span>
                    <span className="text-[10px] opacity-70">{d.closed ? "Closed" : d.slots.length === 0 ? "Full" : c.month}</span>
                  </button>
                );
              })}
            </div>
            {day && (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {day.slots.map((s) => (
                  <button key={s} disabled={!!busy} onClick={() => pick(s)}
                    className="tabular inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white text-sm font-medium hover:border-ink">
                    {busy === s ? <Loader2 className="size-4 " /> : fmtTime(s)}
                  </button>
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
                  <button key={s} onClick={() => pick(s)} className="tabular rounded-full border border-ink px-3 py-1.5 text-ink hover:bg-ink hover:text-primary-foreground">
                    {fmtDateLong(s).split(",")[0]} {fmtTime(s)}
                  </button>
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [naOpen, setNaOpen] = useState(false);
  const [reason, setReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const upload = async (f?: File | null) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return setErr("Please use a PDF, JPG or PNG.");
    if (f.size > MAX) return setErr("That file is over 15MB. A phone photo usually works.");
    setBusy(true); setErr(null);
    try {
      const { path, token: t } = await getUrl({ data: { token, itemId: item.id, fileName: f.name || "photo.jpg", size: f.size } });
      const up = await supabase.storage.from("client-documents").uploadToSignedUrl(path, t, f, { contentType: f.type });
      if (up.error) throw up.error;
      await confirm({ data: { token, itemId: item.id, path } });
      await onChange();
    } catch { setErr("The upload didn't go through. Please try again."); }
    setBusy(false);
  };

  const saveNa = async () => {
    setBusy(true);
    try { await markNa({ data: { token, itemId: item.id, reason } }); setNaOpen(false); await onChange(); } catch { setErr("Couldn't save that. Please try again."); }
    setBusy(false);
  };

  return (
    <li>
        {item.status === "uploaded" ? (
          <div key="up" className="flex items-center gap-4 rounded-2xl border border-success/30 bg-sheet p-5">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-5" strokeWidth={3} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-deep-ink">{item.document_name}</p>
              <p className="text-sm text-success">Received</p>
            </div>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-ink">Replace</button>
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
            className={`sheet-stack p-5 ${drag ? "ring-2 ring-[#4F69F2]" : ""}`}>
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fill-neutral text-ink"><FileText className="size-5" strokeWidth={1.75} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-deep-ink">{item.document_name}</p>
                  {!item.required && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">If you have it</span>}
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
                <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="" /> : <Upload />} Upload</Button>
                <Button size="sm" variant="outline" onClick={() => camRef.current?.click()} disabled={busy}><Camera /> Take a photo</Button>
                <button onClick={() => setNaOpen(true)} className="ml-auto text-sm text-muted-foreground underline underline-offset-4 hover:text-ink">Doesn't apply to me</button>
              </div>
            )}
            <p className="mt-3 hidden text-xs text-muted-foreground sm:block">Or drag a file onto this card.</p>
          </div>
        )}
      {err && <p className="mt-2 text-sm text-destructive" role="alert">{err}</p>}
      <input ref={fileRef} type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={camRef} type="file" className="sr-only" accept="image/jpeg,image/png" capture="environment" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
    </li>
  );
}

/* ---------- Form 8879 e-sign ---------- */
function SignSection({ token, appt, onDone }: { token: string; appt: Appt; onDone: () => void }) {
  const sign = useServerFn(signForm8879);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const ok = name.trim().length >= 2 && agree;

  return (
    <section className="sheet-stack p-6">
      <p className="text-[11px] font-medium text-warning">One last step</p>
      <h2 className="mt-1 text-xl leading-[30px] tracking-[-0.2px] text-deep-ink">Sign your e-file authorization (Form 8879)</h2>
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
          <Input id="sig" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1.5 h-12 bg-white font-serif text-2xl" />
        </div>
        <label className="flex items-start gap-3 text-sm text-deep-ink/80">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
          I've reviewed my return with Claire and authorize her to file it electronically. Typing my name counts as my signature.
        </label>
        {err && <p className="text-sm text-destructive">We couldn't save your signature. Please try again.</p>}
        <Button type="submit" size="lg" disabled={!ok || busy}>{busy ? <Loader2 className="" /> : <PenLine />} Sign</Button>
      </form>
    </section>
  );
}
