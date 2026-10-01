import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Video, Users, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GROUPS, SERVICES, isIntro, serviceInfo } from "@/lib/services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/segmented";
import { DocumentStack } from "@/components/brand/DocumentStack";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import { IntakeQuestions } from "@/components/booking/IntakeQuestions";
import { BookingShell, StepTitle } from "@/components/booking/BookingShell";
import { useBookingDraft, clearDraft, type BookingDraft } from "@/lib/booking-store";
import { bookAppointment, getAvailabilityWindow, joinWaitlist, saveLead } from "@/lib/booking.functions";
import { getLeadDraft } from "@/lib/automations.functions";
import { fmtDateLong, fmtDayChip, fmtTime, previewChecklist, questionsFor, toIntakePayload, type Answers, chipsFor, intakeComplete } from "@/lib/intake";

export const Route = createFileRoute("/book/")({
  validateSearch: z.object({ service: z.string().optional(), step: z.number().int().min(0).max(2).optional(), resume: z.string().uuid().optional(), start: z.string().datetime({ offset: true }).optional() }),
  head: () => ({
    meta: [
      { title: "Schedule an appointment — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Book a tax appointment in Montclair, NJ in about two minutes. Confirmed right away, with your own document list." },
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
        navigate({ search: { step: l.service ? 1 : 0 }, replace: true });
      }).catch(() => {});
      return;
    }
    // A time picked on the homepage: keep it, ask the questions, then confirm it on the time step.
    if (search.start) {
      update({ serviceSlug: search.service ?? "individual", slot: search.start, date: nyDay(search.start) });
      navigate({ search: { step: 2 }, replace: true });
      return;
    }
    if (search.service) {
      if (search.service !== draft.serviceSlug) update({ serviceSlug: search.service, slot: undefined, date: undefined });
      if (search.step === undefined) navigate({ search: { step: 1 }, replace: true });
    }
  }, [loaded, search.service, search.resume, search.start, draft.serviceSlug, update, fetchLead, navigate]);

  const service = services.data?.find((s) => s.slug === draft.serviceSlug);
  let step = search.step ?? 0;
  if (loaded && step >= 1 && !draft.serviceSlug) step = 0;
  if (loaded && step === 2 && !draft.slot) step = 1;

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
  const questionsComplete = intakeComplete(draft.serviceSlug, draft.answers);
  const preview = previewChecklist(draft.serviceSlug, draft.answers);
  const canContinue = step === 0 ? !!service : step === 1 ? slotOk : detailsComplete && questionsComplete && slotOk && !bookingBusy;
  // Short enough to fit a phone's sticky footer; the selection itself is visible on the page.
  const short = (iso?: string) => (iso ? `${new Date(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" })} ${fmtTime(iso)}` : "");
  const cta = step === 0 ? (service ? "Continue" : "Choose a service")
    : step === 1 ? (draft.slot ? `Continue with ${fmtTime(draft.slot)}` : "Pick a time")
    : bookingBusy ? "Confirming…" : !questionsComplete ? "Answer the questions" : `Confirm ${short(draft.slot)}`;

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
              {step === 0 && <ServiceStep services={services} selected={draft.serviceSlug} onPick={(slug) => { if (slug !== draft.serviceSlug) update({ serviceSlug: slug, slot: undefined, date: undefined, ...(isIntro(slug) ? { meetingType: "video" as const } : {}) }); }} />}
              {step === 1 && (service
                ? <TimeStep service={service} draft={draft} update={update} />
                : <div className="space-y-4"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>)}
              {step === 2 && service && <DetailsStep service={service} draft={draft} update={update} busy={bookingBusy} setBusy={setBookingBusy} onPickAgain={() => go(1)} />}
            </motion.div>
          </AnimatePresence>
          <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-sheet px-5 py-3 lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
            {step === 0 ? <Button asChild variant="secondary" size="lg"><Link to="/">Back</Link></Button> : <Button variant="secondary" size="lg" onClick={() => go(step - 1)}><ArrowLeft className="size-4" /> Back</Button>}
            <Button size="lg" className="min-w-0 flex-1 truncate lg:flex-none" type={step === 2 ? "submit" : "button"} form={step === 2 ? "booking-details" : undefined} disabled={!canContinue} onClick={step < 2 ? () => go(step + 1) : undefined}>{cta}</Button>
          </div>
        </div>
        <aside className="hidden lg:block"><div className="sticky top-8 space-y-4">{service && step > 0 && <BookingSummary service={service} draft={draft} onPickAgain={step === 2 ? () => go(1) : undefined} />}{step === 2 && preview.length > 0 && <ChecklistPreview docs={preview} complete={questionsComplete} />}</div></aside>
      </div>
    </BookingShell>
  );
}

/* ---------- Step 1: what you need ---------- */
function ServiceStep({ services, selected, onPick }: { services: ReturnType<typeof useServices>; selected?: string | undefined; onPick: (slug: string) => void }) {
  return (
    <>
       <StepTitle hideEyebrow eyebrow="Step 1 of 3" title="What do you need help with?" sub="Nothing to pay now." />
       {services.isLoading && <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>}
      {services.isError && (
        <div className="rounded-2xl bg-surface-2 p-6 text-sm">
          We couldn't load the services. <button className="font-medium text-ink underline" onClick={() => services.refetch()}>Try again</button>
        </div>
      )}
      {(() => {
        const list = services.data ?? [];
        const intro = list.find((x) => x.slug === "intro");
        const card = (s: (typeof list)[number]) => {
          const active = s.slug === selected;
            return (
               <button
                key={s.id}
                type="button"
                onClick={() => onPick(s.slug)}
                aria-pressed={active}
                className={`flex min-h-36 w-full flex-col rounded-xl border p-5 text-left ${active ? "border-ink bg-ink-50 shadow-[0_0_0_1px_var(--color-ink)]" : "border-line-1 bg-sheet hover:border-line-2 hover:bg-surface-2"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <ServiceIcon service={s.slug} size={40} />
                  <span className={`mt-1 size-[18px] shrink-0 rounded-full border transition-[border-width,border-color] duration-150 ${active ? "border-[6px] border-ink" : "border-line-2 bg-sheet"}`} />
                </div>
                <h2 className="mt-3 t-card text-deep-ink">{s.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{SERVICES.find((x) => x.id === s.slug)?.blurb ?? s.description}</p>
                <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                  <span className="tabular text-muted-foreground">{s.duration_min} min</span>
                  <span className="text-deep-ink">
                    {s.is_from_price && <span className="mr-1 text-xs text-muted-foreground">from</span>}
                    <span className="tabular text-base font-semibold">{Number(s.price_from) === 0 ? "Free" : `$${Number(s.price_from)}`}</span>
                  </span>
                </div>
               </button>
            );
          };
        return (
          <>
            {intro && (
              <button type="button" onClick={() => onPick(intro.slug)} aria-pressed={intro.slug === selected}
                className={`mb-8 flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors duration-150 ${intro.slug === selected ? "border-ink bg-ink-50 shadow-[0_0_0_1px_var(--color-ink)]" : "border-line-2 bg-surface-2 hover:border-line-3"}`}>
                <ServiceIcon service="intro" size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-deep-ink">Not sure? Start with a free 15-minute call</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">15 minutes with Claire to find the right appointment. No documents needed.</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-deep-ink">Free</span>
              </button>
            )}
            {GROUPS.map((g) => {
              const items = list.filter((x) => serviceInfo(x.slug)?.group === g.id);
              if (!items.length) return null;
              return (
                <div key={g.id} className="mb-8">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 className="t-sub">{g.title}</h2></div>
                  <div className="grid gap-3 sm:grid-cols-2">{items.map(card)}</div>
                </div>
              );
            })}
            {/* Anything in the database not described yet still shows, so a new service is never hidden. */}
            {list.some((x) => !serviceInfo(x.slug)) && <div className="mb-8 grid gap-3 sm:grid-cols-2">{list.filter((x) => !serviceInfo(x.slug)).map(card)}</div>}
          </>
        );
      })()}
    </>
  );
}


function ChecklistPreview({ docs, complete }: { docs: ReturnType<typeof previewChecklist>; complete: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-sheet">
       <div className="border-b border-line-1 bg-surface-2 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">{complete ? "What you'll bring" : "Your list so far"}</p>
        <p className="t-card text-deep-ink"><span className="tabular">{docs.length}</span> document{docs.length === 1 ? "" : "s"}</p>
      </div>
       <ul className="max-h-[280px] space-y-1.5 overflow-y-auto px-4 py-3">
        {docs.map((d) => (
          <li key={d.id} className="enter-item flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 size-4 shrink-0 rounded-[4px] border-[1.5px] border-line-3" />
            <span><span className="block text-deep-ink">{d.title}</span>{d.note && <span className="block text-xs text-muted-foreground">{d.note}</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- The five questions (shown on the details step) ---------- */
function QuestionsStep({ slug, answers, onChange }: { slug?: string | undefined; answers: Answers; onChange: (a: Answers) => void }) {
  return (
    <>
      <div className="mb-4 mt-10 border-t border-line-1 pt-8">
        <h2 className="t-card text-deep-ink">Tell us about your year</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your answers become your document list.</p>
      </div>
      <IntakeQuestions slug={slug} answers={answers} onChange={onChange} />
    </>
  );
}


/* ---------- Step 2: time ---------- */
function TimeStep({ service, draft, update }: { service: Service; draft: BookingDraft; update: (p: Partial<BookingDraft>) => void }) {
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const q = useQuery({ queryKey: ["availability", service.id], queryFn: () => fetchWindow({ data: { serviceId: service.id, days: 21 } }), staleTime: 30_000 });
  // Clients see 30-minute starts only; every label, chip and "Next available" uses the same list.
  const days = (q.data?.days ?? []).map((d) => ({ ...d, slots: d.slots.filter((x) => new Date(x).getUTCMinutes() % 30 === 0) }));
  const firstOpen = days.find((d) => d.slots.length)?.date;
  const selDate = draft.date && days.some((d) => d.date === draft.date) ? draft.date : firstOpen;
  const day = days.find((d) => d.date === selDate);
  // One week on screen at a time, so busy weeks read at a glance (no sideways scrolling).
  const weeks = Math.max(1, Math.ceil(days.length / 7));
  const [week, setWeek] = useState(() => Math.max(0, Math.floor(Math.max(0, days.findIndex((d) => d.date === selDate)) / 7)));
  const shown = days.slice(week * 7, week * 7 + 7);
  const weekLabel = shown.length ? `${fmtDayChip(shown[0]!.date).month} ${fmtDayChip(shown[0]!.date).day} to ${fmtDayChip(shown.at(-1)!.date).month} ${fmtDayChip(shown.at(-1)!.date).day}` : "";

  return (
    <>
        <StepTitle hideEyebrow eyebrow="Step 2 of 3" title="Pick a time" sub="Eastern time" />
      {isIntro(service.slug) ? <p className="mb-6 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted-foreground">A 15-minute video call.</p> : <Segmented className="mb-6" label="Meeting type" value={draft.meetingType} onChange={(v) => update({ meetingType: v })}
        options={[{ value: "in_person", label: <><Users /> In person</> }, { value: "video", label: <><Video /> Video call</> }]} />}

       {q.isLoading && <div className="space-y-6"><div className="flex gap-1 overflow-hidden">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[68px] w-[72px] shrink-0 rounded-lg" />)}</div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}</div></div>}
      {(q.isError || q.data?.error) && (
        <div className="rounded-2xl bg-surface-2 p-6 text-sm">
          {q.data?.error ?? "We couldn't load times."} <button className="font-medium text-ink underline" onClick={() => q.refetch()}>Try again</button>
        </div>
      )}

      {days.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-deep-ink">{weekLabel}</p>
            <div className="flex gap-1">
              <Button variant="secondary" size="icon" aria-label="Previous week" disabled={week === 0} onClick={() => setWeek((w) => Math.max(0, w - 1))}><ChevronLeft /></Button>
              <Button variant="secondary" size="icon" aria-label="Next week" disabled={week >= weeks - 1} onClick={() => setWeek((w) => Math.min(weeks - 1, w + 1))}><ChevronRight /></Button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5" role="listbox" aria-label="Choose a day">
            {shown.map((d) => {
              const c = fmtDayChip(d.date);
              const active = d.date === selDate;
              const open = d.slots.length;
              const full = !d.closed && open === 0;
              return (
                <button key={d.date} type="button" disabled={d.closed} onClick={() => update({ date: d.date, slot: undefined })} role="option" aria-selected={active}
                  aria-label={`${c.dow} ${c.month} ${c.day}, ${d.closed ? "closed" : full ? "full" : `${open} open`}`}
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 py-2 transition-colors duration-150 ${
                    active ? "border-deep-ink bg-deep-ink text-primary-foreground" : d.closed ? "border-transparent text-muted-foreground/50" : full ? "border-line-1 bg-surface-2 text-muted-foreground hover:border-line-2" : "border-line-1 bg-sheet text-deep-ink hover:border-line-3"}`}>
                  <span className={`text-[11px] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{c.dow}</span>
                  <span className={`tabular text-lg font-medium leading-tight ${full && !active ? "line-through decoration-1" : ""}`}>{c.day}</span>
                  <span className={`text-[10px] font-medium ${active ? "text-primary-foreground/80" : d.closed ? "" : full ? "" : "text-success"}`}>{d.closed ? "Closed" : full ? "Full" : `${open} open`}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {day && day.slots.length > 0 && <p className="mb-4 text-xs text-muted-foreground">Available times</p>}
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
              <p className="rounded-2xl bg-surface-2 p-6 text-sm text-deep-ink/80">The next three weeks are fully booked. Pick a day above to join its waitlist; you'll be offered the first cancellation.</p>
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
    ["Where", isIntro(service.slug) ? "Video call, or phone" : draft.meetingType === "video" ? "Video call" : "412 Bloomfield Ave, Montclair"],
    ["Length", `${service.duration_min} minutes`],
    ["Fee", Number(service.price_from) === 0 ? "Free" : `${service.is_from_price ? "From " : ""}$${service.price_from}, paid when the work is done`],
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
      <div className="border-t border-line-1 bg-surface-2 px-4 py-3 text-[12px] leading-5 text-muted-foreground">        {onPickAgain && <button type="button" onClick={onPickAgain} className="ml-1 font-semibold text-ink underline underline-offset-2">Change time</button>}
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
        phone: draft.phone.trim() || undefined, meetingType: isIntro(service.slug) ? "video" : draft.meetingType, intake: toIntakePayload(service.slug, draft.answers),
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
       <StepTitle hideEyebrow eyebrow="Step 3 of 3" title="Your details" />
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
          <Lock className="mt-0.5 size-3.5 shrink-0" /> We never ask for your Social Security number online.
        </p>
      </form>
      {(questionsFor(service.slug).length > 0 || chipsFor(service.slug).length > 0) && <QuestionsStep slug={service.slug} answers={draft.answers} onChange={(answers) => update({ answers })} />}
      {previewChecklist(service.slug, draft.answers).length > 0 && <div className="mt-6 lg:hidden"><ChecklistPreview docs={previewChecklist(service.slug, draft.answers)} complete={intakeComplete(service.slug, draft.answers)} /></div>}
    </>
  );
}
