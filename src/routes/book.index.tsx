import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Video, Users, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/segmented";
import { DocumentStack } from "@/components/brand/DocumentStack";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import { BookingShell, StepTitle } from "@/components/booking/BookingShell";
import { useBookingDraft, clearDraft, type BookingDraft } from "@/lib/booking-store";
import { bookAppointment, getAvailabilityWindow, joinWaitlist, saveLead } from "@/lib/booking.functions";
import { getLeadDraft } from "@/lib/automations.functions";
import { fmtDateLong, fmtDayChip, fmtTime, type Answers } from "@/lib/intake";

export const Route = createFileRoute("/book/")({
  validateSearch: z.object({ service: z.string().optional(), step: z.number().int().min(0).max(1).optional(), resume: z.string().uuid().optional(), start: z.string().datetime({ offset: true }).optional() }),
  head: () => ({
    meta: [
      { title: "Schedule an appointment — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Book with Claire Hartwell, EA in about two minutes. Confirmed instantly, with a personal document checklist." },
      { property: "og:title", content: "Schedule an appointment — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "Pick a service and a time. Confirmed instantly." },
    ],
  }),
  component: BookPage,
});

type Service = { id: string; name: string; slug: string; duration_min: number; price_from: number; is_from_price: boolean; description: string | null };
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const nyDay = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id,name,slug,duration_min,price_from,is_from_price,description").eq("active", true).order("sort_order");
      if (error) throw error;
      return data as Service[];
    },
  });
}

function BookPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/book/" });
  const { draft, update, loaded } = useBookingDraft();
  const services = useServices();
  const reduce = useReducedMotion();
  const [bookingBusy, setBookingBusy] = useState(false);
  const applied = useRef(false);

  const fetchLead = useServerFn(getLeadDraft);
  useEffect(() => {
    if (!loaded || applied.current) return;
    applied.current = true;
    if (search.resume) {
      fetchLead({ data: { id: search.resume } }).then((l) => {
        if (!l) { navigate({ search: {}, replace: true }); return; }
        update({ email: l.email, name: l.name, meetingType: l.meetingType, answers: l.answers as Answers, ...(l.service ? { serviceSlug: l.service } : {}), slot: undefined, date: undefined });
        navigate({ search: { step: 0 }, replace: true });
      }).catch(() => {});
      return;
    }
    // A time picked on the homepage: keep it, ask the questions, then confirm it on the time step.
    if (search.start) {
      update({ serviceSlug: search.service ?? "individual", slot: search.start, date: nyDay(search.start) });
      navigate({ search: { step: 1 }, replace: true });
      return;
    }
    if (search.service && search.service !== draft.serviceSlug) update({ serviceSlug: search.service, slot: undefined, date: undefined });
    else if (!draft.serviceSlug) update({ serviceSlug: "individual" });
  }, [loaded, search.service, search.resume, search.start, draft.serviceSlug, update, fetchLead, navigate]);

  const service = services.data?.find((s) => s.slug === draft.serviceSlug);
  let step = search.step ?? 0;
  if (loaded && step === 1 && !draft.slot) step = 0;

  // Steps slide forward or back with the direction of travel (DESIGN_SYSTEM motion: expo-out, 260ms).
  const prevStep = useRef(step);
  const dir = step >= prevStep.current ? 1 : -1;
  useEffect(() => { prevStep.current = step; }, [step]);

  const go = (n: number) => {
    navigate({ search: (s) => ({ ...s, step: n }) });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
  };

  const detailsComplete = draft.name.trim().length > 0 && emailOk(draft.email);
  const slotOk = !!draft.slot && !!draft.date && nyDay(draft.slot) === draft.date;
  const canContinue = step === 0 ? !!service && slotOk : detailsComplete && slotOk && !bookingBusy;

  if (!loaded) {
     return <BookingShell step={0}><div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"><div><Skeleton className="h-10 w-3/4" /><Skeleton className="mt-3 h-5 w-2/3" /><div className="mt-14 grid gap-5 sm:grid-cols-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div></div><div className="hidden lg:block"><Skeleton className="h-48 rounded-2xl" /></div></div></BookingShell>;
  }

  return (
    <BookingShell step={step}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 pb-24 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduce ? false : { opacity: 0, x: 16 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -8 * dir }}
              transition={{ duration: reduce ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 && (service
                ? <TimeStep service={service} services={services.data ?? []} draft={draft} update={update} />
                : <div className="space-y-4"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-9 w-full" /><Skeleton className="h-40 w-full" /></div>)}
              {step === 1 && service && <DetailsStep service={service} draft={draft} update={update} busy={bookingBusy} setBusy={setBookingBusy} onPickAgain={() => go(0)} />}
            </motion.div>
          </AnimatePresence>
          <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-sheet px-5 py-3 lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
            {step === 0 ? <Button asChild variant="secondary" size="lg"><Link to="/">Back</Link></Button> : <Button variant="secondary" size="lg" onClick={() => go(step - 1)}><ArrowLeft className="size-4" /> Back</Button>}
            <Button size="lg" className="flex-1 lg:flex-none" type={step === 1 ? "submit" : "button"} form={step === 1 ? "booking-details" : undefined} disabled={!canContinue} onClick={step === 0 ? () => go(1) : undefined}>{step === 1 ? (bookingBusy ? "Booking…" : "Confirm this time") : draft.slot ? `Continue with ${fmtTime(draft.slot)}` : "Pick a time to continue"}</Button>
          </div>
        </div>
        <aside className="hidden lg:block"><div className="sticky top-8">{service && <BookingSummary service={service} draft={draft} onPickAgain={step === 1 ? () => go(0) : undefined} />}</div></aside>
      </div>
    </BookingShell>
  );
}

function TimeStep({ service, services, draft, update }: { service: Service; services: Service[]; draft: BookingDraft; update: (p: Partial<BookingDraft>) => void }) {
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const strip = useRef<HTMLDivElement>(null);
  const q = useQuery({ queryKey: ["availability", service.id], queryFn: () => fetchWindow({ data: { serviceId: service.id, days: 14 } }), staleTime: 30_000 });
  // Clients see 30-minute starts only; every label, chip and "Next available" uses the same list.
  const days = (q.data?.days ?? []).map((d) => ({ ...d, slots: d.slots.filter((x) => new Date(x).getUTCMinutes() % 30 === 0) }));
  const firstOpen = days.find((d) => d.slots.length)?.date;
  const selDate = draft.date && days.some((d) => d.date === draft.date) ? draft.date : firstOpen;
  const day = days.find((d) => d.date === selDate);

  return (
    <>
        <StepTitle hideEyebrow eyebrow="Step 1 of 2" title="Pick a time for your tax appointment" sub="All times are Eastern. You can move or cancel later from your link." />
      <div role="radiogroup" aria-label="Service" className="mb-5 flex flex-wrap gap-1.5">
        {services.map((x) => (
          <button key={x.slug} type="button" role="radio" aria-checked={x.slug === service.slug} onClick={() => { if (x.slug !== service.slug) update({ serviceSlug: x.slug, slot: undefined, date: undefined }); }}
            className={`h-10 rounded-md border px-3.5 text-[13px] font-semibold transition-colors duration-150 ${x.slug === service.slug ? "border-ink bg-ink text-white" : "border-line-1 bg-sheet text-body hover:border-line-3"}`}>
            {x.name}
          </button>
        ))}
      </div>
      <Segmented className="mb-6" label="Meeting type" value={draft.meetingType} onChange={(v) => update({ meetingType: v })}
        options={[{ value: "in_person", label: <><Users /> In person</> }, { value: "video", label: <><Video /> Video call</> }]} />

       {q.isLoading && <div className="space-y-6"><div className="flex gap-1 overflow-hidden">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[68px] w-[72px] shrink-0 rounded-lg" />)}</div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}</div></div>}
      {(q.isError || q.data?.error) && (
        <div className="rounded-2xl bg-surface-2 p-6 text-sm">
          {q.data?.error ?? "We couldn't load times."} <button className="font-medium text-ink underline" onClick={() => q.refetch()}>Try again</button>
        </div>
      )}

      {days.length > 0 && (
        <>
           <div className="relative">
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-[76px] w-10 bg-gradient-to-l from-sheet to-transparent" />
             <div ref={strip} className="flex gap-1 overflow-x-auto pb-2 pr-9 [scrollbar-width:none]" role="listbox" aria-label="Choose a day">
            {days.map((d) => {
              const c = fmtDayChip(d.date);
              const active = d.date === selDate;
              const open = d.slots.length;
              const full = !d.closed && open === 0;
              return (
                 <Button key={d.date} variant="secondary" disabled={d.closed} onClick={() => update({ date: d.date, slot: undefined })} role="option" aria-selected={active}
                   className={`flex h-[76px] w-[76px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 transition-colors duration-150 ${
                     active ? "border-deep-ink bg-deep-ink text-primary-foreground hover:bg-deep-ink" : d.closed ? "border-transparent bg-transparent text-muted-foreground/50" : full ? "border-transparent bg-fill-subtle text-muted-foreground" : "border-border bg-sheet text-deep-ink hover:bg-surface-2"}`}>
                  <span className={`text-[11px] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{c.dow} {c.month}</span>
                  <span className={`tabular text-lg font-medium leading-tight ${full && !active ? "line-through decoration-1" : ""}`}>{c.day}</span>
                  <span className={`text-[10px] font-medium ${active ? "text-primary-foreground/80" : d.closed ? "" : full ? "text-muted-foreground" : "text-success"}`}>{d.closed ? "Closed" : full ? "Full" : `${open} open`}</span>
                 </Button>
              );
            })}
             </div>
             <div className="mt-1 flex justify-end gap-1">
               <Button variant="secondary" size="icon" aria-label="Earlier dates" onClick={() => strip.current?.scrollBy({ left: -240, behavior: "smooth" })}><ChevronLeft /></Button>
               <Button variant="secondary" size="icon" aria-label="Later dates" onClick={() => strip.current?.scrollBy({ left: 240, behavior: "smooth" })}><ChevronRight /></Button>
             </div>
          </div>

          <div className="mt-6">
            {day && day.slots.length > 0 && <p className="mb-4 text-xs text-muted-foreground">{fmtDateLong(day.slots[0]!)}. Only open times are shown.</p>}
            {day && day.slots.length > 0 && (
               <div className="space-y-6">{(["Morning", "Afternoon", "Evening"] as const).map((period) => {
                 const slots = day.slots.filter((s) => {
                   const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(s));
                   const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
                   return new Date(s).getUTCMinutes() % 30 === 0 && (period === "Morning" ? hour < 12 : period === "Afternoon" ? hour >= 12 && hour < 17 : hour >= 17);
                 });
                 return slots.length ? <div key={period}><h2 className="mb-3 t-sub">{period}</h2><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map((s) => (
                   <Button key={s} variant="secondary" onClick={() => update({ date: day.date, slot: s })} aria-pressed={draft.slot === s && draft.date === day.date}
                     className={`tabular h-11 rounded-lg text-sm font-medium transition-colors duration-150 ${draft.slot === s && draft.date === day.date ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-secondary text-deep-ink hover:bg-fill-selected"}`}>
                     {fmtTime(s)}
                   </Button>
                 ))}</div></div> : null;
               })}</div>
            )}
            {day && !day.closed && day.slots.length === 0 && <WaitlistPanel service={service} date={day.date} draft={draft} />}
             {!firstOpen && !draft.date && (
              <p className="rounded-2xl bg-surface-2 p-6 text-sm text-deep-ink/80">The next two weeks are fully booked. Pick a day above to join its waitlist.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}

function WaitlistPanel({ service, date, draft }: { service: Service; date: string; draft: BookingDraft }) {
  const join = useServerFn(joinWaitlist);
  const [name, setName] = useState(draft.name);
  const [email, setEmail] = useState(draft.email);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const c = fmtDayChip(date);
  if (state === "done") {
    return <div className="rounded-2xl bg-surface-2 p-6"><p className="t-card text-deep-ink">You're on the list.</p><p className="mt-1 text-sm text-deep-ink/70">If a {c.dow} slot opens, we'll email you first.</p></div>;
  }
  return (
    <form
      className="rounded-2xl bg-surface-2 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        try { const r = await join({ data: { serviceId: service.id, name, email, date } }); setState(r.ok ? "done" : "error"); } catch { setState("error"); }
      }}
    >
      <p className="t-card text-deep-ink">This day is full. Join the waitlist.</p>
      <p className="mt-1 text-sm text-deep-ink/70">{c.dow} {c.month} {c.day} is fully booked. We'll email you if a spot opens.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input required aria-label="Your name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
        <Input required type="email" aria-label="Email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
      </div>
      {state === "error" && <p className="mt-2 text-sm text-destructive" role="alert">We couldn't add you to the waitlist. Please try again.</p>}
      <Button type="submit" size="md" className="mt-4" disabled={state === "saving"}>
        {state === "saving" && <Loader2 className="animate-spin" />} Join the waitlist
      </Button>
    </form>
  );
}

/* ---------- Step 4: details + book ---------- */
function BookingSummary({ service, draft, onPickAgain }: { service: Service; draft: BookingDraft; onPickAgain?: (() => void) | undefined }) {
  const rows: [string, string][] = [
    ["Service", service.name],
    ["When", draft.slot ? `${fmtDateLong(draft.slot)}, ${fmtTime(draft.slot)}` : "Pick a time"],
    ["Where", draft.meetingType === "video" ? "Video call" : "412 Bloomfield Ave, Montclair"],
    ["Length", `${service.duration_min} minutes`],
    ["Fee", `${service.is_from_price ? "From " : ""}$${service.price_from}, paid when your return is filed`],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-line-2 bg-sheet">
      <p className="bg-deep-ink px-4 py-2.5 text-[13px] font-bold text-white">Your appointment</p>
      <dl className="divide-y divide-line-1">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[72px_1fr] gap-3 px-4 py-2.5 text-[13px]">
            <dt className="font-semibold text-muted-foreground">{k}</dt><dd className={k === "When" && !draft.slot ? "text-muted-foreground" : "text-deep-ink"}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-line-1 bg-surface-2 px-4 py-3 text-[12px] leading-5 text-muted-foreground">
        Confirmed as soon as you book. Move or cancel any time from your link.
        {onPickAgain && <button type="button" onClick={onPickAgain} className="ml-1 font-semibold text-ink underline underline-offset-2">Change time</button>}
      </div>
    </div>
  );
}

function DetailsStep({ service, draft, update, busy, setBusy, onPickAgain }: { service: Service; draft: BookingDraft; update: (p: Partial<BookingDraft>) => void; busy: boolean; setBusy: (value: boolean) => void; onPickAgain: () => void }) {
  const navigate = useNavigate();
  const book = useServerFn(bookAppointment);
  const lead = useServerFn(saveLead);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const lastLead = useRef("");

  const saveLeadNow = () => {
    if (!emailOk(draft.email) || lastLead.current === draft.email + draft.name) return;
    lastLead.current = draft.email + draft.name;
    lead({ data: { email: draft.email, name: draft.name || undefined, lastStep: "details", partial: { service: draft.serviceSlug, slot: draft.slot, meeting_type: draft.meetingType, answers: draft.answers } } }).catch(() => {});
  };

  const submit = async (slot: string) => {
    setBusy(true); setError(null);
    try {
      const r = await book({ data: {
        serviceId: service.id, start: slot, name: draft.name.trim(), email: draft.email.trim(),
        phone: draft.phone.trim() || undefined, meetingType: draft.meetingType, intake: { intake_pending: true },
      } });
      if (r.ok) {
        clearDraft();
        navigate({ to: "/book/confirmed", search: { token: r.manageToken } });
        return;
      }
      setError(r.error);
      setAlternatives(r.alternatives);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  const valid = draft.name.trim().length > 0 && emailOk(draft.email);

  return (
    <>
       <StepTitle hideEyebrow eyebrow="Step 2 of 2" title="Your details" sub="Where to send your confirmation. That's all we need to book." />
       <div className="mb-6 lg:hidden"><BookingSummary service={service} draft={draft} onPickAgain={onPickAgain} /></div>
       <form id="booking-details" className="w-full space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid && draft.slot && draft.date === nyDay(draft.slot)) submit(draft.slot); }}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" required value={draft.name} onChange={(e) => update({ name: e.target.value })} onBlur={saveLeadNow} className="h-12 bg-sheet" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={draft.email} onChange={(e) => update({ email: e.target.value })} onBlur={saveLeadNow} className="h-12 bg-sheet" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone <span className="font-normal text-muted-foreground">(for text reminders, optional)</span></Label>
          <Input id="phone" type="tel" autoComplete="tel" value={draft.phone} placeholder={draft.phoneHint ? `We have your number ${draft.phoneHint}` : ""}
            onChange={(e) => update({ phone: e.target.value })} className="h-12 bg-sheet" />
        </div>

        {error && (
          <div className="rounded-2xl border border-warning/40 bg-sheet p-4" role="alert">
            <p className="font-medium text-deep-ink">{error}</p>
            {alternatives.length > 0 ? (
              <>
                <p className="mt-1 text-sm text-deep-ink/70">Here are the closest open times:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                   {alternatives.map((a) => (
                     <Button key={a} variant="secondary" type="button" disabled={busy} onClick={() => { update({ date: nyDay(a), slot: a }); onPickAgain(); }}
                       className="tabular text-sm">
                       {fmtDayChip(nyDay(a)).dow} {fmtTime(a)}
                     </Button>
                  ))}
                </div>
              </>
            ) : (
              <button type="button" onClick={onPickAgain} className="mt-2 text-sm font-medium text-ink underline">Pick another time</button>
            )}
          </div>
        )}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" /> Confirmed instantly, nothing to pay now. We never ask for your Social Security number online.
        </p>
      </form>
    </>
  );
}
