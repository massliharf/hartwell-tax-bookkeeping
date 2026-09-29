import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Check, FileUp, KeyRound, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/brand/Reveal";
import { HeroVisual } from "@/components/site/HeroVisual";
import { AnnouncementBar, SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SERVICES } from "@/lib/services";

const TITLE = "Patel Tax & Bookkeeping — Taxes, without the chase";
const DESC = "Book a tax appointment with Priya Patel, EA in Edison, NJ in two minutes. Get a clear document checklist and arrive ready to file once.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
       { property: "og:image", content: "/social-share.jpg" },
       { name: "twitter:image", content: "/social-share.jpg" },
    ],
  }),
  component: Home,
});

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink/70">{children}</p>;
}

function Home() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <Services />
        <About />
        <Testimonials />
        <Privacy />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 md:grid-cols-[1.15fr_1fr] md:pt-24">
      <Reveal>
        <Eyebrow>Priya Patel, EA · Edison, New Jersey</Eyebrow>
        <h1 className="mt-5 text-[3.4rem] leading-[0.95] text-deep-ink sm:text-7xl lg:text-[5.75rem]">
          Taxes, without <em className="relative whitespace-nowrap text-ink">the chase.<span className="absolute bottom-1 left-0 -z-10 h-3 w-full rounded-full bg-ink/40" /></em>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-deep-ink/75">
          Book in two minutes. We'll tell you exactly what to bring, and check it before you arrive.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg"><Link to="/book">Book an appointment <ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/book/returning">I'm a returning client</Link></Button>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">Confirmed instantly. No payment until you file.</p>
      </Reveal>
      <Reveal delay={0.15}><HeroVisual /></Reveal>
    </section>
  );
}

function TrustStrip() {
  const items = ["IRS Enrolled Agent", "12 years in Edison", "In person or video", "Your documents stay private"];
  return (
    <div className="border-y border-border bg-sheet/60">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-4 text-sm text-deep-ink/80">
        {items.map((t) => (
          <li key={t} className="flex items-center gap-2"><Check className="size-3.5 text-success" strokeWidth={2.5} />{t}</li>
        ))}
      </ul>
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <Reveal className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-4xl leading-tight text-deep-ink sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-deep-ink/70">{sub}</p>}
    </Reveal>
  );
}

function HowItWorks() {
  const steps = [
    { icon: CalendarCheck, title: "Book a time", text: "Pick a service and a slot that suits you. You're confirmed on the spot." },
    { icon: FileUp, title: "Upload what's on your list", text: "You get a short checklist made for your return. Add documents whenever you have them." },
    { icon: Check, title: "Arrive ready, file once", text: "Priya reviews everything beforehand, so your appointment is the only one you need." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <SectionHead eyebrow="How it works" title="Three steps. One appointment." />
      <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1}>
            <li className="relative">
              <div className="relative mb-6 h-28 w-40">
                <div className="absolute left-6 top-3 h-24 w-28 rotate-6 rounded-xl border border-border bg-paper-deep" />
                <div className="absolute left-3 top-1.5 h-24 w-28 rotate-2 rounded-xl border border-border bg-sheet shadow-sheet" />
                <div className="absolute left-0 top-0 grid h-24 w-28 place-items-center rounded-xl border border-border bg-sheet shadow-sheet">
                  <s.icon className="size-8 text-ink" strokeWidth={1.5} />
                </div>
                <span className="tabular absolute -right-1 -top-2 grid size-8 place-items-center rounded-full bg-ink font-sans text-lg text-deep-ink">{i + 1}</span>
              </div>
              <h3 className="text-2xl text-deep-ink">{s.title}</h3>
              <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-deep-ink/70">{s.text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="scroll-mt-24 bg-sage/50 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead eyebrow="Services" title="Clear prices, set in advance." sub="Fees are paid when your return is filed. Nothing is charged at booking." />
        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 0.08}>
              <Link to="/book" search={{ service: s.id }} className="sheet-stack group flex h-full flex-col p-6 transition-transform duration-300 hover:-translate-y-1">
                <p className="tabular text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{s.minutes} min</p>
                <h3 className="mt-3 text-[1.75rem] leading-tight text-deep-ink">{s.name}</h3>
                <p className="mt-2 text-sm text-deep-ink/70">{s.blurb}</p>
                <div className="mt-auto flex items-end justify-between border-t border-border pt-5 mt-8">
                  <p className="text-deep-ink">
                    {s.from && <span className="mr-1 text-xs text-muted-foreground">from</span>}
                    <span className="tabular font-sans text-3xl">${s.price}</span>
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-ink">
                    Book <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-14 px-5 py-24 md:grid-cols-[0.9fr_1.1fr]">
      <Reveal>
        <figure className="relative mx-auto w-full max-w-xs">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[1.5rem] border border-ink/20" />
          <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[1.5rem] border border-border bg-sheet shadow-lift">
            <div className="absolute inset-0 opacity-60" />
            <span className="relative font-sans text-8xl text-ink/25">PP</span>
          </div>
          <figcaption className="absolute -bottom-5 left-5 rounded-full bg-ink px-4 py-1.5 text-xs text-paper shadow-sheet">Priya Patel, EA</figcaption>
        </figure>
      </Reveal>
      <Reveal delay={0.1}>
        <Eyebrow>About Priya</Eyebrow>
        <h2 className="mt-3 text-4xl leading-tight text-deep-ink sm:text-5xl">A neighbor who happens to love the tax code.</h2>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-deep-ink/75">
          <p>I'm an IRS Enrolled Agent, which means I'm licensed to prepare returns and represent you before the IRS. For twelve years I've helped families, freelancers and landlords in Edison file with confidence.</p>
          <p>My practice is small on purpose. When you book with me, you work with me — from the first document to the final signature.</p>
        </div>
        <p className="mt-6 font-sans text-2xl text-ink">— Priya</p>
      </Reveal>
    </section>
  );
}

function Testimonials() {
  const t = [
    { q: "I uploaded everything the week before and my appointment took forty minutes. First year I didn't have to come back.", n: "Anita R.", r: "Individual return, Edison" },
    { q: "Priya untangled three years of 1099s from my design work and explained every line. I finally understand my taxes.", n: "Marcus L.", r: "Freelancer, Metuchen" },
    { q: "The checklist for my rental was spot on. She caught a depreciation item my old preparer missed for years.", n: "Deepa & Raj S.", r: "Rental property, Iselin" },
  ];
  return (
    <section className="bg-ink py-24 text-paper">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal><p className="text-xs font-medium uppercase tracking-[0.16em] text-paper">Kind words</p></Reveal>
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {t.map((x, i) => (
            <Reveal key={x.n} delay={i * 0.1}>
              <figure className="border-t border-paper/20 pt-6">
                <blockquote className="font-sans text-2xl leading-snug">"{x.q}"</blockquote>
                <figcaption className="mt-5 text-sm"><span className="text-paper">{x.n}</span><span className="block text-paper/60">{x.r}</span></figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Privacy() {
  const points = [
    { icon: Lock, title: "Private by default", text: "Your files are kept in private storage. Only Priya can open them." },
    { icon: KeyRound, title: "Short-lived access", text: "Each time a file is opened, a link is created that expires within minutes." },
    { icon: ShieldCheck, title: "No Social Security number", text: "We never ask for it online. What's needed is handled in person, safely." },
    { icon: Trash2, title: "Only what's needed", text: "Upload what's on your checklist, nothing more. You're always in control." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <div className="sheet-stack p-8 sm:p-12">
        <SectionHead eyebrow="Your documents are safe" title="Handled the way you'd handle them yourself." sub="Tax papers are personal. Here is, in plain words, how we look after yours." />
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sage text-ink"><p.icon className="size-5" strokeWidth={1.75} /></span>
              <div><h3 className="text-xl text-deep-ink">{p.title}</h3><p className="mt-1 text-sm leading-relaxed text-deep-ink/70">{p.text}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const qs = [
    { q: "What should I bring?", a: "After you book, you'll get a checklist made for your return — usually W-2s, 1099s, 1098 mortgage statements, and last year's return. Upload them ahead of time and Priya will confirm everything is there." },
    { q: "Video call or in person?", a: "Whichever you prefer. Both work the same way: documents are uploaded beforehand, and we go through your return together. Choose when you book." },
    { q: "Can I reschedule?", a: "Of course. Use the link in your confirmation email to pick a new time. If you can't make it, please let us know so someone waiting can take your slot." },
    { q: "Can you file an extension for me?", a: "Yes. An extension gives you until October 15 to file, but any tax owed is still due in April. Book an Extension review and we'll handle it." },
    { q: "What are the key deadlines?", a: "Most individual returns are due April 15. Extended returns are due October 15. Estimated taxes are due in April, June, September and January." },
  ];
  return (
    <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-5 py-16 md:grid-cols-[0.8fr_1.2fr]">
      <SectionHead eyebrow="Questions" title="Good to know." />
      <Reveal>
        <Accordion type="single" collapsible className="border-t border-border">
          {qs.map((x) => (
            <AccordionItem key={x.q} value={x.q} className="border-border">
              <AccordionTrigger className="py-5 text-left font-sans text-xl font-normal text-deep-ink hover:no-underline">{x.q}</AccordionTrigger>
              <AccordionContent className="pb-5 text-[15px] leading-relaxed text-deep-ink/70">{x.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
