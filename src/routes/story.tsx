import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/story")({
  head: () => ({ meta: [
    { title: "Case study: Hartwell Tax & Bookkeeping" },
    { name: "description", content: "How a one-person tax practice in Montclair, NJ turns 'can you do my taxes?' into a confirmed, prepared appointment without picking up the phone." },
    { property: "og:title", content: "Case study: Hartwell Tax & Bookkeeping" },
    { property: "og:description", content: "From 'can I book?' to 'you're booked', with almost no work for the owner." },
  ] }),
  component: Story,
});

const quirks = [
  { n: "1", unit: "person", d: "Claire Hartwell, EA. No front desk. Every call, confirmation and reminder used to be hers." },
  { n: "40+", unit: "calls a week", d: "in the weeks before April 15 and October 15, answered between returns." },
  { n: "1 in 6", unit: "appointments stalled", d: "last season: a no-show, or a client who arrived without their W-2 and needed a second visit." },
  { n: "2–3", unit: "days of phone tag", d: "between a voicemail and a booked time, while the deadline got closer." },
];
const before = [
  ["9:12 pm", "A client texts: “Can you do my taxes before Oct 15?”"],
  ["Next day", "Claire calls back between returns. Voicemail."],
  ["Day 3", "A time is agreed. Claire emails a generic list of what to bring."],
  ["The day", "The client arrives without their 1098. Second visit booked."],
  ["Week 2", "Return done. Paper invoice. Payment chased by phone."],
];
const after = [
  ["9:12 pm", "The client opens the site and sees open times. Picks Thursday 10:30."],
  ["9:14 pm", "Confirmed. A checklist built from three questions. Calendar invite."],
  ["Mon–Wed", "Documents arrive from their phone, each one checked on arrival. Reminders cover the rest."],
  ["Thursday", "One meeting. Claire finishes the return; the client signs Form 8879 and pays from the email."],
  ["Friday", "Filed. The client gets an email. Claire touched none of the admin."],
];
const effort = [
  ["Answering “are you free?” calls", "Open times on the homepage and booking page", "Gone"],
  ["Confirmations and calendar invites", "Sent the moment a client books", "Automatic"],
  ["Chasing missing documents", "Personal checklist, upload checks, reminders 7 days before", "Automatic"],
  ["No-shows and last-minute gaps", "48-hour readiness check, self-serve move, waitlist offered the slot", "Automatic"],
  ["Reviewing every upload", "Only flagged or unreadable files reach Claire", "Exceptions only"],
  ["Rescheduling by phone", "Clients move or cancel from their link", "Gone"],
  ["Collecting signatures and payment", "Review, sign and pay email, reminders day 1, 3 and 5", "Automatic"],
  ["Telling clients it's filed", "One click, the client is emailed", "1 click"],
];

function Story() {
  return (
    <div className="min-h-screen bg-paper-warm">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link to="/" aria-label="Hartwell Tax & Bookkeeping, home"><Logo /></Link>
        <Button asChild size="sm" variant="secondary"><Link to="/">Back to the site</Link></Button>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-3 pb-20 sm:px-5">
        <section className="enter rounded-[28px] bg-sheet px-6 py-12 sm:px-12 sm:py-16">
          <p className="inline-flex h-7 items-center rounded-full border border-line-1 bg-surface-2 px-3 text-[12px] font-medium text-body">Case study · Lovable challenge</p>
          <h1 className="enter-title mt-6 max-w-[18ch] t-hero text-deep-ink">From “can I book?” to “you’re booked.”</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-body">Hartwell Tax turns a late-night “can you do my taxes?” into a confirmed, fully prepared appointment, without Claire picking up the phone.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/book">Try it as a client</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/auth">See Claire's side</Link></Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Claire's side: demo@example.com / Ledger-Ready-8879. Demo tools in the sidebar walk through a whole season in a few clicks.</p>
        </section>

        <section className="rounded-[28px] bg-sheet px-6 py-12 sm:px-12">
          <h2 className="t-section text-deep-ink">The client</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Hartwell Tax &amp; Bookkeeping, 412 Bloomfield Avenue, Montclair, NJ. A one-person practice run by an IRS Enrolled Agent, with two deadline rushes a year.</p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quirks.map((q) => (
              <li key={q.unit} className="rounded-[22px] border border-line-1 p-5">
                <p className="font-serif text-[44px] font-semibold leading-none tracking-[-0.04em] text-ink">{q.n}</p>
                <p className="mt-2 text-sm font-medium text-deep-ink">{q.unit}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{q.d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {[["Before", before, false], ["After", after, true]].map(([label, rows, good]) => (
            <div key={label as string} className={`rounded-[28px] px-6 py-10 sm:px-10 ${good ? "bg-ink-900 text-white" : "bg-sheet"}`}>
              <h2 className={`t-section ${good ? "text-white" : "text-deep-ink"}`}>{label as string}</h2>
              <ol className="relative mt-8 space-y-5">
                {(rows as string[][]).map(([when, what]) => (
                  <li key={`${when}-${what}`} className="grid grid-cols-[84px_1fr] gap-4 text-[15px] leading-6">
                    <span className={`tabular text-[13px] font-medium ${good ? "text-white/60" : "text-muted-foreground"}`}>{when}</span>
                    <span className={good ? "text-white/90" : "text-body"}>{what}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] bg-sheet px-6 py-12 sm:px-12">
          <h2 className="t-section text-deep-ink">What Claire doesn't do anymore</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Fix the front door and the follow-through. Every task that used to need Claire, and what happens now. Her Today screen shows the hours given back each week.</p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-line-1 text-[11px] uppercase tracking-[0.06em] text-muted-foreground"><th className="py-3 pr-4 font-medium">Used to be Claire's job</th><th className="py-3 pr-4 font-medium">Now</th><th className="py-3 font-medium">Her effort</th></tr></thead>
              <tbody>
                {effort.map(([was, now, e]) => (
                  <tr key={was} className="border-b border-line-1 last:border-0">
                    <td className="py-3.5 pr-4 text-deep-ink">{was}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{now}</td>
                    <td className="py-3.5"><span className="inline-flex items-center gap-1.5 rounded-full bg-alert-success px-2.5 py-1 text-xs font-medium text-alert-success-fg"><Check className="size-3" strokeWidth={3} />{e}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/book" className="group mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-ink">Book a test appointment and watch it happen<ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" /></Link>
        </section>
      </main>
    </div>
  );
}
