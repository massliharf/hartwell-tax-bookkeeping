import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Lock, ShieldCheck, Trash2, Video, MapPin, Clock, ArrowUpRight, CreditCard, MapPinned } from "lucide-react";
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
        <About />
        <HowItWorks />
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
  const facts: [string, string][] = [["Claire Hartwell, EA", "An IRS Enrolled Agent you can talk to directly"], ["Here in Montclair", "Meet at the office or by video"], ["No payment to reserve", "Know the price before work begins"]];
  return (
    <section className="overflow-hidden">
      <div className="grid items-center gap-10 px-2 pb-10 pt-10 sm:px-4 md:min-h-[530px] md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:pb-14 md:pt-16">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Hartwell Tax & Bookkeeping in Montclair, NJ</p>
          <h1 className="mt-5 max-w-[16ch] text-balance t-hero text-deep-ink md:!text-[56px] md:!leading-[58px]">Your taxes, done in one visit.</h1>
          <p className="mt-6 max-w-[33rem] text-base leading-7 text-body sm:text-lg sm:leading-8">
            We prepare returns for families, freelancers, landlords and small businesses. Choose a time, share your documents from your phone, and sit down with Claire once.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg"><Link to="/book">See open times</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/book" search={{ service: "intro" }}>Free 15-minute call</Link></Button>
          </div>
          
        </div>
        <div className="min-w-0 rounded-[28px] bg-surface-2 px-4 py-4 sm:px-8 sm:py-6"><HeroVisual /></div>
      </div>
      <ul className="grid overflow-hidden rounded-2xl bg-sheet sm:grid-cols-3">
        {facts.map(([k, v], i) => (
          <li key={k} className="flex min-w-0 items-center gap-3.5 bg-sheet px-5 py-5 sm:px-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink">{i === 0 ? <img src={claire} alt="" width={40} height={40} className="size-10 rounded-xl object-cover" /> : i === 1 ? <MapPinned className="size-[18px]" strokeWidth={1.75} /> : <CreditCard className="size-[18px]" strokeWidth={1.75} />}</span>
            <div className="min-w-0"><p className="text-sm font-semibold text-deep-ink">{k}</p><p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{v}</p></div>
          </li>
        ))}
      </ul>
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
      <ol className="mt-10 grid gap-x-8 gap-y-8 border-t border-line-2 pt-7 sm:grid-cols-2 lg:grid-cols-4">
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
            <ul className="mt-3 divide-y divide-line-1 border-y border-line-1">
              {SERVICES.filter((x) => x.group === g.id).map((x) => (
                <li key={x.id}>
                  <Link to="/book" search={{ service: x.id }} className="group grid grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-x-3 py-4">
                    <ServiceIcon service={x.id} size={32} />
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
      <Link to="/book" search={{ service: "intro" }} className="group mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line-1 pt-6 focus-visible:outline-offset-4">
        <span className="flex items-center gap-3 text-[15px] leading-6 text-deep-ink"><ServiceIcon service="intro" size={32} /><span><span className="font-semibold">Not sure which one?</span> Talk it through with Claire in a free 15-minute call.</span></span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink group-hover:underline group-hover:underline-offset-4">Choose a call time<ArrowUpRight className="size-4" /></span>
      </Link>
    </section>
  );
}
function About() {
  const stats = [{ v: "12", l: "years in Montclair" }, { v: "1,800+", l: "returns filed" }, { v: "4.9", l: "average rating" }];
  return (
    <section id="about" className={`${panel} scroll-mt-24 overflow-hidden`}>
      <div className="grid md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative min-h-[320px] md:min-h-full">
          <img src={claire} alt="Claire Hartwell, EA, in her office" width={800} height={1008} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="px-5 py-12 sm:px-10 sm:py-16">
          <h2 className="t-section text-deep-ink">One person who knows your return.</h2>
          <p className="mt-4 max-w-[34rem] text-base leading-7 text-body">An IRS Enrolled Agent, licensed to prepare your return and represent you before the IRS. You work with her from start to finish.</p>
          <blockquote className="mt-8 border-l-2 border-ink pl-4 text-[15px] leading-6 text-body">“I sent everything the week before. The appointment took forty minutes, and I didn't have to come back.”<footer className="mt-2 text-[13px] text-muted-foreground">Anita R., Montclair</footer></blockquote>
          <dl className="mt-8 grid grid-cols-3 gap-2">
            {stats.map((x) => (
              <div key={x.l} className="rounded-xl bg-surface-2 p-3 sm:p-4">
                <dt className="sr-only">{x.l}</dt>
                <dd className="tabular font-serif text-2xl font-medium text-deep-ink sm:text-[28px]">{x.v}</dd>
                <dd className="mt-1 text-xs text-muted-foreground">{x.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
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
            <AccordionContent className="pb-0 text-sm leading-[22px] text-body">{x.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
