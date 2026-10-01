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
      { property: "og:image", content: "https://patel-ready-book.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://patel-ready-book.lovable.app/og-image.jpg" },
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
        <Services />
        <HowItWorks />
        <Reviews />
        <About />
        <Year />
        <Privacy />
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
          <h1 className="mt-5 max-w-[16ch] text-balance t-hero text-deep-ink md:!text-[56px] md:!leading-[58px]">Your taxes, done in one visit.</h1>
          <p className="mt-6 max-w-[33rem] text-base leading-7 text-body sm:text-lg sm:leading-8">
            Tax returns for families, freelancers, landlords and small businesses in Montclair. Book online, send your documents from your phone, and meet Claire once.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg"><Link to="/book">See open times</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/book" search={{ service: "intro" }}>Free 15-minute call</Link></Button>
          </div>
          <a href="#reviews" className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-deep-ink">
            <Stars /><span><span className="font-semibold text-deep-ink">4.9</span> from 212 Google reviews</span>
          </a>
        </div>
        <div className="min-w-0 rounded-[28px] bg-surface-2 px-4 py-4 sm:px-8 sm:py-6"><HeroVisual /></div>
      </div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line-1 lg:grid-cols-4">
        {PROOF.map((x) => (
          <div key={x.l} className="bg-sheet px-5 py-5 sm:px-6">
            <dt className="sr-only">{x.l}</dt>
            <dd className="tabular flex items-center gap-1.5 font-serif text-[28px] font-semibold leading-none tracking-[-0.02em] text-deep-ink">{x.v}{x.star && <Star className="size-5 fill-[#E7AD16] text-[#E7AD16]" />}</dd>
            <dd className="mt-2 text-[13px] leading-5 text-muted-foreground">{x.l}</dd>
          </div>
        ))}
      </dl>
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
          <p className="text-sm font-medium text-primary-foreground/70">When to come in</p>
          <h2 className="t-section mt-3 max-w-[13ch] text-balance">Here all year, not just at tax time.</h2>
        </div>
        <div className="min-w-0 border-t border-primary-foreground/25 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          <div className="space-y-0 divide-y divide-primary-foreground/20">
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 first:pt-0 sm:grid-cols-[7rem_1fr]">
              <span className="font-semibold text-primary-foreground">Feb–Apr</span>
              <p className="text-sm leading-6 text-primary-foreground/75">Busiest for returns. Book early.</p>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 sm:grid-cols-[7rem_1fr]">
              <span className="font-semibold text-primary-foreground">Oct 15</span>
              <p className="text-sm leading-6 text-primary-foreground/75">Extended returns due. Full days have a waitlist.</p>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 py-4 last:pb-0 sm:grid-cols-[7rem_1fr]">
              <span className="font-semibold text-primary-foreground">All year</span>
              <p className="text-sm leading-6 text-primary-foreground/75">Letters, planning and bookkeeping.</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-12 gap-1" aria-label="Busier months: February, March, April and October">
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
    { t: "Choose a time", d: "Pick an open slot online. You're confirmed right away." },
    { t: "Answer five questions", d: "They become the exact list of documents to bring." },
    { t: "Send your documents", d: "From your phone. We check each one as it arrives." },
    { t: "Meet Claire, then sign and pay", d: "One appointment, then sign and pay online." },
  ];
  return (
    <section id="how" className={`${panel} scroll-mt-24 px-5 py-12 sm:px-10 sm:py-16`}>
      <div className="max-w-3xl">
        <h2 className="t-section text-balance text-deep-ink">From first question to filed return.</h2>
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
      <SectionHead title="What can we help with?" sub="Prices agreed before we start. Nothing due when you book." />
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
        <span className="min-w-0 text-[15px] leading-6 text-deep-ink"><span className="font-semibold">Not sure which one?</span> Talk it through with Claire in a free 15-minute call.</span>
        <span className="col-start-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink group-hover:underline group-hover:underline-offset-4 sm:col-start-3 sm:justify-self-end">Choose a call time<ArrowUpRight className="size-4" /></span>
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
          <h2 className="t-section text-deep-ink">One person who knows your return.</h2>
          <p className="mt-4 max-w-[34rem] text-base leading-7 text-body">Claire Hartwell has prepared returns in Montclair since 2014. As an IRS Enrolled Agent she can also represent you if the IRS has questions. You work with her from start to finish.</p>
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

/** What clients say, with where the ratings come from. */
function Reviews() {
  const reviews = [
    { name: "Anita R.", where: "Montclair", what: "Individual return", text: "I sent everything the week before. The appointment took forty minutes and I didn't have to come back." },
    { name: "Marcus L.", where: "Glen Ridge", what: "Self-employed", text: "Claire untangled three years of 1099s from my design work and explained every line. First year I understood my taxes." },
    { name: "Deepa & Raj S.", where: "Bloomfield", what: "Rental property", text: "The checklist for our rental was spot on. She caught a depreciation item our old preparer missed for years." },
  ];
  const sources = [{ s: "Google", r: "4.9", n: "212 reviews" }, { s: "Yelp", r: "4.8", n: "64 reviews" }];
  return (
    <section id="reviews" className={`${panel} scroll-mt-24 px-5 py-12 sm:px-10 sm:py-16`}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead title="What clients say." />
        <ul className="flex gap-6">
          {sources.map((x) => (
            <li key={x.s}>
              <p className="flex items-center gap-1.5"><span className="tabular text-xl font-semibold text-deep-ink">{x.r}</span><Stars /></p>
              <p className="text-xs text-muted-foreground">{x.s}, {x.n}</p>
            </li>
          ))}
        </ul>
      </div>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.name} className="flex flex-col rounded-2xl bg-surface-2 p-5">
            <Stars />
            <p className="mt-3 flex-1 text-[15px] leading-6 text-deep-ink">“{r.text}”</p>
            <p className="mt-5 text-sm font-medium text-deep-ink">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.where}, {r.what}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stars() {
  return <span className="inline-flex" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 fill-[#E7AD16] text-[#E7AD16]" />)}</span>;
}

const PROOF = [
  { v: "4.9", l: "Google rating, 212 reviews", star: true },
  { v: "1,800+", l: "returns filed since 2014" },
  { v: "640", l: "clients in Montclair and nearby" },
  { v: "98%", l: "come back the next year" },
];
function Privacy() {
  const points = [
    { icon: Lock, title: "Private storage", text: "Only your preparer can open your files." },
    { icon: KeyRound, title: "Links that expire", text: "Every file opens through a link that lasts minutes." },
    { icon: ShieldCheck, title: "No Social Security number online", text: "We never ask for it here." },
    { icon: Trash2, title: "Only what's needed", text: "Just what's on your checklist." },
  ];
  return (
    <section className={`${panel} px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="Your documents stay between us." sub="Only Claire can open your files." />
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
  if ((m === 8) || (m === 9 && d <= 15)) return { title: "October 15 is close. Your slot doesn't have to be.", body: "Extended returns are due October 15. Schedule now, send your documents this week, and file in one visit.", cta: "Schedule an extension review", service: "extension" };
  if ((m >= 1 && m <= 2) || (m === 3 && d <= 15)) return { title: "April 15 is coming. Times are filling.", body: "Filing season is the busiest time of the year. Schedule now and send your documents as they arrive.", cta: "Schedule your return", service: "individual" };
  return { title: "Got a letter from the IRS?", body: "Quieter months mean openings this week: IRS and New Jersey letters, quarterly estimates, bookkeeping, and past returns.", cta: "Schedule a letter review", service: "extension" };
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
          <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><a href="#services">See all services</a></Button>
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
    { q: "Are you open all year?", a: "Yes. February to mid-April and before October 15 are the busiest; the rest of the year there's usually an opening the same week." },
    { q: "What is an Enrolled Agent?", a: "A tax professional licensed by the IRS to prepare returns and to represent you in audits, collections and appeals." },
    { q: "How much will it cost?", a: "The prices above, confirmed before any work starts. You pay when the work is done, never when you book." },
    { q: "Do you do New York returns?", a: "Yes. If you work in New York, your non-resident return is included." },
    { q: "What should I bring?", a: "After you book, five quick questions give you an exact list. Send the documents from your phone before your appointment." },
    { q: "Video call or in person?", a: "Either. You choose when you book; both work the same way." },
    { q: "Can I reschedule or cancel?", a: "Yes, any time, from the link in your confirmation email. Your old time goes to someone on the waitlist." },
    { q: "What are the key deadlines?", a: "April 15 for most returns, October 15 for extended returns. Quarterly estimates are due in April, June, September and January." },
  ];
  return (
    <section id="faq" className={`${panel} grid scroll-mt-24 gap-8 px-5 py-12 sm:px-10 sm:py-16 md:grid-cols-[0.8fr_1.2fr]`}>
      <div className="self-start"><SectionHead title="Questions." sub="Anything else? Ask below, call (973) 555-0142 or email claire@hartwelltax.com." /><AskForm className="mt-6" /></div>
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
