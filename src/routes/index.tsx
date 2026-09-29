import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Building2, CalendarCheck, Check, FileSpreadsheet, FileUp, Home as HomeIcon, KeyRound, Lock, Receipt, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/brand/Reveal";
import { HeroVisual } from "@/components/site/HeroVisual";
import { AnnouncementBar, SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SERVICES } from "@/lib/services";
import claire from "@/assets/claire-portrait.jpg";

const SERVICE_STYLE: Record<string, { icon: typeof Receipt; rgb: string }> = {
  individual: { icon: Receipt, rgb: "79,105,242" },
  "self-employed": { icon: Briefcase, rgb: "133,102,220" },
  rental: { icon: HomeIcon, rgb: "30,91,71" },
  extension: { icon: FileSpreadsheet, rgb: "196,120,44" },
  bookkeeping: { icon: Building2, rgb: "33,124,150" },
};


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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium leading-6 text-muted-foreground">{children}</p>;
}

function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-canvas">
      <AnnouncementBar />
      <SiteHeader />
      <main className="space-y-16 lg:space-y-24">
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
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 md:grid-cols-[1.15fr_1fr] md:gap-14 md:pt-16">
      <Reveal>
         <Eyebrow>Claire Hartwell, EA, Montclair, New Jersey</Eyebrow>
         <h1 className="mt-3 text-[36px] font-medium leading-[44px] tracking-[-0.4px] text-deep-ink sm:text-[52px] sm:leading-[58px]">
           Taxes, without <em className="relative whitespace-nowrap not-italic">the chase.</em>
        </h1>
        <p className="mt-4 max-w-md text-base leading-6 text-[#363636]">
          Book in two minutes. We'll tell you exactly what to bring, and check it before you arrive.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
           <Button asChild size="lg"><Link to="/book">Book an appointment</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/book/returning">I'm a returning client</Link></Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Confirmed instantly. No payment until you file.</p>
      </Reveal>
      <Reveal delay={0.15}><HeroVisual /></Reveal>
    </section>
  );
}

function TrustStrip() {
  const items = ["IRS Enrolled Agent", "12 years in Montclair", "In person or video", "Your documents stay private"];
  return (
    <div className="mx-auto max-w-6xl px-5">
      <ul className="flex flex-wrap items-center justify-start gap-2">
        {items.map((t) => (
          <li key={t} className="flex h-7 items-center gap-1.5 rounded-full border border-border bg-fill-subtle px-3 text-xs font-medium text-deep-ink"><Check className="size-3 text-ink" strokeWidth={2.5} />{t}</li>
        ))}
      </ul>
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <Reveal className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-1 text-[26px] font-medium leading-[34px] tracking-[-0.2px] text-deep-ink">{title}</h2>
      {sub && <p className="mt-2 text-sm leading-[22px] text-muted-foreground">{sub}</p>}
    </Reveal>
  );
}

function HowItWorks() {
  const steps = [
    { icon: CalendarCheck, title: "Book a time", text: "Pick a service and a slot that suits you. You're confirmed on the spot." },
    { icon: FileUp, title: "Upload what's on your list", text: "You get a short checklist made for your return. Add documents whenever you have them." },
    { icon: Check, title: "Arrive ready, file once", text: "Claire reviews everything beforehand, so your appointment is the only one you need." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-5">
      <SectionHead eyebrow="How it works" title="Three steps. One appointment." />
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1} className="h-full">
            <li className="relative h-full rounded-2xl border border-border bg-sheet p-6">
              <div className="relative mb-4 h-12 w-12">
                <div className="grid size-12 place-items-center rounded-lg bg-[rgba(30,91,71,0.1)]">
                  <s.icon className="size-5 text-ink" strokeWidth={1.75} />
                </div>
                <span className="tabular absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-ink text-[8px] font-bold text-primary-foreground">{i + 1}</span>
              </div>
              <h3 className="text-xl font-medium leading-[30px] tracking-[-0.2px] text-deep-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-[22px] text-[#363636]">{s.text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead eyebrow="Services" title="Clear prices, set in advance." sub="Fees are paid when your return is filed. Nothing is charged at booking." />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {SERVICES.map((s) => {
            const style = SERVICE_STYLE[s.id] ?? { icon: Receipt, rgb: "30,91,71" };
            const Icon = style.icon;
            return (
              <Reveal key={s.id} className={`h-full ${s.id === "bookkeeping" ? "lg:col-span-2" : ""}`}>
                <article className="grid h-full min-h-36 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-sheet p-4 sm:gap-4 sm:p-5 lg:min-h-28">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `rgba(${style.rgb},0.1)` }}>
                    <Icon className="size-5" strokeWidth={1.75} style={{ color: `rgb(${style.rgb})` }} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-medium leading-6 text-deep-ink">{s.name}</h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground" title={s.blurb}>{s.blurb}</p>
                    <p className="tabular mt-1 text-xs text-muted-foreground">{s.minutes} min</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="whitespace-nowrap text-deep-ink">
                      {s.from && <span className="mr-1 text-xs text-muted-foreground">from</span>}
                      <span className="tabular text-lg font-semibold">${s.price}</span>
                    </p>
                    <Button asChild size="sm"><Link to="/book" search={{ service: s.id }}>Book</Link></Button>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}


function About() {
  return (
    <section id="about" className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-10 px-5 md:grid-cols-[0.9fr_1.1fr]">
      <Reveal>
        <figure className="w-full max-w-xs">
          <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-surface-2">
            <img src={claire} alt="Claire Hartwell, EA, in her office" width={800} height={1008} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </figure>
      </Reveal>
      <Reveal delay={0.1}>
        <Eyebrow>About Claire</Eyebrow>
        <h2 className="mt-1 text-[26px] font-medium leading-[34px] tracking-[-0.2px] text-deep-ink">A neighbor who happens to love the tax code.</h2>
        <div className="mt-4 space-y-3 text-base leading-6 text-[#363636]">
          <p>I'm an IRS Enrolled Agent, which means I'm licensed to prepare returns and represent you before the IRS. For twelve years I've helped families, freelancers and landlords in Montclair file with confidence.</p>
          <p>My practice is small on purpose. When you book with me, you work with me — from the first document to the final signature.</p>
        </div>
        <p className="mt-4 text-lg font-medium text-ink">— Claire</p>

      </Reveal>
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
    <section>
      <div className="mx-auto max-w-6xl px-5">
         <Reveal><p className="text-xs font-medium leading-6 text-muted-foreground">Kind words</p></Reveal>
        <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible [scrollbar-width:none]">
          {t.map((x, i) => (
            <Reveal key={x.n} delay={i * 0.1} className="h-full">
              <figure className="flex h-full w-[85vw] shrink-0 snap-start flex-col rounded-2xl border border-border bg-sheet p-6 text-deep-ink md:w-auto">
                <blockquote className="text-lg font-medium leading-[28px] tracking-[-0.2px]">"{x.q}"</blockquote>
                <figcaption className="mt-auto pt-5 text-sm"><span className="text-deep-ink">{x.n}</span><span className="block text-muted-foreground">{x.r}</span></figcaption>

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
    { icon: Lock, title: "Private by default", text: "Your files are kept in private storage. Only Claire can open them." },
    { icon: KeyRound, title: "Short-lived access", text: "Each time a file is opened, a link is created that expires within minutes." },
    { icon: ShieldCheck, title: "No Social Security number", text: "We never ask for it online. What's needed is handled in person, safely." },
    { icon: Trash2, title: "Only what's needed", text: "Upload what's on your checklist, nothing more. You're always in control." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5">
      <div className="rounded-2xl border border-border bg-sheet p-6 sm:p-10">
        <SectionHead eyebrow="Your documents are safe" title="Handled the way you'd handle them yourself." sub="Tax papers are personal. Here is, in plain words, how we look after yours." />
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06} className="flex gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[rgba(30,91,71,0.1)] text-ink"><p.icon className="size-5" strokeWidth={1.75} /></span>
              <div><h3 className="text-base font-medium text-deep-ink">{p.title}</h3><p className="mt-1 text-sm leading-relaxed text-deep-ink/70">{p.text}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const qs = [
    { q: "What should I bring?", a: "After you book, you'll get a checklist made for your return — usually W-2s, 1099s, 1098 mortgage statements, and last year's return. Upload them ahead of time and Claire will confirm everything is there." },
    { q: "Video call or in person?", a: "Whichever you prefer. Both work the same way: documents are uploaded beforehand, and we go through your return together. Choose when you book." },
    { q: "Can I reschedule?", a: "Of course. Use the link in your confirmation email to pick a new time. If you can't make it, please let us know so someone waiting can take your slot." },
    { q: "Can you file an extension for me?", a: "Yes. An extension gives you until October 15 to file, but any tax owed is still due in April. Book an Extension review and we'll handle it." },
    { q: "What are the key deadlines?", a: "Most individual returns are due April 15. Extended returns are due October 15. Estimated taxes are due in April, June, September and January." },
  ];
  return (
    <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-24 gap-8 px-5 md:grid-cols-[0.8fr_1.2fr]">
      <SectionHead eyebrow="Questions" title="Good to know." />
      <Reveal>
        <Accordion type="single" collapsible className="overflow-hidden rounded-2xl bg-surface-2 px-3">
          {qs.map((x) => (
            <AccordionItem key={x.q} value={x.q} className="border-border">
              <AccordionTrigger className="py-4 text-left text-sm font-medium text-deep-ink hover:no-underline">{x.q}</AccordionTrigger>
              <AccordionContent className="pb-4 text-sm text-muted-foreground">{x.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
