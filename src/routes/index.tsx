import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, FileText, KeyRound, Lock, ShieldCheck, Trash2, Video, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { NextOpen } from "@/components/site/NextOpen";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SERVICES } from "@/lib/services";
import { serviceStyle } from "@/lib/service-style";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
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
      <main className="mx-auto max-w-6xl space-y-3 px-2 sm:space-y-4 sm:px-5">
        <Hero />
        <Services />
        <Year />
        <HowItWorks />
        <BeforeAfter />
        <About />
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
    <section className="enter overflow-hidden">
      <div className="grid items-center gap-8 px-1 pb-8 pt-6 sm:px-4 md:grid-cols-[1.45fr_1fr] md:gap-12 md:pb-12 md:pt-14">
        <div>
          <p className="text-sm font-medium text-ink">Tax preparation and bookkeeping in Montclair, NJ</p>
          <h1 className="enter-title mt-4 max-w-[19ch] text-balance t-hero text-deep-ink">Your taxes, handled by someone who knows your name.</h1>
          <p className="mt-6 max-w-[35rem] text-base leading-7 text-body sm:text-lg sm:leading-8">
            Hartwell Tax is a one-person practice run by Claire Hartwell, an IRS Enrolled Agent. She prepares federal and New Jersey returns for families, freelancers, landlords and small businesses, and deals with the IRS when a letter arrives.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/book">See open times</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/book/returning">My appointment</Link></Button>
          </div>
          <p className="mt-4 max-w-[34rem] text-sm leading-6 text-muted-foreground">Open all year, Monday to Saturday. From February to mid-April and before October 15, times fill a few weeks ahead, so schedule early or join the waitlist for a cancellation.</p>
        </div>
        <figure className="enter-spot relative min-w-0 overflow-hidden rounded-2xl bg-ink-900" style={{ animationDelay: "200ms" }}>
          <img src={claire} alt="Claire Hartwell at her desk in Montclair" className="aspect-[4/5] w-full object-cover opacity-90 sm:aspect-[5/5]" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-5 pt-16 text-white">
            <p className="text-[15px] font-medium">Claire Hartwell, EA</p>
            <p className="text-[13px] text-white/70">Enrolled to practice before the IRS. 12 years in Montclair.</p>
            <div className="mt-4 border-t border-white/20 pt-3"><NextOpen /></div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/** The year, as clients live it: open all year, two rushes. This is the business's main quirk, said plainly. */
function Year() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const peak = new Set([1, 2, 3, 8, 9]);
  const rows = [
    { t: "February to mid-April", d: "Filing season. Times fill two to three weeks ahead. Schedule early, and if a day is full, join its waitlist: the first cancellation is offered to you by email." },
    { t: "September to October 15", d: "The extension deadline. If you filed an extension in April, this is when your return gets finished, and the calendar fills again." },
    { t: "The rest of the year", d: "Quieter, and usually open the same week: IRS letters, quarterly estimates for freelancers, bookkeeping, and catching up on past returns." },
  ];
  return (
    <section className={`${panel} px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead title="Open all year, busiest twice." sub="Most people only think about taxes in April. Claire works with clients all year, and plans her calendar around the two rushes." />
      <div className="mt-10" aria-hidden="true">
        <div className="grid grid-cols-12 gap-1">
          {months.map((m, i) => (
            <div key={m} className="text-center">
              <div className={`h-10 rounded-md ${peak.has(i) ? "bg-ink" : "bg-fill-neutral"}`} />
              <p className={`mt-1.5 text-[11px] ${peak.has(i) ? "font-medium text-deep-ink" : "text-muted-foreground"}`}>{m}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {rows.map((r, i) => (
          <div key={r.t} className="flex gap-3">
            <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${i < 2 ? "bg-ink" : "bg-line-3"}`} />
            <div><h3 className="text-[15px] font-medium text-deep-ink">{r.t}</h3><p className="mt-1.5 text-[15px] leading-6 text-muted-foreground">{r.d}</p></div>
          </div>
        ))}
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
          {d.ok ? <span className="grid size-4 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-2.5" strokeWidth={3} /></span> : <span className="size-4 rounded-full border border-border" />}
        </li>
      ))}
    </ul>
  );
}

function StepPreviewReady() {
  return (
    <div className="flex items-center gap-4">
      <ReadyRing value={100} size={88} stroke={7} />
      <div className="text-xs leading-5 text-body">
        <p className="font-medium text-deep-ink">All set for Thursday</p>
        <p>Claire has checked every document.</p>
      </div>
    </div>
  );
}

function StepPreviewReminders() {
  const msgs = [
    { when: "Thursday, 4:12 pm", text: "Your return is ready. Review, sign and pay: $250." },
    { when: "Thursday, 6:40 pm", text: "Signed and paid. Thank you, Jane." },
    { when: "Friday, 9:05 am", text: "Your return has been e-filed." },
  ];
  return (
    <ul className="w-full space-y-2">
      {msgs.map((m) => (
        <li key={m.when} className="rounded-xl border border-line-1 bg-sheet px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">{m.when}</p>
          <p className="mt-0.5 text-[13px] text-deep-ink">{m.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** magnific.com/desktop "sticky index" section: the list on the left follows the text on the right. */
function HowItWorks() {
  const steps = [
    { title: "Pick a time.", text: "See every open time online, Saturdays included. You're confirmed on the spot, without waiting for a call back.", preview: <StepPreviewTime /> },
    { title: "Send what's on your list.", text: "A few quick questions build a checklist for your return. Snap documents with your phone; each one is checked as it arrives, and gentle reminders cover the rest.", preview: <StepPreviewDocs /> },
    { title: "Meet Claire once.", text: "In person in Montclair or on a video call. She's already seen your documents, so the hour goes to your return, not to paperwork.", preview: <StepPreviewReady /> },
    { title: "Sign, pay, filed.", text: "When your return is ready you get one email: review it, sign Form 8879 and pay from your phone. Claire files, and you're told when it's done.", preview: <StepPreviewReminders /> },
  ];
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const onScroll = () => {
      const line = window.innerHeight * 0.4;
      let idx = 0;
      refs.current.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= line) idx = i; });
      setActive(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <section id="how" className={`${panel} scroll-mt-24 px-5 py-12 sm:px-10 sm:py-20`}>
      <SectionHead eyebrow="How it works" title="From first click to filed return." sub="Four steps, no back-and-forth emails. You only come in for one of them." />
      <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <nav aria-label="Steps" className="hidden lg:block">
          <ol className="sticky top-28 space-y-1">
            {steps.map((s, i) => (
              <li key={s.title}>
                <a href={`#step-${i + 1}`} className={`relative flex h-9 items-center pl-4 text-sm transition-colors duration-150 before:absolute before:left-0 before:top-2 before:h-5 before:w-[2px] before:rounded-full before:transition-colors before:duration-200 ${active === i ? "font-medium text-deep-ink before:bg-ink" : "text-muted-foreground before:bg-transparent hover:text-deep-ink"}`}>
                  {s.title.replace(/\.$/, "")}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <ol className="space-y-16 sm:space-y-24">
          {steps.map((s, i) => (
            <li key={s.title} id={`step-${i + 1}`} data-i={i} ref={(el) => { refs.current[i] = el; }} className="scroll-mt-28">
              <p className="lead-text max-w-[560px] text-balance"><b>{s.title}</b> {s.text}</p>
              <div className="mt-6 flex min-h-[220px] max-w-[640px] items-center justify-center rounded-[22px] bg-ink-50 p-6 sm:p-10">
                <div className="w-full max-w-[340px]">{s.preview}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function BeforeAfter() {
  const before = ["Call, leave a voicemail, wait for a call back", "Guess which documents to bring", "Arrive and find out a form is missing", "Come back a second time to finish", "Get a paper bill, mail a check"];
  const after = ["Pick an open time, confirmed on the spot", "A checklist made for your answers", "Every upload checked before you come", "One appointment, then sign and pay online", "Filed, with an email to say so"];
  return (
    <section className={`${panel} px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead eyebrow="Before and after" title="Same return. None of the chasing." sub="What getting your taxes done usually looks like, and how it works at Hartwell Tax." />
      <div className="mt-10 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-2 p-6">
          <p className="text-sm font-medium text-muted-foreground">The usual way</p>
          <ul className="mt-4 space-y-3">
            {before.map((x) => (
              <li key={x} className="flex items-start gap-3 text-[15px] leading-6 text-muted-foreground"><span className="mt-2.5 h-px w-3 shrink-0 bg-muted-foreground/50" />{x}</li>
            ))}
          </ul>
        </div>
         <div className="rounded-2xl bg-ink-900 p-6 text-primary-foreground">
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
      <SectionHead title="What Claire can do for you." sub="Each price is agreed before any work starts, and you pay when your return is filed. Federal and New Jersey returns are included; a New York return too if you work in the city." />
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
                <Button asChild size="sm" variant="secondary"><Link to="/book" search={{ service: s.id }}>Schedule</Link></Button>
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
          <h2 className="t-section text-deep-ink">It's just me, on purpose.</h2>
          <div className="mt-5 space-y-3 text-base leading-7 text-body">
            <p>I'm an IRS Enrolled Agent, which means I'm licensed to prepare returns and represent you before the IRS. For twelve years I've helped families, freelancers and landlords in Montclair file with confidence.</p>
            <p>There's no front desk. When you book, you work with me from the first document to the final signature. That's also why booking is online: in season I'm with clients, not on the phone, and this way you never wait for a call back.</p>
          </div>
          <p className="mt-5 text-base font-medium text-deep-ink">Claire Hartwell, EA</p>
          <blockquote className="mt-8 border-l-2 border-ink pl-4 text-[15px] leading-6 text-body">“I uploaded everything the week before and my appointment took forty minutes. First year I didn't have to come back.”<footer className="mt-2 text-[13px] text-muted-foreground">Anita R., Montclair</footer></blockquote>
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
    { icon: Lock, title: "Private by default", text: "Your files are kept in private storage. Only Claire can open them." },
    { icon: KeyRound, title: "Short-lived access", text: "Each time a file is opened, a link is created that expires within minutes." },
    { icon: ShieldCheck, title: "No Social Security number", text: "We never ask for it online. What's needed is handled in person, safely." },
    { icon: Trash2, title: "Only what's needed", text: "Upload what's on your checklist, nothing more. You're always in control." },
  ];
  return (
    <section className={`${panel} px-5 py-12 sm:px-10 sm:py-16`}>
      <SectionHead eyebrow="Privacy" title="Handled the way you'd handle them yourself." sub="Tax papers are personal. Here is, in plain words, how we look after yours." />
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {points.map((p) => (
          <div key={p.title} className="flex gap-4 rounded-2xl bg-surface-2 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><p.icon className="size-5" strokeWidth={1.75} /></span>
            <div><h3 className="t-sub">{p.title}</h3><p className="mt-1 text-sm leading-[22px] text-body">{p.text}</p></div>
          </div>
        ))}
      </div>
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
          <h2 className="t-section text-white">{c.title}</h2>
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
    { q: "Are you open all year, or only in tax season?", a: "All year. February to mid-April and the weeks before October 15 are the busiest, so times fill a few weeks ahead; schedule early or join the waitlist for a cancellation. The rest of the year is quieter: IRS letters, quarterly estimates, bookkeeping and past returns, usually with an opening the same week." },
    { q: "What is an Enrolled Agent?", a: "An Enrolled Agent is licensed by the IRS itself to prepare tax returns and to represent taxpayers in audits, collections and appeals. It is the highest credential the IRS awards, and it requires ongoing education every year." },
    { q: "How much will my return cost?", a: "Prices start at the amounts listed above and are confirmed before any work starts. You pay once your return is ready to file, never at booking." },
    { q: "Do you prepare New York returns too?", a: "Yes. Many Montclair clients work in New York, so non-resident New York returns are included when you need one." },
    { q: "What should I bring?", a: "After you book, you'll get a checklist made for your return, usually W-2s, 1099s, 1098 mortgage statements, and last year's return. Upload them ahead of time and Claire will confirm everything is there." },
    { q: "Video call or in person?", a: "Whichever you prefer. Both work the same way: documents are uploaded beforehand, and we go through your return together. Choose when you book." },
    { q: "Can I reschedule?", a: "Of course. Use the link in your confirmation email to pick a new time. If you can't make it, please let us know so someone waiting can take your slot." },
    { q: "Can you file an extension for me?", a: "Yes. An extension gives you until October 15 to file, but any tax owed is still due in April. Schedule an extension review and we'll handle it." },
    { q: "What are the key deadlines?", a: "Most individual returns are due April 15. Extended returns are due October 15. Estimated taxes are due in April, June, September and January." },
  ];
  return (
    <section id="faq" className={`${panel} grid scroll-mt-24 gap-8 px-5 py-12 sm:px-10 sm:py-16 md:grid-cols-[0.8fr_1.2fr]`}>
      <div className="self-start"><SectionHead title="Good to know." sub="Still unsure? Call (973) 555-0142." /></div>
      <Accordion type="single" collapsible className="overflow-hidden rounded-2xl bg-surface-2 px-4">
        {qs.map((x) => (
          <AccordionItem key={x.q} value={x.q} className="border-border">
            <AccordionTrigger className="py-4 text-left text-[15px] font-medium text-deep-ink hover:no-underline">{x.q}</AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-[22px] text-body">{x.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
