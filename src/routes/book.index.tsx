import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Minus, Plus, Video, Users, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/segmented";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DocumentStack } from "@/components/brand/DocumentStack";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import { BookingShell, StepTitle } from "@/components/booking/BookingShell";
import { useBookingDraft, clearDraft, type BookingDraft } from "@/lib/booking-store";
import { bookAppointment, getAvailabilityWindow, joinWaitlist, saveLead } from "@/lib/booking.functions";
import { getLeadDraft } from "@/lib/automations.functions";
import { fmtDateLong, fmtDayChip, fmtTime, previewChecklist, questionsFor, toIntakePayload, type Answers } from "@/lib/intake";

export const Route = createFileRoute("/book/")({
  validateSearch: z.object({ service: z.string().optional(), step: z.number().int().min(0).max(3).optional(), resume: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Book an appointment — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Book with Claire Hartwell, EA in about two minutes. Confirmed instantly, with a personal document checklist." },
      { property: "og:title", content: "Book an appointment — Hartwell Tax & Bookkeeping" },
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
        navigate({ search: { step: l.service ? 2 : 0 }, replace: true });
      }).catch(() => {});
      return;
    }
    if (search.service && search.service !== draft.serviceSlug) update({ serviceSlug: search.service, slot: undefined, date: undefined });
  }, [loaded, search.service, search.resume, draft.serviceSlug, update, fetchLead, navigate]);

  const service = services.data?.find((s) => s.slug === draft.serviceSlug);
  let step = search.step ?? 0;
  if (loaded && !draft.serviceSlug) step = 0;
  if (loaded && step === 3 && !draft.slot) step = 2;

  const go = (n: number) => {
    navigate({ search: (s) => ({ ...s, step: n }) });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
  };

  const preview = useMemo(() => previewChecklist(draft.serviceSlug, draft.answers), [draft.serviceSlug, draft.answers]);
  const questionsComplete = questionsFor(draft.serviceSlug).every((q) => q.type === "count" || typeof draft.answers[q.key] === "boolean");
  const detailsComplete = draft.name.trim().length > 0 && emailOk(draft.email);
  const canContinue = step === 0 ? !!service : step === 1 ? questionsComplete : step === 2 ? !!draft.slot && !!draft.date && nyDay(draft.slot) === draft.date : detailsComplete && !!draft.slot && !!draft.date && nyDay(draft.slot) === draft.date && !bookingBusy;

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
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2, ease: [0, 0, 0.2, 1] }}
            >
              {step === 0 && (
                <ServiceStep
                  services={services}
                  selected={draft.serviceSlug}
                  onPick={(slug) => {
                    if (slug !== draft.serviceSlug) update({ serviceSlug: slug, slot: undefined, date: undefined });
                  }}
                />
              )}
              {step === 1 && (
                <QuestionsStep slug={draft.serviceSlug} answers={draft.answers} onChange={(answers) => update({ answers })} />
              )}
              {step === 2 && service && <TimeStep service={service} draft={draft} update={update} />}
              {step === 3 && service && <DetailsStep service={service} draft={draft} update={update} busy={bookingBusy} setBusy={setBookingBusy} onPickAgain={() => go(2)} />}
            </motion.div>
          </AnimatePresence>
          <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-sheet px-5 py-3 lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
            {step === 0 ? <Button asChild variant="secondary" size="lg"><Link to="/">Back</Link></Button> : <Button variant="secondary" size="lg" onClick={() => go(step - 1)}><ArrowLeft className="size-4" /> Back</Button>}
            <Button size="lg" className="flex-1 lg:flex-none" type={step === 3 ? "submit" : "button"} form={step === 3 ? "booking-details" : undefined} disabled={!canContinue} onClick={step < 3 ? () => go(step + 1) : undefined}>{step === 3 ? "Book my appointment" : "Continue"}</Button>
          </div>
        </div>
        <aside className="hidden lg:block"><div className="sticky top-8 space-y-4">
          {step === 3 && service && <BookingSummary service={service} draft={draft} onPickAgain={() => go(2)} />}
          <ChecklistPreview docs={preview} hasService={!!service} />
        </div></aside>
      </div>
      <div className="fixed inset-x-0 bottom-[64px] z-30 border-t border-border bg-sheet px-5 py-2 lg:hidden">
        <Dialog><DialogTrigger asChild><Button variant="secondary" className="w-full justify-between">Your checklist ({service ? preview.length : 0}) <ChevronRight className="size-4" /></Button></DialogTrigger>
          <DialogContent className="max-w-md"><DialogTitle className="sr-only">Your checklist</DialogTitle><ChecklistPreview docs={preview} hasService={!!service} /></DialogContent>
        </Dialog>
      </div>
    </BookingShell>
  );
}

function ChecklistPreview({ docs, hasService }: { docs: ReturnType<typeof previewChecklist>; hasService: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-sheet">
      <div className="bg-surface-2 p-3 px-4">
         <p className="text-xs font-medium leading-6 text-muted-foreground">Your checklist so far</p>
         <p className="t-card text-deep-ink">
           <span className="tabular">{hasService ? docs.length : 0}</span> document{hasService && docs.length === 1 ? "" : "s"}
        </p>
      </div>
       {hasService ? <><div className="max-h-[440px] overflow-y-auto px-4 pt-4"><DocumentStack docs={[...docs].reverse().map((d) => ({ ...d, received: false }))} /></div>
       <p className="px-4 pb-6 pt-4 text-xs text-muted-foreground">You'll upload these after booking. They never hold up your appointment.</p></> : <p className="px-4 py-8 text-sm text-muted-foreground">Pick a service to start your checklist.</p>}
    </div>
  );
}

/* ---------- Step 1: service ---------- */
function ServiceStep({ services, selected, onPick }: { services: ReturnType<typeof useServices>; selected?: string | undefined; onPick: (slug: string) => void }) {
  return (
    <>
       <StepTitle hideEyebrow eyebrow="Step 1 of 4" title="What can Claire help with?" sub="Pick the closest fit. You can add details in the next step." />
      <div className="mb-6 text-sm text-muted-foreground">
        Already booked, or booking again? <Link to="/book/returning" className="font-medium text-ink underline underline-offset-4">Get your private link</Link>
      </div>
       {services.isLoading && <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>}
      {services.isError && (
        <div className="rounded-2xl bg-surface-2 p-6 text-sm">
          We couldn't load the services. <button className="font-medium text-ink underline" onClick={() => services.refetch()}>Try again</button>
        </div>
      )}
       <div className="grid gap-3 sm:grid-cols-2">
        {services.data?.map((s) => {
          const active = s.slug === selected;
          return (
             <button
              key={s.id}
              type="button"
              onClick={() => onPick(s.slug)}
              aria-pressed={active}
              className={`flex min-h-36 w-full flex-col rounded-2xl border bg-sheet p-4 text-left transition-colors duration-150 ${active ? "border-deep-ink ring-1 ring-deep-ink" : "border-border hover:bg-surface-2"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <ServiceIcon service={s.slug} size={40} />
                <span className={`mt-1 size-4 shrink-0 rounded-full border ${active ? "border-[5px] border-deep-ink" : "border-border bg-sheet"}`} />
              </div>
              <h2 className="mt-3 t-card text-deep-ink">{s.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                <span className="tabular text-muted-foreground">{s.duration_min} min</span>
                <span className="text-deep-ink">
                  {s.is_from_price && <span className="mr-1 text-xs text-muted-foreground">from</span>}
                  <span className="tabular text-base font-semibold">${Number(s.price_from)}</span>
                </span>
              </div>
             </button>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">No payment now. The fee is paid when your return is filed.</p>
    </>
  );
}

/* ---------- Step 2: questions ---------- */
function QuestionsStep({ slug, answers, onChange }: { slug?: string | undefined; answers: Answers; onChange: (a: Answers) => void }) {
  const qs = questionsFor(slug);
  const set = (k: keyof Answers, v: boolean | number) => onChange({ ...answers, [k]: v });

  return (
    <>
       <StepTitle hideEyebrow eyebrow="Step 2 of 4" title="A few quick questions" sub="This builds your personal checklist, so you'll know exactly what to bring." />
      <div className="space-y-3">
         {qs.map((q) => (
          <div key={q.key} className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-deep-ink">{q.label}</p>
              {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
            </div>
            {q.type === "count" ? (
              <div className="flex h-10 shrink-0 items-center gap-1 rounded-lg bg-fill-neutral px-1">
                <button aria-label="Fewer" onClick={() => set(q.key, Math.max(0, ((answers[q.key] as number) ?? 0) - 1))} className="grid size-8 place-items-center rounded-md transition-colors duration-150 hover:bg-fill-selected">
                  <Minus className="size-3.5" />
                </button>
                <span className="tabular w-6 text-center text-xs font-semibold">{(answers[q.key] as number) ?? 0}</span>
                <button aria-label="More" onClick={() => set(q.key, Math.min(6, ((answers[q.key] as number) ?? 0) + 1))} className="grid size-8 place-items-center rounded-md transition-colors duration-150 hover:bg-fill-selected">
                  <Plus className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-8 shrink-0 gap-1 rounded-lg bg-fill-neutral p-1" role="radiogroup" aria-label={q.label}>
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    role="radio"
                    aria-checked={answers[q.key] === v}
                    onClick={() => set(q.key, v)}
                     className={`h-6 min-w-14 rounded-md px-4 text-xs font-semibold transition-colors duration-150 ${answers[q.key] === v ? "bg-fill-selected text-deep-ink" : "text-muted-foreground hover:text-deep-ink"}`}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Step 3: time ---------- */
function TimeStep({ service, draft, update }: { service: Service; draft: BookingDraft; update: (p: Partial<BookingDraft>) => void }) {
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
        <StepTitle hideEyebrow eyebrow="Step 3 of 4" title="Pick a time" sub={`${service.name}, ${service.duration_min} minutes. All times Eastern.`} />
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
          {firstOpen && (() => {
            const fd = days.find((d) => d.date === firstOpen)!;
            const first = fd.slots[0]!;
            const picked = draft.slot === first;
            return (
              <button type="button" onClick={() => update({ date: fd.date, slot: first })}
                className={`mb-4 flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 sm:w-auto sm:min-w-[320px] ${picked ? "border-deep-ink bg-surface-2" : "border-border bg-sheet hover:bg-surface-2"}`}>
                <span><span className="block text-xs text-muted-foreground">Next available</span><span className="block text-sm font-medium text-deep-ink">{fmtDateLong(first)}, {fmtTime(first)}</span></span>
                <span className="text-xs font-medium text-ink">{picked ? "Selected" : "Pick this"}</span>
              </button>
            );
          })()}
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
                 return slots.length ? <div key={period}><h2 className="mb-2 text-sm font-medium text-deep-ink">{period}</h2><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map((s) => (
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
      <p className="t-card text-deep-ink">Full — join the waitlist</p>
      <p className="mt-1 text-sm text-deep-ink/70">{c.dow} {c.month} {c.day} is fully booked. We'll email you if a spot opens.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
        <Input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
      </div>
      {state === "error" && <p className="mt-2 text-sm text-destructive">Something went wrong. Please try again.</p>}
      <Button type="submit" variant="highlight" className="mt-4" disabled={state === "saving"}>
        {state === "saving" && <Loader2 className="" />} Join the waitlist
      </Button>
    </form>
  );
}

/* ---------- Step 4: details + book ---------- */
function BookingSummary({ service, draft, onPickAgain }: { service: Service; draft: BookingDraft; onPickAgain: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-sheet p-4">
    <div className="min-w-0"><p className="font-medium text-deep-ink">{service.name}</p><p className="text-sm text-muted-foreground">{draft.slot && `${fmtDateLong(draft.slot)}, ${fmtTime(draft.slot)}`}, {draft.meetingType === "video" ? "Video call" : "In person"}</p></div>
    <Button variant="secondary" onClick={onPickAgain}>Change</Button>
  </div>;
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
        phone: draft.phone.trim() || undefined, meetingType: draft.meetingType, intake: toIntakePayload(service.slug, draft.answers),
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
       <StepTitle hideEyebrow eyebrow="Step 4 of 4" title="Your details" sub="So we can send your confirmation and checklist." />
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
          <Lock className="mt-0.5 size-3.5 shrink-0" /> We'll never ask for your Social Security number online. Confirmed instantly, no payment now.
        </p>
      </form>
    </>
  );
}
