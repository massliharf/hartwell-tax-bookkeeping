import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Lock, ShieldCheck, Trash2, Video, MapPin, Clock, ArrowUpRight, CreditCard, MapPinned, Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HeroVisual } from "@/components/site/HeroVisual";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { AskForm } from "@/components/site/AskForm";
import { GROUPS, SERVICES } from "@/lib/services";
import claire from "@/assets/claire-portrait.jpg";




const TITLE = "Hartwell Tax & Bookkeeping — Tax preparation in Montclair, NJ";
const DESC = "Tax preparation in Montclair, NJ for families, freelancers, landlords and small businesses. See open times, schedule in two minutes, and file in one visit.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://hartwell-tax-bookkeeping.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://hartwell-tax-bookkeeping.lovable.app/og-image.jpg" },
    ],
  }),
  component: Home,
});


const panel = "rounded-[28px] bg-sheet";

function SectionHead({ title, sub, action, eyebrow }: { title: string; sub?: string; action?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 [&_h2]:text-balance">
      <div className="max-w-2xl">
        <h2 className="t-section text-deep-ink">{title}</h2>
        {sub && <p className="mt-2 text-sm leading-[22px] text-muted-foreground sm:text-base sm:leading-6">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-paper-warm">
      <SiteHeader warm />
      <main className="mx-auto max-w-6xl space-y-3 px-2 pb-6 sm:space-y-4 sm:px-5">
        <Hero />
        <HowItWorks />
        <Services />
        <Reviews />
        <About />
        <Privacy />
        <Year />
        <Faq />
        <DeadlineCta />
      </main>
      <SiteFooter />
    </div>
  );
}


function Hero() {
  return (
    <section className="overflow-hidden">
      <div className="grid items-center gap-10 px-2 pb-10 pt-10 sm:px-4 md:min-h-[530px] md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:pb-14 md:pt-16">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Hartwell Tax & Bookkeeping in Montclair, NJ</p>
          <h1 className="mt-5 max-w-[16ch] text-balance t-hero text-deep-ink md:!text-[56px] md:!leading-[58px]">Your tax return, done in one appointment.</h1>
          <p className="mt-6 max-w-[33rem] text-base leading-7 text-body sm:text-lg sm:leading-8">
            We prepare tax returns for families, freelancers, landlords and small businesses in Montclair, NJ. Choose a time online, upload your documents before you come in, and leave with your return done.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg"><Link to="/book">See available times</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/book" search={{ service: "intro" }}>Free 15-minute call</Link></Button>
          </div>
        </div>
        <div className="min-w-0 rounded-[28px] bg-surface-2 px-4 py-4 sm:px-8 sm:py-6"><HeroVisual /></div>
      </div>
    </section>
  );
}
function Year() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const peak = new Set([1, 2, 3, 9]);
  return (
    <section className="rounded-[28px] bg-ink px-5 py-12 text-primary-foreground sm:px-10 sm:py-16">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-16">
        <div>
          <p className="text-sm font-medium text-primary-foreground/70">When to book</p>
          <h2 className="t-section mt-3 max-w-[13ch] text-balance">Open all year. Busiest in spring and October.</h2>
        </div>
        <div className="min-w-0 border-t border-primary-foreground/25 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          <div className="space-y-0 divide-y divide-primary-foreground/20">
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 first:pt-0 sm:grid-cols-[7rem_1fr]">
              <span className="font-semibold text-primary-foreground">Feb–Apr</span>
              <p className="text-sm leading-6 text-primary-foreground/75">Tax season. Times fill up weeks ahead, so schedule early.</p>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 sm:grid-cols-[7rem_1fr]">
              <span className="font-semibold text-primary-foreground">Oct 15</span>
              <p className="text-sm leading-6 text-primary-foreground/75">Deadline for extended returns. If a day is full, join its waitlist.</p>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 last:pb-0 sm:grid-cols-[7rem_1fr]">
              <span className="font-semibold text-primary-foreground">All year</span>
              <p className="text-sm leading-6 text-primary-foreground/75">IRS letters, tax planning and bookkeeping, usually with openings the same week.</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-12 gap-1" aria-label="Busiest months">
            {months.map((month, i) => (
              <div key={month} className="min-w-0 text-center">
                <div className={`h-2 rounded-full ${peak.has(i) ? "bg-primary-foreground" : "bg-primary-foreground/20"}`} />
                <span className={`mt-2 block text-[10px] sm:text-xs ${peak.has(i) ? "font-semibold text-primary-foreground" : "text-primary-foreground/60"}`}><span className="sm:hidden">{month.slice(0, 1)}</span><span className="hidden sm:inline">{month}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function HowItWorks() {
  const steps = [
    { t: "Choose a time online", d: "Pick any available time. You're confirmed right away, no phone call needed." },
    { t: "Get your document checklist", d: "Answer a few yes-or-no questions and we'll list exactly which documents to bring." },
    { t: "Upload your documents", d: "Send them from your phone before your appointment. We check each one and tell you if anything is missing." },
    { t: "Go over your return with Claire", d: "In person or by video. Afterwards you sign and pay online, and we file your return with the IRS." },
  ];
  return (
    <section id="how" className={`${panel} scroll-mt-24 px-5 py-12 sm:px-10 sm:py-16`}>
      <div className="max-w-3xl">
        <h2 className="t-section text-balance text-deep-ink">How it works.</h2>
        <p className="mt-3 text-base leading-7 text-muted-foreground">Four steps, from choosing a time to your filed return. Most clients only need one appointment.</p>
      </div>
      <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((x, i) => (
          <li key={x.t} className="min-w-0">
            <span className="flex size-9 items-center justify-center rounded-full bg-ink text-sm font-semibold tabular-nums text-primary-foreground">{i + 1}</span>
            <h3 className="mt-5 text-lg font-semibold leading-snug text-deep-ink">{x.t}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{x.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
function Services() {
  const price = (x: (typeof SERVICES)[number]) => (x.price === 0 ? "Free" : `${x.from ? "from " : ""}$${x.price}`);
  return (
    <section id="services" className={`${panel} scroll-mt-24 px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="Services and prices." sub="Your price is agreed before any work starts. You pay when the work is done, not when you schedule." />
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <div key={g.id}>
            <h3 className="t-sub">{g.title}</h3>
            <ul className="mt-3 divide-y divide-line-1 overflow-hidden rounded-xl bg-surface-2">
              {SERVICES.filter((x) => x.group === g.id).map((x) => (
                <li key={x.id}>
                  <Link to="/book" search={{ service: x.id }} className="group grid grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-5 transition-colors duration-150 hover:bg-fill-selected focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring">
                    <ServiceIcon service={x.id} size={40} className="transition-transform duration-150 group-hover:scale-110" />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium text-deep-ink group-hover:underline group-hover:underline-offset-4">{x.name}</span>
                      <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{x.blurb}</span>
                      {x.note && <span className="mt-1 block text-xs text-muted-foreground">{x.note}</span>}
                    </span>
                    <span className="text-right">
                      <span className="tabular block text-[17px] font-semibold text-deep-ink">{price(x)}</span>
                      <span className="tabular block text-xs text-muted-foreground">{x.minutes} min</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Link to="/book" search={{ service: "intro" }} className="group mt-8 grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-xl bg-surface-2 px-4 py-5 transition-colors duration-150 hover:bg-fill-selected focus-visible:outline-2 focus-visible:outline-ring sm:grid-cols-[40px_minmax(0,1fr)_auto]">
        <ServiceIcon service="intro" size={40} className="transition-transform duration-150 group-hover:scale-110" />
        <span className="min-w-0 text-[15px] leading-6 text-deep-ink"><span className="font-semibold">Not sure which service you need?</span> Schedule a free 15-minute call and Claire will help you choose.</span>
        <span className="col-start-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink group-hover:underline group-hover:underline-offset-4 sm:col-start-3 sm:justify-self-end">Schedule a free call<ArrowUpRight className="size-4" /></span>
      </Link>
    </section>
  );
}
function About() {
  const creds = ["IRS Enrolled Agent", "IRS Authorized e-file Provider", "PTIN registered", "NATP member", "Federal, NJ and NY returns"];
  return (
    <section id="about" className={`${panel} scroll-mt-24 overflow-hidden`}>
      <div className="grid md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative min-h-[320px] md:min-h-full">
          <img src={claire} alt="Claire Hartwell, EA, in her office" width={800} height={1008} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="px-5 py-12 sm:px-10 sm:py-16">
          <h2 className="t-section text-deep-ink">Meet Claire Hartwell, EA.</h2>
          <p className="mt-4 max-w-[34rem] text-base leading-7 text-body">Claire has prepared tax returns in Montclair since 2014. As an IRS Enrolled Agent, she is licensed to prepare your return and to represent you if the IRS contacts you. You work with her directly, from your first document to your filed return.</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {creds.map((c) => <li key={c} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-1 px-3 text-xs font-medium text-deep-ink"><BadgeCheck className="size-3.5 text-success" />{c}</li>)}
          </ul>
          <div className="mt-8 flex gap-3 rounded-xl bg-surface-2 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-deep-ink" strokeWidth={1.75} />
            <div><p className="text-sm font-semibold text-deep-ink">Accuracy guarantee</p><p className="mt-0.5 text-sm text-muted-foreground">If we make a mistake on your return, we fix it and pay any penalty and interest it caused.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Every trust signal in one place: the rating and where it comes from, the track record, and what clients say. */
function Reviews() {
  const sources = [{ s: "Google", r: 4.9, n: 212 }, { s: "Yelp", r: 4.8, n: 64 }];
  const dist = [[5, 92], [4, 6], [3, 1], [2, 0], [1, 1]] as const;
  const record = [["1,800+", "returns filed since 2014"], ["640", "clients in Montclair and nearby"], ["98%", "come back the next year"]] as const;
  const reviews = [
    { name: "Anita R.", where: "Montclair", what: "Individual return", when: "March 2026", src: "Google", text: "I sent everything the week before. The appointment took forty minutes and I didn't have to come back." },
    { name: "Marcus L.", where: "Glen Ridge", what: "Self-employed", when: "April 2026", src: "Google", text: "Claire untangled three years of 1099s from my design work and explained every line. First year I understood my taxes." },
    { name: "Deepa and Raj S.", where: "Bloomfield", what: "Rental property", when: "February 2026", src: "Yelp", text: "The checklist for our rental was spot on. She caught a depreciation item our old preparer missed for years." },
    { name: "Tom B.", where: "Montclair", what: "IRS letter", when: "July 2026", src: "Google", text: "Got a scary notice in July. Booked the same week, and Claire had it sorted with one phone call to the IRS." },
    { name: "Olivia G.", where: "Verona", what: "Extension", when: "October 2025", src: "Google", text: "Booked at 10pm, two days before the deadline. Confirmed instantly, filed on time. No phone tag at all." },
    { name: "Sam C.", where: "Nutley", what: "Bookkeeping", when: "January 2026", src: "Yelp", text: "Set up simple books for my shop in an hour. Tax time this year was the easiest it's ever been." },
  ];
  const total = sources.reduce((n, x) => n + x.n, 0);
  return (
    <section id="reviews" className={`${panel} scroll-mt-24 px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="What clients say." />
      <div className="mt-10 grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
        <aside>
          <div className="flex items-end gap-3">
            <span className="tabular font-serif text-[56px] font-semibold leading-none tracking-[-0.03em] text-deep-ink">4.9</span>
            <div className="pb-1"><Stars /><p className="mt-1 text-xs text-muted-foreground">{total} reviews</p></div>
          </div>
          <ul className="mt-5 space-y-1.5">
            {dist.map(([star, pct]) => (
              <li key={star} className="grid grid-cols-[24px_1fr_36px] items-center gap-2 text-xs text-muted-foreground">
                <span className="tabular">{star}★</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-fill-neutral"><span className="block h-full rounded-full bg-[#E7AD16]" style={{ width: `${pct}%` }} /></span>
                <span className="tabular text-right">{pct}%</span>
              </li>
            ))}
          </ul>
          <ul className="mt-6 divide-y divide-line-1 border-y border-line-1">
            {sources.map((x) => (
              <li key={x.s} className="flex items-center justify-between py-2.5 text-sm"><span className="text-deep-ink">{x.s}</span><span className="tabular text-muted-foreground"><span className="font-semibold text-deep-ink">{x.r}</span> · {x.n} reviews</span></li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3">
            {record.map(([v, l]) => (
              <div key={l} className="flex items-baseline gap-3"><dt className="sr-only">{l}</dt><dd className="tabular w-16 shrink-0 text-lg font-semibold text-deep-ink">{v}</dd><dd className="text-sm text-muted-foreground">{l}</dd></div>
            ))}
          </dl>
        </aside>
        <ul className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.name} className="flex flex-col rounded-2xl bg-surface-2 p-5">
              <div className="flex items-center justify-between gap-2"><Stars /><span className="text-[11px] text-muted-foreground">{r.src}</span></div>
              <p className="mt-3 flex-1 text-[15px] leading-6 text-deep-ink">“{r.text}”</p>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div><p className="text-sm font-medium text-deep-ink">{r.name}</p><p className="text-xs text-muted-foreground">{r.where}, {r.what}</p></div>
                <p className="shrink-0 text-[11px] text-muted-foreground">{r.when}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Stars() {
  return <span className="inline-flex" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 fill-[#E7AD16] text-[#E7AD16]" />)}</span>;
}

function Privacy() {
  const points = [
    { icon: Lock, title: "Private storage", text: "Files are stored privately, not in email." },
    { icon: KeyRound, title: "Links that expire", text: "Files open only through a link that expires after a few minutes." },
    { icon: ShieldCheck, title: "No Social Security number online", text: "We never ask for your Social Security number online." },
    { icon: Trash2, title: "Only what's needed", text: "We only ask for the documents on your checklist." },
  ];
  return (
    <section className={`${panel} px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="Your documents are private." sub="Only Claire can open the files you upload." />
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {points.map((x) => (
          <li key={x.title} className="flex gap-3">
            <x.icon className="mt-0.5 size-5 shrink-0 text-deep-ink" strokeWidth={1.75} />
            <div><h3 className="text-[15px] font-medium text-deep-ink">{x.title}</h3><p className="mt-0.5 text-sm text-muted-foreground">{x.text}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
/** The closing call to action follows the season, so it's never out of date. */
function seasonCta(now = new Date()) {
  const m = now.getMonth(), d = now.getDate();
  if ((m === 8) || (m === 9 && d <= 15)) return { title: "The October 15 deadline is close.", body: "If you filed an extension, your return is due October 15. Schedule now, upload your documents this week, and we'll file on time.", cta: "Schedule an extension appointment", service: "extension" };
  if ((m >= 1 && m <= 2) || (m === 3 && d <= 15)) return { title: "April 15 is coming.", body: "Tax season is our busiest time. Schedule now and upload your documents as they arrive.", cta: "Schedule your tax return", service: "individual" };
  return { title: "Got a letter from the IRS?", body: "We usually have openings this week for IRS and state letters, tax planning, bookkeeping and past-year returns.", cta: "Schedule a letter review", service: "extension" };
}

function DeadlineCta() {
  const c = seasonCta();
  return (
     <section id="deadline" className="overflow-hidden rounded-2xl bg-ink-900 px-5 py-12 text-primary-foreground sm:px-10 sm:py-16">
      <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="t-section text-primary-foreground">{c.title}</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-primary-foreground/70 sm:text-base">{c.body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
          <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to="/book" search={{ service: c.service }}>{c.cta}</Link></Button>
          <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><a href="tel:+19735550142">Call (973) 555-0142</a></Button>
        </div>
      </div>
      <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/70">
        <li className="flex items-center gap-1.5"><MapPin className="size-3.5" />412 Bloomfield Avenue, Montclair</li>
        <li className="flex items-center gap-1.5"><Video className="size-3.5" />Video appointments available</li>
        <li className="flex items-center gap-1.5"><Clock className="size-3.5" />Mon to Fri 9 to 6, Sat 10 to 2</li>
      </ul>
    </section>
  );
}

function Faq() {
  const qs = [
    { q: "Are you open all year?", a: "Yes. February to mid-April and the weeks before October 15 are busiest, so schedule early then. The rest of the year there's usually an opening the same week." },
    { q: "What is an Enrolled Agent?", a: "A tax professional licensed by the IRS to prepare returns and to represent you in audits, collections and appeals." },
    { q: "How much will it cost?", a: "See the prices above. Your exact price is agreed before any work starts, and you pay when the work is done." },
    { q: "Do you do New York returns?", a: "Yes. If you work in New York, your non-resident return is included." },
    { q: "What should I bring?", a: "When you schedule, you answer a few questions and get a checklist of exactly what to bring. You can upload everything from your phone." },
    { q: "Video call or in person?", a: "Either. You choose when you schedule. Video calls work in your browser, no app needed." },
    { q: "Can I reschedule or cancel?", a: "Yes. Use the link in your confirmation email to move or cancel any time, no phone call needed." },
    { q: "What are the key deadlines?", a: "April 15 for most returns, October 15 for extended returns. Quarterly estimates are due in April, June, September and January." },
  ];
  return (
    <section id="faq" className={`${panel} grid scroll-mt-24 gap-8 px-5 py-12 sm:px-10 sm:py-16 md:grid-cols-[0.8fr_1.2fr]`}>
      <div className="self-start"><SectionHead title="Questions." sub="Can't find your answer? Send us a question, call (973) 555-0142 or email claire@hartwelltax.com." /><AskForm className="mt-6" /></div>
      <Accordion type="single" collapsible className="overflow-hidden rounded-2xl border border-line-1 bg-sheet px-4">
        {qs.map((x) => (
          <AccordionItem key={x.q} value={x.q} className="border-line-1 last:border-b-0">
            <AccordionTrigger className="py-4 text-left text-[15px] font-medium text-deep-ink hover:no-underline">{x.q}</AccordionTrigger>
            <AccordionContent className="pb-5 text-sm leading-[22px] text-body">{x.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
