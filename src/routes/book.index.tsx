import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Minus, Plus, Video, Users, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentStack } from "@/components/brand/DocumentStack";
import { BookingShell, StepTitle } from "@/components/booking/BookingShell";
import { useBookingDraft, clearDraft, type BookingDraft } from "@/lib/booking-store";
import { bookAppointment, getAvailabilityWindow, joinWaitlist, saveLead } from "@/lib/booking.functions";
import { getLeadDraft } from "@/lib/automations.functions";
import { fmtDateLong, fmtDayChip, fmtTime, previewChecklist, questionsFor, toIntakePayload, type Answers } from "@/lib/intake";

export const Route = createFileRoute("/book/")({
  validateSearch: z.object({ service: z.string().optional(), step: z.number().int().min(0).max(3).optional(), resume: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Book an appointment — Patel Tax & Bookkeeping" },
      { name: "description", content: "Book with Priya Patel, EA in about two minutes. Confirmed instantly, with a personal document checklist." },
      { property: "og:title", content: "Book an appointment — Patel Tax & Bookkeeping" },
      { property: "og:description", content: "Pick a service and a time. Confirmed instantly." },
    ],
  }),
  component: BookPage,
});

type Service = { id: string; name: string; slug: string; duration_min: number; price_from: number; is_from_price: boolean; description: string | null };
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

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
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  useEffect(() => {
    if (!loaded) return;
    const id = window.setTimeout(() => document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true }), reduce ? 0 : 380);
    return () => window.clearTimeout(id);
  }, [step, loaded, reduce]);

  const preview = useMemo(() => previewChecklist(draft.serviceSlug, draft.answers), [draft.serviceSlug, draft.answers]);

  if (!loaded) {
    return <BookingShell step={0}><div className="h-64 animate-pulse rounded-2xl bg-sheet/60" /></BookingShell>;
  }

  return (
    <BookingShell step={step}>
      <div className={`grid gap-10 ${step === 1 || step === 2 ? "lg:grid-cols-[1fr_320px]" : ""}`}>
        <div className="min-w-0">
          {step > 0 && (
            <button onClick={() => go(step - 1)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
              <ArrowLeft className="size-4" /> Back
            </button>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <ServiceStep
                  services={services}
                  selected={draft.serviceSlug}
                  onPick={(slug) => {
                    if (slug !== draft.serviceSlug) update({ serviceSlug: slug, slot: undefined, date: undefined });
                    go(1);
                  }}
                />
              )}
              {step === 1 && (
                <QuestionsStep slug={draft.serviceSlug} answers={draft.answers} onChange={(answers) => update({ answers })} onDone={() => go(2)} count={preview.length} />
              )}
              {step === 2 && service && <TimeStep service={service} draft={draft} update={update} onDone={() => go(3)} />}
              {step === 3 && service && <DetailsStep service={service} draft={draft} update={update} onPickAgain={() => go(2)} />}
            </motion.div>
          </AnimatePresence>
        </div>
        {(step === 1 || step === 2) && (
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <ChecklistPreview docs={preview} />
            </div>
          </aside>
        )}
      </div>
    </BookingShell>
  );
}

function ChecklistPreview({ docs }: { docs: ReturnType<typeof previewChecklist> }) {
  return (
    <div className="sheet-stack ledger p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Your checklist so far</p>
      <p className="mt-1 font-serif text-3xl text-deep-ink">
        <span className="tabular">{docs.length}</span> document{docs.length === 1 ? "" : "s"}
      </p>
      <div className="mt-4 max-h-[440px] overflow-y-auto pr-1">
        <DocumentStack docs={[...docs].reverse().map((d) => ({ ...d, received: false }))} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">You'll upload these after booking. They never hold up your appointment.</p>
    </div>
  );
}

/* ---------- Step 1: service ---------- */
function ServiceStep({ services, selected, onPick }: { services: ReturnType<typeof useServices>; selected?: string | undefined; onPick: (slug: string) => void }) {
  return (
    <>
      <StepTitle eyebrow="Step 1 of 4" title="What can Priya help with?" sub="Pick the closest fit. You can add details in the next step." />
      <div className="mb-6 text-sm text-muted-foreground">
        Booked with us before? <Link to="/book/returning" className="font-medium text-ink underline underline-offset-4">Use the 30-second returning client path</Link>
      </div>
      {services.isLoading && <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-sheet/70" />)}</div>}
      {services.isError && (
        <div className="rounded-2xl border border-border bg-sheet p-6 text-sm">
          We couldn't load the services. <button className="font-medium text-ink underline" onClick={() => services.refetch()}>Try again</button>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {services.data?.map((s) => {
          const active = s.slug === selected;
          return (
            <button
              key={s.id}
              onClick={() => onPick(s.slug)}
              className={`sheet-stack group p-5 text-left transition-transform duration-300 hover:-translate-y-0.5 ${active ? "ring-2 ring-ink" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl leading-tight text-deep-ink">{s.name}</h2>
                <span className={`mt-1 size-4 shrink-0 rounded-full border ${active ? "border-[5px] border-ink" : "border-border"}`} />
              </div>
              <p className="mt-1 text-sm text-deep-ink/70">{s.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="tabular text-muted-foreground">{s.duration_min} min</span>
                <span className="text-deep-ink">
                  {s.is_from_price && <span className="mr-1 text-xs text-muted-foreground">from</span>}
                  <span className="tabular font-serif text-2xl">${Number(s.price_from)}</span>
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
function QuestionsStep({ slug, answers, onChange, onDone, count }: { slug?: string | undefined; answers: Answers; onChange: (a: Answers) => void; onDone: () => void; count: number }) {
  const qs = questionsFor(slug);
  const pages = Math.ceil(qs.length / 4);
  const [page, setPage] = useState(0);
  const visible = qs.slice(page * 4, page * 4 + 4);
  const answered = visible.every((q) => q.type === "count" || typeof answers[q.key] === "boolean");
  const set = (k: keyof Answers, v: boolean | number) => onChange({ ...answers, [k]: v });

  return (
    <>
      <StepTitle eyebrow="Step 2 of 4" title="A few quick questions" sub="This builds your personal checklist, so you'll know exactly what to bring." />
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-sm text-ink lg:hidden">
        Your checklist so far: <span className="tabular font-medium">{count} documents</span>
      </div>
      <div className="space-y-3">
        {visible.map((q) => (
          <div key={q.key} className="flex flex-col gap-3 rounded-2xl border border-border bg-sheet p-4 shadow-sheet sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-deep-ink">{q.label}</p>
              {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
            </div>
            {q.type === "count" ? (
              <div className="flex shrink-0 items-center gap-3">
                <button aria-label="Fewer" onClick={() => set(q.key, Math.max(0, ((answers[q.key] as number) ?? 0) - 1))} className="grid size-9 place-items-center rounded-full border border-border hover:border-ink">
                  <Minus className="size-4" />
                </button>
                <span className="tabular w-6 text-center font-serif text-2xl">{(answers[q.key] as number) ?? 0}</span>
                <button aria-label="More" onClick={() => set(q.key, Math.min(6, ((answers[q.key] as number) ?? 0) + 1))} className="grid size-9 place-items-center rounded-full border border-border hover:border-ink">
                  <Plus className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex shrink-0 gap-2" role="radiogroup" aria-label={q.label}>
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    role="radio"
                    aria-checked={answers[q.key] === v}
                    onClick={() => set(q.key, v)}
                    onKeyDown={(e) => {
                      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) {
                        e.preventDefault();
                        const next = !v;
                        set(q.key, next);
                        e.currentTarget.parentElement?.querySelector<HTMLElement>(`[aria-checked="${next}"]`)?.focus();
                      }
                    }}
                    className={`h-10 min-w-16 rounded-full border px-4 text-sm font-medium transition-colors ${answers[q.key] === v ? "border-ink bg-ink text-paper" : "border-border bg-transparent text-deep-ink hover:border-ink"}`}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-3">
        {page > 0 && <Button variant="outline" size="lg" onClick={() => setPage(page - 1)}>Previous</Button>}
        <Button size="lg" disabled={!answered} onClick={() => (page < pages - 1 ? setPage(page + 1) : onDone())}>
          Continue <ArrowRight />
        </Button>
        {pages > 1 && <span className="tabular text-xs text-muted-foreground">{page + 1} / {pages}</span>}
      </div>
    </>
  );
}

/* ---------- Step 3: time ---------- */
function TimeStep({ service, draft, update, onDone }: { service: Service; draft: BookingDraft; update: (p: Partial<BookingDraft>) => void; onDone: () => void }) {
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const q = useQuery({ queryKey: ["availability", service.id], queryFn: () => fetchWindow({ data: { serviceId: service.id, days: 14 } }), staleTime: 30_000 });
  const days = q.data?.days ?? [];
  const firstOpen = days.find((d) => d.slots.length)?.date;
  const selDate = draft.date && days.some((d) => d.date === draft.date) ? draft.date : firstOpen;
  const day = days.find((d) => d.date === selDate);

  return (
    <>
      <StepTitle eyebrow="Step 3 of 4" title="Pick a time" sub={`${service.name} · ${service.duration_min} minutes. All times Eastern.`} />
      <div className="mb-6 inline-flex rounded-full border border-border bg-sheet p-1" role="radiogroup" aria-label="Meeting type">
        {([["in_person", "In person", Users], ["video", "Video call", Video]] as const).map(([v, label, Icon]) => (
          <button key={v} role="radio" aria-checked={draft.meetingType === v} onClick={() => update({ meetingType: v })}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${draft.meetingType === v ? "bg-ink text-paper" : "text-deep-ink hover:bg-sage"}`}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {q.isLoading && <div className="space-y-4"><div className="h-20 animate-pulse rounded-2xl bg-sheet/70" /><div className="h-48 animate-pulse rounded-2xl bg-sheet/70" /></div>}
      {(q.isError || q.data?.error) && (
        <div className="rounded-2xl border border-border bg-sheet p-6 text-sm">
          {q.data?.error ?? "We couldn't load times."} <button className="font-medium text-ink underline" onClick={() => q.refetch()}>Try again</button>
        </div>
      )}

      {days.length > 0 && (
        <>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2" role="listbox" aria-label="Choose a day">
            {days.map((d) => {
              const c = fmtDayChip(d.date);
              const active = d.date === selDate;
              const full = !d.closed && d.slots.length === 0;
              return (
                <button key={d.date} disabled={d.closed} onClick={() => update({ date: d.date, slot: undefined })} role="option" aria-selected={active}
                  className={`flex w-[76px] shrink-0 flex-col items-center rounded-2xl border px-2 py-2.5 transition-colors ${
                    active ? "border-ink bg-ink text-paper" : d.closed ? "border-transparent text-muted-foreground/50" : "border-border bg-sheet hover:border-ink"}`}>
                  <span className="text-[11px] uppercase tracking-wider opacity-70">{c.dow}</span>
                  <span className="tabular font-serif text-2xl leading-tight">{c.day}</span>
                  <span className={`text-[10px] ${full && !active ? "text-warning" : "opacity-70"}`}>{d.closed ? "Closed" : full ? "Full" : c.month}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {day && day.slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {day.slots.map((s) => (
                  <button key={s} onClick={() => { update({ date: day.date, slot: s }); onDone(); }}
                    className={`tabular h-11 rounded-xl border text-sm font-medium transition-all hover:-translate-y-0.5 ${draft.slot === s ? "border-ink bg-ink text-paper" : "border-border bg-sheet text-deep-ink hover:border-ink"}`}>
                    {fmtTime(s)}
                  </button>
                ))}
              </div>
            )}
            {day && !day.closed && day.slots.length === 0 && <WaitlistPanel service={service} date={day.date} draft={draft} />}
            {!firstOpen && !draft.date && (
              <p className="rounded-2xl border border-border bg-sheet p-6 text-sm text-deep-ink/80">The next two weeks are fully booked. Pick a day above to join its waitlist.</p>
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
    return <div className="rounded-2xl border border-border bg-sheet p-6"><p className="font-serif text-2xl text-deep-ink">You're on the list.</p><p className="mt-1 text-sm text-deep-ink/70">If a {c.dow} slot opens, we'll email you first.</p></div>;
  }
  return (
    <form
      className="rounded-2xl border border-border bg-sheet p-5 shadow-sheet"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        try { const r = await join({ data: { serviceId: service.id, name, email, date } }); setState(r.ok ? "done" : "error"); } catch { setState("error"); }
      }}
    >
      <p className="font-serif text-2xl text-deep-ink">Full — join the waitlist</p>
      <p className="mt-1 text-sm text-deep-ink/70">{c.dow} {c.month} {c.day} is fully booked. We'll email you if a spot opens.</p>
       <div className="mt-4 grid gap-3 sm:grid-cols-2">
         <Input required aria-label="Your name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-paper" />
         <Input required aria-label="Email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-paper" />
      </div>
       {state === "error" && <p className="mt-2 text-sm text-destructive" role="alert">Something went wrong. Please try again.</p>}
      <Button type="submit" variant="highlight" className="mt-4" disabled={state === "saving"}>
        {state === "saving" && <Loader2 className="animate-spin" />} Join the waitlist
      </Button>
    </form>
  );
}

/* ---------- Step 4: details + book ---------- */
function DetailsStep({ service, draft, update, onPickAgain }: { service: Service; draft: BookingDraft; update: (p: Partial<BookingDraft>) => void; onPickAgain: () => void }) {
  const navigate = useNavigate();
  const book = useServerFn(bookAppointment);
  const lead = useServerFn(saveLead);
  const [busy, setBusy] = useState(false);
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
      <StepTitle eyebrow="Step 4 of 4" title="Your details" sub="So we can send your confirmation and checklist." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-sage/60 p-4">
        <div className="min-w-0">
          <p className="font-medium text-deep-ink">{service.name}</p>
          <p className="text-sm text-deep-ink/70">{draft.slot && `${fmtDateLong(draft.slot)} · ${fmtTime(draft.slot)}`} · {draft.meetingType === "video" ? "Video call" : "In person"}</p>
        </div>
        <button onClick={onPickAgain} className="text-sm font-medium text-ink underline underline-offset-4">Change</button>
      </div>

      <form className="max-w-md space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid && draft.slot) submit(draft.slot); }}>
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
                    <button key={a} type="button" disabled={busy} onClick={() => { update({ slot: a }); submit(a); }}
                      className="tabular rounded-full border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-paper">
                      {fmtDayChip(new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(a))).dow} {fmtTime(a)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button type="button" onClick={onPickAgain} className="mt-2 text-sm font-medium text-ink underline">Pick another time</button>
            )}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!valid || busy}>
          {busy ? <Loader2 className="animate-spin" /> : null} Book my appointment
        </Button>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" /> We'll never ask for your Social Security number online. Confirmed instantly, no payment now.
        </p>
      </form>
    </>
  );
}
