import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarDays, Check, FileText, LockKeyhole, Search, ShieldCheck, Star, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { DocumentStack } from "@/components/brand/DocumentStack";
import { AnnouncementBar, SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SERVICES } from "@/lib/services";
import { previewChecklist, fmtDateLong, fmtTime, type Answers } from "@/lib/intake";
import { getAvailabilityWindow } from "@/lib/booking.functions";
import { supabase } from "@/integrations/supabase/client";
import { writeDraft, emptyDraft } from "@/lib/booking-store";
import priyaPortrait from "@/assets/priya-portrait.jpg";

const TITLE = "Patel Tax & Bookkeeping — Taxes, done once";
const DESC = "Book with Priya Patel, EA in Edison, NJ. Get a personal document checklist and arrive ready to file once.";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: TITLE }, { name: "description", content: DESC }, { property: "og:title", content: TITLE }, { property: "og:description", content: DESC }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Home,
});
const TILES = ["bg-evergreen-tint text-evergreen", "bg-[var(--info-tint)] text-[var(--info)]", "bg-[var(--warning-tint)] text-warning", "bg-[var(--danger-tint)] text-destructive", "bg-control text-deep-ink"];
const SITUATIONS: { label: string; key: keyof Answers; value: number | boolean }[] = [
  { label: "W-2 job", key: "w2_count", value: 1 }, { label: "Freelance income", key: "freelance", value: true },
  { label: "Mortgage", key: "mortgage", value: true }, { label: "Student loans", key: "student_loans", value: true },
  { label: "Kids or childcare", key: "dependents", value: true }, { label: "Rental property", key: "rental", value: true },
  { label: "IRS letter", key: "irs_letter", value: true },
];
function Home() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>({});
  const [service, setService] = useState("");
  const [search, setSearch] = useState("");
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const opening = useQuery({
    queryKey: ["home-opening"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id").eq("slug", "individual").eq("active", true).maybeSingle();
      if (!data) return null;
      const result = await fetchWindow({ data: { serviceId: data.id, days: 14 } });
      const day = result.days?.find((d) => d.slots.length);
      return day ? { time: day.slots[0], count: result.days?.reduce((n, d) => n + d.slots.length, 0) ?? 0 } : null;
    }, staleTime: 60_000,
  });
  const docs = previewChecklist(service || "individual", answers);
  const goBook = (slug?: string) => {
    const selected = slug || service || SERVICES.find((s) => s.name.toLowerCase().includes(search.toLowerCase()) && search.trim())?.id || "individual";
    writeDraft({ ...emptyDraft, serviceSlug: selected, answers });
    navigate({ to: "/book", search: { service: selected } });
  };
  const toggle = (key: keyof Answers, value: boolean | number) => setAnswers((a) => ({ ...a, [key]: a[key] === value ? (typeof value === "number" ? 0 : false) : value }));
  const reviews = [
    { quote: "I uploaded everything the week before and my appointment took forty minutes. First year I didn't have to come back.", name: "Anita R.", place: "Edison" },
    { quote: "Priya untangled three years of 1099s from my design work and explained every line. I finally understand my taxes.", name: "Marcus L.", place: "Metuchen" },
    { quote: "The checklist for my rental was spot on. She caught a depreciation item my old preparer missed for years.", name: "Deepa & Raj S.", place: "Iselin" },
  ];
  const faq = [
    { q: "What should I bring?", a: "After you book, you'll get a checklist made for your return. Upload documents ahead of time and Priya will confirm everything is there." },
    { q: "Video call or in person?", a: "Whichever you prefer. Both work the same way: documents are uploaded beforehand, and we go through your return together." },
    { q: "Can I reschedule?", a: "Of course. Use the link in your confirmation email to pick a new time. If you can't make it, let us know so someone waiting can take your slot." },
    { q: "Can you file an extension for me?", a: "Yes. An extension gives you until October 15 to file, but any tax owed is still due in April." },
    { q: "What are the key deadlines?", a: "Most individual returns are due April 15. Extended returns are due October 15. Estimated taxes are due in April, June, September and January." },
  ];
  return <div className="min-h-screen bg-canvas pb-16 md:pb-0">
    <AnnouncementBar /><SiteHeader />
    <main className="mx-auto max-w-[1152px] space-y-4 px-2 py-3 sm:px-4 sm:py-4">
      <Panel className="px-5 py-12 text-center sm:px-10 sm:py-20">
        <h1 className="text-4xl font-semibold leading-tight text-deep-ink sm:text-[52px] sm:leading-[1.08]">Taxes, done once.</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-graphite sm:text-lg">Book in two minutes. We tell you exactly what to bring and check it before you arrive.</p>
        <div className="mx-auto mt-9 flex max-w-2xl items-center gap-2 rounded-full border border-line bg-paper p-2 shadow-[var(--shadow-1)]">
          <Search className="ml-3 size-5 shrink-0 text-graphite" />
          <input aria-label="What do you need help with?" placeholder="What do you need help with?" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") goBook(); }} className="min-w-0 flex-1 bg-transparent px-1 text-sm text-deep-ink outline-none placeholder:text-graphite sm:text-base" />
          <Button className="shrink-0 rounded-full max-sm:px-3" onClick={() => goBook()}>Find a time</Button>
        </div>
        <div className="mx-auto mt-8 flex max-w-3xl gap-4 overflow-x-auto pb-3 sm:justify-center" aria-label="Services">
          {SERVICES.map((s, i) => <Button key={s.id} variant="ghost" onClick={() => goBook(s.id)} className="group h-auto w-[112px] shrink-0 flex-col gap-2 whitespace-normal p-1 text-center text-xs font-medium text-deep-ink sm:w-[132px]">
            <span className={`grid size-14 place-items-center rounded-[14px] transition-transform group-hover:scale-105 ${TILES[i]}`}><FileText className="size-6" strokeWidth={1.5} /></span><span className="min-h-9 leading-tight">{s.name}</span>
          </Button>)}
        </div>
        <p className="mt-3 text-sm text-graphite" aria-live="polite">{opening.data?.time ? `Next opening ${fmtDateLong(opening.data.time)} at ${fmtTime(opening.data.time)}.` : opening.isLoading ? "Checking the next opening…" : "Choose a service to see available times."}</p>
        <p className="mt-3 text-xs text-graphite">Confirmed instantly. No payment until you file.</p>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="min-w-0"><h2 className="text-2xl font-semibold">Build your checklist</h2><p className="mt-2 text-sm text-graphite">Choose what applies to you. We'll put together what to bring.</p>
          <div className="mt-6 flex flex-wrap gap-2 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-3">
            {SITUATIONS.map((s) => <Button key={s.label} variant="neutral" aria-pressed={answers[s.key] === s.value} onClick={() => toggle(s.key, s.value)} className={`h-9 shrink-0 rounded-full px-4 text-sm ${answers[s.key] === s.value ? "bg-evergreen-tint text-evergreen" : ""}`}>{answers[s.key] === s.value && <Check className="size-3.5" />}{s.label}</Button>)}
          </div><p className="mt-6 text-sm text-graphite">You can adjust this when you book.</p>
        </Panel>
        <Panel className="min-w-0"><div className="flex items-center gap-5"><ReadyRing value={Math.min(100, Math.max(0, (Object.values(answers).filter(Boolean).length / 7) * 100))} size={128} stroke={9} /><div><h2 className="text-2xl font-semibold">Your document list</h2><p className="text-sm text-graphite">{docs.length} document{docs.length === 1 ? "" : "s"} so far</p></div></div>
          <div className="mt-6 max-h-[280px] overflow-y-auto"><DocumentStack docs={docs.map((d) => ({ ...d, received: false }))} /></div>
          <Button className="mt-6 w-full" onClick={() => goBook()}>Book with this checklist</Button>
        </Panel>
      </div>
      <Panel id="how" className="scroll-mt-24"><h2 className="text-3xl font-semibold">How it works</h2><div className="mt-8 grid gap-8 md:grid-cols-3">{[
        { title: "Book a time", body: "Pick a service and a time that suits you. You're confirmed on the spot.", icon: CalendarDays },
        { title: "Upload your documents", body: "You get a short checklist for your return. Add documents whenever you have them.", icon: FileText },
        { title: "Arrive ready", body: "Priya reviews everything beforehand, so your appointment is the only one you need.", icon: Check },
      ].map((step, i) => <div key={step.title}><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-evergreen-tint text-sm font-semibold text-evergreen">{i+1}</span><step.icon className="size-5 text-evergreen" /></div><h3 className="mt-4 text-xl font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-graphite">{step.body}</p></div>)}</div></Panel>
      <Panel id="services" className="scroll-mt-24"><h2 className="text-3xl font-semibold">Services and pricing</h2><p className="mt-2 text-graphite">Fees are paid when your return is filed. Nothing is charged at booking.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{SERVICES.map((s, i) => <Link key={s.id} to="/book" search={{ service: s.id }} className={`flex min-w-0 items-center gap-4 rounded-[14px] border border-line p-4 transition-colors hover:bg-control ${i === 4 ? "sm:col-span-2" : ""}`}><span className={`grid size-12 shrink-0 place-items-center rounded-xl ${TILES[i]}`}><FileText className="size-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-semibold text-deep-ink">{s.name}</strong><span className="block text-xs text-graphite">{s.blurb}</span></span><span className="shrink-0 text-right text-sm font-semibold text-deep-ink">{s.from && <small className="block font-normal text-graphite">from</small>}${s.price}<small className="block font-normal text-graphite">{s.minutes} min</small></span></Link>)}</div></Panel>
      <Panel id="about" className="scroll-mt-24"><div className="grid items-center gap-8 md:grid-cols-[220px_1fr]"><img src={priyaPortrait} alt="Portrait representing Priya Patel in her office" loading="lazy" width={1024} height={1280} className="aspect-[4/5] w-full max-w-[240px] rounded-[14px] object-cover" /><div><h2 className="text-3xl font-semibold">Priya Patel</h2><p className="mt-1 text-evergreen">IRS Enrolled Agent</p><div className="mt-6 flex flex-wrap gap-6 text-sm"><span><strong className="block text-xl">12</strong> years in Edison</span><span><strong className="block text-xl">1,800+</strong> returns</span><span><strong className="block text-xl">4.9</strong> rating</span></div><p className="mt-6 max-w-2xl leading-7 text-graphite">I'm licensed to prepare returns and represent you before the IRS. My practice is small on purpose: when you book with me, you work with me, from the first document to the final signature.</p></div></div></Panel>
      <Panel id="reviews" className="scroll-mt-24"><div className="flex items-center gap-3"><Star className="size-5 text-evergreen" /><h2 className="text-3xl font-semibold">4.9 from our clients</h2></div><div className="mt-8 grid gap-8 md:grid-cols-3">{reviews.map((r) => <blockquote key={r.name} className="border-t border-line pt-5"><p className="text-base leading-7">“{r.quote}”</p><footer className="mt-4 text-sm text-graphite">{r.name}, {r.place}</footer></blockquote>)}</div></Panel>
      <Panel><h2 className="text-3xl font-semibold">Your documents are safe</h2><div className="mt-8 grid gap-6 sm:grid-cols-2">{[
        { icon: LockKeyhole, title: "Private by default", body: "Only Priya can open your files." }, { icon: ShieldCheck, title: "Short-lived access", body: "File links expire within minutes." },
        { icon: UserRound, title: "No Social Security number", body: "We never ask for it online." }, { icon: Wallet, title: "Only what's needed", body: "Upload what's on your checklist, nothing more." },
      ].map((p) => <div key={p.title} className="flex gap-3"><p.icon className="size-5 shrink-0 text-evergreen" /><div><h3 className="font-semibold">{p.title}</h3><p className="mt-1 text-sm text-graphite">{p.body}</p></div></div>)}</div></Panel>
      <Panel id="faq" className="scroll-mt-24"><h2 className="text-3xl font-semibold">Good to know</h2><Accordion type="single" collapsible className="mt-6">{faq.map((f) => <AccordionItem key={f.q} value={f.q}><AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger><AccordionContent className="text-sm leading-6 text-graphite">{f.a}</AccordionContent></AccordionItem>)}</Accordion></Panel>
    </main><SiteFooter />
    <div className="fixed inset-x-2 bottom-2 z-30 rounded-[16px] bg-paper p-2 shadow-[var(--shadow-3)] md:hidden"><Button asChild className="w-full"><Link to="/book">Book</Link></Button></div>
  </div>;
}
