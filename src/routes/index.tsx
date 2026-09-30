import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, FileText, KeyRound, Lock, ShieldCheck, Trash2, Video, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { HeroVisual } from "@/components/site/HeroVisual";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SERVICES } from "@/lib/services";
import { serviceStyle } from "@/lib/service-style";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import claire from "@/assets/claire-portrait.jpg";




const TITLE = "Hartwell Tax & Bookkeeping — Taxes, without the chase";
const DESC = "Book a tax appointment with Claire Hartwell, EA in Montclair, NJ in two minutes. Get a clear document checklist and arrive ready to file once.";

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


const panel = "rounded-2xl bg-sheet";

function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
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
    <div className="min-h-screen overflow-x-clip bg-canvas">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-3 px-2 sm:space-y-4 sm:px-5">
        <Hero />
        <WhatClaireDoes />
        <HowItWorks />
        <BeforeAfter />
        <Services />
        <About />
        <Testimonials />
        <Privacy />
        <DeadlineCta />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  const trust = ["IRS Enrolled Agent", "12 years in Montclair", "In person or video", "Your documents stay private"];
  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="grid items-center gap-10 px-5 pb-10 pt-10 sm:px-10 md:grid-cols-[1.15fr_1fr] md:gap-12 md:pb-14 md:pt-16">
        <div>
          <Link to="/book" search={{ service: "extension" }} className="group inline-flex h-8 items-center gap-2 rounded-full border border-[rgba(16,16,16,0.1)] bg-sheet pl-1 pr-3 text-xs text-[#363636] transition-colors duration-150 hover:bg-surface-2">
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-primary-foreground">Oct 15</span>
            Extensions are due. <span className="font-medium text-ink group-hover:underline">Book your slot</span>
          </Link>
          <h1 className="mt-5 max-w-[12ch] text-balance t-hero text-deep-ink">
            Taxes, without the chase.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#363636] sm:text-lg">
            Book in two minutes. We'll tell you exactly what to bring, and check it before you arrive.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/book">Book an appointment</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/book/returning">I already have a booking</Link></Button>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <img src={claire} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
            <p className="text-sm leading-5 text-muted-foreground"><span className="font-medium text-deep-ink">Claire Hartwell, EA</span><br />Confirmed instantly. No payment until you file.</p>
          </div>
        </div>
        <HeroVisual />
      </div>
      <div className="border-t border-border bg-surface-2 px-5 py-4 sm:px-10">
        <p className="mb-3 text-xs font-medium text-muted-foreground">Start with what you need</p>
        <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-5 sm:overflow-visible">
          {SERVICES.map((s) => {
            const st = serviceStyle(s.id);
            const Icon = st.icon;
            return (
              <li key={s.id} className="shrink-0">
                <Link to="/book" search={{ service: s.id }} className="flex h-full w-40 items-center gap-3 rounded-xl bg-sheet p-3 transition-colors duration-150 hover:bg-fill-subtle sm:w-auto">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `rgba(${st.rgb},0.1)` }}>
                    <Icon className="size-5" strokeWidth={1.75} style={{ color: `rgb(${st.rgb})` }} />
                  </span>
                  <span className="min-w-0 text-[13px] font-medium leading-4 text-deep-ink">{s.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {trust.map((t) => (
            <li key={t} className="flex items-center gap-1.5 text-xs text-[#363636]"><Check className="size-3.5 text-ink" strokeWidth={2.5} />{t}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function WhatClaireDoes() {
  const who = [
    { svc: "individual", title: "Families and employees", text: "W-2 income, mortgage interest, child and education credits, and the deductions most people miss." },
    { svc: "self-employed", title: "Freelancers and 1099 workers", text: "Schedule C, home office, quarterly estimated payments, and a plan so April isn't a surprise." },
    { svc: "rental", title: "Landlords", text: "Rental income and expenses, depreciation, and records that hold up if you sell." },
    { svc: "bookkeeping", title: "Small businesses", text: "Clean monthly books, sales tax questions, and a return that matches them." },
  ];
  const included = [
    "Federal and New Jersey returns, e-filed with confirmation",
    "A look at last year's return for anything missed",
    "Help if the IRS or the NJ Division of Taxation writes to you",
    "Answers to tax questions all year, not just in April",
    "Private document upload, no Social Security number online",
    "One flat price, agreed before any work starts",
  ];
  return (
    <section id="what" className={`${panel} scroll-mt-24 px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="An Enrolled Agent for your whole tax year." sub="Enrolled Agents are licensed by the IRS to prepare returns and to represent you if the IRS has questions. Claire prepares every return herself." />
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {who.map((w) => (
          <article key={w.title} className="flex gap-4 rounded-2xl border border-border p-5">
            <ServiceIcon service={w.svc} size={40} />
            <div><h3 className="text-[15px] font-medium text-deep-ink">{w.title}</h3><p className="mt-1 text-sm leading-[22px] text-[#363636]">{w.text}</p></div>
          </article>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-surface-2 p-5 sm:p-6">
        <h3 className="text-[15px] font-medium text-deep-ink">Every return includes</h3>
        <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {included.map((x) => (
            <li key={x} className="flex items-start gap-3 text-sm leading-[22px] text-[#363636]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/10 text-success"><Check className="size-3" strokeWidth={3} /></span>{x}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StepPreviewTime() {
  const days = [{ d: "Wed", n: 14 }, { d: "Thu", n: 15 }, { d: "Fri", n: 16 }];
  const times = ["9:30 am", "10:30 am", "1:00 pm", "3:30 pm"];
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {days.map((x, i) => (
          <span key={x.n} className={`flex h-12 w-12 flex-col items-center justify-center rounded-lg text-[11px] ${i === 1 ? "bg-deep-ink text-primary-foreground" : "bg-sheet text-deep-ink"}`}>
            <span className={i === 1 ? "text-primary-foreground/70" : "text-muted-foreground"}>{x.d}</span><span className="tabular text-sm font-medium">{x.n}</span>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {times.map((t, i) => (
          <span key={t} className={`tabular grid h-8 place-items-center rounded-lg text-xs ${i === 1 ? "bg-deep-ink text-primary-foreground" : "bg-sheet text-deep-ink"}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function StepPreviewDocs() {
  const docs = [{ t: "W-2", ok: true }, { t: "1098 mortgage", ok: true }, { t: "Last year's return", ok: false }];
  return (
    <ul className="space-y-2">
      {docs.map((d) => (
        <li key={d.t} className="flex h-10 items-center gap-2.5 rounded-lg bg-sheet px-3 text-xs text-deep-ink">
          <FileText className="size-3.5 text-muted-foreground" /><span className="flex-1">{d.t}</span>
          {d.ok ? <span className="grid size-4 place-items-center rounded-full bg-ink text-primary-foreground"><Check className="size-2.5" strokeWidth={3} /></span> : <span className="size-4 rounded-full border border-border" />}
        </li>
      ))}
    </ul>
  );
}

function StepPreviewReady() {
  return (
    <div className="flex items-center gap-4">
      <ReadyRing value={100} size={88} stroke={7} />
      <div className="text-xs leading-5 text-[#363636]">
        <p className="font-medium text-deep-ink">All set for Thursday</p>
        <p>Claire has checked every document.</p>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { title: "Book a time", text: "Pick a service and a slot that suits you. You're confirmed on the spot.", preview: <StepPreviewTime /> },
    { title: "Upload what's on your list", text: "You get a short checklist made for your return. Add documents whenever you have them.", preview: <StepPreviewDocs /> },
    { title: "Arrive ready, file once", text: "Claire reviews everything beforehand, so your appointment is the only one you need.", preview: <StepPreviewReady /> },
  ];
  return (
    <section id="how" className={`${panel} scroll-mt-24 px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="Three steps. One appointment." sub="No back-and-forth emails, no second visit for a missing form." />
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col rounded-2xl bg-surface-2 p-2">
            <div className="flex min-h-[152px] items-center rounded-xl bg-fill-neutral/60 p-4">{s.preview}</div>
            <div className="px-3 pb-4 pt-5">
              <p className="tabular text-xs font-medium text-muted-foreground">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-medium leading-7 text-deep-ink">{s.title}</h3>
              <p className="mt-1 text-sm leading-[22px] text-[#363636]">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BeforeAfter() {
  const before = ["Six emails to find a time", "A list of documents you have to guess", "Arrive, find out a form is missing", "Book a second visit to finish"];
  const after = ["One link, confirmed on the spot", "A checklist made for your return", "Reminders until everything is in", "One appointment, filed the same week"];
  return (
    <section className={`${panel} px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="The same return. Half the hassle." sub="What booking a tax appointment usually looks like, and what it looks like here." />
      <div className="mt-10 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-2 p-6">
          <p className="text-sm font-medium text-muted-foreground">The usual way</p>
          <ul className="mt-4 space-y-3">
            {before.map((x) => (
              <li key={x} className="flex items-start gap-3 text-[15px] leading-6 text-muted-foreground"><span className="mt-2.5 h-px w-3 shrink-0 bg-muted-foreground/50" />{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
          <p className="text-sm font-medium text-primary-foreground/70">With Hartwell Tax</p>
          <ul className="mt-4 space-y-3">
            {after.map((x) => (
              <li key={x} className="flex items-start gap-3 text-[15px] leading-6"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-foreground text-primary"><Check className="size-3" strokeWidth={3} /></span>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className={`${panel} scroll-mt-24 px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="Clear prices, set in advance." sub="Fees are paid when your return is filed. Nothing is charged at booking." />
      <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {SERVICES.map((s) => {
          const st = serviceStyle(s.id);
          const Icon = st.icon;
          return (
            <li key={s.id} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 bg-sheet px-4 py-4 transition-colors duration-150 hover:bg-surface-2 sm:grid-cols-[40px_minmax(0,1fr)_90px_110px_auto] sm:px-5">
              <span className="grid size-10 place-items-center rounded-lg" style={{ backgroundColor: `rgba(${st.rgb},0.1)` }}>
                <Icon className="size-5" strokeWidth={1.75} style={{ color: `rgb(${st.rgb})` }} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-medium leading-6 text-deep-ink">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.blurb}<span className="sm:hidden">, {s.minutes} min</span></p>
              </div>
              <p className="tabular hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><Clock className="size-3.5" />{s.minutes} min</p>
              <p className="hidden whitespace-nowrap text-right text-deep-ink sm:block">
                {s.from && <span className="mr-1 text-xs text-muted-foreground">from</span>}
                <span className="tabular text-lg font-semibold">${s.price}</span>
              </p>
              <div className="flex flex-col items-end gap-1">
                <span className="tabular text-sm font-semibold text-deep-ink sm:hidden">{s.from ? "from " : ""}${s.price}</span>
                <Button asChild size="sm" variant="secondary"><Link to="/book" search={{ service: s.id }}>Book</Link></Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function About() {
  const stats = [{ v: "12", l: "years in Montclair" }, { v: "1,800+", l: "returns filed" }, { v: "4.9", l: "average rating" }];
  return (
    <section id="about" className={`${panel} scroll-mt-24 overflow-hidden`}>
      <div className="grid md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative min-h-[360px] md:min-h-full">
          <img src={claire} alt="Claire Hartwell, EA, in her office" width={800} height={1008} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="px-5 py-12 sm:px-10 sm:py-16">
          <h2 className="t-section text-deep-ink">A neighbor who happens to love the tax code.</h2>
          <div className="mt-5 space-y-3 text-base leading-7 text-[#363636]">
            <p>I'm an IRS Enrolled Agent, which means I'm licensed to prepare returns and represent you before the IRS. For twelve years I've helped families, freelancers and landlords in Montclair file with confidence.</p>
            <p>My practice is small on purpose. When you book with me, you work with me, from the first document to the final signature.</p>
          </div>
          <p className="mt-5 text-base font-medium text-deep-ink">Claire Hartwell, EA</p>
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

function Testimonials() {
  const t = [
    { q: "I uploaded everything the week before and my appointment took forty minutes. First year I didn't have to come back.", n: "Anita R.", r: "Individual return, Montclair" },
    { q: "Claire untangled three years of 1099s from my design work and explained every line. I finally understand my taxes.", n: "Marcus L.", r: "Freelancer, Glen Ridge" },
    { q: "The checklist for my rental was spot on. She caught a depreciation item my old preparer missed for years.", n: "Deepa & Raj S.", r: "Rental property, Bloomfield" },
  ];
  return (
    <section className={`${panel} px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="What clients say." />
      <div className="mt-8 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible">
        {t.map((x) => (
          <figure key={x.n} className="flex w-[82vw] shrink-0 snap-start flex-col rounded-2xl bg-surface-2 p-6 md:w-auto">
            <blockquote className="text-base leading-7 text-deep-ink">"{x.q}"</blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-6 text-sm">
              <span className="grid size-9 place-items-center rounded-full bg-fill-neutral text-xs font-medium text-deep-ink">{x.n.charAt(0)}</span>
              <span><span className="block font-medium text-deep-ink">{x.n}</span><span className="block text-xs text-muted-foreground">{x.r}</span></span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Privacy() {
  const points = [
    { icon: Lock, title: "Private by default", text: "Your files are kept in private storage. Only Claire can open them." },
    { icon: KeyRound, title: "Short-lived access", text: "Each time a file is opened, a link is created that expires within minutes." },
    { icon: ShieldCheck, title: "No Social Security number", text: "We never ask for it online. What's needed is handled in person, safely." },
    { icon: Trash2, title: "Only what's needed", text: "Upload what's on your checklist, nothing more. You're always in control." },
  ];
  return (
    <section className={`${panel} px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="Handled the way you'd handle them yourself." sub="Tax papers are personal. Here is, in plain words, how we look after yours." />
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {points.map((p) => (
          <div key={p.title} className="flex gap-4 rounded-2xl bg-surface-2 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><p.icon className="size-5" strokeWidth={1.75} /></span>
            <div><h3 className="text-[15px] font-medium text-deep-ink">{p.title}</h3><p className="mt-1 text-sm leading-[22px] text-[#363636]">{p.text}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeadlineCta() {
  return (
    <section className="overflow-hidden rounded-2xl bg-primary px-5 py-12 text-primary-foreground sm:px-10 sm:py-16">
      <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-serif text-[28px] font-medium leading-[36px] tracking-[-0.02em] sm:text-[36px] sm:leading-[44px]">October 15 is close. Your slot doesn't have to be.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-primary-foreground/70 sm:text-base">Extended returns are due on October 15. Book now, upload your documents this week, and file once.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
          <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to="/book" search={{ service: "extension" }}>Book an extension review</Link></Button>
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
    { q: "What is an Enrolled Agent?", a: "An Enrolled Agent is licensed by the IRS itself to prepare tax returns and to represent taxpayers in audits, collections and appeals. It is the highest credential the IRS awards, and it requires ongoing education every year." },
    { q: "How much will my return cost?", a: "Prices start at the amounts listed above and are confirmed before any work starts. You pay once your return is ready to file, never at booking." },
    { q: "Do you prepare New York returns too?", a: "Yes. Many Montclair clients work in New York, so non-resident New York returns are included when you need one." },
    { q: "What should I bring?", a: "After you book, you'll get a checklist made for your return, usually W-2s, 1099s, 1098 mortgage statements, and last year's return. Upload them ahead of time and Claire will confirm everything is there." },
    { q: "Video call or in person?", a: "Whichever you prefer. Both work the same way: documents are uploaded beforehand, and we go through your return together. Choose when you book." },
    { q: "Can I reschedule?", a: "Of course. Use the link in your confirmation email to pick a new time. If you can't make it, please let us know so someone waiting can take your slot." },
    { q: "Can you file an extension for me?", a: "Yes. An extension gives you until October 15 to file, but any tax owed is still due in April. Book an Extension review and we'll handle it." },
    { q: "What are the key deadlines?", a: "Most individual returns are due April 15. Extended returns are due October 15. Estimated taxes are due in April, June, September and January." },
  ];
  return (
    <section id="faq" className={`${panel} grid scroll-mt-24 gap-8 px-5 py-12 sm:px-10 sm:py-16 md:grid-cols-[0.8fr_1.2fr]`}>
      <div className="self-start"><SectionHead title="Good to know." sub="Still unsure? Call (973) 555-0142." /></div>
      <Accordion type="single" collapsible className="overflow-hidden rounded-2xl bg-surface-2 px-4">
        {qs.map((x) => (
          <AccordionItem key={x.q} value={x.q} className="border-border">
            <AccordionTrigger className="py-4 text-left text-[15px] font-medium text-deep-ink hover:no-underline">{x.q}</AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-[22px] text-[#363636]">{x.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
